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
import type { CancelSubscriptionPayload, CancelSubscriptionResponse } from "@/lib/types/subscription-cancel";
import type { ConfirmPlanChangePayload, ConfirmPlanChangeResponse } from "@/lib/types/subscription-plan-change-confirm";
import type { ActivateAddonResponse } from "@/lib/types/subscription-addon-activate";
import type { BillingPaymentMethodPayload, BillingPaymentMethodsResponse } from "@/lib/types/subscription-billing-payment-method";
import type { SubscriptionResourceResponse } from "@/lib/types/subscription-resource-response";
import type { PlanPreviewPayload, PlanPreviewResponse } from "@/lib/types/subscription-plan-preview";
import type { SubscriptionPaymentMethodResponse } from "@/lib/types/subscription-payment-method-response";
import type { ReactivateSubscriptionResponse } from "@/lib/types/subscription-reactivate";
import type { SubscriptionDetailResponse } from "@/lib/types/subscription-detail-response";
import type { SubscriptionAuditLogResponse } from "@/lib/types/subscription-audit-log-response";
import type { BillingInvoicesResponse } from "@/lib/types/subscription-billing-invoice";
import type { UpcomingInvoiceResponse } from "@/lib/types/subscription-upcoming-invoice-response";
import type { SubscriptionQrMenuResponse } from "@/lib/types/subscription-qr-menu-response";
import type { SubscriptionAddonsResponse } from "@/lib/types/subscription-addon-response";
import type { SubscriptionFeaturesResponse } from "@/lib/types/subscription-features-response";
import type { SubscriptionPlansResponse } from "@/lib/types/subscription-plans-response";
import type { SubscriptionUsageResponse } from "@/lib/types/subscription-usage-response";

// ==========================================
//               GET Queries
// ==========================================

export const useGetSubscription = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn ? API_ENDPOINTS.SUBSCRIPTION : null;
  return useApi<SubscriptionDetailResponse>(url, options);
};

export const useGetPlans = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn ? API_ENDPOINTS.SUBSCRIPTION_PLANS : null;
  return useApi<SubscriptionPlansResponse>(url, options);
};

export const useGetUsage = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn ? API_ENDPOINTS.SUBSCRIPTION_USAGE : null;
  return useApi<SubscriptionUsageResponse>(url, options);
};

export const useGetFeatures = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn ? API_ENDPOINTS.SUBSCRIPTION_FEATURES : null;
  return useApi<SubscriptionFeaturesResponse>(url, options);
};

export const useGetAddons = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn ? API_ENDPOINTS.SUBSCRIPTION_ADDONS : null;
  return useApi<SubscriptionAddonsResponse>(url, options);
};

export const useGetQrMenu = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn ? API_ENDPOINTS.SUBSCRIPTION_ADDON_QR_MENU : null;
  return useApi<SubscriptionQrMenuResponse>(url, options);
};

export const useGetBillingPaymentMethods = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn ? API_ENDPOINTS.SUBSCRIPTION_BILLING_PAYMENT_METHODS : null;
  return useApi<BillingPaymentMethodsResponse>(url, options);
};

export const useGetPaymentMethods = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn ? API_ENDPOINTS.SUBSCRIPTION_PAYMENT_METHODS : null;
  return useApi<SubscriptionPlansResponse>(url, options); // reusing plans response shape or generic array
};

export const useGetBillingInvoices = (
  params?: { page?: number; per_page?: number },
  options?: SWRConfiguration
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.SUBSCRIPTION_BILLING_INVOICES, params)
    : null;
  return useApi<BillingInvoicesResponse>(url, options);
};

export const useGetInvoices = (
  params?: { page?: number; per_page?: number },
  options?: SWRConfiguration
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.SUBSCRIPTION_INVOICES, params)
    : null;
  return useApi<SubscriptionResourceResponse[]>(url, options);
};

export const useGetBillingUpcomingInvoice = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn ? API_ENDPOINTS.SUBSCRIPTION_BILLING_UPCOMING_INVOICE : null;
  return useApi<UpcomingInvoiceResponse>(url, options);
};

export const useGetUpcomingInvoices = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn ? API_ENDPOINTS.SUBSCRIPTION_INVOICES_UPCOMING : null;
  return useApi<SubscriptionResourceResponse[]>(url, options);
};

export const useGetAuditLogs = (
  params?: { page?: number; per_page?: number },
  options?: SWRConfiguration
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.SUBSCRIPTION_AUDIT_LOG, params)
    : null;
  return useApi<SubscriptionAuditLogResponse>(url, options);
};

// ==========================================
//              MUTATIONS
// ==========================================

