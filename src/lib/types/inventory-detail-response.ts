export interface InventoryDetailResponse {
  id: string;
  outletId: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  quantity: number;
  costPrice: number;
  sellPrice: number;
  reorderLevel: number;
  status: string;
  createdAt: string;
}
