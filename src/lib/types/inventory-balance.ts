export interface InventoryBalanceResponse {
  inventoryItemId: string;
  locationKind: string;
  locationId: string;
  quantity: number;
  reservedQty: number;
  availableQty: number;
}
