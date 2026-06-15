export interface Subcategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  outletId?: string;
  icon?: string | null;
  sortOrder?: number | null;
  subcategories?: Subcategory[];
}
