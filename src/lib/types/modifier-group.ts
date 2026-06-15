import { Pagination } from "./paginated-response";

export interface ApiModifier {
  id: string;
  name: string;
  price: number;
  sortOrder: number;
  linkedInventoryItemId?: string;
}

export interface ApiModifierGroup {
  id: string;
  name: string;
  description?: string;
  minSelect: number;
  maxSelect: number;
  modifiers: ApiModifier[];
  catalogItemCount?: number;
  createdAt?: string;
}

export interface ModifierGroupsListResponse {
  data: ApiModifierGroup[];
  meta: Pagination;
}

export interface CreateModifierGroupPayload {
  name: string;
  description?: string;
  minSelect: number;
  maxSelect: number;
  modifiers: {
    name: string;
    price: number;
    sortOrder: number;
    linkedInventoryItemId?: string;
  }[];
}

export interface UpdateModifierGroupPayload {
  name?: string;
  description?: string;
  minSelect?: number;
  maxSelect?: number;
  modifiers?: {
    id?: string;
    name: string;
    price: number;
    sortOrder: number;
    linkedInventoryItemId?: string;
  }[];
}
