/**
 * Real API Inventory Service — stub endpoints.
 */

import { apiRequest } from "../http";
import { ok, err } from "../types";
import type { InventoryRecord, InventoryService } from "../mock/inventory.types";

export const realInventoryService: InventoryService = {
  async list(outletId?) {
    try {
      const q = outletId ? `?outletId=${outletId}` : "";
      return ok(await apiRequest<InventoryRecord[]>(`/api/inventory${q}`));
    } catch (e: any) { return err(e?.message || "Failed to load inventory"); }
  },
  async getById(id) {
    try {
      return ok(await apiRequest<InventoryRecord>(`/api/inventory/${id}`));
    } catch (e: any) { return err(e?.message || "Item not found"); }
  },
  async create(body) {
    try {
      return ok(await apiRequest<InventoryRecord>("/api/inventory", { method: "POST", body }));
    } catch (e: any) { return err(e?.message || "Failed to create item"); }
  },
  async update(id, body) {
    try {
      return ok(await apiRequest<InventoryRecord>(`/api/inventory/${id}`, { method: "PATCH", body }));
    } catch (e: any) { return err(e?.message || "Failed to update item"); }
  },
  async adjustStock(id, body) {
    try {
      return ok(await apiRequest<InventoryRecord>(`/api/inventory/${id}/adjust`, { method: "POST", body }));
    } catch (e: any) { return err(e?.message || "Failed to adjust stock"); }
  },
};
