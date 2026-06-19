import type { Meta } from "./paginated-response";
import type { CustomerTransactionRecord } from "./customer-transaction-record";

export interface CustomerTransactionsResponse {
  data: CustomerTransactionRecord[];
  meta: Meta;
}
