import type { SWRConfiguration } from "swr";
import type { SWRMutationConfiguration } from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useApi, useApiMutation, type APIError } from "../api-hooks";
import { API_ENDPOINTS } from "../endpoints";
import { createUrlWithParams } from "@/lib/utils";

// Types
import type {
  ApiPromoBundle,
  CreatePromoBundlePayload,
  ListPromoBundlesResponse,
  UpdatePromoBundleStatusPayload,
} from "@/lib/types/promo-bundle";

export const useGetPromoBundles = (
  params?: { outletId?: string; search?: string },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.BUNDLES, params)
    : null;
  return useApi<ListPromoBundlesResponse>(url, options);
};

export const useGetPromoBundle = (
  id: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<ApiPromoBundle>(
    isLoggedIn && id ? API_ENDPOINTS.SINGLE_BUNDLE(id) : null,
    options,
  );
};

export const useCreatePromoBundle = (
  options?: SWRMutationConfiguration<
    ApiPromoBundle,
    APIError,
    string | null,
    CreatePromoBundlePayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreatePromoBundlePayload, ApiPromoBundle>(
    API_ENDPOINTS.BUNDLES,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create promo bundle",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeletePromoBundle = (
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
    id ? API_ENDPOINTS.SINGLE_BUNDLE(id) : null,
    "DELETE",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to delete promo bundle",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateBundleStatus = (
  id: number | string | undefined,
  options?: SWRMutationConfiguration<
    ApiPromoBundle,
    APIError,
    string | null,
    UpdatePromoBundleStatusPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdatePromoBundleStatusPayload, ApiPromoBundle>(
    id ? API_ENDPOINTS.UPDATE_BUNDLE_STATUS(id) : null,
    "PATCH",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to update bundle status",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdatePromoBundle = (
  id: number | string | undefined,
  options?: SWRMutationConfiguration<
    ApiPromoBundle,
    APIError,
    string | null,
    CreatePromoBundlePayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreatePromoBundlePayload, ApiPromoBundle>(
    id ? API_ENDPOINTS.SINGLE_BUNDLE(id) : null,
    "PATCH",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to update promo bundle",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};
