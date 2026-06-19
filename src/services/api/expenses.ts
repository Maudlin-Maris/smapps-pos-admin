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
import type { ExpenseRecord } from "@/lib/types/expense-record";
import type { ExpensesListResponse } from "@/lib/types/expenses-list-response";
import type { CreateExpensePayload } from "@/lib/types/create-expense-payload";
import type { UpdateExpensePayload } from "@/lib/types/update-expense-payload";

export const useGetExpenses = (
  params?: {
    outletId?: string;
    category?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    per_page?: number;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.EXPENSES, params)
    : null;
  return useApi<ExpensesListResponse>(url, options);
};

export const useGetExpense = (
  id: string | number | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<ExpenseRecord>(
    isLoggedIn && id ? API_ENDPOINTS.SINGLE_EXPENSE(id) : null,
    options,
  );
};

export const useCreateExpense = (
  options?: SWRMutationConfiguration<
    { data: ExpenseRecord },
    APIError,
    string | null,
    CreateExpensePayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreateExpensePayload, { data: ExpenseRecord }>(
    API_ENDPOINTS.EXPENSES,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create expense",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateExpense = (
  id: string | number | undefined,
  options?: SWRMutationConfiguration<
    { data: ExpenseRecord },
    APIError,
    string | null,
    UpdateExpensePayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateExpensePayload, { data: ExpenseRecord }>(
    id ? API_ENDPOINTS.SINGLE_EXPENSE(id) : null,
    "PATCH",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to update expense",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteExpense = (
  options?: SWRMutationConfiguration<
    { message: string },
    APIError,
    string,
    string
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg: id }: { arg: string }) => {
    const { data } = await api.delete(API_ENDPOINTS.SINGLE_EXPENSE(id));
    return data;
  };
  return useSWRMutation<{ message: string }, APIError, string, string>(
    "/api/admin/expenses/delete",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to delete expense",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};
