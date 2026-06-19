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
import type { InventoryListResponse } from "@/lib/types/inventory-list-response";
import type { InventoryDetailResponse } from "@/lib/types/inventory-detail-response";
import type { CreateInventoryPayload } from "@/lib/types/create-inventory-payload";
import type { UpdateInventoryPayload } from "@/lib/types/update-inventory-payload";
import type { AdjustInventoryPayload } from "@/lib/types/adjust-inventory-payload";

export const useGetInventoryItems = (
  params?: {
    page?: number;
    per_page?: number;
    search?: string;
    categoryId?: string;
    outletId?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.INVENTORY, params)
    : null;
  return useApi<InventoryListResponse>(url, options);
};

export const useGetInventoryItem = (
  id: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<InventoryDetailResponse>(
    isLoggedIn && id ? API_ENDPOINTS.SINGLE_INVENTORY(id) : null,
    options,
  );
};

export const getInventoryItemDetails = async (id: number | string): Promise<InventoryDetailResponse> => {
  const { data } = await api.get(API_ENDPOINTS.SINGLE_INVENTORY(id));
  return data;
}

export const useCreateInventoryItem = (
  options?: SWRMutationConfiguration<
    InventoryListResponse,
    APIError,
    string,
    CreateInventoryPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (url: string, { arg }: { arg: CreateInventoryPayload }) => {
    const { data } = await api.post(url, arg);
    return data;
  };
  return useSWRMutation<InventoryListResponse, APIError, string, CreateInventoryPayload>(
    API_ENDPOINTS.INVENTORY,
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to register item",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateInventoryItem = (
  options?: SWRMutationConfiguration<
    InventoryDetailResponse,
    APIError,
    string,
    { id: string | number; payload: UpdateInventoryPayload }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg }: { arg: { id: string | number; payload: UpdateInventoryPayload } }) => {
    const { data } = await api.patch(API_ENDPOINTS.SINGLE_INVENTORY(arg.id), arg.payload);
    return data;
  };
  return useSWRMutation<
    InventoryDetailResponse,
    APIError,
    string,
    { id: string | number; payload: UpdateInventoryPayload }
  >(
    "/api/admin/inventory/update",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to update item",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteInventoryItem = (
  options?: SWRMutationConfiguration<
    { message: string },
    APIError,
    string,
    string
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg: id }: { arg: string }) => {
    const { data } = await api.delete(API_ENDPOINTS.SINGLE_INVENTORY(id));
    return data;
  };
  return useSWRMutation<{ message: string }, APIError, string, string>(
    "/api/admin/inventory/delete",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to delete item",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useAdjustInventoryItem = (
  options?: SWRMutationConfiguration<
    InventoryDetailResponse,
    APIError,
    string,
    { id: string | number; payload: AdjustInventoryPayload }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg }: { arg: { id: string | number; payload: AdjustInventoryPayload } }) => {
    const { data } = await api.post(API_ENDPOINTS.ADJUST_INVENTORY(arg.id), arg.payload);
    return data;
  };
  return useSWRMutation<
    InventoryDetailResponse,
    APIError,
    string,
    { id: string | number; payload: AdjustInventoryPayload }
  >(
    "/api/admin/inventory/adjust",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to adjust stock",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};
