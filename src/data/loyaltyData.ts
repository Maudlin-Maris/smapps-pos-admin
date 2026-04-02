// Shared loyalty types and data used by both CustomerManagement and POS

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export interface LoyaltyCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyTier: LoyaltyTier;
  points: number;
  totalSpent: number;
  visitCount: number;
  lastVisit: Date | null;
  notes: string;
  tags: string[];
  createdAt: Date;
}

export interface LoyaltyReward {
  id: string;
  name: string;
  pointsCost: number;
  description: string;
  type: "discount_percentage" | "discount_fixed" | "free_item";
  value: number; // percentage, fixed naira amount, or 0 for free item
  isActive: boolean;
  /** Empty array = available at ALL outlets (global). Non-empty = only at listed outlet IDs. */
  outletIds: string[];
}

export interface LoyaltyRedemption {
  customerId: string;
  customerName: string;
  rewardId: string;
  rewardName: string;
  pointsUsed: number;
  discountValue: number;
  pointsEarned: number;
}

export const tierConfig: Record<LoyaltyTier, {
  label: string;
  color: string;
  badgeClass: string;
  minPoints: number;
  earnMultiplier: number;
}> = {
  bronze:   { label: "Bronze",   color: "hsl(25, 80%, 55%)",  badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", minPoints: 0,    earnMultiplier: 1 },
  silver:   { label: "Silver",   color: "hsl(220, 10%, 55%)", badgeClass: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",           minPoints: 500,  earnMultiplier: 1.5 },
  gold:     { label: "Gold",     color: "hsl(45, 90%, 50%)",  badgeClass: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", minPoints: 2000, earnMultiplier: 2 },
  platinum: { label: "Platinum", color: "hsl(270, 60%, 55%)", badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", minPoints: 5000, earnMultiplier: 3 },
};

// Points earn rate: 1 point per ₦100 spent (base)
export const POINTS_PER_NAIRA = 1 / 100;

/** Per-outlet earn rate multiplier overrides. Missing = use global default (1x). */
export interface OutletEarnOverride {
  outletId: string;
  multiplier: number; // e.g. 1.5 means 1.5x the global base rate
  label?: string; // e.g. "Grand Opening Bonus"
}

export const outletEarnOverrides: OutletEarnOverride[] = [
  { outletId: "outlet-2", multiplier: 2, label: "Mall Branch 2x Promo" },
  { outletId: "outlet-7", multiplier: 1.5, label: "FreshMart Bonus" },
];

export function getOutletEarnMultiplier(outletId: string): number {
  const override = outletEarnOverrides.find(o => o.outletId === outletId);
  return override?.multiplier ?? 1;
}

export function calculatePointsEarned(amount: number, tier: LoyaltyTier, outletId?: string): number {
  const outletMultiplier = outletId ? getOutletEarnMultiplier(outletId) : 1;
  return Math.floor(amount * POINTS_PER_NAIRA * tierConfig[tier].earnMultiplier * outletMultiplier);
}

export const loyaltyCustomers: LoyaltyCustomer[] = [
  { id: "c1", name: "Adebayo Johnson", email: "adebayo@email.com", phone: "+234 801 111 2222", loyaltyTier: "gold", points: 2450, totalSpent: 185000, visitCount: 47, lastVisit: new Date("2024-06-12"), notes: "Prefers organic coffee", tags: ["VIP", "Regular"], createdAt: new Date("2023-06-01") },
  { id: "c2", name: "Chioma Okafor", email: "chioma@email.com", phone: "+234 802 333 4444", loyaltyTier: "platinum", points: 6200, totalSpent: 340000, visitCount: 102, lastVisit: new Date("2024-06-14"), notes: "Loves croissants", tags: ["VIP", "Birthday:March"], createdAt: new Date("2023-03-15") },
  { id: "c3", name: "Musa Abdullahi", email: "musa@email.com", phone: "+234 803 555 6666", loyaltyTier: "silver", points: 820, totalSpent: 65000, visitCount: 18, lastVisit: new Date("2024-06-08"), notes: "", tags: ["New"], createdAt: new Date("2024-01-10") },
  { id: "c4", name: "Ngozi Eze", email: "ngozi@email.com", phone: "+234 804 777 8888", loyaltyTier: "bronze", points: 150, totalSpent: 12500, visitCount: 5, lastVisit: new Date("2024-05-20"), notes: "Walk-in customer", tags: [], createdAt: new Date("2024-04-20") },
  { id: "c5", name: "Tunde Bakare", email: "tunde@email.com", phone: "+234 805 999 0000", loyaltyTier: "gold", points: 3100, totalSpent: 220000, visitCount: 64, lastVisit: new Date("2024-06-13"), notes: "Corporate account", tags: ["Corporate", "VIP"], createdAt: new Date("2023-09-01") },
];

export const loyaltyRewards: LoyaltyReward[] = [
  { id: "r1", name: "Free Coffee", pointsCost: 100, description: "Any regular sized coffee", type: "free_item", value: 0, isActive: true, outletIds: [] },
  { id: "r2", name: "10% Discount", pointsCost: 250, description: "10% off entire purchase", type: "discount_percentage", value: 10, isActive: true, outletIds: [] },
  { id: "r3", name: "Free Pastry", pointsCost: 150, description: "Any pastry from the menu", type: "free_item", value: 0, isActive: true, outletIds: ["outlet-1", "outlet-3"] },
  { id: "r4", name: "25% Discount", pointsCost: 500, description: "25% off entire purchase", type: "discount_percentage", value: 25, isActive: true, outletIds: [] },
  { id: "r5", name: "₦1,000 Off", pointsCost: 200, description: "₦1,000 off your purchase", type: "discount_fixed", value: 1000, isActive: true, outletIds: [] },
  { id: "r6", name: "₦2,500 Off", pointsCost: 400, description: "₦2,500 off your purchase", type: "discount_fixed", value: 2500, isActive: true, outletIds: ["outlet-2"] },
  { id: "r7", name: "VIP Experience", pointsCost: 1000, description: "Complimentary meal for two", type: "free_item", value: 0, isActive: false, outletIds: ["outlet-1"] },
];

/** Activity entry with outlet tracking */
export interface ActivityEntry {
  id: string;
  date: Date;
  customerName: string;
  type: "earn" | "redeem" | "adjust" | "register";
  description: string;
  points: number;
  outletId: string;
  outletName: string;
}

export const mockActivity: ActivityEntry[] = [
  { id: "a1", date: new Date("2024-06-14T14:32:00"), customerName: "Chioma Okafor", type: "redeem", description: "Redeemed 25% Discount", points: -500, outletId: "outlet-1", outletName: "Downtown Flagship" },
  { id: "a2", date: new Date("2024-06-14T14:32:00"), customerName: "Chioma Okafor", type: "earn", description: "Earned from ₦8,500 order", points: 255, outletId: "outlet-1", outletName: "Downtown Flagship" },
  { id: "a3", date: new Date("2024-06-13T11:15:00"), customerName: "Tunde Bakare", type: "earn", description: "Earned from ₦12,000 order", points: 240, outletId: "outlet-2", outletName: "Mall Branch" },
  { id: "a4", date: new Date("2024-06-12T09:45:00"), customerName: "Adebayo Johnson", type: "redeem", description: "Redeemed Free Coffee", points: -100, outletId: "outlet-3", outletName: "Airport Kiosk" },
  { id: "a5", date: new Date("2024-06-12T09:45:00"), customerName: "Adebayo Johnson", type: "earn", description: "Earned from ₦3,200 order", points: 64, outletId: "outlet-3", outletName: "Airport Kiosk" },
  { id: "a6", date: new Date("2024-06-10T16:20:00"), customerName: "Musa Abdullahi", type: "adjust", description: "Manual adjustment — Birthday bonus", points: 200, outletId: "outlet-2", outletName: "Mall Branch" },
  { id: "a7", date: new Date("2024-06-08T10:00:00"), customerName: "Ngozi Eze", type: "register", description: "New member registered at POS", points: 0, outletId: "outlet-1", outletName: "Downtown Flagship" },
  { id: "a8", date: new Date("2024-06-07T09:30:00"), customerName: "Tunde Bakare", type: "earn", description: "Earned from ₦5,000 order", points: 150, outletId: "outlet-7", outletName: "FreshMart Grocery" },
  { id: "a9", date: new Date("2024-06-06T15:00:00"), customerName: "Chioma Okafor", type: "earn", description: "Earned from ₦15,000 order", points: 450, outletId: "outlet-2", outletName: "Mall Branch" },
  { id: "a10", date: new Date("2024-06-05T12:00:00"), customerName: "Adebayo Johnson", type: "redeem", description: "Redeemed ₦1,000 Off", points: -200, outletId: "outlet-2", outletName: "Mall Branch" },
  { id: "a11", date: new Date("2024-06-04T10:15:00"), customerName: "Musa Abdullahi", type: "earn", description: "Earned from ₦2,800 order", points: 42, outletId: "outlet-1", outletName: "Downtown Flagship" },
  { id: "a12", date: new Date("2024-06-03T08:45:00"), customerName: "Ngozi Eze", type: "earn", description: "Earned from ₦1,500 order", points: 15, outletId: "outlet-7", outletName: "FreshMart Grocery" },
];
