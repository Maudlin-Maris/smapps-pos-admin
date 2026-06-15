export interface DispatchTransferPayload {
  dispatchQtys: Record<string, number>;
  carrier?: string;
  trackingNumber?: string;
}
