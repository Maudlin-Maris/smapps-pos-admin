/**
 * Real API Terminals Service — stub endpoints.
 */

import { apiRequest } from "../http";
import { ok, err } from "../types";
import type { TerminalRecord, TerminalsService } from "../mock/terminals.types";

export const realTerminalsService: TerminalsService = {
  async list() {
    try {
      return ok(await apiRequest<TerminalRecord[]>("/api/terminals"));
    } catch (e: any) { return err(e?.message || "Failed to load terminals"); }
  },
  async register(body) {
    try {
      return ok(await apiRequest<TerminalRecord>("/api/terminals", { method: "POST", body }));
    } catch (e: any) { return err(e?.message || "Failed to register terminal"); }
  },
  async revoke(id) {
    try {
      await apiRequest<void>(`/api/terminals/${id}`, { method: "DELETE" });
      return ok(undefined);
    } catch (e: any) { return err(e?.message || "Failed to revoke terminal"); }
  },
};