export const useCancelSubscription = (
  options?: SWRMutationConfiguration<CancelSubscriptionResponse, APIError, string, CancelSubscriptionPayload>
) => {
  const { toast } = useToast();
  return useApiMutation<CancelSubscriptionPayload, CancelSubscriptionResponse>(
    API_ENDPOINTS.SUBSCRIPTION_CANCEL,
    "POST",
    undefined,
    {
      onError: (err) => {
        toast({
          title: "Cancel Subscription Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const useConfirmPlanChange = (
  options?: SWRMutationConfiguration<ConfirmPlanChangeResponse, APIError, string, ConfirmPlanChangePayload>
) => {
  const { toast } = useToast();
  return useApiMutation<ConfirmPlanChangePayload, ConfirmPlanChangeResponse>(
    API_ENDPOINTS.SUBSCRIPTION_PLAN_CHANGE_CONFIRM,
    "POST",
    undefined,
    {
      onError: (err) => {
        toast({
          title: "Plan Change Confirmation Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const useActivateAddon = (
  options?: SWRMutationConfiguration<ActivateAddonResponse, APIError, string, string>
) => {
  const { toast } = useToast();
  const fetcher = async (_url: string, { arg: key }: { arg: string }) => {
    const { data } = await api.post(API_ENDPOINTS.SUBSCRIPTION_ADDON_ACTIVATE(key));
    return data;
  };
  return useSWRMutation<ActivateAddonResponse, APIError, string, string>(
    "/api/admin/subscription/addons/activate",
    fetcher,
    {
      onError: (err) => {
        toast({
          title: "Add-on Activation Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const useDeactivateAddon = (
  options?: SWRMutationConfiguration<SubscriptionResourceResponse, APIError, string, string>
) => {
  const { toast } = useToast();
  const fetcher = async (_url: string, { arg: key }: { arg: string }) => {
    const { data } = await api.post(API_ENDPOINTS.SUBSCRIPTION_ADDON_DEACTIVATE(key));
    return data;
  };
  return useSWRMutation<SubscriptionResourceResponse, APIError, string, string>(
    "/api/admin/subscription/addons/deactivate",
    fetcher,
    {
      onError: (err) => {
        toast({
          title: "Add-on Deactivation Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const useDeleteAddon = (
  options?: SWRMutationConfiguration<{ message: string }, APIError, string, string>
) => {
  const { toast } = useToast();
  const fetcher = async (_url: string, { arg: key }: { arg: string }) => {
    const { data } = await api.delete(API_ENDPOINTS.SUBSCRIPTION_SINGLE_ADDON(key));
    return data;
  };
  return useSWRMutation<{ message: string }, APIError, string, string>(
    "/api/admin/subscription/addons/delete",
    fetcher,
    {
      onError: (err) => {
        toast({
          title: "Add-on Deletion Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const useCreateBillingPaymentMethod = (
  options?: SWRMutationConfiguration<BillingPaymentMethodsResponse, APIError, string, BillingPaymentMethodPayload>
) => {
  const { toast } = useToast();
  return useApiMutation<BillingPaymentMethodPayload, BillingPaymentMethodsResponse>(
    API_ENDPOINTS.SUBSCRIPTION_BILLING_PAYMENT_METHODS,
    "POST",
    undefined,
    {
      onError: (err) => {
        toast({
          title: "Add Payment Method Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const useCreateBillingPortal = (
  options?: SWRMutationConfiguration<SubscriptionResourceResponse, APIError, string, undefined>
) => {
  const { toast } = useToast();
  return useApiMutation<undefined, SubscriptionResourceResponse>(
    API_ENDPOINTS.SUBSCRIPTION_BILLING_PORTAL,
    "POST",
    undefined,
    {
      onError: (err) => {
        toast({
          title: "Billing Portal Request Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const usePreviewPlanChange = (
  options?: SWRMutationConfiguration<PlanPreviewResponse, APIError, string, PlanPreviewPayload>
) => {
  const { toast } = useToast();
  return useApiMutation<PlanPreviewPayload, PlanPreviewResponse>(
    API_ENDPOINTS.SUBSCRIPTION_PLAN_CHANGE_PREVIEW,
    "POST",
    undefined,
    {
      onError: (err) => {
        toast({
          title: "Preview Plan Change Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const useChangePlan = (
  options?: SWRMutationConfiguration<SubscriptionResourceResponse, APIError, string, { target_plan: string }>
) => {
  const { toast } = useToast();
  return useApiMutation<{ target_plan: string }, SubscriptionResourceResponse>(
    API_ENDPOINTS.SUBSCRIPTION_CHANGE_PLAN,
    "POST",
    undefined,
    {
      onError: (err) => {
        toast({
          title: "Change Plan Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const useCreatePaymentMethod = (
  options?: SWRMutationConfiguration<SubscriptionPaymentMethodResponse, APIError, string, BillingPaymentMethodPayload>
) => {
  const { toast } = useToast();
  return useApiMutation<BillingPaymentMethodPayload, SubscriptionPaymentMethodResponse>(
    API_ENDPOINTS.SUBSCRIPTION_PAYMENT_METHODS,
    "POST",
    undefined,
    {
      onError: (err) => {
        toast({
          title: "Add Payment Method Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const useReactivateSubscription = (
  options?: SWRMutationConfiguration<ReactivateSubscriptionResponse, APIError, string, undefined>
) => {
  const { toast } = useToast();
  return useApiMutation<undefined, ReactivateSubscriptionResponse>(
    API_ENDPOINTS.SUBSCRIPTION_REACTIVATE,
    "POST",
    undefined,
    {
      onError: (err) => {
        toast({
          title: "Reactivate Subscription Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const useDeleteBillingPaymentMethod = (
  options?: SWRMutationConfiguration<{ message: string }, APIError, string, string | number>
) => {
  const { toast } = useToast();
  const fetcher = async (_url: string, { arg: id }: { arg: string | number }) => {
    const { data } = await api.delete(API_ENDPOINTS.SUBSCRIPTION_BILLING_SINGLE_PAYMENT_METHOD(id));
    return data;
  };
  return useSWRMutation<{ message: string }, APIError, string, string | number>(
    "/api/admin/subscription/billing/payment-methods/delete",
    fetcher,
    {
      onError: (err) => {
        toast({
          title: "Delete Payment Method Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const useDeletePaymentMethod = (
  options?: SWRMutationConfiguration<{ message: string }, APIError, string, string | number>
) => {
  const { toast } = useToast();
  const fetcher = async (_url: string, { arg: id }: { arg: string | number }) => {
    const { data } = await api.delete(API_ENDPOINTS.SUBSCRIPTION_SINGLE_PAYMENT_METHOD(id));
    return data;
  };
  return useSWRMutation<{ message: string }, APIError, string, string | number>(
    "/api/admin/subscription/payment-methods/delete",
    fetcher,
    {
      onError: (err) => {
        toast({
          title: "Delete Payment Method Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const useUpdateSubscription = (
  options?: SWRMutationConfiguration<SubscriptionDetailResponse, APIError, string, { auto_renew?: boolean }>
) => {
  const { toast } = useToast();
  return useApiMutation<{ auto_renew?: boolean }, SubscriptionDetailResponse>(
    API_ENDPOINTS.SUBSCRIPTION,
    "PATCH",
    undefined,
    {
      onError: (err) => {
        toast({
          title: "Update Subscription Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const useSetDefaultBillingPaymentMethod = (
  options?: SWRMutationConfiguration<SubscriptionResourceResponse, APIError, string, string | number>
) => {
  const { toast } = useToast();
  const fetcher = async (_url: string, { arg: id }: { arg: string | number }) => {
    const { data } = await api.patch(API_ENDPOINTS.SUBSCRIPTION_BILLING_PAYMENT_METHOD_DEFAULT(id));
    return data;
  };
  return useSWRMutation<SubscriptionResourceResponse, APIError, string, string | number>(
    "/api/admin/subscription/billing/payment-methods/default",
    fetcher,
    {
      onError: (err) => {
        toast({
          title: "Set Default Payment Method Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const useSetDefaultPaymentMethod = (
  options?: SWRMutationConfiguration<SubscriptionResourceResponse, APIError, string, string | number>
) => {
  const { toast } = useToast();
  const fetcher = async (_url: string, { arg: id }: { arg: string | number }) => {
    const { data } = await api.patch(API_ENDPOINTS.SUBSCRIPTION_PAYMENT_METHOD_DEFAULT(id));
    return data;
  };
  return useSWRMutation<SubscriptionResourceResponse, APIError, string, string | number>(
    "/api/admin/subscription/payment-methods/default",
    fetcher,
    {
      onError: (err) => {
        toast({
          title: "Set Default Payment Method Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};

export const useUpdateAutoRenew = (
  options?: SWRMutationConfiguration<SubscriptionResourceResponse, APIError, string, { autoRenew: boolean }>
) => {
  const { toast } = useToast();
  return useApiMutation<{ autoRenew: boolean }, SubscriptionResourceResponse>(
    API_ENDPOINTS.SUBSCRIPTION_AUTO_RENEW,
    "PATCH",
    undefined,
    {
      onError: (err) => {
        toast({
          title: "Update Auto Renew Failed",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    }
  );
};
