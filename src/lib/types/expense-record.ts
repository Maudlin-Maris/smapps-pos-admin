export interface ExpenseRecord {
  id: string;
  outletId: string;
  outletName?: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  recurring: boolean;
  recurringPeriod?: "weekly" | "monthly" | "quarterly" | "yearly";
  createdAt?: string;
  updatedAt?: string;
}
