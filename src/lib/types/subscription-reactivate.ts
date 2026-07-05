export interface ReactivateSubscriptionResponse {
  data: {
    canceled: boolean;
    status: string;
    autoRenew: boolean;
    plan: string;
    renewalDate: string;
  };
}
