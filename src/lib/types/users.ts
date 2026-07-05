export interface UserRole {
  id: string;
  name: string;
}

export interface UserRecord {
  id:              string;
  businessId:      string;
  email:           string;
  first_name:      string;
  last_name:       string;
  display_name:    string;
  avatar:          null;
  phone:           string;
  status:          string;
  role:            Role;
  role_id:         string;
  assignedOutlets: AssignedOutlet[];
  permissions:     string[];
  created_at:      Date;
}

export interface AssignedOutlet {
  id:   string;
  name: string;
}

export interface Role {
  id:          string;
  name:        string;
  description: string;
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
