export interface ConfirmPlanChangePayload {
  targetPlan: string;
}

export interface ConfirmPlanChangeResponse {
  data: {
    success: boolean;
    newPlan: string;
    newPlanKey: string;
    effectiveAt: string;
    chargedAmount: number;
    invoiceId: string;
  };
}
