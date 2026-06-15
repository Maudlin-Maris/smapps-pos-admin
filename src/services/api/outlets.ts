import type { SWRConfiguration } from "swr";
import type { SWRMutationConfiguration } from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { CreateOutletPayload } from "@/lib/types/create-outlet-payload";
import type { CreateOutletResponse } from "@/lib/types/create-outlet-response";
import type { ListOutletsResponse } from "@/lib/types/list-outlets-response";
import type { UpdateOutletPayload } from "@/lib/types/update-outlet-payload";
import type { UpdateOutletResponse } from "@/lib/types/update-outlet-response";
import type { UpdateOutletStatusPayload } from "@/lib/types/update-outlet-status-payload";
import type { UpdateOutletStatusResponse } from "@/lib/types/update-outlet-status-response";

import { useApi, useApiMutation, type APIError } from "./api-hooks";
import { API_ENDPOINTS } from "./endpoints";

export const useGetOutlets = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  return useApi<ListOutletsResponse>(
    isLoggedIn ? API_ENDPOINTS.LIST_OUTLETS : null,
    options,
  );
};

export const useCreateOutlet = (
  options?: SWRMutationConfiguration<
    CreateOutletResponse,
    APIError,
    string | null,
    CreateOutletPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreateOutletPayload, CreateOutletResponse>(
    API_ENDPOINTS.CREATE_OUTLET,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create outlet",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateOutlet = (
  id: number | string | undefined,
  options?: SWRMutationConfiguration<
    UpdateOutletResponse,
    APIError,
    string | null,
    UpdateOutletPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateOutletPayload, UpdateOutletResponse>(
    id ? API_ENDPOINTS.UPDATE_OUTLET(id) : null,
    "PATCH",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to update outlet",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateOutletStatus = (
  id: number | string | undefined,
  options?: SWRMutationConfiguration<
    UpdateOutletStatusResponse,
    APIError,
    string | null,
    UpdateOutletStatusPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateOutletStatusPayload, UpdateOutletStatusResponse>(
    id ? API_ENDPOINTS.UPDATE_OUTLET_STATUS(id) : null,
    "PATCH",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to update outlet status",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

// --- Legacy Real API Outlets Service for fallback compatibility ---
import { apiRequest } from "../http";
import { ok, err } from "../types";
import type { OutletRecord, OutletsService } from "../mock/outlets.types";

export const realOutletsService: OutletsService = {
  async list() {
    try {
      return ok(await apiRequest<OutletRecord[]>("/api/outlets"));
    } catch (e: any) { return err(e?.message || "Failed to load outlets"); }
  },
  async getById(id) {
    try {
      return ok(await apiRequest<OutletRecord>(`/api/outlets/${id}`));
    } catch (e: any) { return err(e?.message || "Outlet not found"); }
  },
  async create(body) {
    try {
      return ok(await apiRequest<OutletRecord>("/api/outlets", { method: "POST", body }));
    } catch (e: any) { return err(e?.message || "Failed to create outlet"); }
  },
  async update(id, body) {
    try {
      return ok(await apiRequest<OutletRecord>(`/api/outlets/${id}`, { method: "PATCH", body }));
    } catch (e: any) { return err(e?.message || "Failed to update outlet"); }
  },
  async remove(id) {
    try {
      await apiRequest<void>(`/api/outlets/${id}`, { method: "DELETE" });
      return ok(undefined);
    } catch (e: any) { return err(e?.message || "Failed to delete outlet"); }
  },
};

