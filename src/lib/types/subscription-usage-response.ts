export interface SubscriptionUsageItem {
  key: string;
  label: string;
  used: number;
  limit: number;
  limitDisplay?: string;
  unit: string;
  percent: number;
  tone: "ok" | "warn" | "crit";
}

export interface SubscriptionUsageResponse {
  data: SubscriptionUsageItem[];
}
