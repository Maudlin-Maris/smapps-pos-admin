import { Meta } from "./paginated-response";
import { InventoryReconciliation } from "@/data/snapshotTypes";

export interface ReconciliationListResponse {
  data: InventoryReconciliation[];
  meta: Meta;
}
