/**
 * Orders service type definitions.
 */

import type { ServiceResult } from "../types";

export interface OrderRecord {
  id: string;
  outletId: string;
  cashierId: string;
  items: any[];
  status: string;
  type: string;
  total: number;
  payments: any[];
  created_at: string;
  [key: string]: any;
}

export interface OrdersService {
  list(outletId?: string): Promise<ServiceResult<OrderRecord[]>>;
  getById(id: string): Promise<ServiceResult<OrderRecord>>;
  create(data: Partial<OrderRecord>): Promise<ServiceResult<OrderRecord>>;
  update(id: string, data: Partial<OrderRecord>): Promise<ServiceResult<OrderRecord>>;
  addPayment(orderId: string, payment: any): Promise<ServiceResult<OrderRecord>>;
}
