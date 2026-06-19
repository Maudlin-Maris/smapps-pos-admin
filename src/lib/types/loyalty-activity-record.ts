export interface LoyaltyActivityRecord {
  id: string;
  type: "earn" | "redeem" | "adjust" | "register" | string;
  customerId: string;
  customerName: string;
  outletName: string;
  outletId?: string;
  points: number;
  date: string;
  description?: string;
}
