import { Meta } from "./paginated-response";
import { InventoryBalanceResponse } from "./inventory-balance";

export interface InventoryBalancesListResponse {
  data: InventoryBalanceResponse[];
  meta: Meta;
}
