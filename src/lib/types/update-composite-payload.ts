import { CompositeResponseComponent } from "./composite-response";

export interface UpdateCompositePayload {
  outletId?: string;
  name?: string;
  description?: string;
  sku?: string;
  sellPrice?: number;
  components?: CompositeResponseComponent[];
}
