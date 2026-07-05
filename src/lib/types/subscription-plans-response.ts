export interface SubscriptionPlan {
  key: string;
  name: string;
  price: string;
  priceValue: number;
  tier: number;
  tagline: string;
  outlets: number | string;
  staff: number | string;
  transactions: number | string;
  reports: string;
  support: string;
  current: boolean;
}

export interface SubscriptionPlansResponse {
  data: SubscriptionPlan[];
}
