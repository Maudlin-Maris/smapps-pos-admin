export interface InventoryCategoryResponse {
  id:          string;
  parentId:    string | null;
  name:        string;
  description: string | null;
  sortOrder:   number;
  itemCount:   number;
  createdAt:   Date;
  updatedAt:   Date;
}
