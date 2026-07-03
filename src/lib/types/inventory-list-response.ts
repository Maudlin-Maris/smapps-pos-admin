export interface InventoryListResponse {
  data:   InventoryListItem[];
  meta:   Meta;
  alerts: Alerts;
}

export interface Alerts {
  lowStockCount:     number;
  expiredCount:      number;
  expiringSoonCount: number;
}

export interface InventoryListItem {
  id:                 string;
  name:               string;
  description:        null;
  sku:                string;
  categoryId:         string;
  category:           string;
  subcategoryId:      null;
  subcategory:        null;
  quantity:           number;
  stock:              number;
  minStock:           number;
  unitId:             string;
  unitName:           string;
  unitAbbreviation:   string;
  unit:               string;
  costPrice:          number;
  sellingPrice:       number;
  sellPrice:          number | null;
  pricingMethod:      null | string;
  pricingValue:       number | null;
  status:             Status;
  batchNumber:        null;
  expiryDate:         null;
  outletId:           string;
  outletName:         OutletName;
  outletBusinessType: OutletBusinessType;
  conversions:        Conversion[];
  batches:            any[];
}
export interface Conversion {
  id:                 string;
  fromQuantity:       number;
  toQuantity:         number;
  toUnitId:           string;
  toUnit:             string;
  toUnitName:         string;
  toUnitAbbreviation: string;
  sellable:           boolean;
  sellPrice:          number | null;
}

export enum OutletBusinessType {
  Restaurant = "restaurant",
}

export enum OutletName {
  MamaPutLekki = "Mama Put — Lekki",
  MamaPutVictoriaIsland = "Mama Put — Victoria Island",
}

export enum Status {
  Critical = "critical",
  Good = "good",
}

export interface Meta {
  current_page: number;
  per_page:     number;
  last_page:    number;
  total:        number;
  from:         number;
  to:           number;
}
