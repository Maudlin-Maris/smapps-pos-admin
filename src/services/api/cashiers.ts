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

/**
 * Real API Cashiers Service — stub endpoints for fallback compatibility.
 */
import { apiRequest } from "../http";
import { ok, err, type ServiceResult } from "../types";
import type { CashierRecord, CashiersService } from "../mock/cashiers.types";

export const realCashiersService: CashiersService = {
  async list() {
    try {
      const data = await apiRequest<CashierRecord[]>("/api/cashiers");
      return ok(data);
    } catch (e: any) { return err(e?.message || "Failed to load cashiers"); }
  },
  async getById(id) {
    try {
      const data = await apiRequest<CashierRecord>(`/api/cashiers/${id}`);
      return ok(data);
    } catch (e: any) { return err(e?.message || "Cashier not found"); }
  },
  async create(body) {
    try {
      const data = await apiRequest<CashierRecord>("/api/cashiers", { method: "POST", body });
      return ok(data);
    } catch (e: any) { return err(e?.message || "Failed to create cashier"); }
  },
  async update(id, body) {
    try {
      const data = await apiRequest<CashierRecord>(`/api/cashiers/${id}`, { method: "PATCH", body });
      return ok(data);
    } catch (e: any) { return err(e?.message || "Failed to update cashier"); }
  },
  async remove(id) {
    try {
      await apiRequest<void>(`/api/cashiers/${id}`, { method: "DELETE" });
      return ok(undefined);
    } catch (e: any) { return err(e?.message || "Failed to delete cashier"); }
  },
};
