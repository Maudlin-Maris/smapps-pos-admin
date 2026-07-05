export interface UpcomingInvoiceItem {
  label: string;
  amount: string;
  amountValue: number;
}

export interface UpcomingInvoice {
  number: string;
  date: string;
  dateIso?: string;
  amount: string;
  amountValue: number;
  items: UpcomingInvoiceItem[];
}

export interface UpcomingInvoiceResponse {
  data: UpcomingInvoice;
}
