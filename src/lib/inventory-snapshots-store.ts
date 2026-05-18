// localStorage-backed snapshot + reconciliation store.
// Snapshot generation service: creates per-day, per-outlet, per-item rows.
// Reconciliation service: drafts, submits, approves; posts adjustment movements.
// Variance service: aggregates open variances across snapshots.
//
// Counting session workflow:
//   DRAFT  ──submit──▶  IN_REVIEW  ──approve──▶  APPROVED  ──post──▶  POSTED
//                                  └─reject──▶  REJECTED
//
// A DRAFT is a long-lived counting session. Partial counts (counted/skipped flags
// per line) are persisted on every save, so a count can be resumed across
// sessions, devices, or interruptions. Inventory ledger movements are only
// written when the reconciliation transitions to POSTED.
//
// Integrates safely with the existing transfers-store inventory ledger:
// transferred-in / transferred-out values are sourced from `listMovements()`.

import { defaultInventoryItems } from "@/data/inventoryItems";
import { outlets } from "@/data/outlets";
import {
  type DailyInventorySnapshot,
  type InventoryReconciliation,
  type ReconciliationLine,
  type ReconciliationProgress,
  type ReconciliationReason,
  type SnapshotFilter,
} from "@/data/snapshotTypes";
import {
  applyDelta,
  appendMovement,
  getEffectiveStock,
  listMovements,
} from "@/lib/transfers-store";
import type { InventoryMovement } from "@/data/transferTypes";

const KEY_SNAPSHOTS = "smapps_inv_snapshots_v1";
const KEY_RECONS    = "smapps_inv_reconciliations_v1";
const KEY_REC_COUNTER = "smapps_inv_recon_counter_v1";
const KEY_SEEDED    = "smapps_inv_snapshots_seeded_v1";

// ── Storage helpers ──
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}
function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("snapshots:changed"));
}

export function nextReconciliationReference(): string {
  const n = (read<number>(KEY_REC_COUNTER, 0) || 0) + 1;
  localStorage.setItem(KEY_REC_COUNTER, String(n));
  const yr = new Date().getFullYear();
  return `RCN-${yr}-${String(n).padStart(6, "0")}`;
}

// ── Date utilities ──
export function isoDate(d: Date): string { return d.toISOString().slice(0, 10); }
export function addDays(d: Date, n: number): Date {
  const x = new Date(d); x.setDate(x.getDate() + n); return x;
}

// ── Snapshot CRUD ──
export function listSnapshots(): DailyInventorySnapshot[] {
  return read<DailyInventorySnapshot[]>(KEY_SNAPSHOTS, []);
}
export function saveSnapshots(list: DailyInventorySnapshot[]) {
  write(KEY_SNAPSHOTS, list);
}
export function upsertSnapshot(s: DailyInventorySnapshot) {
  const list = listSnapshots();
  const idx = list.findIndex(
    (x) => x.date === s.date && x.outletId === s.outletId && x.inventoryItemId === s.inventoryItemId
  );
  if (idx >= 0) list[idx] = s; else list.unshift(s);
  saveSnapshots(list);
}

export function getSnapshot(id: string): DailyInventorySnapshot | undefined {
  return listSnapshots().find((s) => s.id === id);
}

// Snapshot key for joining
function snapKey(date: string, outletId: string, itemId: string) {
  return `${date}::${outletId}::${itemId}`;
}

