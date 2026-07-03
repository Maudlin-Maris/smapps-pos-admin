export interface LoyaltyOutletPerformanceResponse {
  data: Datum[];
}

export interface Datum {
  outletId: string;
  outletName: string;
  earned: number;
  redeemed: number;
  registrations: number;
  transactions: number;
}
