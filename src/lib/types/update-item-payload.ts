import type { MenuItemType } from "@/components/menu/MenuItemForm";
import type { CreateItemIngredient, CreateItemVariant } from "./create-item-payload";

export interface UpdateItemPayload {
  name?: string;
  description?: string;
  price?: number;
  quantity?: number;
  salePrice?: number | null;
  salePeriodStart?: string | Date | null;
  salePeriodEnd?: string | Date | null;
  status?: "active" | "inactive";
  images?: string[];
  modifierGroupIds?: string[];
  ingredients?: CreateItemIngredient[];
  variants?: CreateItemVariant[];
  sku?: string;
  itemType?: MenuItemType;
  pricingStrategy?: "base" | "variant" | "open";
  linkedInventoryItemId?: string | null;
  addToInventory?: boolean;
  sellingUnit?: string;
  costPrice?: number | null;
  pricingMethod?: "markup" | "margin" | "fixed" | null;
  pricingValue?: number | null;
  category?: string;
  categoryId?: string;
}
