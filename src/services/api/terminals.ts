import type { SWRConfiguration } from "swr";
import type { SWRMutationConfiguration } from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useApi, useApiMutation, type APIError } from "./api-hooks";
import { API_ENDPOINTS } from "./endpoints";
import { createUrlWithParams } from "@/lib/utils";

import type {
  TerminalRecord as ApiTerminalRecord,
  CreateTerminalPayload,
} from "@/lib/types/terminals";

export const useGetTerminals = (
  params?: { search?: string },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.TERMINALS, params)
    : null;
  return useApi<ApiTerminalRecord[]>(url, options);
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
