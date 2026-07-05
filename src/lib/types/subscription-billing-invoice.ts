import { Meta } from "./paginated-response";

export interface BillingInvoice {
  id: string;
  date: string;
  amount: string;
  amountValue: number;
  status: string;
  method: string;
  pdfUrl?: string;
}

export interface BillingInvoicesResponse {
  data: BillingInvoice[];
  meta?: Meta;
}
