// Enterprise daily inventory snapshot domain model.
// Snapshot architecture: pre-aggregated per-day, per-location, per-item rows
// so dashboards/reports load fast without scanning the raw movement ledger.
// Movements remain the source of truth; snapshots are derived/cacheable.

export type ReconciliationStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "POSTED";

export type MovementKind =
  | "OPENING"
  | "RECEIVED"        // purchases / GRN
  | "SOLD"            // POS deduction
  | "RETURNED"        // customer returns into stock
  | "WASTED"          // spoilage / breakage
  | "ADJUSTED"        // signed manual adjustment
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "RECONCILED";     // posted variance from a reconciliation

export interface DailyInventorySnapshot {
  id: string;
  date: string;                // YYYY-MM-DD (business date)
  outletId: string;
  inventoryItemId: string;
  itemName: string;
  sku: string;
  categoryId: string;
  unit: string;
  unitCost: number;            // WAC at end of day
  // Quantities
  openingQty: number;
  receivedQty: number;
  soldQty: number;
  returnedQty: number;
  wastedQty: number;
  adjustedQty: number;         // signed (+/-)
  transferredInQty: number;
  transferredOutQty: number;
  expectedClosingQty: number;  // opening + in - out
  actualCountedQty: number | null;
  varianceQty: number;         // actual - expected (0 when not counted)
  varianceCost: number;        // varianceQty * unitCost
  // Reconciliation linkage
  reconciliationId?: string;
  reconciledAt?: string;
  reconciledBy?: string;
  // Audit
  generatedAt: string;
  source: "AUTO" | "MANUAL";
}

export interface ReconciliationLine {
  id: string;
  snapshotId: string;
  inventoryItemId: string;
  itemName: string;
  sku: string;
  unit: string;
  unitCost: number;
  expectedQty: number;
  actualQty: number;
  varianceQty: number;
  varianceCost: number;
  reasonCode?: ReconciliationReason;
  reasonNote?: string;
  // Counting session state
  counted: boolean;            // user entered a quantity
  skipped: boolean;            // user explicitly skipped
  countedAt?: string;
  countedBy?: string;
}

export type ReconciliationReason =
  | "SHRINKAGE"
  | "DAMAGE"
  | "SPOILAGE"
  | "MISCOUNT_PRIOR"
  | "DATA_ENTRY_ERROR"
  | "THEFT"
  | "RECEIVING_ERROR"
  | "OTHER";

export interface ReconciliationProgress {
  total: number;
  counted: number;
  skipped: number;
  pending: number;
  pct: number;                 // 0-100, counted/total
}

export interface InventoryReconciliation {
  id: string;
  reference: string;           // RCN-YYYY-000001
  outletId: string;
  outletName: string;
  date: string;                // snapshot date being reconciled
  status: ReconciliationStatus;
  lines: ReconciliationLine[];
  totals: {
    linesCounted: number;
    varianceQty: number;       // sum (signed)
    absVarianceQty: number;    // sum |variance|
    varianceCost: number;      // sum (signed)
    absVarianceCost: number;
  };
  progress: ReconciliationProgress;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  submittedAt?: string;
  submittedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  postedAt?: string;
  postedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectedReason?: string;
  notes?: string;
}

export interface SnapshotFilter {
  locationId?: string;         // outlet or warehouse id; undefined = all
  categoryId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  varianceOnly?: boolean;
}

export const RECONCILIATION_REASON_LABELS: Record<ReconciliationReason, string> = {
  SHRINKAGE: "Shrinkage",
  DAMAGE: "Damage",
  SPOILAGE: "Spoilage",
  MISCOUNT_PRIOR: "Prior-day miscount",
  DATA_ENTRY_ERROR: "Data entry error",
  THEFT: "Suspected theft",
  RECEIVING_ERROR: "Receiving error",
  OTHER: "Other",
};

export const RECONCILIATION_STATUS_LABELS: Record<ReconciliationStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  POSTED: "Posted",
};
