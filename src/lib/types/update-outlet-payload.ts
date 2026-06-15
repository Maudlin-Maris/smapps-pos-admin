export interface OrderSettings {
  allowPaymentBeforeConfirmation: boolean;
  allowPaymentAfterConfirmation: boolean;
  disableMobileOrdering: boolean;
  restrictOrderMerging: boolean;
  restrictOrderSettlement: boolean;
}

export interface PayoutInfo {
  bank: string;
  accountNumber: string;
  accountName: string;
  otpEmail: string;
}

export interface UpdateOutletPayload {
  name?: string;
  phone?: string;
  email?: string;
  status?: "open" | "closed" | string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  orderSettings?: Partial<OrderSettings>;
  payoutInfo?: Partial<PayoutInfo>;
}
