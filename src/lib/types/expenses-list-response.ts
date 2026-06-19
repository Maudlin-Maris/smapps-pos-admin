import type { Meta } from "./paginated-response";
import type { ExpenseRecord } from "./expense-record";

export interface ExpensesSummary {
  totalAmount: number;
  count: number;
}

export interface ExpensesListResponse {
  data: ExpenseRecord[];
  meta: Meta;
  summary: ExpensesSummary;
}
