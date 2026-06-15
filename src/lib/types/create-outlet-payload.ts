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

export interface CreateOutletPayload {
  name: string;
  businessType: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  status: "open" | "closed" | string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  orderSettings: OrderSettings;
  payoutInfo: PayoutInfo;
}
