import type { SWRConfiguration } from "swr";
import type { SWRMutationConfiguration } from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useApi, useApiMutation, type APIError } from "../api-hooks";
import { API_ENDPOINTS } from "../endpoints";
import { createUrlWithParams } from "@/lib/utils";

// Types
import type {
  ApiModifierGroup,
  ModifierGroupsListResponse,
  CreateModifierGroupPayload,
  UpdateModifierGroupPayload,
} from "@/lib/types/modifier-group";

export const useGetModifierGroups = (
  params?: { page?: number; per_page?: number; search?: string },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.LIST_MODIFIER_GROUPS, params)
    : null;
  return useApi<ModifierGroupsListResponse>(url, options);
};

export const useGetModifierGroup = (
  id: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<ApiModifierGroup>(
    isLoggedIn && id ? API_ENDPOINTS.GET_MODIFIER_GROUP(id) : null,
    options,
  );
};

export const useCreateModifierGroup = (
  options?: SWRMutationConfiguration<
    ApiModifierGroup,
    APIError,
    string | null,
    CreateModifierGroupPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreateModifierGroupPayload, ApiModifierGroup>(
    API_ENDPOINTS.CREATE_MODIFIER_GROUP,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create modifier group",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateModifierGroup = (
  id: number | string | undefined,
  options?: SWRMutationConfiguration<
    ApiModifierGroup,
    APIError,
    string | null,
    UpdateModifierGroupPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateModifierGroupPayload, ApiModifierGroup>(
    id ? API_ENDPOINTS.UPDATE_MODIFIER_GROUP(id) : null,
    "PATCH",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to update modifier group",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteModifierGroup = (
  id: number | string | undefined,
  options?: SWRMutationConfiguration<
    { message?: string },
    APIError,
    string | null,
    undefined
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<undefined, { message?: string }>(
    id ? API_ENDPOINTS.DELETE_MODIFIER_GROUP(id) : null,
    "DELETE",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to delete modifier group",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};
