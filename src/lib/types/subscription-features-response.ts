export interface SubscriptionFeature {
  name: string;
  desc: string;
  category: string;
  tier: number;
  addon?: boolean;
  enabled: boolean;
}

export interface SubscriptionFeaturesResponse {
  data: SubscriptionFeature[];
  enabled: SubscriptionFeature[];
  disabled: SubscriptionFeature[];
}
