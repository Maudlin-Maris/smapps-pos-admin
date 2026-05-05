/**
 * Real API Cashiers Service — stub endpoints.
 */

import { apiRequest } from "../http";
import { ok, err, type ServiceResult } from "../types";
import type { CashierRecord, CashiersService } from "../mock/cashiers.types";

export const realCashiersService: CashiersService = {
  async list() {
    try {
      const data = await apiRequest<CashierRecord[]>("/api/cashiers");
      return ok(data);
    } catch (e: any) { return err(e?.message || "Failed to load cashiers"); }
  },
  async getById(id) {
    try {
      const data = await apiRequest<CashierRecord>(`/api/cashiers/${id}`);
      return ok(data);
    } catch (e: any) { return err(e?.message || "Cashier not found"); }
  },
  async create(body) {
    try {
      const data = await apiRequest<CashierRecord>("/api/cashiers", { method: "POST", body });
      return ok(data);
    } catch (e: any) { return err(e?.message || "Failed to create cashier"); }
  },
  async update(id, body) {
    try {
      const data = await apiRequest<CashierRecord>(`/api/cashiers/${id}`, { method: "PATCH", body });
      return ok(data);
    } catch (e: any) { return err(e?.message || "Failed to update cashier"); }
  },
  async remove(id) {
    try {
      await apiRequest<void>(`/api/cashiers/${id}`, { method: "DELETE" });
      return ok(undefined);
    } catch (e: any) { return err(e?.message || "Failed to delete cashier"); }
  },
};
