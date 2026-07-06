import type { Meta } from "./paginated-response";

export interface InventoryMovementItem {
  id: string;
  inventoryItemId: string;
  type: string;
  quantity: number;
  locationKind: string;
  locationId: string;
  createdAt: string;
}

export interface InventoryMovementsListResponse {
  data: InventoryMovementItem[];
  meta?: Meta;
}
