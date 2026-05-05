/**
 * Real API Orders Service — stub endpoints.
 */

import { apiRequest } from "../http";
import { ok, err } from "../types";
import type { OrdersService, OrderRecord } from "../mock/orders.types";

export const realOrdersService: OrdersService = {
  async list(outletId?) {
    try {
      const q = outletId ? `?outletId=${outletId}` : "";
      return ok(await apiRequest<OrderRecord[]>(`/api/orders${q}`));
    } catch (e: any) { return err(e?.message || "Failed to load orders"); }
  },
  async getById(id) {
    try {
      return ok(await apiRequest<OrderRecord>(`/api/orders/${id}`));
    } catch (e: any) { return err(e?.message || "Order not found"); }
  },
  async create(body) {
    try {
      return ok(await apiRequest<OrderRecord>("/api/orders", { method: "POST", body }));
    } catch (e: any) { return err(e?.message || "Failed to create order"); }
  },
  async update(id, body) {
    try {
      return ok(await apiRequest<OrderRecord>(`/api/orders/${id}`, { method: "PATCH", body }));
    } catch (e: any) { return err(e?.message || "Failed to update order"); }
  },
  async addPayment(orderId, payment) {
    try {
      return ok(await apiRequest<OrderRecord>(`/api/orders/${orderId}/payments`, { method: "POST", body: payment }));
    } catch (e: any) { return err(e?.message || "Failed to add payment"); }
  },
};
