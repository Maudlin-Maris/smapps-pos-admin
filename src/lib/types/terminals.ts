export interface TerminalRecord {
  id: string;
  outletId: string;
  name: string;
  deviceFingerprint?: string;
  status: "online" | "offline";
  lastSeenAt: string;
}

export interface CreateTerminalPayload {
  outletId: string;
  name: string;
}
