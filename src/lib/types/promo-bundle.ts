import { Meta } from "./paginated-response";

export interface PromoBundleItem {
  catalogItemId: string;
  quantity: number;
  name?: string;
}

export interface APIPromoBundle {
  id:                string;
  name:              string;
  description:       string;
  outletId:          string;
  pricingType:       string;
  pricingValue:      number;
  originalPrice:     number;
  bundlePrice:       number;
  savingsPercentage: number;
  status:            string;
  startDate:         null;
  endDate:           null;
  image:             null;
  imageUrl:          null;
  items:             Item[];
}

export interface Item {
  id:          string;
  productId:   string;
  productName: string;
  variantId:   null | string;
  variantName: null | string;
  quantity:    number;
  slotPrice:   number;
  swappable:   boolean;
  sortOrder:   number;
  swapOptions: APISwapOption[];
}

export interface APISwapOption {
  id:          string;
  productId:   string;
  productName: string;
  variantId:   null | string;
  variantName: null | string;
  upcharge:    number;
}


export interface CreatePromoBundlePayload {
  outletId: string;
  name: string;
  description?: string;
  price: number;
  status: "active" | "inactive";
  pricingType?: string;
  pricingValue?: number;
  items: {
    catalogItemId: string;
    quantity: number;
    variantId?: string | null;
    swappable?: boolean;
    swapOptions?: {
      catalogItemId: string;
      variantId?: string | null;
    }[];
  }[];
}

export interface ListPromoBundlesResponse {
  data: ApiPromoBundle[];
  meta: Meta;
}

export interface UpdatePromoBundleStatusPayload {
  status: "active" | "inactive";
}

export interface SwapOption {
  productId: string;
  productName: string;
  /** Optional: lock to a specific variant */
  variantId?: string;
  variantName?: string;
}

export interface BundleItem {
  productId: string;
  productName: string;
  quantity: number;
  price?: number;
  /** If set, lock to this variant */
  variantId?: string;
  variantName?: string;
  /** Admin-configured allowed swap alternatives for this slot */
  swapOptions?: SwapOption[];
  /** Whether swapping is enabled for this slot */
  swappable?: boolean;
}

export type BundlePricingType = "fixed" | "percentage_discount";

export interface PromoBundle {
  id: string;
  name: string;
  description: string;
  outletId: string;
  items: BundleItem[];
  /** "fixed" = sell at this price; "percentage_discount" = X% off combined item total */
  pricingType: BundlePricingType;
  /** For fixed: the bundle price. For percentage_discount: the % off (0-100) */
  pricingValue: number;
  /** Computed original price (sum of items) */
  originalPrice: number;
  /** Computed final price */
  bundlePrice: number;
  status: "active" | "inactive";
  startDate?: Date;
  endDate?: Date;
  image?: string;
}

export interface POSVariant {
  id: string;
  name: string;
  price: number;
  sku?: string;
}

export interface POSProduct {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  subcategoryId?: string;
  image?: string;
  barcode?: string;
  variants?: POSVariant[];
  inStock: boolean;
  outletId: string;
}

export type ApiPromoBundle = APIPromoBundle;



