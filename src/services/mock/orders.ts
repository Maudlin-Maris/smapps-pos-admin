/**
 * Mock Orders Service
 */

import { mockOrders } from "@/data/posData";
import { ok, err, type ServiceResult } from "../types";
import type { OrderRecord, OrdersService } from "./orders.types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// In-memory store seeded from posData
let orders: OrderRecord[] = (mockOrders as any[]).map((o) => ({
  ...o,
  created_at: o.createdAt || new Date().toISOString(),
}));

export const mockOrdersService: OrdersService = {
  async list(outletId?) {
    await delay(200);
    const filtered = outletId ? orders.filter((o) => o.outletId === outletId) : orders;
    return ok(filtered);
  },
  async getById(id) {
    await delay(150);
    const found = orders.find((o) => o.id === id);
    return found ? ok(found) : err("Order not found");
  },
  async create(data) {
    await delay(300);
    const record: OrderRecord = {
      id: `order_${Date.now()}`,
      outletId: "",
      cashierId: "",
      items: [],
      status: "open",
      type: "dine_in",
      total: 0,
      payments: [],
      created_at: new Date().toISOString(),
      ...data,
    };
    orders.push(record);
    return ok(record);
  },
  async update(id, data) {
    await delay(200);
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return err("Order not found");
    orders[idx] = { ...orders[idx], ...data };
    return ok(orders[idx]);
  },
  async addPayment(orderId, payment) {
    await delay(200);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return err("Order not found");
    orders[idx].payments.push(payment);
    return ok(orders[idx]);
  },
};
