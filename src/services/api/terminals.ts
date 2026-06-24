import type { SWRConfiguration } from "swr";
import type { SWRMutationConfiguration } from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useApi, useApiMutation, type APIError } from "./api-hooks";
import { API_ENDPOINTS } from "./endpoints";

import type {
  TerminalRecord as ApiTerminalRecord,
  CreateTerminalPayload,
} from "@/lib/types/terminals";

export const useGetTerminals = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  return useApi<ApiTerminalRecord[]>(
    isLoggedIn ? API_ENDPOINTS.TERMINALS : null,
    options,
  );
};

export const useCreateTerminal = (
  options?: SWRMutationConfiguration<
    ApiTerminalRecord,
    APIError,
    string | null,
    CreateTerminalPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreateTerminalPayload, ApiTerminalRecord>(
    API_ENDPOINTS.TERMINALS,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to register terminal",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteTerminal = (
  id: string | number | undefined,
  options?: SWRMutationConfiguration<
    { message: string },
    APIError,
    string | null,
    void
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<void, { message: string }>(
    id ? API_ENDPOINTS.SINGLE_TERMINAL(id) : null,
    "DELETE",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to delete terminal",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

/**
 * Real API Terminals Service — stub endpoints for fallback compatibility.
 */
import { apiRequest } from "../http";
import { ok, err } from "../types";
import type { TerminalRecord, TerminalsService } from "../mock/terminals.types";

export const realTerminalsService: TerminalsService = {
  async list() {
    try {
      return ok(await apiRequest<TerminalRecord[]>("/api/terminals"));
    } catch (e: any) { return err(e?.message || "Failed to load terminals"); }
  },
  async register(body) {
    try {
      return ok(await apiRequest<TerminalRecord>("/api/terminals", { method: "POST", body }));
    } catch (e: any) { return err(e?.message || "Failed to register terminal"); }
  },
  async revoke(id) {
    try {
      await apiRequest<void>(`/api/terminals/${id}`, { method: "DELETE" });
      return ok(undefined);
    } catch (e: any) { return err(e?.message || "Failed to revoke terminal"); }
  },
};