// ── Snapshot generation service ──
// For a given business date + outlet, build a snapshot per item by aggregating
// the prior day's expected closing as opening + the day's movements.
export function generateSnapshotsForDay(date: string, outletId?: string): DailyInventorySnapshot[] {
  const targetOutlets = outletId
    ? outlets.filter((o) => o.id === outletId)
    : outlets;
  const movements = listMovements();
  const existing = listSnapshots();
  const generated: DailyInventorySnapshot[] = [];

  for (const o of targetOutlets) {
    const items = defaultInventoryItems.filter((i) => i.outletId === o.id);
    for (const it of items) {
      const prior = findPriorSnapshot(existing, date, o.id, it.id);
      const opening = prior ? prior.expectedClosingQty : Math.max(0, it.stock - randomDelta(it.id, date));

      const dayMovements = movements.filter((m) =>
        m.locationId === o.id &&
        m.inventoryItemId === it.id &&
        m.ts.slice(0, 10) === date
      );

      const transferIn  = sumQty(dayMovements, "TRANSFER_IN");
      const transferOut = -sumQty(dayMovements, "TRANSFER_OUT"); // stored as negative
      const damage      = -sumQty(dayMovements, "TRANSFER_DAMAGE");

      // Synthetic per-day operational activity (deterministic hash so the
      // same date/outlet/item always produces the same demo numbers).
      const seedTotals = pseudoDailyTotals(it.id, o.id, date);

      const received   = seedTotals.received;
      const sold       = seedTotals.sold;
      const returned   = seedTotals.returned;
      const wasted     = seedTotals.wasted + damage;
      const adjusted   = seedTotals.adjusted;

      const expectedClosing =
        opening + received + returned + transferIn
        - sold - wasted - transferOut + adjusted;

      const id = snapKey(date, o.id, it.id);
      const snap: DailyInventorySnapshot = {
        id,
        date,
        outletId: o.id,
        inventoryItemId: it.id,
        itemName: it.name,
        sku: it.sku,
        categoryId: it.categoryId,
        unit: "unit",
        unitCost: it.costPrice,
        openingQty: round(opening),
        receivedQty: round(received),
        soldQty: round(sold),
        returnedQty: round(returned),
        wastedQty: round(wasted),
        adjustedQty: round(adjusted),
        transferredInQty: round(transferIn),
        transferredOutQty: round(transferOut),
        expectedClosingQty: round(expectedClosing),
        actualCountedQty: null,
        varianceQty: 0,
        varianceCost: 0,
        generatedAt: new Date().toISOString(),
        source: "AUTO",
      };
      upsertSnapshot(snap);
      generated.push(snap);
    }
  }
  return generated;
}

function findPriorSnapshot(
  list: DailyInventorySnapshot[], date: string, outletId: string, itemId: string
) {
  return list
    .filter((s) => s.outletId === outletId && s.inventoryItemId === itemId && s.date < date)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}

function sumQty(ms: InventoryMovement[], type: InventoryMovement["type"]): number {
  return ms.filter((m) => m.type === type).reduce((s, m) => s + m.quantity, 0);
}

// Deterministic small-number generator so the demo data feels real.
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}
function pseudoDailyTotals(itemId: string, outletId: string, date: string) {
  const h = hashStr(`${itemId}|${outletId}|${date}`);
  const sold     = (h % 7);                   // 0–6
  const received = ((h >> 3) % 5) === 0 ? ((h >> 5) % 12) : 0;
  const returned = ((h >> 7) % 11) === 0 ? 1 : 0;
  const wasted   = ((h >> 9) % 13) === 0 ? 1 : 0;
  const adjustedRaw = ((h >> 11) % 17) === 0 ? (((h >> 13) % 3) - 1) : 0;
  return { sold, received, returned, wasted, adjusted: adjustedRaw };
}
function randomDelta(itemId: string, date: string) {
  return hashStr(`${itemId}|${date}`) % 5;
}
function round(n: number) { return Math.round(n * 100) / 100; }

// ── Seeding (only first run) ──
export function seedSnapshotsIfEmpty(days = 14) {
  if (localStorage.getItem(KEY_SEEDED) === "1") return;
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    generateSnapshotsForDay(isoDate(addDays(today, -i)));
  }
  localStorage.setItem(KEY_SEEDED, "1");
}

// ── Filtering / querying ──
export function querySnapshots(filter: SnapshotFilter): DailyInventorySnapshot[] {
  const term = filter.search?.trim().toLowerCase();
  return listSnapshots().filter((s) => {
    if (filter.locationId && filter.locationId !== "all" && s.outletId !== filter.locationId) return false;
    if (filter.categoryId && filter.categoryId !== "all" && s.categoryId !== filter.categoryId) return false;
    if (filter.fromDate && s.date < filter.fromDate) return false;
    if (filter.toDate && s.date > filter.toDate) return false;
    if (filter.varianceOnly && s.varianceQty === 0) return false;
    if (term && !(`${s.itemName} ${s.sku}`.toLowerCase().includes(term))) return false;
    return true;
  });
}

