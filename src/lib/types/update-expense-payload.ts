export interface UpdateExpensePayload {
  outletId?: string;
  category?: string;
  amount?: number;
  date?: string;
  description?: string;
  recurring?: boolean;
  recurringPeriod?: "weekly" | "monthly" | "quarterly" | "yearly";
}
