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
import type { CompositeResponse } from "@/lib/types/composite-response";
import type { CompositeListResponse } from "@/lib/types/composite-list-response";
import type { CreateCompositePayload } from "@/lib/types/create-composite-payload";
import type { UpdateCompositePayload } from "@/lib/types/update-composite-payload";

export const useGetComposites = (
  params?: {
    outletId?: string;
    page?: number;
    per_page?: number;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.LIST_COMPOSITES, params)
    : null;
  return useApi<CompositeListResponse>(url, options);
};

export const useGetComposite = (
  id: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<CompositeResponse>(
    isLoggedIn && id ? API_ENDPOINTS.GET_COMPOSITE(id) : null,
    options,
  );
};

export const useCreateComposite = (
  options?: SWRMutationConfiguration<
    CompositeResponse,
    APIError,
    string,
    CreateCompositePayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (url: string, { arg }: { arg: CreateCompositePayload }) => {
    const { data } = await api.post(url, arg);
    return data;
  };
  return useSWRMutation<CompositeResponse, APIError, string, CreateCompositePayload>(
    API_ENDPOINTS.CREATE_COMPOSITE,
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to create recipe",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateComposite = (
  options?: SWRMutationConfiguration<
    CompositeResponse,
    APIError,
    string,
    { id: string | number; payload: UpdateCompositePayload }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg }: { arg: { id: string | number; payload: UpdateCompositePayload } }) => {
    const { data } = await api.patch(API_ENDPOINTS.UPDATE_COMPOSITE(arg.id), arg.payload);
    return data;
  };
  return useSWRMutation<
    CompositeResponse,
    APIError,
    string,
    { id: string | number; payload: UpdateCompositePayload }
  >(
    "/api/admin/inventory/composites/update",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to update recipe",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteComposite = (
  options?: SWRMutationConfiguration<
    { message: string },
    APIError,
    string,
    string
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg: id }: { arg: string }) => {
    const { data } = await api.delete(API_ENDPOINTS.DELETE_COMPOSITE(id));
    return data;
  };
  return useSWRMutation<{ message: string }, APIError, string, string>(
    "/api/admin/inventory/composites/delete",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to delete recipe",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};
