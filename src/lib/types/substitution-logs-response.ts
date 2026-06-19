import { Meta } from "./paginated-response";

export interface SubstitutionLogItem {
  id: string;
  orderId: string;
  originalItemId: string;
  substituteItemId: string;
  quantity: number;
  createdAt: string;
}

export interface SubstitutionLogsListResponse {
  data: SubstitutionLogItem[];
  meta: Meta;
}
