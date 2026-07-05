export interface SubscriptionPlanDetail {
  id: string;
  key: string;
  name: string;
  tier: number;
  tagline: string;
  price: string;
  priceValue: number;
  current: boolean;
}

export interface SubscriptionDetail {
  id: string;
  externalReference: string;
  plan: SubscriptionPlanDetail;
  scheduledPlan: string | null;
  status: "active" | "trial" | "grace" | "past_due" | "suspended";
  canceled: boolean;
  cancelReason: string | null;
  cancelFeedback: string | null;
  renewalDate: string;
  renewalDateIso: string;
  billingCycle: string;
  monthlyCost: number;
  monthlyCostFormatted: string;
  autoRenew: boolean;
  daysLeft: number;
  since: string;
  sinceIso: string;
  accountCredit: number;
  accessUntil: string;
  health: {
    label: string;
    message: string;
  };
}

export interface SubscriptionDetailResponse {
  data: SubscriptionDetail;
}
