export interface RoleRecord {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  userCount?: number;
  createdAt: string;
}

export interface CreateRolePayload {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissions?: string[];
}
