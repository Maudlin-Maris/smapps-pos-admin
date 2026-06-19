export interface CustomerRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loyaltyTier: "bronze" | "silver" | "gold" | "platinum";
  points: number;
  totalSpent: number;
  visitCount: number;
  lastVisitAt: string | null;
  notes?: string;
  createdAt?: string;
}
