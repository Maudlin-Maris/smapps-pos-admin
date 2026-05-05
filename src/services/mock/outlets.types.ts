/**
 * Outlets service type definitions.
 */

import type { ServiceResult } from "../types";
import type { BusinessTypeId } from "@/data/businessTypes";

export interface OutletRecord {
  id: string;
  name: string;
  businessType: BusinessTypeId;
  address?: string;
  phone?: string;
  status?: "active" | "inactive";
}

export interface OutletsService {
  list(): Promise<ServiceResult<OutletRecord[]>>;
  getById(id: string): Promise<ServiceResult<OutletRecord>>;
  create(data: Omit<OutletRecord, "id">): Promise<ServiceResult<OutletRecord>>;
  update(id: string, data: Partial<OutletRecord>): Promise<ServiceResult<OutletRecord>>;
  remove(id: string): Promise<ServiceResult<void>>;
}
