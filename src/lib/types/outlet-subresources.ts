export interface DepartmentRecord {
  id:                 string;
  outletId:           string;
  name:               string;
  itemCount:          number;
  categoryCount:      number;
  assignedCategories: any[];
  createdAt:          Date;
}


export interface CreateDepartmentPayload {
  name: string;
}

export interface UpdateDepartmentPayload {
  name?: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateDepartmentCategoriesPayload {
  categoryIds: string[];
}

export interface DiscountRecord {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
}

export interface CreateDiscountPayload {
  name: string;
  type: "percentage" | "fixed";
  value: number;
}

export interface FeeRecord {
  id: string;
  name: string;
  type: string;
  value: number;
  enabled: boolean;
}

export interface CreateFeePayload {
  name: string;
  serviceOption: string;
  isFixed: boolean;
  chargeToCustomers: boolean;
  value: number;
}

export interface UpdateFeePayload {
  value?: number;
  enabled?: boolean;
}

export interface LocationRecord {
  id: string;
  name: string;
  type: string;
  sortOrder: number;
  isActive: boolean;
  description?: string;
}

export interface CreateLocationPayload {
  name: string;
  description?: string;
}

export interface UpdateLocationPayload {
  name?: string;
  isActive?: boolean;
  description?: string;
}

export interface PaymentMethodRecord {
  id:        string;
  label:     string;
  code:      string;
  enabled:   boolean;
  sortOrder: number;
  createdAt: Date;
}


export interface CreatePaymentMethodPayload {
  label: string;
}

export interface UpdatePaymentMethodPayload {
  label?: string;
  enabled?: boolean;
}

export interface TipsPresetRecord {
  id: string;
  label: string;
  type: string;
  value: number;
  sortOrder: number;
}

export interface CreateTipsPresetPayload {
  value: number;
}
