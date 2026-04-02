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

export function calculatePointsEarned(amount: number, tier: LoyaltyTier): number {
  return Math.floor(amount * POINTS_PER_NAIRA * tierConfig[tier].earnMultiplier);
}

export const loyaltyCustomers: LoyaltyCustomer[] = [
  { id: "c1", name: "Adebayo Johnson", email: "adebayo@email.com", phone: "+234 801 111 2222", loyaltyTier: "gold", points: 2450, totalSpent: 185000, visitCount: 47, lastVisit: new Date("2024-06-12"), notes: "Prefers organic coffee", tags: ["VIP", "Regular"], createdAt: new Date("2023-06-01") },
  { id: "c2", name: "Chioma Okafor", email: "chioma@email.com", phone: "+234 802 333 4444", loyaltyTier: "platinum", points: 6200, totalSpent: 340000, visitCount: 102, lastVisit: new Date("2024-06-14"), notes: "Loves croissants", tags: ["VIP", "Birthday:March"], createdAt: new Date("2023-03-15") },
  { id: "c3", name: "Musa Abdullahi", email: "musa@email.com", phone: "+234 803 555 6666", loyaltyTier: "silver", points: 820, totalSpent: 65000, visitCount: 18, lastVisit: new Date("2024-06-08"), notes: "", tags: ["New"], createdAt: new Date("2024-01-10") },
  { id: "c4", name: "Ngozi Eze", email: "ngozi@email.com", phone: "+234 804 777 8888", loyaltyTier: "bronze", points: 150, totalSpent: 12500, visitCount: 5, lastVisit: new Date("2024-05-20"), notes: "Walk-in customer", tags: [], createdAt: new Date("2024-04-20") },
  { id: "c5", name: "Tunde Bakare", email: "tunde@email.com", phone: "+234 805 999 0000", loyaltyTier: "gold", points: 3100, totalSpent: 220000, visitCount: 64, lastVisit: new Date("2024-06-13"), notes: "Corporate account", tags: ["Corporate", "VIP"], createdAt: new Date("2023-09-01") },
];

export const loyaltyRewards: LoyaltyReward[] = [
  { id: "r1", name: "Free Coffee", pointsCost: 100, description: "Any regular sized coffee", type: "free_item", value: 0, isActive: true },
  { id: "r2", name: "10% Discount", pointsCost: 250, description: "10% off entire purchase", type: "discount_percentage", value: 10, isActive: true },
  { id: "r3", name: "Free Pastry", pointsCost: 150, description: "Any pastry from the menu", type: "free_item", value: 0, isActive: true },
  { id: "r4", name: "25% Discount", pointsCost: 500, description: "25% off entire purchase", type: "discount_percentage", value: 25, isActive: true },
  { id: "r5", name: "₦1,000 Off", pointsCost: 200, description: "₦1,000 off your purchase", type: "discount_fixed", value: 1000, isActive: true },
  { id: "r6", name: "₦2,500 Off", pointsCost: 400, description: "₦2,500 off your purchase", type: "discount_fixed", value: 2500, isActive: true },
  { id: "r7", name: "VIP Experience", pointsCost: 1000, description: "Complimentary meal for two", type: "free_item", value: 0, isActive: false },
];
