export interface CompositeListResponse {
  data: Composite[];
  meta: Meta;
}

export interface Composite {
  id:              string;
  outletId:        string;
  name:            string;
  description:     string;
  sku:             string;
  status:          Status;
  menuItemId:      null;
  menuVariantId:   null;
  sellPrice:       number;
  overheadPerUnit: number | null;
  pricingMethod:   null | string;
  pricingValue:    number | null;
  components:      Component[];
  createdAt:       Date;
  updatedAt:       Date;
}

export interface Component {
  inventoryItemId:    string;
  itemName:           string;
  quantity:           number;
  unitId:             null | string;
  unitAbbr:           UnitAbbr;
  role:               Role;
  allowSubstitute:    boolean;
  substituteMode:     SubstituteMode;
  substitutes:        Substitute[];
  substituteGroupIds: any[];
}

export enum Role {
  Primary = "primary",
}

export enum SubstituteMode {
  Auto = "auto",
  ManualApproval = "manual_approval",
  Strict = "strict",
}

export interface Substitute {
  inventoryItemId: string;
  itemName:        string;
  priority:        number;
  conversionRatio: number;
}

export enum UnitAbbr {
  Kg = "kg",
  Litres = "litres",
  Pcs = "pcs",
}

export enum Status {
  Active = "active",
}

export interface Meta {
  current_page: number;
  per_page:     number;
  last_page:    number;
  total:        number;
  from:         number;
  to:           number;
}
