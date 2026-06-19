import type { Meta } from "./paginated-response";
import type { CustomerRecord } from "./customer-record";

export interface CustomersListStats {
  total: number;
  totalPoints: number;
  avgSpend: number;
  vipCount: number;
}

export interface CustomersListResponse {
  data: CustomerRecord[];
  meta: Meta;
  stats: CustomersListStats;
}
