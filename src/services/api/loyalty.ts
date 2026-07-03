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
import type { LoyaltySettingsResponse, Tier, OutletOverride } from "@/lib/types/loyalty-settings-response";
export interface LoyaltyOverviewResponse {
  totalMembers: number;
  pointsIssued: number;
  pointsRedeemed: number;
}

export interface LoyaltyTierBreakdownRecord {
  tier: string;
  members: number;
  percentage: number;
}

export interface LoyaltyTierBreakdownResponse {
  data: LoyaltyTierBreakdownRecord[];
}

export interface UpdateLoyaltyRewardPayload {
  name?: string;
  pointsCost?: number;
  discountType?: "percentage" | "fixed" | "free_item";
  discountValue?: number;
  freeItemId?: string;
  freeItemQuantity?: number;
  isActive?: boolean;
  outletIds?: string[];
}

export interface UpdateLoyaltySettingsPayload {
  programEnabled?: boolean;
  baseEarnRate?: number;
  tierThresholds?: Tier;
  tierMultipliers?: Tier;
  outletOverrides?: OutletOverride[];
  crossOutletRedemption?: boolean;
  autoPromptCashiers?: boolean;
  allowPosRegistration?: boolean;
  showPointsOnReceipt?: boolean;
  enablePointsExpiry?: boolean;
  pointsExpiryDays?: number;
}

export interface UpdateMemberPointsPayload {
  pointsChange: number;
  reason?: string;
}

export interface UpdateMemberPointsResponse {
  message: string;
  points: number;
}

export interface UpdateProgramEnabledPayload {
  enabled: boolean;
}

export interface UpdateProgramEnabledResponse {
  enabled: boolean;
}

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
