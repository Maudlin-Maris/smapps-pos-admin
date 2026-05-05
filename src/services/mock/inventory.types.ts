/**
 * Inventory service type definitions.
 */

import type { ServiceResult } from "../types";

export interface InventoryRecord {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  subcategory?: string;
  quantity: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  outletId: string;
  [key: string]: any;
}

export interface InventoryService {
  list(outletId?: string): Promise<ServiceResult<InventoryRecord[]>>;
  getById(id: string): Promise<ServiceResult<InventoryRecord>>;
  create(data: Partial<InventoryRecord>): Promise<ServiceResult<InventoryRecord>>;
  update(id: string, data: Partial<InventoryRecord>): Promise<ServiceResult<InventoryRecord>>;
  adjustStock(id: string, adjustment: { quantity: number; reason: string; adjustedBy: string }): Promise<ServiceResult<InventoryRecord>>;
}
