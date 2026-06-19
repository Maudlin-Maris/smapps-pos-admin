import type { Meta } from "./paginated-response";

export interface TipRecord {
  id: string;
  outletId: string;
  outletName: string;
  staffId: string;
  staffName: string;
  orderId: string;
  amount: number;
  paidAmount: number;
  status: string;
  earnedAt: string;
  orderAmount?: number;
  orderPaidAmount?: number;
}

export interface TipsTotals {
  totalEarned: number;
  totalPaid: number;
  totalOutstanding: number;
  pendingCount: number;
  paidCount: number;
}

export interface TipStaff {
  id: string;
  name: string;
  outletIds: string[];
}

export interface TipsQueryParams {
  outletId?: string;
  page?: number;
  per_page?: number;
}

export interface TipsResponse {
  data: TipRecord[];
  meta: Meta;
  totals: TipsTotals;
  staff: TipStaff[];
}

export interface TipsPayoutRecord {
  id: string;
  staffId: string;
  staffName: string;
  outletId: string;
  amount: number;
  method: string;
  status: string;
  reference: string;
  createdAt: string;
}

export interface TipsPayoutsQueryParams {
  outletId?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface TipsPayoutsResponse {
  data: TipsPayoutRecord[];
  meta: Meta;
}

export interface ConfirmTipsPayoutPayload {
  email: string;
  otp: string;
  staffId: string;
  outletId: string;
  amount: number;
  method: string;
  reference: string;
}

export interface SendTipsPayoutOtpPayload {
  email: string;
  staffId: string;
  outletId: string;
  amount: number;
  method: string;
  reference: string;
  notes?: string;
}

export interface SendTipsPayoutOtpResponse {
  message: string;
  sentTo: string;
  email: string;
  expiresAt: string;
}

export interface ReverseTipsPayoutPayload {
  reason: string;
}
