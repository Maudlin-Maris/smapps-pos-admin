export interface CopyItemsToOutletPayload {
  targetOutletId: string;
  itemIds: string[];
  priceOverrides?: Record<
    string,
    {
      basePrice?: number;
      variantPrices?: Record<string, number>;
    }
  >;
}

export interface CloneItemPayload {
  name: string;
  outletId: string;
  sku: string | null;
}
