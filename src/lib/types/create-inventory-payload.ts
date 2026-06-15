export interface CreateInventoryPayload {
  outletId: string;
  name: string;
  description: string;
  sku: string;
  categoryId: string;
  stock: number;
  minStock: number;
  unitId: string;
  costPrice: number;
  sellingPrice: number;
  pricingMethod: string;
  pricingValue: number;
  conversions: Conversion[];
  batches: Batch[];
}

export interface Batch {
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  costPrice: number;
}

export interface Conversion {
  fromQuantity: number;
  toQuantity: number;
  toUnitId: string;
  sellable: boolean;
  sellPrice: number;
}
