export interface SubscriptionAddon {
  key: string;
  name: string;
  desc: string;
  price: string;
  priceValue: number;
  iconKey?: string;
  active: boolean;
  included?: boolean;
  includedFromTier: number;
  bundled?: boolean;
  comingSoon?: boolean;
}

export interface SubscriptionAddonsResponse {
  data: SubscriptionAddon[];
}
