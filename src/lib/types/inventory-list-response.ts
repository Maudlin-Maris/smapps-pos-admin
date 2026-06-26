import { Meta } from "./paginated-response";

export interface InventoryListItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  costPrice: number;
  categoryId?: string;
  unitId?: string;
  outletId?: string;
  stock?: number;
}

export interface InventoryListResponse {
  data: InventoryListItem[];
  meta: Meta;
}
