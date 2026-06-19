import type { SWRConfiguration } from "swr";
import type { SWRMutationConfiguration } from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useApi, useApiMutation, type APIError } from "./api-hooks";
import { API_ENDPOINTS } from "./endpoints";
import { createUrlWithParams } from "@/lib/utils";

// Types
import type {
  TipsQueryParams,
  TipsResponse,
  TipsPayoutsQueryParams,
  TipsPayoutsResponse,
  ConfirmTipsPayoutPayload,
  ConfirmTipsPayoutResponse,
  ReverseTipsPayoutPayload,
  SendTipsPayoutOtpPayload,
  SendTipsPayoutOtpResponse,
} from "@/lib/types/tips";

export const useGetTips = (
  params?: TipsQueryParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.TIPS, params)
    : null;
  return useApi<TipsResponse>(url, options);
};

export const useGetTipsPayouts = (
  params?: TipsPayoutsQueryParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.TIPS_PAYOUTS, params)
    : null;
  return useApi<TipsPayoutsResponse>(url, options);
};

export const useConfirmTipsPayout = (
  options?: SWRMutationConfiguration<
    ConfirmTipsPayoutResponse,
    APIError,
    string | null,
    ConfirmTipsPayoutPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<ConfirmTipsPayoutPayload, ConfirmTipsPayoutResponse>(
    API_ENDPOINTS.CONFIRM_TIPS_PAYOUT,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to confirm payout",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useReverseTipsPayout = (
  id: string | number | undefined,
  options?: SWRMutationConfiguration<
    ConfirmTipsPayoutResponse,
    APIError,
    string | null,
    ReverseTipsPayoutPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<ReverseTipsPayoutPayload, ConfirmTipsPayoutResponse>(
    id ? API_ENDPOINTS.REVERSE_TIPS_PAYOUT(id) : null,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to reverse payout",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useSendTipsPayoutOtp = (
  options?: SWRMutationConfiguration<
    SendTipsPayoutOtpResponse,
    APIError,
    string | null,
    SendTipsPayoutOtpPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<SendTipsPayoutOtpPayload, SendTipsPayoutOtpResponse>(
    API_ENDPOINTS.SEND_TIPS_PAYOUT_OTP,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to send OTP",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};
