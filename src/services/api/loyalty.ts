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
import type { LoyaltyRewardRecord } from "@/lib/types/loyalty-reward-record";
import type { LoyaltyRewardsResponse } from "@/lib/types/loyalty-rewards-response";
import type { LoyaltyActivityResponse } from "@/lib/types/loyalty-activity-response";
import type { LoyaltyOutletPerformanceResponse } from "@/lib/types/loyalty-outlet-performance-response";
import type { LoyaltyOverviewResponse } from "@/lib/types/loyalty-overview-response";
import type { LoyaltySettingsResponse } from "@/lib/types/loyalty-settings-response";
import type { LoyaltyTierBreakdownResponse } from "@/lib/types/loyalty-outlet-performance-response"; // Wait, let's keep tier breakdown response inline if needed, or define it here
import type { UpdateLoyaltyRewardPayload } from "@/lib/types/update-loyalty-reward-payload";
import type { UpdateLoyaltySettingsPayload } from "@/lib/types/update-loyalty-settings-payload";
import type { UpdateMemberPointsPayload } from "@/lib/types/update-member-points-payload";
import type { UpdateMemberPointsResponse } from "@/lib/types/update-member-points-response";
import type { UpdateProgramEnabledPayload } from "@/lib/types/update-program-enabled-payload";
import type { UpdateProgramEnabledResponse } from "@/lib/types/update-program-enabled-response";

export const useGetLoyaltyOverview = (
  params?: {
    outletId?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.GET_LOYALTY_OVERVIEW, params)
    : null;
  return useApi<LoyaltyOverviewResponse>(url, options);
};

export const useGetLoyaltyRewards = (
  params?: {
    page?: number;
    per_page?: number;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.LOYALTY_REWARDS, params)
    : null;
  return useApi<LoyaltyRewardsResponse>(url, options);
};

export const useGetLoyaltyActivity = (
  params?: {
    page?: number;
    per_page?: number;
    type?: string;
    search?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.LIST_LOYALTY_ACTIVITY, params)
    : null;
  return useApi<LoyaltyActivityResponse>(url, options);
};

export const useGetLoyaltyOutletPerformance = (
  params?: {
    from?: string;
    to?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.GET_LOYALTY_OUTLET_PERFORMANCE, params)
    : null;
  return useApi<LoyaltyOutletPerformanceResponse>(url, options);
};

export const useGetLoyaltySettings = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  return useApi<LoyaltySettingsResponse>(
    isLoggedIn ? API_ENDPOINTS.GET_LOYALTY_SETTINGS : null,
    options,
  );
};

export const useGetLoyaltyTierBreakdown = (
  params?: {
    outletId?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.GET_LOYALTY_TIER_BREAKDOWN, params)
    : null;
  // Fallback structure in case tier breakdown doesn't return data, or has standard structure
  return useApi<any>(url, options);
};

export const useCreateLoyaltyReward = (
  options?: SWRMutationConfiguration<
    LoyaltyRewardRecord,
    APIError,
    string | null,
    Omit<LoyaltyRewardRecord, "id">
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<Omit<LoyaltyRewardRecord, "id">, LoyaltyRewardRecord>(
    API_ENDPOINTS.LOYALTY_REWARDS,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create reward",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateLoyaltyReward = (
  id: string | number | undefined,
  options?: SWRMutationConfiguration<
    LoyaltyRewardRecord,
    APIError,
    string | null,
    UpdateLoyaltyRewardPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateLoyaltyRewardPayload, LoyaltyRewardRecord>(
    id ? API_ENDPOINTS.SINGLE_LOYALTY_REWARD(id) : null,
    "PATCH",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to update reward",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteLoyaltyReward = (
  options?: SWRMutationConfiguration<
    { message: string },
    APIError,
    string,
    string
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg: id }: { arg: string }) => {
    const { data } = await api.delete(API_ENDPOINTS.SINGLE_LOYALTY_REWARD(id));
    return data;
  };
  return useSWRMutation<{ message: string }, APIError, string, string>(
    "/api/admin/loyalty/rewards/delete",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to delete reward",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateLoyaltySettings = (
  options?: SWRMutationConfiguration<
    LoyaltySettingsResponse,
    APIError,
    string | null,
    UpdateLoyaltySettingsPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateLoyaltySettingsPayload, LoyaltySettingsResponse>(
    API_ENDPOINTS.UPDATE_LOYALTY_SETTINGS,
    "PATCH",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to save settings",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateMemberPoints = (
  id: string | number | undefined,
  options?: SWRMutationConfiguration<
    UpdateMemberPointsResponse,
    APIError,
    string | null,
    UpdateMemberPointsPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateMemberPointsPayload, UpdateMemberPointsResponse>(
    id ? API_ENDPOINTS.UPDATE_LOYALTY_MEMBER_POINTS(id) : null,
    "PATCH",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to adjust points",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateLoyaltyProgramEnabled = (
  options?: SWRMutationConfiguration<
    UpdateProgramEnabledResponse,
    APIError,
    string | null,
    UpdateProgramEnabledPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateProgramEnabledPayload, UpdateProgramEnabledResponse>(
    API_ENDPOINTS.UPDATE_LOYALTY_PROGRAM_ENABLED,
    "PATCH",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to update loyalty program state",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};