// ── Movement drill-down (combine ledger + synthetic per-day rows) ──
export interface MovementRow {
  ts: string;
  type: string;
  quantity: number;
  unitCost: number;
  reference?: string;
  notes?: string;
  source: "ledger" | "synthetic";
}
export function listMovementsForSnapshot(s: DailyInventorySnapshot): MovementRow[] {
  const ledger = listMovements()
    .filter((m) => m.locationId === s.outletId && m.inventoryItemId === s.inventoryItemId
      && m.ts.slice(0, 10) === s.date)
    .map<MovementRow>((m) => ({
      ts: m.ts,
      type: m.type,
      quantity: m.quantity,
      unitCost: m.unitCost,
      reference: m.transferReference,
      notes: m.metadata?.notes as string | undefined,
      source: "ledger",
    }));

  const synth: MovementRow[] = [];
  const push = (type: string, qty: number) => {
    if (qty === 0) return;
    synth.push({
      ts: `${s.date}T12:00:00Z`,
      type,
      quantity: qty,
      unitCost: s.unitCost,
      source: "synthetic",
    });
  };
  push("RECEIVED", s.receivedQty);
  push("SOLD", -s.soldQty);
  push("RETURNED", s.returnedQty);
  push("WASTED", -s.wastedQty);
  push("ADJUSTED", s.adjustedQty);
  return [...ledger, ...synth].sort((a, b) => b.ts.localeCompare(a.ts));
}

// ── Reconciliations ──
export function listReconciliations(): InventoryReconciliation[] {
  return read<InventoryReconciliation[]>(KEY_RECONS, []).map(normalizeRecon);
}
export function saveReconciliations(list: InventoryReconciliation[]) {
  write(KEY_RECONS, list);
}
export function getReconciliation(id: string): InventoryReconciliation | undefined {
  return listReconciliations().find((r) => r.id === id);
}
export function upsertReconciliation(r: InventoryReconciliation) {
  const list = listReconciliations();
  const idx = list.findIndex((x) => x.id === r.id);
  if (idx >= 0) list[idx] = r; else list.unshift(r);
  saveReconciliations(list);
}
export function deleteReconciliation(id: string) {
  const r = getReconciliation(id);
  if (!r) return;
  if (r.status !== "DRAFT" && r.status !== "REJECTED") {
    throw new Error("Only DRAFT or REJECTED reconciliations can be deleted");
  }
  saveReconciliations(listReconciliations().filter((x) => x.id !== id));
}

// Backward-compat for any legacy "SUBMITTED" status in storage from before the
// IN_REVIEW rename.
function normalizeRecon(r: InventoryReconciliation): InventoryReconciliation {
  const status = (r.status as unknown as string) === "SUBMITTED"
    ? "IN_REVIEW" as const
    : r.status;
  const lines = (r.lines ?? []).map((l) => ({
    counted: l.counted ?? (l.actualQty !== undefined && l.actualQty !== null),
    skipped: l.skipped ?? false,
    ...l,
  }));
  return {
    ...r,
    status,
    lines,
    progress: r.progress ?? computeProgress(lines, lines.length),
  };
}

function recomputeTotals(lines: ReconciliationLine[]) {
  let varianceQty = 0, absVarianceQty = 0, varianceCost = 0, absVarianceCost = 0;
  let counted = 0;
  for (const l of lines) {
    if (l.counted) {
      counted += 1;
      varianceQty += l.varianceQty;
      absVarianceQty += Math.abs(l.varianceQty);
      varianceCost += l.varianceCost;
      absVarianceCost += Math.abs(l.varianceCost);
    }
  }
  return { linesCounted: counted, varianceQty, absVarianceQty, varianceCost, absVarianceCost };
}

export function computeProgress(lines: ReconciliationLine[], total: number): ReconciliationProgress {
  const counted = lines.filter((l) => l.counted).length;
  const skipped = lines.filter((l) => l.skipped).length;
  const pending = Math.max(0, total - counted - skipped);
  const pct = total > 0 ? Math.round((counted / total) * 100) : 0;
  return { total, counted, skipped, pending, pct };
}

// ── Counting session inputs ──
export interface CountInput {
  snapshotId: string;
  actualQty?: number | null;   // undefined = not counted, null = explicit clear
  skipped?: boolean;
  reasonCode?: ReconciliationReason;
  reasonNote?: string;
}

