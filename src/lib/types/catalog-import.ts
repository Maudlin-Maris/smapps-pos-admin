import { CatalogItem } from "./catalog-item";

export interface ImportCatalogVariant {
  name: string;
  price: number;
  sku: string;
  status: string;
}

export interface ImportCatalogItem {
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  sku: string;
  status: string;
  itemType: string;
  pricingStrategy: string;
  costPrice?: number | null;
  sellingUnit?: string;
  variants: ImportCatalogVariant[];
}

export interface ImportCatalogPayload {
  outletId: string;
  skipDuplicateSkus: boolean;
  items: ImportCatalogItem[];
}

export interface ImportCatalogResponse {
  message: string;
  created: number;
  skipped: number;
  skippedSkus: string[];
  errors: string[];
  items: CatalogItem[];
}

export interface ImportCatalogPreviewItem {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  quantity: number;
  sku: string;
  status: string;
  salePrice: number | null;
  salePeriodStart: string | null;
  salePeriodEnd: string | null;
  images: string[];
  trackInventory: boolean;
  variants: {
    name: string;
    price: number;
    quantity: number;
    sku: string;
    status: string;
    salePrice: number | null;
    salePeriodStart: string | null;
    salePeriodEnd: string | null;
    trackInventory: boolean;
  }[];
  extras: any[];
  itemType: string;
  pricingStrategy: string;
  costPrice: number;
  sellingUnit: string;
}

export interface ImportCatalogPreviewResponse {
  items: ImportCatalogPreviewItem[];
  errors: string[];
  meta: {
    itemCount: number;
    variantCount: number;
    rowCount: number;
  };
}
