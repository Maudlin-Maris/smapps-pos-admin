import type { MenuItemType } from "@/components/menu/MenuItemForm";

export interface CreateItemIngredient {
  inventoryItemId: string;
  quantity: number;
  unitId?: string;
  role?: "primary" | "secondary";
}

export interface CreateItemVariant {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  salePrice: number | null;
  salePeriodStart: string | Date | null;
  salePeriodEnd: string | Date | null;
  trackInventory: boolean;
  sku: string;
  status: "active" | "inactive";
  linkedInventoryItemId?: string;
  components?: Array<{ inventoryItemId: string; quantity: number }>;
}

export interface CreateItemPayload {
  outletId: string;
  name: string;
  description: string;
  category: string;
  categoryId?: string;
  price: number;
  quantity: number;
  salePrice: number | null;
  salePeriodStart: string | Date | null;
  salePeriodEnd: string | Date | null;
  sku: string;
  status: "active" | "inactive";
  itemType: MenuItemType;
  pricingStrategy: "base" | "variant" | "open";
  linkedInventoryItemId: string | null;
  addToInventory: boolean;
  sellingUnit: string;
  costPrice: number | null;
  pricingMethod: "markup" | "margin" | "fixed" | null;
  pricingValue: number | null;
  modifierGroupIds: string[];
  images: string[];
  ingredients: CreateItemIngredient[];
  variants: CreateItemVariant[];
}
