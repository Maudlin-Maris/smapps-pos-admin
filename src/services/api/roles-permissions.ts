import type { SWRConfiguration } from "swr";
import type { SWRMutationConfiguration } from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useApi, useApiMutation, type APIError } from "./api-hooks";
import { API_ENDPOINTS } from "./endpoints";

import type {
  RoleRecord,
  CreateRolePayload,
  UpdateRolePayload,
} from "@/lib/types/roles-permissions";

export const useGetRoles = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  return useApi<RoleRecord[]>(
    isLoggedIn ? API_ENDPOINTS.ROLES : null,
    options,
  );
};

export const useGetRole = (
  id: string | number | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<RoleRecord>(
    isLoggedIn && id ? API_ENDPOINTS.SINGLE_ROLE(id) : null,
    options,
  );
};

export const useGetPermissions = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  return useApi<string[]>(
    isLoggedIn ? API_ENDPOINTS.ROLE_PERMISSIONS : null,
    options,
  );
};

export const useCreateRole = (
  options?: SWRMutationConfiguration<
    RoleRecord,
    APIError,
    string | null,
    CreateRolePayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreateRolePayload, RoleRecord>(
    API_ENDPOINTS.ROLES,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create role",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateRole = (
  id: string | number | undefined,
  options?: SWRMutationConfiguration<
    RoleRecord,
    APIError,
    string | null,
    UpdateRolePayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateRolePayload, RoleRecord>(
    id ? API_ENDPOINTS.SINGLE_ROLE(id) : null,
    "PATCH",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to update role",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteRole = (
  id: string | number | undefined,
  options?: SWRMutationConfiguration<
    { message: string },
    APIError,
    string | null,
    void
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<void, { message: string }>(
    id ? API_ENDPOINTS.SINGLE_ROLE(id) : null,
    "DELETE",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to delete role",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};
