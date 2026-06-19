export interface TierConfig {
  tier: "bronze" | "silver" | "gold" | "platinum" | string;
  minPoints: number;
  earnMultiplier: number;
}

export interface LoyaltySettingsResponse {
  programEnabled: boolean;
  pointsPerCurrency: number;
  currencyPerPoint: number;
  tierConfigs: TierConfig[];
}
