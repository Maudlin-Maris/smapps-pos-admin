/**
 * Mock Inventory Service
 */

import { defaultInventoryItems as defaultItems } from "@/data/inventoryItems";
import { ok, err, type ServiceResult } from "../types";
import type { InventoryRecord, InventoryService } from "./inventory.types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Map existing data to InventoryRecord shape
let items: InventoryRecord[] = (defaultItems as any[]).map((item) => ({
  id: item.id,
  name: item.name,
  sku: item.sku || "",
  category: item.category || "",
  subcategory: item.subcategory || "",
  quantity: item.quantity ?? item.stock ?? 0,
  unit: item.unit || "pcs",
  costPrice: item.costPrice ?? 0,
  sellingPrice: item.sellingPrice ?? item.price ?? 0,
  outletId: item.outletId || "",
}));

export const mockInventoryService: InventoryService = {
  async list(outletId?) {
    await delay(200);
    const filtered = outletId ? items.filter((i) => i.outletId === outletId) : items;
    return ok(filtered);
  },
  async getById(id) {
    await delay(150);
    const found = items.find((i) => i.id === id);
    return found ? ok(found) : err("Inventory item not found");
  },
  async create(data) {
    await delay(300);
    const record: InventoryRecord = {
      id: `inv_${Date.now()}`,
      name: "",
      quantity: 0,
      unit: "pcs",
      costPrice: 0,
      sellingPrice: 0,
      outletId: "",
      ...data,
    };
    items.push(record);
    return ok(record);
  },
  async update(id, data) {
    await delay(250);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return err("Item not found");
    items[idx] = { ...items[idx], ...data };
    return ok(items[idx]);
  },
  async adjustStock(id, adjustment) {
    await delay(200);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return err("Item not found");
    items[idx].quantity += adjustment.quantity;
    return ok(items[idx]);
  },
};
