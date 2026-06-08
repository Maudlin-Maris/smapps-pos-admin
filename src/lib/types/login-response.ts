export interface LoginResponse {
  message: string;
  token: string;
  tokenType: string;
  user: User;
}

export interface User {
  id: string;
  businessId: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar: null;
  phone: string;
  status: string;
  role: Role;
  role_id: string;
  assignedOutlets: any[];
  permissions: string[];
  created_at: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
}
