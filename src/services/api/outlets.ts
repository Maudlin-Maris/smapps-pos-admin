/**
 * Real API Outlets Service — stub endpoints.
 */

import { apiRequest } from "../http";
import { ok, err, type ServiceResult } from "../types";
import type { OutletRecord, OutletsService } from "../mock/outlets.types";

export const realOutletsService: OutletsService = {
  async list() {
    try {
      return ok(await apiRequest<OutletRecord[]>("/api/outlets"));
    } catch (e: any) { return err(e?.message || "Failed to load outlets"); }
  },
  async getById(id) {
    try {
      return ok(await apiRequest<OutletRecord>(`/api/outlets/${id}`));
    } catch (e: any) { return err(e?.message || "Outlet not found"); }
  },
  async create(body) {
    try {
      return ok(await apiRequest<OutletRecord>("/api/outlets", { method: "POST", body }));
    } catch (e: any) { return err(e?.message || "Failed to create outlet"); }
  },
  async update(id, body) {
    try {
      return ok(await apiRequest<OutletRecord>(`/api/outlets/${id}`, { method: "PATCH", body }));
    } catch (e: any) { return err(e?.message || "Failed to update outlet"); }
  },
  async remove(id) {
    try {
      await apiRequest<void>(`/api/outlets/${id}`, { method: "DELETE" });
      return ok(undefined);
    } catch (e: any) { return err(e?.message || "Failed to delete outlet"); }
  },
};
