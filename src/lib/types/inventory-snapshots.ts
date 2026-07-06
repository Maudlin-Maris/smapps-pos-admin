import { Meta } from "./paginated-response";

export interface InventorySnapshotListItem {
  id: string;
  inventoryItemId: string;
  itemName: string;
  snapshotDate: string;
  openingQty: number;
  closingQty: number;
  sku?: string;
  categoryId?: string;
  unit?: string;
  unitCost?: number;
  receivedQty?: number;
  soldQty?: number;
  returnedQty?: number;
  wastedQty?: number;
  adjustedQty?: number;
  transferredInQty?: number;
  transferredOutQty?: number;
  expectedClosingQty?: number;
  actualCountedQty?: number | null;
  varianceQty?: number;
  varianceCost?: number;
  reconciliationId?: string;
  reconciledAt?: string;
  reconciledBy?: string;
  generatedAt?: string;
  source?: "AUTO" | "MANUAL";
}

export interface InventorySnapshotsListResponse {
  data: InventorySnapshotListItem[];
  meta: Meta;
}
