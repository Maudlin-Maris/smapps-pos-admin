import { Meta } from "./paginated-response";
import { SubstituteGroupResponse } from "./substitute-group-response";

export interface SubstituteGroupListResponse {
  data: SubstituteGroupResponse[];
  meta: Meta;
}
