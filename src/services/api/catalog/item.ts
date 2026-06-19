import type { SWRConfiguration } from "swr";
import type { SWRMutationConfiguration } from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useApi, useApiMutation, type APIError } from "../api-hooks";
import { API_ENDPOINTS } from "../endpoints";
import { createUrlWithParams } from "@/lib/utils";
import { api } from "../base";

// Types
import type { CatalogItemsListResponse } from "@/lib/types/catalog-items-list-response";
import type { CatalogItem } from "@/lib/types/catalog-item";
import type { CreateItemPayload } from "@/lib/types/create-item-payload";
import type { CreateItemResponse } from "@/lib/types/create-item-response";
import type { UpdateItemPayload } from "@/lib/types/update-item-payload";
import type { UpdateItemResponse } from "@/lib/types/update-item-response";
import type { CopyItemsToOutletPayload, CloneItemPayload } from "@/lib/types/catalog-item-ops";
import type { ImportCatalogPayload, ImportCatalogResponse, ImportCatalogPreviewResponse } from "@/lib/types/catalog-import";

export const useGetItems = (
  params?: { outletId?: string },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.ITEMS, params)
    : null;
  return useApi<CatalogItemsListResponse>(url, options);
};

export const useGetItem = (
  id: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<CatalogItem>(
    isLoggedIn && id ? API_ENDPOINTS.SINGLE_ITEM(id) : null,
    options,
  );
};

export const useCreateItem = (
  options?: SWRMutationConfiguration<
    CreateItemResponse,
    APIError,
    string | null,
    CreateItemPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreateItemPayload, CreateItemResponse>(
    API_ENDPOINTS.ITEMS,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create item",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateItem = (
  id: number | string | undefined,
  options?: SWRMutationConfiguration<
    UpdateItemResponse,
    APIError,
    string | null,
    UpdateItemPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateItemPayload, UpdateItemResponse>(
    id ? API_ENDPOINTS.SINGLE_ITEM(id) : null,
    "PATCH",
    undefined,
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

export const useDeleteItem = (
  id: number | string | undefined,
  options?: SWRMutationConfiguration<
    { message: string },
    APIError,
    string | null,
    undefined
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<undefined, { message: string }>(
    id ? API_ENDPOINTS.SINGLE_ITEM(id) : null,
    "DELETE",
    undefined,
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

export const useCopyItemsToOutlet = (
  options?: SWRMutationConfiguration<
    unknown,
    APIError,
    string | null,
    CopyItemsToOutletPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CopyItemsToOutletPayload, unknown>(
    API_ENDPOINTS.COPY_ITEMS_TO_OUTLET,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to copy items",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useCloneItem = (
  id: number | string | undefined,
  options?: SWRMutationConfiguration<
    CatalogItem,
    APIError,
    string | null,
    CloneItemPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CloneItemPayload, CatalogItem>(
    id ? API_ENDPOINTS.CLONE_ITEM(id) : null,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to clone item",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useImportCatalogPreview = (
  options?: SWRMutationConfiguration<
    ImportCatalogPreviewResponse,
    APIError,
    string | null,
    FormData
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const customRequest = async (url: string | null, { arg }: { arg: FormData }) => {
    if (!url) return undefined;
    const { data } = await api.post<ImportCatalogPreviewResponse>(url, arg, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  };
  return useApiMutation<FormData, ImportCatalogPreviewResponse>(
    API_ENDPOINTS.IMPORT_CATALOG_PREVIEW,
    "POST",
    customRequest,
    {
      onError(err) {
        toast({
          title: "Failed to parse preview",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useImportCatalog = (
  options?: SWRMutationConfiguration<
    ImportCatalogResponse,
    APIError,
    string | null,
    ImportCatalogPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<ImportCatalogPayload, ImportCatalogResponse>(
    API_ENDPOINTS.IMPORT_CATALOG,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to import items",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const downloadImportTemplate = async () => {
  const response = await api.get(API_ENDPOINTS.IMPORT_CATALOG_TEMPLATE, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "catalog-import-template.xlsx");
  document.body.appendChild(link);
  link.click();
  link.remove();
};
