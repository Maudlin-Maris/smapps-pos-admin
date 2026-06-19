import type { SWRConfiguration } from "swr";
import type { SWRMutationConfiguration } from "swr/mutation";
import useSWRMutation from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useApi, useApiMutation, type APIError } from "./api-hooks";
import { API_ENDPOINTS } from "./endpoints";
import { createUrlWithParams } from "@/lib/utils";
import { api } from "./base";

// Types
import type { CustomerRecord } from "@/lib/types/customer-record";
import type { CustomersListResponse } from "@/lib/types/customers-list-response";
import type { CustomerTransactionsResponse } from "@/lib/types/customer-transactions-response";
import type { UpdateCustomerPayload } from "@/lib/types/update-customer-payload";

export const useGetCustomers = (
  params?: {
    page?: number;
    per_page?: number;
    search?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.CUSTOMERS, params)
    : null;
  return useApi<CustomersListResponse>(url, options);
};

export const useGetCustomer = (
  id: string | number | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<CustomerRecord>(
    isLoggedIn && id ? API_ENDPOINTS.SINGLE_CUSTOMER(id) : null,
    options,
  );
};

export const useGetCustomerTransactions = (
  id: string | number | undefined,
  params?: {
    page?: number;
    per_page?: number;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn && id
    ? createUrlWithParams(API_ENDPOINTS.GET_CUSTOMER_TRANSACTIONS(id), params)
    : null;
  return useApi<CustomerTransactionsResponse>(url, options);
};

export const useCreateCustomer = (
  options?: SWRMutationConfiguration<
    CustomerRecord,
    APIError,
    string | null,
    Omit<CustomerRecord, "id" | "loyaltyTier" | "points" | "totalSpent" | "visitCount" | "lastVisitAt">
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<Omit<CustomerRecord, "id" | "loyaltyTier" | "points" | "totalSpent" | "visitCount" | "lastVisitAt">, CustomerRecord>(
    API_ENDPOINTS.CUSTOMERS,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create customer",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateCustomer = (
  id: string | number | undefined,
  options?: SWRMutationConfiguration<
    CustomerRecord,
    APIError,
    string | null,
    UpdateCustomerPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateCustomerPayload, CustomerRecord>(
    id ? API_ENDPOINTS.SINGLE_CUSTOMER(id) : null,
    "PATCH",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to update customer",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};
