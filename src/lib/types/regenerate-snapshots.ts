export interface RegenerateSnapshotsPayload {
  date: string;
  outletId: string;
  locationKind: string;
}

export interface RegenerateSnapshotsResponse {
  message: string;
  date: string;
  generated: number;
}
