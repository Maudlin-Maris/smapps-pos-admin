export interface CustomerTransactionRecord {
  id: string;
  orderId: string;
  amount: number;
  type: "purchase" | "refund" | string;
  createdAt: string;
  paymentMethod?: string;
  paymentStatus?: "Paid" | "Pending" | "Refunded";
  orderStatus?: "Completed" | "Processing" | "Cancelled";
  location?: string;
}