export interface CreateReconciliationInput {
  outletId: string;
  date: string;
  counts?: CountInput[];
  notes?: string;
  createdBy?: string;
}

// Build a full set of pending lines from snapshots for a (date, outletId).
// Counting sessions are line-complete from the start; lines start uncounted
// and are filled in by the operator.
function buildLinesForSession(date: string, outletId: string): ReconciliationLine[] {
  const snaps = querySnapshots({ locationId: outletId, fromDate: date, toDate: date });
  return snaps.map((s) => ({
    id: crypto.randomUUID(),
    snapshotId: s.id,
    inventoryItemId: s.inventoryItemId,
    itemName: s.itemName,
    sku: s.sku,
    unit: s.unit,
    unitCost: s.unitCost,
    expectedQty: s.expectedClosingQty,
    actualQty: 0,
    varianceQty: 0,
    varianceCost: 0,
    counted: false,
    skipped: false,
  }));
}

export function createReconciliation(input: CreateReconciliationInput): InventoryReconciliation {
  const outletName = outlets.find((o) => o.id === input.outletId)?.name ?? input.outletId;

  // Ensure snapshots exist for the date/outlet.
  let snaps = querySnapshots({ locationId: input.outletId, fromDate: input.date, toDate: input.date });
  if (snaps.length === 0) {
    snaps = generateSnapshotsForDay(input.date, input.outletId);
  }

  let lines = buildLinesForSession(input.date, input.outletId);
  if (input.counts?.length) {
    lines = applyCountsToLines(lines, input.counts);
  }

  const recon: InventoryReconciliation = {
    id: crypto.randomUUID(),
    reference: nextReconciliationReference(),
    outletId: input.outletId,
    outletName,
    date: input.date,
    status: "DRAFT",
    lines,
    totals: recomputeTotals(lines),
    progress: computeProgress(lines, lines.length),
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy ?? "Current User",
    notes: input.notes,
  };
  upsertReconciliation(recon);
  return recon;
}

function applyCountsToLines(lines: ReconciliationLine[], counts: CountInput[]): ReconciliationLine[] {
  const bySnap = new Map(counts.map((c) => [c.snapshotId, c]));
  const now = new Date().toISOString();
  return lines.map((l) => {
    const c = bySnap.get(l.snapshotId);
    if (!c) return l;
    if (c.skipped) {
      return { ...l, skipped: true, counted: false, actualQty: 0, varianceQty: 0, varianceCost: 0 };
    }
    if (c.actualQty === undefined || c.actualQty === null) {
      return { ...l, counted: false, skipped: false, actualQty: 0, varianceQty: 0, varianceCost: 0 };
    }
    const actual = round(Number(c.actualQty));
    const variance = round(actual - l.expectedQty);
    return {
      ...l,
      counted: true,
      skipped: false,
      actualQty: actual,
      varianceQty: variance,
      varianceCost: round(variance * l.unitCost),
      reasonCode: c.reasonCode ?? l.reasonCode,
      reasonNote: c.reasonNote ?? l.reasonNote,
      countedAt: now,
      countedBy: "Current User",
    };
  });
}

// Save partial counts to an existing DRAFT (or REJECTED → reopens as DRAFT).
export interface SaveDraftInput {
  reconciliationId: string;
  counts?: CountInput[];
  notes?: string;
}
export function saveReconciliationDraft(input: SaveDraftInput): InventoryReconciliation {
  const r = getReconciliation(input.reconciliationId);
  if (!r) throw new Error("Reconciliation not found");
  if (r.status !== "DRAFT" && r.status !== "REJECTED") {
    throw new Error("Only DRAFT or REJECTED reconciliations can be edited");
  }
  const lines = input.counts ? applyCountsToLines(r.lines, input.counts) : r.lines;
  const updated: InventoryReconciliation = {
    ...r,
    status: "DRAFT",
    lines,
    totals: recomputeTotals(lines),
    progress: computeProgress(lines, lines.length),
    notes: input.notes ?? r.notes,
    updatedAt: new Date().toISOString(),
    rejectedAt: undefined,
    rejectedBy: undefined,
    rejectedReason: undefined,
  };
  upsertReconciliation(updated);
  return updated;
}

