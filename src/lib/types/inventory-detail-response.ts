export interface InventoryDetailResponse {
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
  sellPrice:          null;
  pricingMethod:      null;
  pricingValue:       null;
  status:             string;
  batchNumber:        null;
  expiryDate:         null;
  outletId:           string;
  outletName:         string;
  outletBusinessType: string;
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
  sellPrice:          null;
}
