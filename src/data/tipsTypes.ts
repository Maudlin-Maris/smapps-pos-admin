// =====================================================================
// Tips Administration & Payout Management — Types
// Multi-business / multi-outlet isolation. Cashier-collected tips flow
// from POS into a per-staff liability ledger that is reduced by payouts.
// =====================================================================

export type TipStatus = "pending" | "partially_paid" | "paid" | "reversed";

export type PayoutStatus =
  | "draft"
  | "approved"
  | "paid"
  | "cancelled"
  | "reversed";

export type PayoutMethod = "cash" | "transfer" | "payroll";

export interface TipEntry {
  id: string;
  businessId: string;
  outletId: string;
  outletName: string;
  staffId: string;
  staffName: string;
  /** Originating POS order, if available */
  orderId?: string;
  /** Tip amount earned in this transaction */
  amount: number;
  /** Amount that has been paid out to the staff member already */
  paidAmount: number;
  status: TipStatus;
  /** ISO timestamp of when the tip was earned (POS sale time) */
  earnedAt: string;
  notes?: string;
}

export interface PayoutAllocation {
  /** Tip entry being settled */
  tipId: string;
  /** Amount applied from this tip */
  amount: number;
}

export interface TipPayout {
  id: string;
  businessId: string;
  outletId: string;
  outletName: string;
  staffId: string;
  staffName: string;
  /** Period covered by this payout */
  periodStart: string;
  periodEnd: string;
  /** Total amount being paid out across all allocations */
  amount: number;
  method: PayoutMethod;
  status: PayoutStatus;
  /** Allocations across the underlying tip entries (FIFO by default) */
  allocations: PayoutAllocation[];
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  paidBy?: string;
  paidAt?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  reversedBy?: string;
  reversedAt?: string;
  reverseReason?: string;
}

export type AuditAction =
  | "payout.created"
  | "payout.updated"
  | "payout.approved"
  | "payout.paid"
  | "payout.cancelled"
  | "payout.reversed"
  | "tip.adjusted";

export interface TipAuditEntry {
  id: string;
  businessId: string;
  action: AuditAction;
  /** Either a payout id or tip id */
  targetId: string;
  targetType: "payout" | "tip";
  actor: string;
  outletId?: string;
  staffId?: string;
  amount?: number;
  details?: string;
  createdAt: string;
}

export const TIP_STATUS_LABELS: Record<TipStatus, string> = {
  pending: "Pending",
  partially_paid: "Partially paid",
  paid: "Paid",
  reversed: "Reversed",
};

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  draft: "Draft",
  approved: "Approved",
  paid: "Paid",
  cancelled: "Cancelled",
  reversed: "Reversed",
};

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  cash: "Cash",
  transfer: "Bank transfer",
  payroll: "Payroll inclusion",
};
