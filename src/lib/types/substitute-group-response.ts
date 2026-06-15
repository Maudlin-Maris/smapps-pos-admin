export interface SubstituteGroupResponseItem {
  inventoryItemId: string;
  priority: number;
  conversionRatio: number;
}

export interface SubstituteGroupResponse {
  id: string;
  name: string;
  outletId: string;
  items: SubstituteGroupResponseItem[];
}
