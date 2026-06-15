export interface ReceiveTransferReceipt {
  received: number;
  damaged: number;
  notes?: string;
}

export interface ReceiveTransferPayload {
  receipts: ReceiveTransferReceipt[] | Record<string, ReceiveTransferReceipt>;
}
