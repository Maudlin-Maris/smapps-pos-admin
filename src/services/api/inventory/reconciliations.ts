import type { SWRConfiguration } from "swr";
import type { SWRMutationConfiguration } from "swr/mutation";
import useSWRMutation from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useApi, type APIError } from "../api-hooks";
import { API_ENDPOINTS } from "../endpoints";
import { createUrlWithParams } from "@/lib/utils";
import { api } from "../base";

// Types
import type { InventoryReconciliation } from "@/data/snapshotTypes";
import type { ReconciliationListResponse } from "@/lib/types/reconciliation-list-response";
import type { CreateReconciliationPayload } from "@/lib/types/create-reconciliation-payload";
import type { DraftReconciliationPayload } from "@/lib/types/draft-reconciliation-payload";

export const useGetReconciliations = (
  params?: {
    outletId?: string;
    page?: number;
    per_page?: number;
    status?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.RECONCILIATIONS, params)
    : null;
  return useApi<ReconciliationListResponse>(url, options);
};

export const useGetReconciliation = (
  id: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<any>(
    isLoggedIn && id ? API_ENDPOINTS.SINGLE_RECONCILIATION(id) : null,
    options,
  );
};

export const useCreateReconciliation = (
  options?: SWRMutationConfiguration<
    any,
    APIError,
    string,
    CreateReconciliationPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (url: string, { arg }: { arg: CreateReconciliationPayload }) => {
    const { data } = await api.post(url, arg);
    return data;
  };
  return useSWRMutation<any, APIError, string, CreateReconciliationPayload>(
    API_ENDPOINTS.RECONCILIATIONS,
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to create reconciliation",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDraftReconciliation = (
  options?: SWRMutationConfiguration<
    InventoryReconciliation,
    APIError,
    string,
    { id: string | number; payload: DraftReconciliationPayload }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg }: { arg: { id: string | number; payload: DraftReconciliationPayload } }) => {
    const { data } = await api.post(API_ENDPOINTS.DRAFT_RECONCILIATION(arg.id), arg.payload);
    return data;
  };
  return useSWRMutation<
    InventoryReconciliation,
    APIError,
    string,
    { id: string | number; payload: DraftReconciliationPayload }
  >(
    "/api/admin/inventory/reconciliations/draft",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to save draft",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useSubmitReconciliation = (
  options?: SWRMutationConfiguration<
    InventoryReconciliation,
    APIError,
    string,
    string | number
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg: id }: { arg: string | number }) => {
    const { data } = await api.post(API_ENDPOINTS.SUBMIT_RECONCILIATION(id));
    return data;
  };
  return useSWRMutation<InventoryReconciliation, APIError, string, string | number>(
    "/api/admin/inventory/reconciliations/submit",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to submit reconciliation",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useApproveReconciliation = (
  options?: SWRMutationConfiguration<
    InventoryReconciliation,
    APIError,
    string,
    string | number
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg: id }: { arg: string | number }) => {
    const { data } = await api.post(API_ENDPOINTS.APPROVE_RECONCILIATION(id));
    return data;
  };
  return useSWRMutation<InventoryReconciliation, APIError, string, string | number>(
    "/api/admin/inventory/reconciliations/approve",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to approve reconciliation",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useApproveAndPostReconciliation = (
  options?: SWRMutationConfiguration<
    InventoryReconciliation,
    APIError,
    string,
    string | number
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg: id }: { arg: string | number }) => {
    const { data } = await api.post(API_ENDPOINTS.APPROVE_AND_POST_RECONCILIATION(id));
    return data;
  };
  return useSWRMutation<InventoryReconciliation, APIError, string, string | number>(
    "/api/admin/inventory/reconciliations/approve-and-post",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to approve and post reconciliation",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const usePostReconciliation = (
  options?: SWRMutationConfiguration<
    InventoryReconciliation,
    APIError,
    string,
    string | number
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg: id }: { arg: string | number }) => {
    const { data } = await api.post(API_ENDPOINTS.POST_RECONCILIATION(id));
    return data;
  };
  return useSWRMutation<InventoryReconciliation, APIError, string, string | number>(
    "/api/admin/inventory/reconciliations/post",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to post reconciliation",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useRejectReconciliation = (
  options?: SWRMutationConfiguration<
    InventoryReconciliation,
    APIError,
    string,
    { id: string | number; reason: string }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg }: { arg: { id: string | number; reason: string } }) => {
    const { data } = await api.post(API_ENDPOINTS.REJECT_RECONCILIATION(arg.id), { reason: arg.reason });
    return data;
  };
  return useSWRMutation<
    InventoryReconciliation,
    APIError,
    string,
    { id: string | number; reason: string }
  >(
    "/api/admin/inventory/reconciliations/reject",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to reject reconciliation",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteReconciliation = (
  options?: SWRMutationConfiguration<
    void,
    APIError,
    string,
    string | number
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg: id }: { arg: string | number }) => {
    const { data } = await api.delete(API_ENDPOINTS.SINGLE_RECONCILIATION(id));
    return data;
  };
  return useSWRMutation<void, APIError, string, string | number>(
    "/api/admin/inventory/reconciliations/delete",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to delete reconciliation",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};
