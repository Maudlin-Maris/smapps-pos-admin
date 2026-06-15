import { TransferLocation, TransferReason } from "@/data/transferTypes";

export interface CreateTransferItemPayload {
  inventoryItemId: string;
  requestedQty: number;
  unit: string;
}

export interface CreateTransferPayload {
  source: TransferLocation;
  destination: TransferLocation;
  reason: TransferReason;
  notes?: string;
  items: CreateTransferItemPayload[];
  submit: boolean;
}
