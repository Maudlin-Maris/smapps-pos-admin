export interface PlanPreviewPayload {
  targetPlan: string;
}

export interface PlanPreviewPlanInfo {
  name: string;
  priceValue: number;
  tier: number;
  current: boolean;
}

export interface PlanPreviewLimitDiff {
  label: string;
  from: string;
  to: string;
  tone: "up" | "down" | "same";
}

export interface PlanPreviewInvoiceItem {
  label: string;
  amount: number;
}

export interface PlanPreviewResponse {
  data: {
    kind: "upgrade" | "downgrade" | "same";
    current: PlanPreviewPlanInfo;
    target: PlanPreviewPlanInfo;
    blockers: { resource: string; used: number; newLimit: number }[];
    warnings: string[];
    limitDiff: PlanPreviewLimitDiff[];
    featureDiff: {
      gained: string[];
      lost: string[];
    };
    proration: number;
    invoiceItems: PlanPreviewInvoiceItem[];
    invoiceTotal: number;
    daysLeft: number;
    cycleDays: number;
  };
}