export function submitReconciliation(id: string, submittedBy = "Current User") {
  const r = getReconciliation(id); if (!r) return;
  if (r.status !== "DRAFT") throw new Error("Only DRAFT can be submitted for review");
  if (r.progress.counted === 0) throw new Error("Count at least one item before submitting");
  r.status = "IN_REVIEW";
  r.submittedAt = new Date().toISOString();
  r.submittedBy = submittedBy;
  upsertReconciliation(r);
}

export function rejectReconciliation(id: string, reason: string, rejectedBy = "Current User") {
  const r = getReconciliation(id); if (!r) return;
  if (r.status !== "IN_REVIEW") throw new Error("Only IN_REVIEW can be rejected");
  r.status = "REJECTED";
  r.rejectedAt = new Date().toISOString();
  r.rejectedBy = rejectedBy;
  r.rejectedReason = reason;
  upsertReconciliation(r);
}

// Approve + post: stamps snapshots, writes ledger movements for variances.
// In this implementation approval and posting are atomic — once approved the
// adjustment hits the inventory ledger. Status becomes POSTED.
export function approveReconciliation(id: string, approvedBy = "Current User") {
  const r = getReconciliation(id); if (!r) return;
  if (r.status !== "IN_REVIEW") throw new Error("Only IN_REVIEW can be approved");

  const countedLines = r.lines.filter((l) => l.counted);
  for (const l of countedLines) {
    if (l.varianceQty !== 0) {
      applyDelta(r.outletId, l.inventoryItemId, l.varianceQty);
      const before = getEffectiveStock(r.outletId, l.inventoryItemId) - l.varianceQty;
      appendMovement({
        id: crypto.randomUUID(),
        ts: new Date().toISOString(),
        type: "TRANSFER_DAMAGE", // closest existing ledger type for adjustments
        locationId: r.outletId,
        inventoryItemId: l.inventoryItemId,
        itemName: l.itemName,
        sku: l.sku,
        unit: l.unit,
        quantity: l.varianceQty,
        balanceBefore: before,
        balanceAfter: before + l.varianceQty,
        unitCost: l.unitCost,
        performedBy: approvedBy,
        transferId: r.id,
        transferReference: r.reference,
        metadata: { notes: `Reconciliation variance: ${l.reasonCode ?? "n/a"}` },
      });
    }
    // Stamp the snapshot
    const snap = getSnapshot(l.snapshotId);
    if (snap) {
      snap.actualCountedQty = l.actualQty;
      snap.varianceQty = l.varianceQty;
      snap.varianceCost = l.varianceCost;
      snap.reconciliationId = r.id;
      snap.reconciledAt = new Date().toISOString();
      snap.reconciledBy = approvedBy;
      upsertSnapshot(snap);
    }
  }
  const now = new Date().toISOString();
  r.status = "POSTED";
  r.approvedAt = now;
  r.approvedBy = approvedBy;
  r.postedAt = now;
  r.postedBy = approvedBy;
  upsertReconciliation(r);
}

// ── Variance service ──
export interface VarianceSummary {
  totalVarianceQty: number;
  totalAbsVarianceQty: number;
  totalVarianceCost: number;
  totalAbsVarianceCost: number;
  countedSnapshots: number;
  pendingReconciliations: number;
  approvedReconciliations: number;
}
export function computeVarianceSummary(filter: SnapshotFilter): VarianceSummary {
  const snaps = querySnapshots({ ...filter, varianceOnly: true });
  const recs = listReconciliations().filter((r) => !filter.locationId || filter.locationId === "all" || r.outletId === filter.locationId);
  const summary: VarianceSummary = {
    totalVarianceQty: 0, totalAbsVarianceQty: 0,
    totalVarianceCost: 0, totalAbsVarianceCost: 0,
    countedSnapshots: snaps.length,
    pendingReconciliations: recs.filter((r) => r.status === "DRAFT" || r.status === "IN_REVIEW").length,
    approvedReconciliations: recs.filter((r) => r.status === "APPROVED" || r.status === "POSTED").length,
  };
  for (const s of snaps) {
    summary.totalVarianceQty += s.varianceQty;
    summary.totalAbsVarianceQty += Math.abs(s.varianceQty);
    summary.totalVarianceCost += s.varianceCost;
    summary.totalAbsVarianceCost += Math.abs(s.varianceCost);
  }
  return summary;
}
