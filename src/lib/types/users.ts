export interface UserRole {
  id: string;
  name: string;
}

export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  permissions: string[];
  outlets: string[];
  isActive: boolean;
  createdAt: string;
}

export interface CreateUserPayload {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role_id: string;
  status: "active" | "inactive";
  outlets: string[];
}

export type UpdateUserPayload = {
  first_name?: string;
  last_name?: string;
  status?: "active" | "inactive";
  email?: string;
  phone?: string;
  role_id?: string;
  outlets?: string[];
}

export type UserQueryParams = {
  search?: string;
  [key: string]: string | undefined;
};
