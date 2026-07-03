import type { SWRConfiguration } from "swr";
import type { SWRInfiniteConfiguration } from "swr/infinite";
import type { SWRMutationConfiguration } from "swr/mutation";
import useSWRMutation from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useApi, useApiInfinite, type APIError } from "../api-hooks";
import { API_ENDPOINTS } from "../endpoints";
import { createUrlWithParams } from "@/lib/utils";
import { api } from "../base";

// Types
import type { InventoryListResponse } from "@/lib/types/inventory-list-response";
import type { InventoryAdjustmentListResponse } from "@/lib/types/inventory-adjustments";
import type { InventoryBalanceResponse } from "@/lib/types/inventory-balance";
import type { InventoryBalancesListResponse } from "@/lib/types/inventory-balances";
import type { BulkReceivePayload, BulkReceiveResponse } from "@/lib/types/bulk-receive";
import type { CreateLocationPayload, InventoryLocationResponse } from "@/lib/types/inventory-locations";
import type { InventoryMovementsListResponse } from "@/lib/types/inventory-movements";
import type { InventoryPickerResponseItem } from "@/lib/types/inventory-picker";
import type { RegenerateSnapshotsPayload, RegenerateSnapshotsResponse } from "@/lib/types/regenerate-snapshots";
import type { InventorySnapshotsListResponse } from "@/lib/types/inventory-snapshots";
import type { InventorySnapshotsSummaryResponse } from "@/lib/types/inventory-snapshots-summary";
import type { SubstitutionLogsListResponse } from "@/lib/types/substitution-logs-response";

export const useGetInventoryAdjustments = (
  params?: {
    page?: number;
    per_page?: number;
    outletId?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.LIST_ADJUSTMENTS, params)
    : null;
  return useApi<InventoryAdjustmentListResponse>(url, options);
};

export const useGetInventoryBalance = (
  params?: {
    inventoryItemId?: string;
    locationKind?: string;
    locationId?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn && params?.inventoryItemId
    ? createUrlWithParams(API_ENDPOINTS.GET_BALANCE, params)
    : null;
  return useApi<InventoryBalanceResponse>(url, options);
};

export const useGetInventoryBalances = (
  params?: {
    locationKind?: string;
    locationId?: string;
    page?: number;
    per_page?: number;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.LIST_BALANCES, params)
    : null;
  return useApi<InventoryBalancesListResponse>(url, options);
};

export const useBulkReceiveInventory = (
  options?: SWRMutationConfiguration<
    BulkReceiveResponse,
    APIError,
    string,
    BulkReceivePayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (url: string, { arg }: { arg: BulkReceivePayload }) => {
    const { data } = await api.post(url, arg);
    return data;
  };
  return useSWRMutation<BulkReceiveResponse, APIError, string, BulkReceivePayload>(
    API_ENDPOINTS.BULK_RECEIVE,
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to receive shipment",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useCreateInventoryLocation = (
  options?: SWRMutationConfiguration<
    InventoryLocationResponse,
    APIError,
    string,
    CreateLocationPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (url: string, { arg }: { arg: CreateLocationPayload }) => {
    const { data } = await api.post(url, arg);
    return data;
  };
  return useSWRMutation<InventoryLocationResponse, APIError, string, CreateLocationPayload>(
    API_ENDPOINTS.CREATE_LOCATION,
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to create location",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useGetInventoryLocations = (
  params?: {
    kind?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.LIST_LOCATIONS, params)
    : null;
  return useApi<InventoryLocationResponse>(url, options);
};

export const useGetInventoryMovements = (
  params?: {
    page?: number;
    per_page?: number;
    outletId?: string;
    inventoryItemId?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.LIST_MOVEMENTS, params)
    : null;
  return useApi<InventoryMovementsListResponse>(url, options);
};

export const useGetInventoryPicker = (
  params?: {
    outletId?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.PICKER, params)
    : null;
  return useApi<InventoryPickerResponseItem[]>(url, options);
};

export const useRegenerateSnapshots = (
  options?: SWRMutationConfiguration<
    RegenerateSnapshotsResponse,
    APIError,
    string,
    RegenerateSnapshotsPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (url: string, { arg }: { arg: RegenerateSnapshotsPayload }) => {
    const { data } = await api.post(url, arg);
    return data;
  };
  return useSWRMutation<RegenerateSnapshotsResponse, APIError, string, RegenerateSnapshotsPayload>(
    API_ENDPOINTS.REGENERATE_SNAPSHOTS,
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to regenerate snapshots",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useGetInventorySnapshots = (
  params?: {
    date?: string;
    outletId?: string;
    page?: number;
    per_page?: number;
    search?: string;
    categoryId?: string;
    varianceOnly?: boolean;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.LIST_SNAPSHOTS, params)
    : null;
  return useApi<InventorySnapshotsListResponse>(url, options);
};

export const useGetInventorySnapshotsSummary = (
  params?: {
    date?: string;
    outletId?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.SNAPSHOTS_SUMMARY, params)
    : null;
  return useApi<InventorySnapshotsSummaryResponse>(url, options);
};

export const useGetSubstitutionLogs = (
  params?: {
    page?: number;
    per_page?: number;
    outletId?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.LIST_SUBSTITUTION_LOGS, params)
    : null;
  return useApi<SubstitutionLogsListResponse>(url, options);
};

export const useGetInventoryItemsInfinite = (
  params?: {
    search?: string;
    categoryId?: string;
    outletId?: string;
  },
  options?: SWRInfiniteConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn ? API_ENDPOINTS.INVENTORY : null;
  return useApiInfinite<InventoryListResponse>(
    url,
    params,
    undefined,
    options,
  );
};
