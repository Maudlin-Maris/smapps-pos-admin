/**
 * Terminals service type definitions.
 */

import type { ServiceResult } from "../types";

export interface TerminalRecord {
  id: string;
  name: string;
  linkingId: string;
  outletId: string;
  outletName: string;
  status: "online" | "offline";
  lastSeen: string;
  created_at: string;
}

export interface TerminalsService {
  list(): Promise<ServiceResult<TerminalRecord[]>>;
  register(data: { name: string; outletId: string; outletName: string }): Promise<ServiceResult<TerminalRecord>>;
  revoke(id: string): Promise<ServiceResult<void>>;
}
