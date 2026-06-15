export interface DraftReconciliationCount {
  snapshotId: string;
  actualQty: number;
  skipped: boolean;
}

export interface DraftReconciliationPayload {
  notes?: string;
  counts?: DraftReconciliationCount[];
}
