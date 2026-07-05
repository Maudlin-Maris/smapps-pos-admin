export interface CancelSubscriptionPayload {
  reason: string;
  feedback?: string;
}

export interface CancelSubscriptionResponse {
  data: {
    canceled: boolean;
    status: string;
    autoRenew: boolean;
    cancelReason: string;
    cancelFeedback?: string;
    cancelledAt: string;
    accessUntil: string;
  };
}
