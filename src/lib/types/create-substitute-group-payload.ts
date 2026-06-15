import { SubstituteGroupResponseItem } from "./substitute-group-response";

export interface CreateSubstituteGroupPayload {
  name: string;
  description?: string;
  outletId: string;
  items: SubstituteGroupResponseItem[];
}
