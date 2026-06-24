export interface CashierAssignmentDepartment {
  id: string;
  name: string;
}

export interface CashierAssignment {
  outletId: string;
  outletName: string;
  departments: CashierAssignmentDepartment[];
}

export interface CashierData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  assignments: CashierAssignment[];
}

export interface CashierRecord {
  id: string;
  data: CashierData;
  pin: string;
  status: "active" | "suspended";
  pinIssuedAt: string;
}

export interface UpdateCashierPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  status?: "active" | "suspended";
  assignments?: {
    outletId: string;
    departments: string[];
  }[];
}

export interface CashierQueryParams {
  search?: string;
  status?: "active" | "suspended" | "all";
}
