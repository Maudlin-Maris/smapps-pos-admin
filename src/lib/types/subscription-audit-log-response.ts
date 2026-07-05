import { Meta } from "./paginated-response";

export interface SubscriptionAuditLog {
  date: string;
  dateIso?: string;
  type: string;
  title: string;
  desc: string;
}

export interface SubscriptionAuditLogResponse {
  data: SubscriptionAuditLog[];
  meta?: Meta;
}
