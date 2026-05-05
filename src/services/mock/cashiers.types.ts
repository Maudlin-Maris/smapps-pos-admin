/**
 * Cashiers service type definitions.
 */

import type { ServiceResult } from "../types";

export interface CashierRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  pin: string;
  avatar?: string;
  outlets: { outletId: string; outletName: string; departments: string[] }[];
  status: "active" | "inactive";
  created_at: string;
}

export interface CashiersService {
  list(): Promise<ServiceResult<CashierRecord[]>>;
  getById(id: string): Promise<ServiceResult<CashierRecord>>;
  create(data: Omit<CashierRecord, "id" | "created_at">): Promise<ServiceResult<CashierRecord>>;
  update(id: string, data: Partial<CashierRecord>): Promise<ServiceResult<CashierRecord>>;
  remove(id: string): Promise<ServiceResult<void>>;
}
