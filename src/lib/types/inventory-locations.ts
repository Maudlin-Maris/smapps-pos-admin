export interface CreateLocationPayload {
  kind: "warehouse" | "outlet";
  name: string;
  code: string;
  outletId?: string | null;
}

export interface InventoryLocationResponse {
  data: InventoryLocationResponseItem[];
}

export interface InventoryLocationResponseItem {
  id: string;
  kind: string; // "warehouse" | "outlet"
  name: string;
  code: string;
  outletId?: string | null;
}
