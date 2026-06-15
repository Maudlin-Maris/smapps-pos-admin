import { Meta } from "./paginated-response";
import { CompositeResponse } from "./composite-response";

export interface CompositeListResponse {
  data: CompositeResponse[];
  meta: Meta;
}
