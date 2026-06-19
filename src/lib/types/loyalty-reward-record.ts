export interface LoyaltyRewardRecord {
  id: string;
  name: string;
  pointsCost: number;
  description?: string;
  isActive: boolean;
  outletIds: string[];
  type: "discount_percentage" | "discount_fixed" | "free_item";
  value: number;
  discountType?: "fixed" | "percentage" | "free_item" | string;
  discountValue?: number;
  freeItemId?: string;
  freeItemQuantity?: number;
}
