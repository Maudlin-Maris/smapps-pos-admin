import { Meta } from "./paginated-response";

export interface PromoBundleItem {
  catalogItemId: string;
  quantity: number;
  name?: string;
}

export interface ApiPromoBundle {
  id: string;
  outletId: string;
  name: string;
  description?: string;
  price: number;
  status: "active" | "inactive";
  items: PromoBundleItem[];
}

export interface CreatePromoBundlePayload {
  outletId: string;
  name: string;
  description?: string;
  price: number;
  status: "active" | "inactive";
  items: {
    catalogItemId: string;
    quantity: number;
  }[];
}

export interface ListPromoBundlesResponse {
  data: ApiPromoBundle[];
  meta: Meta;
}

export interface UpdatePromoBundleStatusPayload {
  status: "active" | "inactive";
}
