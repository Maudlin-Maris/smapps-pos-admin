import { Meta } from "./paginated-response";

export interface InventorySnapshotListItem {
  id: string;
  inventoryItemId: string;
  itemName: string;
  snapshotDate: string;
  openingQty: number;
  closingQty: number;
}

export interface InventorySnapshotsListResponse {
  data: InventorySnapshotListItem[];
  meta: Meta;
}
