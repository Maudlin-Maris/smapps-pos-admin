/**
 * Mock Cashiers Service
 * Uses localStorage-backed data from the existing CashierManagement page.
 */

import { ok, err, type ServiceResult } from "../types";
import type { CashierRecord, CashiersService } from "./cashiers.types";

const STORAGE_KEY = "smapps_cashiers";
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function loadCashiers(): CashierRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCashiers(data: CashierRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const mockCashiersService: CashiersService = {
  async list(): Promise<ServiceResult<CashierRecord[]>> {
    await delay(200);
    return ok(loadCashiers());
  },

  async getById(id: string): Promise<ServiceResult<CashierRecord>> {
    await delay(150);
    const found = loadCashiers().find((c) => c.id === id);
    if (!found) return err("Cashier not found");
    return ok(found);
  },

  async create(data): Promise<ServiceResult<CashierRecord>> {
    await delay(300);
    const list = loadCashiers();
    const record: CashierRecord = {
      ...data,
      id: `cashier_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    list.push(record);
    saveCashiers(list);
    return ok(record);
  },

  async update(id, data): Promise<ServiceResult<CashierRecord>> {
    await delay(250);
    const list = loadCashiers();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return err("Cashier not found");
    list[idx] = { ...list[idx], ...data };
    saveCashiers(list);
    return ok(list[idx]);
  },

  async remove(id): Promise<ServiceResult<void>> {
    await delay(200);
    const list = loadCashiers().filter((c) => c.id !== id);
    saveCashiers(list);
    return ok(undefined);
  },
};
