// Enterprise inventory-transfer domain model.
// Industry-agnostic: works for restaurants, retail, supermarkets, pharmacies,
// fashion, electronics, warehouses, wholesalers, salons, bakeries, manufacturing.

export type TransferStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "IN_TRANSIT"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "REJECTED"
  | "CANCELLED";

export type LocationKind = "outlet" | "warehouse";

export interface TransferLocation {
  id: string;          // outletId or warehouseId
  name: string;
  kind: LocationKind;
}

export type ValuationStrategy = "source" | "custom";

export interface TransferItem {
  id: string;                  // line id
  inventoryItemId: string;
  itemName: string;
  sku: string;
  barcode?: string;
  unit: string;                // unit label snapshot
  unitCost: number;            // source WAC snapshot at create time

  // Quantities — every column in the lifecycle
  availableQty: number;        // snapshot of source stock at creation
  reservedQty: number;         // already reserved across other open transfers
  transferableQty: number;     // available - reserved (snapshot)
  requestedQty: number;
  approvedQty: number;
  dispatchedQty: number;
  receivedQty: number;
  damagedQty: number;
  varianceQty: number;         // dispatched - (received + damaged); set on receive

  // Destination valuation (WAC) snapshots
  destAvailableQty?: number;
  destWacBefore?: number;
  valuationStrategy?: ValuationStrategy;
  customUnitCost?: number;
  incomingUnitCost?: number;
  destWacAfter?: number;

  // Optional batch / expiry support (pharmacy, grocery)
  batchNumber?: string;
  expiryDate?: string;

  notes?: string;
}

export type TransferReason =
  | "replenishment"
  | "rebalancing"
  | "central_distribution"
  | "kitchen_replenishment"
  | "raw_material"
  | "expiry_rotation"
  | "other";

export interface TransferAuditEntry {
  id: string;
  ts: string;        // ISO
  actor: string;     // user/role label
  action:
    | "CREATED"
    | "SUBMITTED"
    | "APPROVED"
    | "REJECTED"
    | "DISPATCHED"
    | "RECEIVED_PARTIAL"
    | "RECEIVED_FULL"
    | "CANCELLED"
    | "EDITED";
  notes?: string;
  meta?: Record<string, unknown>;
}

export interface StockTransferV2 {
  id: string;
  reference: string;           // e.g. "TRF-2026-000123"
  source: TransferLocation;
  destination: TransferLocation;
  status: TransferStatus;
  reason: TransferReason;

  items: TransferItem[];

  notes?: string;
  createdAt: string;
  createdBy: string;

  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedReason?: string;

  dispatchedAt?: string;
  dispatchedBy?: string;
  carrier?: string;
  trackingNumber?: string;

  receivedAt?: string;
  receivedBy?: string;

  cancelledAt?: string;
  cancelledReason?: string;

  audit: TransferAuditEntry[];
}

// ── Inventory movement ledger (mock) ──
export type MovementType =
  | "TRANSFER_OUT"
  | "TRANSFER_IN"
  | "TRANSFER_DAMAGE";

export interface InventoryMovement {
  id: string;
  ts: string;
  type: MovementType;
  locationId: string;
  inventoryItemId: string;
  itemName: string;
  sku: string;
  unit: string;
  quantity: number;            // signed: negative for OUT/DAMAGE, positive for IN
  balanceBefore: number;
  balanceAfter: number;
  unitCost: number;
  performedBy: string;
  transferId: string;
  transferReference: string;
  metadata?: Record<string, unknown>;
}

// ── Status presentation ──
export const TRANSFER_STATUS_META: Record<
  TransferStatus,
  { label: string; tone: string }
> = {
  DRAFT:               { label: "Draft",               tone: "bg-muted text-muted-foreground" },
  PENDING_APPROVAL:    { label: "Pending Approval",    tone: "bg-warning/15 text-warning" },
  APPROVED:            { label: "Approved",            tone: "bg-info/15 text-info" },
  IN_TRANSIT:          { label: "In Transit",          tone: "bg-accent/15 text-accent" },
  PARTIALLY_RECEIVED:  { label: "Partially Received",  tone: "bg-warning/15 text-warning" },
  RECEIVED:            { label: "Received",            tone: "bg-success/15 text-success" },
  REJECTED:            { label: "Rejected",            tone: "bg-destructive/15 text-destructive" },
  CANCELLED:           { label: "Cancelled",           tone: "bg-destructive/15 text-destructive" },
};

export const REASON_LABELS: Record<TransferReason, string> = {
  replenishment: "Replenishment",
  rebalancing: "Branch Rebalancing",
  central_distribution: "Central Distribution",
  kitchen_replenishment: "Kitchen Replenishment",
  raw_material: "Raw Material Distribution",
  expiry_rotation: "Expiry Rotation",
  other: "Other",
};

export const ACTIVE_STATUSES: TransferStatus[] = [
  "PENDING_APPROVAL",
  "APPROVED",
  "IN_TRANSIT",
  "PARTIALLY_RECEIVED",
];
