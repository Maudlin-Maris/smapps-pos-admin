export interface LoyaltyOutletPerformanceRecord {
  outletId: string;
  outletName: string;
  members: number;
  pointsEarned: number;
  pointsRedeemed?: number;
  registrations?: number;
  transactions?: number;
}

export interface LoyaltyOutletPerformanceResponse {
  data: LoyaltyOutletPerformanceRecord[];
}
