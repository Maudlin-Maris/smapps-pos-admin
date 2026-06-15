export interface CompositeResponseComponent {
  inventoryItemId: string;
  quantity: number;
  role: "primary" | "secondary";
}

export interface CompositeResponse {
  id: string;
  outletId: string;
  name: string;
  sku: string;
  sellPrice: number;
  components: CompositeResponseComponent[];
}
