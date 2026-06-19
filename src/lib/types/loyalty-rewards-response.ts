import type { Meta } from "./paginated-response";
import type { LoyaltyRewardRecord } from "./loyalty-reward-record";

export interface LoyaltyRewardsResponse {
  data: LoyaltyRewardRecord[];
  meta: Meta;
}
