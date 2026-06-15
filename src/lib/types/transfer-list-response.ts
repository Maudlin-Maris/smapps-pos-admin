import { Meta } from "./paginated-response";
import { StockTransferV2 } from "@/data/transferTypes";

export interface TransferListResponse {
  data: StockTransferV2[];
  meta: Meta;
}
