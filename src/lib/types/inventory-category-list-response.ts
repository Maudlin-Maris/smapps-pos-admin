import { Meta } from "./paginated-response";
import { InventoryCategoryResponse } from "./inventory-category-response";

export interface InventoryCategoryListResponse {
  data: InventoryCategoryResponse[];
  meta: Meta;
}