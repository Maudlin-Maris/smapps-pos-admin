import type { BusinessTypeId } from "@/data/businessTypes";

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

export interface Outlet {
  id: string;
  name: string;
  businessType: BusinessTypeId;
  address: string;
  phone: string;
  email: string;
  currency: string;
  status: "open" | "closed" | string;
  logoUrl: string | null;
  bannerUrl: string | null;
  departmentCount: number;
  feesCount: number;
  staffCount: number;
  locationCount: number;
  orderSettings: OrderSettings;
  payoutInfo: PayoutInfo;
  created_at: string;
}
