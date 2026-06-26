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
import type { InventoryCategoryResponse } from "@/lib/types/inventory-category-response";
import type { InventoryCategoryListResponse } from "@/lib/types/inventory-category-list-response";
import type { CreateInventoryCategoryPayload } from "@/lib/types/create-inventory-category-payload";
import type { UpdateInventoryCategoryPayload } from "@/lib/types/update-inventory-category-payload";

export const useGetInventoryCategories = (
  params?: {
    outletId?: string;
    page?: number;
    per_page?: number;
    search?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.INVENTORY_CATEGORIES, params)
    : null;
  return useApi<InventoryCategoryListResponse>(url, options);
};

export const useGetInventoryCategory = (
  id: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<InventoryCategoryResponse>(
    isLoggedIn && id ? API_ENDPOINTS.SINGLE_INVENTORY_CATEGORY(id) : null,
    options,
  );
};

export const useCreateInventoryCategory = (
  options?: SWRMutationConfiguration<
    InventoryCategoryResponse,
    APIError,
    string,
    CreateInventoryCategoryPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (url: string, { arg }: { arg: CreateInventoryCategoryPayload }) => {
    const { data } = await api.post(url, arg);
    return data;
  };
  return useSWRMutation<InventoryCategoryResponse, APIError, string, CreateInventoryCategoryPayload>(
    API_ENDPOINTS.INVENTORY_CATEGORIES,
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to create inventory category",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateInventoryCategory = (
  options?: SWRMutationConfiguration<
    InventoryCategoryResponse,
    APIError,
    string,
    { id: string | number; payload: UpdateInventoryCategoryPayload }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg }: { arg: { id: string | number; payload: UpdateInventoryCategoryPayload } }) => {
    const { data } = await api.patch(API_ENDPOINTS.SINGLE_INVENTORY_CATEGORY(arg.id), arg.payload);
    return data;
  };
  return useSWRMutation<
    InventoryCategoryResponse,
    APIError,
    string,
    { id: string | number; payload: UpdateInventoryCategoryPayload }
  >(
    "/api/admin/inventory/categories/update",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to update category",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteInventoryCategory = (
  options?: SWRMutationConfiguration<
    { message: string },
    APIError,
    string,
    string
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg: id }: { arg: string }) => {
    const { data } = await api.delete(API_ENDPOINTS.SINGLE_INVENTORY_CATEGORY(id));
    return data;
  };
  return useSWRMutation<{ message: string }, APIError, string, string>(
    "/api/admin/inventory/categories/delete",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to delete category",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};
