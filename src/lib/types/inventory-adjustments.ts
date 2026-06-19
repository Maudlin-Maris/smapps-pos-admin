import { Meta } from "./paginated-response";

export interface InventoryAdjustment {
  id: string;
  inventoryItemId: string;
  type: string; // "add" | "remove" | "damaged" | "returned"
  quantity: number;
  reason: string;
  adjustedBy: string;
  createdAt: string;
}

export interface InventoryAdjustmentListResponse {
  data: InventoryAdjustment[];
  meta: Meta;
}
