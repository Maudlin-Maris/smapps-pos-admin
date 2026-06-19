export interface BulkReceiveLine {
  inventoryItemId: string;
  quantity: number;
  costPrice: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface BulkReceivePayload {
  outletId: string;
  reason: string;
  reference?: string;
  lines: BulkReceiveLine[];
}

export interface BulkReceiveResponse {
  outletId: string;
  reason: string;
  reference?: string;
  lines: BulkReceiveLine[];
}
