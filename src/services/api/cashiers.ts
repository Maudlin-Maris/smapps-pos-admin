import type { SWRConfiguration } from "swr";
import type { SWRMutationConfiguration } from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useApi, useApiMutation, type APIError } from "./api-hooks";
import { API_ENDPOINTS } from "./endpoints";
import { createUrlWithParams } from "@/lib/utils";

import type {
  CashierRecord as ApiCashierRecord,
  UpdateCashierPayload,
  CashierQueryParams,
} from "@/lib/types/cashiers";

export const useGetCashiers = (
  params?: CashierQueryParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.CASHIERS, params)
    : null;
  return useApi<ApiCashierRecord[]>(url, options);
};

export const useCreateCashier = (
  options?: SWRMutationConfiguration<
    ApiCashierRecord,
    APIError,
    string | null,
    UpdateCashierPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateCashierPayload, ApiCashierRecord>(
    API_ENDPOINTS.CASHIERS,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create cashier",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateCashier = (
  id: string | number | undefined,
  options?: SWRMutationConfiguration<
    ApiCashierRecord,
    APIError,
    string | null,
    UpdateCashierPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateCashierPayload, ApiCashierRecord>(
    id ? API_ENDPOINTS.SINGLE_CASHIER(id) : null,
    "PATCH",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to update cashier",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useRegenerateCashierPin = (
  id: string | number | undefined,
  options?: SWRMutationConfiguration<
    ApiCashierRecord,
    APIError,
    string | null,
    void
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<void, ApiCashierRecord>(
    id ? API_ENDPOINTS.REGENERATE_CASHIER_PIN(id) : null,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to regenerate PIN",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteCashier = (
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
    id ? API_ENDPOINTS.SINGLE_CASHIER(id) : null,
    "DELETE",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to delete cashier",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

// Obsolete fallback code referencing deleted mock types has been removed.
