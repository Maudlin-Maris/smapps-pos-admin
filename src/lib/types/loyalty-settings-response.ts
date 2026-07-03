export interface LoyaltySettingsResponse {
  data: Data;
}

export interface Data {
  programEnabled:        boolean;
  baseEarnRate:          number;
  tierThresholds:        Tier;
  tierMultipliers:       Tier;
  outletOverrides:       OutletOverride[];
  crossOutletRedemption: boolean;
  autoPromptCashiers:    boolean;
  allowPosRegistration:  boolean;
  showPointsOnReceipt:   boolean;
  enablePointsExpiry:    boolean;
  pointsExpiryDays:      number;
}

export interface OutletOverride {
  outletId:   string;
  outletName: string;
  multiplier: number;
  label:      string;
}

export interface Tier {
  bronze:   number;
  silver:   number;
  gold:     number;
  platinum: number;
}
