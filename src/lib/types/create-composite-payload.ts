import { CompositeResponseComponent } from "./composite-response";

export interface CreateCompositePayload {
  outletId: string;
  name: string;
  description?: string;
  sku: string;
  sellPrice: number;
  components: CompositeResponseComponent[];
}
