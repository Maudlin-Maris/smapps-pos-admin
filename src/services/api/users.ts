import type { SWRConfiguration } from "swr";
import type { SWRMutationConfiguration } from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useApi, useApiMutation, type APIError } from "./api-hooks";
import { API_ENDPOINTS } from "./endpoints";
import { createUrlWithParams } from "@/lib/utils";

import type {
  UserRecord,
  CreateUserPayload,
  UpdateUserPayload,
  UserQueryParams,
} from "@/lib/types/users";

export const useGetUsers = (
  params?: UserQueryParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.USERS, params)
    : null;
  return useApi<UserRecord[]>(url, options);
};

export const useGetUser = (
  id: string | number | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn && id
    ? API_ENDPOINTS.SINGLE_USER(id)
    : null;
  return useApi<UserRecord>(url, options);
};

export const useCreateUser = (
  options?: SWRMutationConfiguration<
    UserRecord,
    APIError,
    string | null,
    CreateUserPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreateUserPayload, UserRecord>(
    API_ENDPOINTS.USERS,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create user",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateUser = (
  id: string | number | undefined,
  options?: SWRMutationConfiguration<
    UserRecord,
    APIError,
    string | null,
    UpdateUserPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateUserPayload, UserRecord>(
    id ? API_ENDPOINTS.SINGLE_USER(id) : null,
    "PATCH",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to update user",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeactivateUser = (
  id: string | number | undefined,
  options?: SWRMutationConfiguration<
    UserRecord,
    APIError,
    string | null,
    void
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<void, UserRecord>(
    id ? API_ENDPOINTS.DEACTIVATE_USER(id) : null,
    "PATCH",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to deactivate user",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteUser = (
  id: string | number | undefined,
  options?: SWRMutationConfiguration<
    void,
    APIError,
    string | null,
    void
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<void, void>(
    id ? API_ENDPOINTS.SINGLE_USER(id) : null,
    "DELETE",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to delete user",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};
