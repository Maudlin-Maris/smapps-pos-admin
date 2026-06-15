export interface CreateModifierPayload {
  name: string;
  price: number;
  sortOrder: number;
}

export interface CreateModifierGroupPayload {
  name: string;
  description?: string;
  minSelect: number;
  maxSelect: number;
  modifiers: CreateModifierPayload[];
}
