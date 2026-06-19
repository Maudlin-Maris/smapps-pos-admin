import { ReconciliationReason } from "@/data/snapshotTypes";

export interface CreateReconciliationCount {
  snapshotId: string;
  actualQty?: number;
  skipped?: boolean;
  reasonCode?: ReconciliationReason;
  reasonNote?: string;
}

export interface CreateReconciliationPayload {
  outletId: string;
  date: string;
  notes?: string;
  counts?: CreateReconciliationCount[];
}
