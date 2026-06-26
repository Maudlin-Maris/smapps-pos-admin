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
import { api } from "./base";
import { createUrlWithParams } from "@/lib/utils";

// Outlet sub-resources types
import type { CatalogCategory } from "@/lib/types/catalog-category";
import type {
  DepartmentRecord,
  CreateDepartmentPayload,
  UpdateDepartmentPayload,
  UpdateDepartmentCategoriesPayload,
  DiscountRecord,
  CreateDiscountPayload,
  FeeRecord,
  CreateFeePayload,
  UpdateFeePayload,
  LocationRecord,
  CreateLocationPayload,
  UpdateLocationPayload,
  PaymentMethodRecord,
  CreatePaymentMethodPayload,
  UpdatePaymentMethodPayload,
  TipsPresetRecord,
  CreateTipsPresetPayload,
} from "@/lib/types/outlet-subresources";

export const useGetOutlets = (options?: SWRConfiguration) => {
  const { isLoggedIn } = useAuth();
  return useApi<ListOutletsResponse>(
    isLoggedIn ? API_ENDPOINTS.OUTLETS : null,
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
    API_ENDPOINTS.OUTLETS,
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
    id ? API_ENDPOINTS.SINGLE_OUTLET(id) : null,
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
    id ? API_ENDPOINTS.OUTLET_STATUS(id) : null,
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

// --- Catalog Categories ---
export const useGetOutletCatalogCategories = (
  outletId: number | string | undefined,
  params?: { search?: string },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn && outletId
    ? createUrlWithParams(API_ENDPOINTS.OUTLET_CATALOG_CATEGORIES(outletId), params)
    : null;
  return useApi<CatalogCategory[]>(url, options);
};

// --- Departments ---
export const useGetOutletDepartments = (
  outletId: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<DepartmentRecord[]>(
    isLoggedIn && outletId ? API_ENDPOINTS.OUTLET_DEPARTMENTS(outletId) : null,
    options,
  );
};

export const useGetOutletDepartment = (
  outletId: number | string | undefined,
  deptId: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<DepartmentRecord>(
    isLoggedIn && outletId && deptId
      ? API_ENDPOINTS.OUTLET_SINGLE_DEPARTMENT(outletId, deptId)
      : null,
    options,
  );
};

export const useCreateOutletDepartment = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    DepartmentRecord,
    APIError,
    string | null,
    CreateDepartmentPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreateDepartmentPayload, DepartmentRecord>(
    outletId ? API_ENDPOINTS.OUTLET_DEPARTMENTS(outletId) : null,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create department",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateOutletDepartment = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    DepartmentRecord,
    APIError,
    string | null,
    { deptId: number | string; payload: UpdateDepartmentPayload }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<
    { deptId: number | string; payload: UpdateDepartmentPayload },
    DepartmentRecord
  >(
    outletId ? `/api/admin/outlets/${outletId}/departments/update` : null,
    "PATCH",
    async (_, { arg }) => {
      const { data } = await api.patch(
        API_ENDPOINTS.OUTLET_SINGLE_DEPARTMENT(outletId!, arg.deptId),
        arg.payload,
      );
      return data;
    },
    {
      onError(err) {
        toast({
          title: "Failed to update department",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateOutletDepartmentCategories = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    DepartmentRecord,
    APIError,
    string | null,
    { deptId: number | string; payload: UpdateDepartmentCategoriesPayload }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<
    { deptId: number | string; payload: UpdateDepartmentCategoriesPayload },
    DepartmentRecord
  >(
    outletId ? `/api/admin/outlets/${outletId}/departments/categories/update` : null,
    "PUT",
    async (_, { arg }) => {
      const { data } = await api.put(
        API_ENDPOINTS.OUTLET_DEPARTMENT_CATEGORIES(outletId!, arg.deptId),
        arg.payload,
      );
      return data;
    },
    {
      onError(err) {
        toast({
          title: "Failed to assign categories",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteOutletDepartment = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    void,
    APIError,
    string | null,
    number | string
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<number | string, void>(
    outletId ? `/api/admin/outlets/${outletId}/departments/delete` : null,
    "DELETE",
    async (_, { arg: deptId }) => {
      const { data } = await api.delete(
        API_ENDPOINTS.OUTLET_SINGLE_DEPARTMENT(outletId!, deptId),
      );
      return data;
    },
    {
      onError(err) {
        toast({
          title: "Failed to delete department",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

// --- Discounts ---
export const useGetOutletDiscounts = (
  outletId: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<DiscountRecord[]>(
    isLoggedIn && outletId ? API_ENDPOINTS.OUTLET_DISCOUNTS(outletId) : null,
    options,
  );
};

export const useCreateOutletDiscount = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    DiscountRecord,
    APIError,
    string | null,
    CreateDiscountPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreateDiscountPayload, DiscountRecord>(
    outletId ? API_ENDPOINTS.OUTLET_DISCOUNTS(outletId) : null,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create discount",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteOutletDiscount = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    void,
    APIError,
    string | null,
    string | number
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<string | number, void>(
    outletId ? `/api/admin/outlets/${outletId}/discounts/delete` : null,
    "DELETE",
    async (_, { arg: id }) => {
      const { data } = await api.delete(
        API_ENDPOINTS.OUTLET_SINGLE_DISCOUNT(outletId!, id),
      );
      return data;
    },
    {
      onError(err) {
        toast({
          title: "Failed to delete discount",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

// --- Fees ---
export const useGetOutletFees = (
  outletId: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<FeeRecord[]>(
    isLoggedIn && outletId ? API_ENDPOINTS.OUTLET_FEES(outletId) : null,
    options,
  );
};

export const useGetOutletFee = (
  outletId: number | string | undefined,
  feeId: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<FeeRecord>(
    isLoggedIn && outletId && feeId ? API_ENDPOINTS.OUTLET_SINGLE_FEE(outletId, feeId) : null,
    options,
  );
};

export const useCreateOutletFee = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    FeeRecord,
    APIError,
    string | null,
    CreateFeePayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreateFeePayload, FeeRecord>(
    outletId ? API_ENDPOINTS.OUTLET_FEES(outletId) : null,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create fee",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateOutletFee = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    FeeRecord,
    APIError,
    string | null,
    { feeId: number | string; payload: UpdateFeePayload }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<
    { feeId: number | string; payload: UpdateFeePayload },
    FeeRecord
  >(
    outletId ? `/api/admin/outlets/${outletId}/fees/update` : null,
    "PATCH",
    async (_, { arg }) => {
      const { data } = await api.patch(
        API_ENDPOINTS.OUTLET_SINGLE_FEE(outletId!, arg.feeId),
        arg.payload,
      );
      return data;
    },
    {
      onError(err) {
        toast({
          title: "Failed to update fee",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteOutletFee = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    void,
    APIError,
    string | null,
    number | string
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<number | string, void>(
    outletId ? `/api/admin/outlets/${outletId}/fees/delete` : null,
    "DELETE",
    async (_, { arg: feeId }) => {
      const { data } = await api.delete(
        API_ENDPOINTS.OUTLET_SINGLE_FEE(outletId!, feeId),
      );
      return data;
    },
    {
      onError(err) {
        toast({
          title: "Failed to delete fee",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

// --- Locations ---
export const useGetOutletLocations = (
  outletId: number | string | undefined,
  params?: { search?: string },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn && outletId
    ? createUrlWithParams(API_ENDPOINTS.OUTLET_LOCATIONS(outletId), params)
    : null;
  return useApi<LocationRecord[]>(url, options);
};

export const useCreateOutletLocation = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    LocationRecord,
    APIError,
    string | null,
    CreateLocationPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreateLocationPayload, LocationRecord>(
    outletId ? API_ENDPOINTS.OUTLET_LOCATIONS(outletId) : null,
    "POST",
    undefined,
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

export const useUpdateOutletLocation = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    LocationRecord,
    APIError,
    string | null,
    { locationId: number | string; payload: UpdateLocationPayload }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<
    { locationId: number | string; payload: UpdateLocationPayload },
    LocationRecord
  >(
    outletId ? `/api/admin/outlets/${outletId}/locations/update` : null,
    "PATCH",
    async (_, { arg }) => {
      const { data } = await api.patch(
        API_ENDPOINTS.OUTLET_SINGLE_LOCATION(outletId!, arg.locationId),
        arg.payload,
      );
      return data;
    },
    {
      onError(err) {
        toast({
          title: "Failed to update location",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteOutletLocation = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    void,
    APIError,
    string | null,
    number | string
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<number | string, void>(
    outletId ? `/api/admin/outlets/${outletId}/locations/delete` : null,
    "DELETE",
    async (_, { arg: locationId }) => {
      const { data } = await api.delete(
        API_ENDPOINTS.OUTLET_SINGLE_LOCATION(outletId!, locationId),
      );
      return data;
    },
    {
      onError(err) {
        toast({
          title: "Failed to delete location",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

// --- Payment Methods ---
export const useGetOutletPaymentMethods = (
  outletId: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<PaymentMethodRecord[]>(
    isLoggedIn && outletId ? API_ENDPOINTS.OUTLET_PAYMENT_METHODS(outletId) : null,
    options,
  );
};

export const useCreateOutletPaymentMethod = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    PaymentMethodRecord,
    APIError,
    string | null,
    CreatePaymentMethodPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreatePaymentMethodPayload, PaymentMethodRecord>(
    outletId ? API_ENDPOINTS.OUTLET_PAYMENT_METHODS(outletId) : null,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create payment method",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateOutletPaymentMethod = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    PaymentMethodRecord,
    APIError,
    string | null,
    { pmId: number | string; payload: UpdatePaymentMethodPayload }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<
    { pmId: number | string; payload: UpdatePaymentMethodPayload },
    PaymentMethodRecord
  >(
    outletId ? `/api/admin/outlets/${outletId}/payment-methods/update` : null,
    "PATCH",
    async (_, { arg }) => {
      const { data } = await api.patch(
        API_ENDPOINTS.OUTLET_SINGLE_PAYMENT_METHOD(outletId!, arg.pmId),
        arg.payload,
      );
      return data;
    },
    {
      onError(err) {
        toast({
          title: "Failed to update payment method",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteOutletPaymentMethod = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    void,
    APIError,
    string | null,
    number | string
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<number | string, void>(
    outletId ? `/api/admin/outlets/${outletId}/payment-methods/delete` : null,
    "DELETE",
    async (_, { arg: pmId }) => {
      const { data } = await api.delete(
        API_ENDPOINTS.OUTLET_SINGLE_PAYMENT_METHOD(outletId!, pmId),
      );
      return data;
    },
    {
      onError(err) {
        toast({
          title: "Failed to delete payment method",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

// --- Tips Presets ---
export const useGetOutletTips = (
  outletId: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<TipsPresetRecord[]>(
    isLoggedIn && outletId ? API_ENDPOINTS.OUTLET_TIPS_PRESETS(outletId) : null,
    options,
  );
};

export const useCreateOutletTip = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    TipsPresetRecord,
    APIError,
    string | null,
    CreateTipsPresetPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<CreateTipsPresetPayload, TipsPresetRecord>(
    outletId ? API_ENDPOINTS.OUTLET_TIPS_PRESETS(outletId) : null,
    "POST",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to create tip preset",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteOutletTip = (
  outletId: number | string | undefined,
  options?: SWRMutationConfiguration<
    void,
    APIError,
    string | null,
    string | number
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<string | number, void>(
    outletId ? `/api/admin/outlets/${outletId}/tips/delete` : null,
    "DELETE",
    async (_, { arg: id }) => {
      const { data } = await api.delete(
        API_ENDPOINTS.OUTLET_SINGLE_TIPS_PRESET(outletId!, id),
      );
      return data;
    },
    {
      onError(err) {
        toast({
          title: "Failed to delete tip preset",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

// Obsolete fallback code referencing deleted mock types has been removed.
