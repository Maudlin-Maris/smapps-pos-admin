export interface ModifierResponse {
  id: string;
  name: string;
  price: number;
  linkedInventoryItemId?: string;
}

export interface ModifierGroupResponse {
  id: string;
  name: string;
  description?: string;
  minSelect: number;
  maxSelect: number;
  modifiers: ModifierResponse[];
}

export interface CreateModifierGroupResponse {
  message?: string;
  data: ModifierGroupResponse;
}
