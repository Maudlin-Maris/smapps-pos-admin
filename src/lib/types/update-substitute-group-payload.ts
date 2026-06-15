import { SubstituteGroupResponseItem } from "./substitute-group-response";

export interface UpdateSubstituteGroupPayload {
  name?: string;
  description?: string;
  outletId?: string;
  items?: SubstituteGroupResponseItem[];
}
