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
import type { StockTransferV2, TransferStatus } from "@/data/transferTypes";
import type { TransferListResponse } from "@/lib/types/transfer-list-response";
import type { CreateTransferPayload } from "@/lib/types/create-transfer-payload";
import type { DispatchTransferPayload } from "@/lib/types/dispatch-transfer-payload";
import type { ReceiveTransferPayload } from "@/lib/types/receive-transfer-payload";

export const useGetTransfers = (
  params?: {
    page?: number;
    per_page?: number;
    status?: TransferStatus;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.TRANSFERS, params)
    : null;
  return useApi<TransferListResponse>(url, options);
};

export const useGetTransfer = (
  id: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<StockTransferV2>(
    isLoggedIn && id ? API_ENDPOINTS.SINGLE_TRANSFER(id) : null,
    options,
  );
};

export const useCreateTransfer = (
  options?: SWRMutationConfiguration<
    StockTransferV2,
    APIError,
    string,
    CreateTransferPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (url: string, { arg }: { arg: CreateTransferPayload }) => {
    const { data } = await api.post(url, arg);
    return data;
  };
  return useSWRMutation<StockTransferV2, APIError, string, CreateTransferPayload>(
    API_ENDPOINTS.TRANSFERS,
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to create transfer",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateTransfer = (
  options?: SWRMutationConfiguration<
    StockTransferV2,
    APIError,
    string,
    { id: string | number; payload: { notes: string } }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg }: { arg: { id: string | number; payload: { notes: string } } }) => {
    const { data } = await api.patch(API_ENDPOINTS.SINGLE_TRANSFER(arg.id), arg.payload);
    return data;
  };
  return useSWRMutation<
    StockTransferV2,
    APIError,
    string,
    { id: string | number; payload: { notes: string } }
  >(
    "/api/admin/inventory/transfers/update",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to update transfer",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useApproveTransfer = (
  options?: SWRMutationConfiguration<
    StockTransferV2,
    APIError,
    string,
    { id: string | number; payload: { lineApprovals: Record<string, number> } }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg }: { arg: { id: string | number; payload: { lineApprovals: Record<string, number> } } }) => {
    const { data } = await api.post(API_ENDPOINTS.APPROVE_TRANSFER(arg.id), arg.payload);
    return data;
  };
  return useSWRMutation<
    StockTransferV2,
    APIError,
    string,
    { id: string | number; payload: { lineApprovals: Record<string, number> } }
  >(
    "/api/admin/inventory/transfers/approve",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to approve transfer",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useCancelTransfer = (
  options?: SWRMutationConfiguration<
    StockTransferV2,
    APIError,
    string,
    { id: string | number; payload: { reason: string } }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg }: { arg: { id: string | number; payload: { reason: string } } }) => {
    const { data } = await api.post(API_ENDPOINTS.CANCEL_TRANSFER(arg.id), arg.payload);
    return data;
  };
  return useSWRMutation<
    StockTransferV2,
    APIError,
    string,
    { id: string | number; payload: { reason: string } }
  >(
    "/api/admin/inventory/transfers/cancel",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to cancel transfer",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDispatchTransfer = (
  options?: SWRMutationConfiguration<
    StockTransferV2,
    APIError,
    string,
    { id: string | number; payload: DispatchTransferPayload }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg }: { arg: { id: string | number; payload: DispatchTransferPayload } }) => {
    const { data } = await api.post(API_ENDPOINTS.DISPATCH_TRANSFER(arg.id), arg.payload);
    return data;
  };
  return useSWRMutation<
    StockTransferV2,
    APIError,
    string,
    { id: string | number; payload: DispatchTransferPayload }
  >(
    "/api/admin/inventory/transfers/dispatch",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to dispatch transfer",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useReceiveTransfer = (
  options?: SWRMutationConfiguration<
    StockTransferV2,
    APIError,
    string,
    { id: string | number; payload: ReceiveTransferPayload }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg }: { arg: { id: string | number; payload: ReceiveTransferPayload } }) => {
    const { data } = await api.post(API_ENDPOINTS.RECEIVE_TRANSFER(arg.id), arg.payload);
    return data;
  };
  return useSWRMutation<
    StockTransferV2,
    APIError,
    string,
    { id: string | number; payload: ReceiveTransferPayload }
  >(
    "/api/admin/inventory/transfers/receive",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to receive transfer",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useRejectTransfer = (
  options?: SWRMutationConfiguration<
    StockTransferV2,
    APIError,
    string,
    { id: string | number; payload: { reason: string } }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg }: { arg: { id: string | number; payload: { reason: string } } }) => {
    const { data } = await api.post(API_ENDPOINTS.REJECT_TRANSFER(arg.id), arg.payload);
    return data;
  };
  return useSWRMutation<
    StockTransferV2,
    APIError,
    string,
    { id: string | number; payload: { reason: string } }
  >(
    "/api/admin/inventory/transfers/reject",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to reject transfer",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useSubmitTransfer = (
  options?: SWRMutationConfiguration<
    StockTransferV2,
    APIError,
    string,
    string | number
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg: id }: { arg: string | number }) => {
    const { data } = await api.post(API_ENDPOINTS.SUBMIT_TRANSFER(id));
    return data;
  };
  return useSWRMutation<StockTransferV2, APIError, string, string | number>(
    "/api/admin/inventory/transfers/submit",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to submit transfer",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteTransfer = (
  options?: SWRMutationConfiguration<
    void,
    APIError,
    string,
    string | number
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg: id }: { arg: string | number }) => {
    const { data } = await api.delete(API_ENDPOINTS.SINGLE_TRANSFER(id));
    return data;
  };
  return useSWRMutation<void, APIError, string, string | number>(
    "/api/admin/inventory/transfers/delete",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to delete transfer",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};
