// localStorage-backed snapshot + reconciliation store.
// Snapshot generation service: creates per-day, per-outlet, per-item rows.
// Reconciliation service: drafts, submits, approves; posts adjustment movements.
// Variance service: aggregates open variances across snapshots.
//
// Integrates safely with the existing transfers-store inventory ledger:
// transferred-in / transferred-out values are sourced from `listMovements()`.

import { defaultInventoryItems } from "@/data/inventoryItems";
import { outlets } from "@/data/outlets";
import {
  type DailyInventorySnapshot,
  type InventoryReconciliation,
  type ReconciliationLine,
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
  return read<InventoryReconciliation[]>(KEY_RECONS, []);
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

function recomputeTotals(lines: ReconciliationLine[]) {
  let varianceQty = 0, absVarianceQty = 0, varianceCost = 0, absVarianceCost = 0;
  for (const l of lines) {
    varianceQty += l.varianceQty;
    absVarianceQty += Math.abs(l.varianceQty);
    varianceCost += l.varianceCost;
    absVarianceCost += Math.abs(l.varianceCost);
  }
  return { linesCounted: lines.length, varianceQty, absVarianceQty, varianceCost, absVarianceCost };
}

export interface CreateReconciliationInput {
  outletId: string;
  date: string;
  counts: Array<{ snapshotId: string; actualQty: number; reasonCode?: ReconciliationReason; reasonNote?: string }>;
  notes?: string;
  createdBy?: string;
}

export function createReconciliation(input: CreateReconciliationInput): InventoryReconciliation {
  const outletName = outlets.find((o) => o.id === input.outletId)?.name ?? input.outletId;
  const lines: ReconciliationLine[] = [];
  for (const c of input.counts) {
    const snap = getSnapshot(c.snapshotId);
    if (!snap) continue;
    const variance = round(c.actualQty - snap.expectedClosingQty);
    lines.push({
      id: crypto.randomUUID(),
      snapshotId: snap.id,
      inventoryItemId: snap.inventoryItemId,
      itemName: snap.itemName,
      sku: snap.sku,
      unit: snap.unit,
      unitCost: snap.unitCost,
      expectedQty: snap.expectedClosingQty,
      actualQty: round(c.actualQty),
      varianceQty: variance,
      varianceCost: round(variance * snap.unitCost),
      reasonCode: c.reasonCode,
      reasonNote: c.reasonNote,
    });
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
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy ?? "Current User",
    notes: input.notes,
  };
  upsertReconciliation(recon);
  return recon;
}

export function submitReconciliation(id: string) {
  const r = getReconciliation(id); if (!r) return;
  if (r.status !== "DRAFT") throw new Error("Only DRAFT can be submitted");
  r.status = "SUBMITTED";
  r.submittedAt = new Date().toISOString();
  upsertReconciliation(r);
}

export function rejectReconciliation(id: string, reason: string) {
  const r = getReconciliation(id); if (!r) return;
  if (r.status !== "SUBMITTED") throw new Error("Only SUBMITTED can be rejected");
  r.status = "REJECTED";
  r.rejectedAt = new Date().toISOString();
  r.rejectedReason = reason;
  upsertReconciliation(r);
}

// Approving posts the variance: adjusts effective stock by varianceQty,
// stamps the snapshot, and writes an adjustment movement to the ledger so
// downstream reports stay consistent.
export function approveReconciliation(id: string, approvedBy = "Current User") {
  const r = getReconciliation(id); if (!r) return;
  if (r.status !== "SUBMITTED") throw new Error("Only SUBMITTED can be approved");

  for (const l of r.lines) {
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
  r.status = "APPROVED";
  r.approvedAt = new Date().toISOString();
  r.approvedBy = approvedBy;
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
    pendingReconciliations: recs.filter((r) => r.status === "SUBMITTED" || r.status === "DRAFT").length,
    approvedReconciliations: recs.filter((r) => r.status === "APPROVED").length,
  };
  for (const s of snaps) {
    summary.totalVarianceQty += s.varianceQty;
    summary.totalAbsVarianceQty += Math.abs(s.varianceQty);
    summary.totalVarianceCost += s.varianceCost;
    summary.totalAbsVarianceCost += Math.abs(s.varianceCost);
  }
  return summary;
}
