import type { SWRInfiniteConfiguration } from "swr/infinite";
import type { SWRMutationConfiguration } from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useApiMutation, useApiInfinite, type APIError } from "../api-hooks";
import { API_ENDPOINTS } from "../endpoints";

// Types
import type { CatalogCategoriesListReponse } from "@/lib/types/catalog-categories-list-response";
import type { CreateCategoryPayload } from "@/lib/types/create-category-payload";
import type { CreateCategoryResponse } from "@/lib/types/create-category-response";
import type { UpdateCategoryPayload } from "@/lib/types/update-category-payload";
import type { UpdateCategoryResponse } from "@/lib/types/update-category-response";

export const useGetCategories = (
  params?: { outletId?: string },
  options?: SWRInfiniteConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn ? API_ENDPOINTS.CATEGORIES : null;
  return useApiInfinite<CatalogCategoriesListReponse>(
    url,
    params,
    undefined,
    options,
  );
};

export const useCreateCategory = (
  options?: SWRMutationConfiguration<
    CreateCategoryResponse,
    APIError,
    string | null,
    CreateCategoryPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreateCategoryPayload, CreateCategoryResponse>(
    API_ENDPOINTS.CATEGORIES,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create category",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateCategory = (
  id: number | string | undefined,
  options?: SWRMutationConfiguration<
    UpdateCategoryResponse,
    APIError,
    string | null,
    UpdateCategoryPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateCategoryPayload, UpdateCategoryResponse>(
    id ? API_ENDPOINTS.SINGLE_CATEGORY(id) : null,
    "PATCH",
    undefined,
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

export const useDeleteCategory = (
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
    id ? API_ENDPOINTS.SINGLE_CATEGORY(id) : null,
    "DELETE",
    undefined,
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
