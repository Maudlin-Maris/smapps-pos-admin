// =====================================================================
// Tips Store — localStorage-backed mock for tip ledger, payouts and audit.
// Maintains accounting integrity: unpaid balance = sum(amount - paidAmount)
// across non-reversed tip entries. Payouts allocate against tips FIFO and
// reduce per-tip paidAmount; reversals restore liabilities.
// =====================================================================

import {
  TipEntry,
  TipPayout,
  TipAuditEntry,
  TipStatus,
  PayoutStatus,
  PayoutMethod,
  PayoutAllocation,
  AuditAction,
} from "@/data/tipsTypes";
import { outlets } from "@/data/outlets";

const TIPS_KEY = "smapps_tips_ledger_v1";
const PAYOUTS_KEY = "smapps_tips_payouts_v1";
const AUDIT_KEY = "smapps_tips_audit_v1";
const SEEDED_KEY = "smapps_tips_seeded_v2";

const DEFAULT_BUSINESS = "biz_default";

// ----- Mock staff (re-used across seed + payouts) -----
export interface TipStaff {
  id: string;
  name: string;
  outletIds: string[];
}

export const TIP_STAFF: TipStaff[] = [
  { id: "staff_ada", name: "Ada Obi", outletIds: ["outlet-1"] },
  { id: "staff_ben", name: "Ben Carter", outletIds: ["outlet-1", "outlet-3"] },
  { id: "staff_chi", name: "Chiamaka Eze", outletIds: ["outlet-3"] },
  { id: "staff_dami", name: "Dami Adekunle", outletIds: ["outlet-5"] },
  { id: "staff_emeka", name: "Emeka Nwosu", outletIds: ["outlet-6"] },
  { id: "staff_funke", name: "Funke Bello", outletIds: ["outlet-1"] },
];

// ----- Storage helpers -----
function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}
function save<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ----- Seeding -----
function seedIfNeeded() {
  if (localStorage.getItem(SEEDED_KEY)) return;
  const tips: TipEntry[] = [];
  const now = Date.now();
  const day = 86_400_000;
  let i = 0;
  for (const staff of TIP_STAFF) {
    for (const outletId of staff.outletIds) {
      const outletName = outlets.find((o) => o.id === outletId)?.name || outletId;
      const count = 4 + (i % 3);
      for (let k = 0; k < count; k++) {
        const orderAmount = Math.round((2500 + Math.random() * 22500) / 50) * 50;
        const amount = Math.round((500 + Math.random() * 4500) / 50) * 50;
        // Most orders are fully paid; ~20% are partially paid
        const isPartial = Math.random() < 0.2;
        const orderPaidAmount = isPartial
          ? Math.round((orderAmount * (0.3 + Math.random() * 0.5)) / 50) * 50
          : orderAmount;
        tips.push({
          id: uid("tip"),
          businessId: DEFAULT_BUSINESS,
          outletId,
          outletName,
          staffId: staff.id,
          staffName: staff.name,
          orderId: `ORD-${1000 + i * 10 + k}`,
          orderAmount,
          orderPaidAmount,
          amount,
          paidAmount: 0,
          status: "pending",
          earnedAt: new Date(now - (k + i) * day * 0.6).toISOString(),
        });
      }
      i++;
    }
  }
  save(TIPS_KEY, tips);
  save(PAYOUTS_KEY, []);
  save(AUDIT_KEY, []);
  localStorage.setItem(SEEDED_KEY, "1");
}

