/**
 * Mock Outlets Service
 */

import { outlets as defaultOutlets } from "@/data/outlets";
import { ok, err, type ServiceResult } from "../types";
import type { OutletRecord, OutletsService } from "./outlets.types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STORAGE_KEY = "smapps_outlets";

function load(): OutletRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const mapped: OutletRecord[] = defaultOutlets.map((o) => ({
    id: o.id,
    name: o.name,
    businessType: o.businessType,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
  return mapped;
}

function save(data: OutletRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const mockOutletsService: OutletsService = {
  async list() { await delay(200); return ok(load()); },
  async getById(id) {
    await delay(150);
    const found = load().find((o) => o.id === id);
    return found ? ok(found) : err("Outlet not found");
  },
  async create(data) {
    await delay(300);
    const list = load();
    const record: OutletRecord = { ...data, id: `outlet-${Date.now()}` };
    list.push(record);
    save(list);
    return ok(record);
  },
  async update(id, data) {
    await delay(250);
    const list = load();
    const idx = list.findIndex((o) => o.id === id);
    if (idx === -1) return err("Outlet not found");
    list[idx] = { ...list[idx], ...data };
    save(list);
    return ok(list[idx]);
  },
  async remove(id) {
    await delay(200);
    save(load().filter((o) => o.id !== id));
    return ok(undefined);
  },
};
