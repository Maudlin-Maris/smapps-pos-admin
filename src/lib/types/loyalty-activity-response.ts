import type { Meta } from "./paginated-response";
import type { LoyaltyActivityRecord } from "./loyalty-activity-record";

export interface LoyaltyActivityResponse {
  data: LoyaltyActivityRecord[];
  meta: Meta;
}
