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

export interface CartSubstitutionRecord {
  originalItemId: string;
  originalItemName: string;
  substituteItemId: string;
  substituteItemName: string;
  /** Substitute base-unit qty drawn. */
  quantityUsed: number;
  conversionRatio: number;
  /** substituteCost*qty - originalCost*equivalentQty. Negative = saved. */
  costVariance: number;
  /** Why the substitution happened. */
  reason: "auto" | "manual_approval" | "fallback";
  approvedBy?: string;
  timestamp: string;
}
