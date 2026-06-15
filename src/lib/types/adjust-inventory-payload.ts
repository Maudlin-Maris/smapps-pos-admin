export interface AdjustInventoryPayload {
  type: "add" | "remove" | string;
  quantity: number;
  reason: string;
  costPrice?: number;
  notes?: string;
}