// ----- Public API -----
export function getTips(): TipEntry[] {
  seedIfNeeded();
  return load<TipEntry>(TIPS_KEY);
}
export function getPayouts(): TipPayout[] {
  seedIfNeeded();
  return load<TipPayout>(PAYOUTS_KEY);
}
export function getAuditLog(): TipAuditEntry[] {
  seedIfNeeded();
  return load<TipAuditEntry>(AUDIT_KEY).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

function appendAudit(entry: Omit<TipAuditEntry, "id" | "createdAt" | "businessId">) {
  const log = load<TipAuditEntry>(AUDIT_KEY);
  log.push({
    ...entry,
    id: uid("aud"),
    businessId: DEFAULT_BUSINESS,
    createdAt: new Date().toISOString(),
  });
  save(AUDIT_KEY, log);
}

function recomputeTipStatus(t: TipEntry): TipEntry {
  if (t.status === "reversed") return t;
  if (t.paidAmount <= 0) return { ...t, status: "pending" };
  if (t.paidAmount >= t.amount - 0.0001) return { ...t, status: "paid", paidAmount: t.amount };
  return { ...t, status: "partially_paid" };
}

// ----- Aggregations -----
export interface StaffSummary {
  staffId: string;
  staffName: string;
  earned: number;
  paid: number;
  outstanding: number;
  pendingCount: number;
  outletIds: string[];
}

export interface OutletSummary {
  outletId: string;
  outletName: string;
  earned: number;
  paid: number;
  outstanding: number;
  staffCount: number;
}

export interface DashboardTotals {
  totalEarned: number;
  totalPaid: number;
  totalOutstanding: number;
  pendingCount: number;
  paidCount: number;
}

export function computeStaffSummaries(filterOutletId?: string): StaffSummary[] {
  const tips = getTips().filter((t) => t.status !== "reversed");
  const map = new Map<string, StaffSummary>();
  for (const t of tips) {
    if (filterOutletId && t.outletId !== filterOutletId) continue;
    const cur = map.get(t.staffId) || {
      staffId: t.staffId,
      staffName: t.staffName,
      earned: 0,
      paid: 0,
      outstanding: 0,
      pendingCount: 0,
      outletIds: [],
    };
    cur.earned += t.amount;
    cur.paid += t.paidAmount;
    cur.outstanding += t.amount - t.paidAmount;
    if (t.status !== "paid") cur.pendingCount += 1;
    if (!cur.outletIds.includes(t.outletId)) cur.outletIds.push(t.outletId);
    map.set(t.staffId, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.outstanding - a.outstanding);
}

export function computeOutletSummaries(): OutletSummary[] {
  const tips = getTips().filter((t) => t.status !== "reversed");
  const map = new Map<string, OutletSummary & { staffSet: Set<string> }>();
  for (const t of tips) {
    const cur =
      map.get(t.outletId) ||
      ({
        outletId: t.outletId,
        outletName: t.outletName,
        earned: 0,
        paid: 0,
        outstanding: 0,
        staffCount: 0,
        staffSet: new Set<string>(),
      } as any);
    cur.earned += t.amount;
    cur.paid += t.paidAmount;
    cur.outstanding += t.amount - t.paidAmount;
    cur.staffSet.add(t.staffId);
    map.set(t.outletId, cur);
  }
  return Array.from(map.values())
    .map((o) => ({ ...o, staffCount: o.staffSet.size }))
    .sort((a, b) => b.outstanding - a.outstanding);
}

export function computeDashboardTotals(): DashboardTotals {
  const tips = getTips();
  let totalEarned = 0;
  let totalPaid = 0;
  let pendingCount = 0;
  let paidCount = 0;
  for (const t of tips) {
    if (t.status === "reversed") continue;
    totalEarned += t.amount;
    totalPaid += t.paidAmount;
    if (t.status === "paid") paidCount += 1;
    else pendingCount += 1;
  }
  return {
    totalEarned,
    totalPaid,
    totalOutstanding: totalEarned - totalPaid,
    pendingCount,
    paidCount,
  };
}

// ----- Payout creation / lifecycle -----
export interface CreatePayoutInput {
  staffId: string;
  outletId: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  method: PayoutMethod;
  reference?: string;
  notes?: string;
  actor: string;
}

/** Compute unpaid tips for a staff member within the period & outlet. */
export function getUnpaidTipsForStaff(
  staffId: string,
  outletId: string,
  periodStart?: string,
  periodEnd?: string
): TipEntry[] {
  return getTips()
    .filter(
      (t) =>
        t.staffId === staffId &&
        t.outletId === outletId &&
        t.status !== "reversed" &&
        t.status !== "paid" &&
        (!periodStart || t.earnedAt >= periodStart) &&
        (!periodEnd || t.earnedAt <= periodEnd)
    )
    .sort((a, b) => a.earnedAt.localeCompare(b.earnedAt));
}

export function createPayout(input: CreatePayoutInput): TipPayout {
  const eligible = getUnpaidTipsForStaff(
    input.staffId,
    input.outletId,
    input.periodStart,
    input.periodEnd
  );
  const totalAvailable = eligible.reduce((s, t) => s + (t.amount - t.paidAmount), 0);
  const requested = Math.min(input.amount, totalAvailable);

  // FIFO allocation
  const allocations: PayoutAllocation[] = [];
  let remaining = requested;
  for (const tip of eligible) {
    if (remaining <= 0) break;
    const available = tip.amount - tip.paidAmount;
    if (available <= 0) continue;
    const apply = Math.min(available, remaining);
    allocations.push({ tipId: tip.id, amount: apply });
    remaining -= apply;
  }

  const outletName = eligible[0]?.outletName || outlets.find((o) => o.id === input.outletId)?.name || input.outletId;
  const staffName = eligible[0]?.staffName || TIP_STAFF.find((s) => s.id === input.staffId)?.name || input.staffId;

  const payout: TipPayout = {
    id: uid("po"),
    businessId: DEFAULT_BUSINESS,
    outletId: input.outletId,
    outletName,
    staffId: input.staffId,
    staffName,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    amount: requested,
    method: input.method,
    status: "draft",
    allocations,
    reference: input.reference,
    notes: input.notes,
    createdBy: input.actor,
    createdAt: new Date().toISOString(),
  };
  const list = load<TipPayout>(PAYOUTS_KEY);
  list.push(payout);
  save(PAYOUTS_KEY, list);
  appendAudit({
    action: "payout.created",
    targetId: payout.id,
    targetType: "payout",
    actor: input.actor,
    outletId: payout.outletId,
    staffId: payout.staffId,
    amount: payout.amount,
    details: `Draft payout for ${staffName} (${outletName})`,
  });
  return payout;
}

function updatePayout(id: string, patch: Partial<TipPayout>) {
  const list = load<TipPayout>(PAYOUTS_KEY);
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch };
  save(PAYOUTS_KEY, list);
  return list[idx];
}

export function approvePayout(id: string, actor: string): TipPayout | null {
  const p = load<TipPayout>(PAYOUTS_KEY).find((x) => x.id === id);
  if (!p || p.status !== "draft") return null;
  const next = updatePayout(id, {
    status: "approved",
    approvedBy: actor,
    approvedAt: new Date().toISOString(),
  });
  appendAudit({
    action: "payout.approved",
    targetId: id,
    targetType: "payout",
    actor,
    outletId: p.outletId,
    staffId: p.staffId,
    amount: p.amount,
  });
  return next;
}

export function markPayoutPaid(id: string, actor: string): TipPayout | null {
  const list = load<TipPayout>(PAYOUTS_KEY);
  const p = list.find((x) => x.id === id);
  if (!p || (p.status !== "approved" && p.status !== "draft")) return null;

  // Apply allocations to tip ledger
  const tips = load<TipEntry>(TIPS_KEY);
  for (const alloc of p.allocations) {
    const idx = tips.findIndex((t) => t.id === alloc.tipId);
    if (idx === -1) continue;
    const updated = { ...tips[idx], paidAmount: tips[idx].paidAmount + alloc.amount };
    tips[idx] = recomputeTipStatus(updated);
  }
  save(TIPS_KEY, tips);

  const next = updatePayout(id, {
    status: "paid",
    paidBy: actor,
    paidAt: new Date().toISOString(),
    approvedAt: p.approvedAt || new Date().toISOString(),
    approvedBy: p.approvedBy || actor,
  });
  appendAudit({
    action: "payout.paid",
    targetId: id,
    targetType: "payout",
    actor,
    outletId: p.outletId,
    staffId: p.staffId,
    amount: p.amount,
    details: `Disbursed via ${p.method}`,
  });
  return next;
}

export function cancelPayout(id: string, actor: string, reason?: string): TipPayout | null {
  const p = load<TipPayout>(PAYOUTS_KEY).find((x) => x.id === id);
  if (!p || (p.status !== "draft" && p.status !== "approved")) return null;
  const next = updatePayout(id, {
    status: "cancelled",
    cancelledBy: actor,
    cancelledAt: new Date().toISOString(),
    notes: reason ? `${p.notes ? p.notes + " | " : ""}Cancelled: ${reason}` : p.notes,
  });
  appendAudit({
    action: "payout.cancelled",
    targetId: id,
    targetType: "payout",
    actor,
    outletId: p.outletId,
    staffId: p.staffId,
    amount: p.amount,
    details: reason,
  });
  return next;
}

export function reversePayout(id: string, actor: string, reason: string): TipPayout | null {
  const list = load<TipPayout>(PAYOUTS_KEY);
  const p = list.find((x) => x.id === id);
  if (!p || p.status !== "paid") return null;

  // Restore tip liabilities
  const tips = load<TipEntry>(TIPS_KEY);
  for (const alloc of p.allocations) {
    const idx = tips.findIndex((t) => t.id === alloc.tipId);
    if (idx === -1) continue;
    const restored = { ...tips[idx], paidAmount: Math.max(0, tips[idx].paidAmount - alloc.amount) };
    tips[idx] = recomputeTipStatus(restored);
  }
  save(TIPS_KEY, tips);

  const next = updatePayout(id, {
    status: "reversed",
    reversedBy: actor,
    reversedAt: new Date().toISOString(),
    reverseReason: reason,
  });
  appendAudit({
    action: "payout.reversed",
    targetId: id,
    targetType: "payout",
    actor,
    outletId: p.outletId,
    staffId: p.staffId,
    amount: p.amount,
    details: reason,
  });
  return next;
}

export function getPayoutById(id: string): TipPayout | undefined {
  return getPayouts().find((p) => p.id === id);
}

export function getTipsByIds(ids: string[]): TipEntry[] {
  const all = getTips();
  return ids.map((id) => all.find((t) => t.id === id)).filter(Boolean) as TipEntry[];
}

export function getStaffById(id: string): TipStaff | undefined {
  return TIP_STAFF.find((s) => s.id === id);
}
