import type { SWRConfiguration } from "swr";
import type { SWRMutationConfiguration } from "swr/mutation";
import useSWRMutation from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useApi, type APIError } from "../api-hooks";
import { API_ENDPOINTS } from "../endpoints";
import { createUrlWithParams } from "@/lib/utils";
import { api } from "../base";

// Types
import type { SubstituteGroupResponse } from "@/lib/types/substitute-group-response";
import type { SubstituteGroupListResponse } from "@/lib/types/substitute-group-list-response";
import type { CreateSubstituteGroupPayload } from "@/lib/types/create-substitute-group-payload";
import type { UpdateSubstituteGroupPayload } from "@/lib/types/update-substitute-group-payload";

export const useGetSubstituteGroups = (
  params?: {
    outletId?: string;
    page?: number;
    per_page?: number;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.SUBSTITUTE_GROUPS, params)
    : null;
  return useApi<SubstituteGroupListResponse>(url, options);
};

export const useGetSubstituteGroup = (
  id: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<SubstituteGroupResponse>(
    isLoggedIn && id ? API_ENDPOINTS.SINGLE_SUBSTITUTE_GROUP(id) : null,
    options,
  );
};

export const useCreateSubstituteGroup = (
  options?: SWRMutationConfiguration<
    SubstituteGroupResponse,
    APIError,
    string,
    CreateSubstituteGroupPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (url: string, { arg }: { arg: CreateSubstituteGroupPayload }) => {
    const { data } = await api.post(url, arg);
    return data;
  };
  return useSWRMutation<SubstituteGroupResponse, APIError, string, CreateSubstituteGroupPayload>(
    API_ENDPOINTS.SUBSTITUTE_GROUPS,
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to create substitute group",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateSubstituteGroup = (
  options?: SWRMutationConfiguration<
    SubstituteGroupResponse,
    APIError,
    string,
    { id: string | number; payload: UpdateSubstituteGroupPayload }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg }: { arg: { id: string | number; payload: UpdateSubstituteGroupPayload } }) => {
    const { data } = await api.patch(API_ENDPOINTS.SINGLE_SUBSTITUTE_GROUP(arg.id), arg.payload);
    return data;
  };
  return useSWRMutation<
    SubstituteGroupResponse,
    APIError,
    string,
    { id: string | number; payload: UpdateSubstituteGroupPayload }
  >(
    "/api/admin/inventory/substitute-groups/update",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to update substitute group",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteSubstituteGroup = (
  options?: SWRMutationConfiguration<
    { message: string },
    APIError,
    string,
    string
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg: id }: { arg: string }) => {
    const { data } = await api.delete(API_ENDPOINTS.SINGLE_SUBSTITUTE_GROUP(id));
    return data;
  };
  return useSWRMutation<{ message: string }, APIError, string, string>(
    "/api/admin/inventory/substitute-groups/delete",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to delete substitute group",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};
