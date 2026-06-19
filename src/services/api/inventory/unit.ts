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
import type { MeasuringUnit } from "@/lib/types/measuring-unit";
import type { MeasuringUnitListResponse } from "@/lib/types/measuring-unit-list-response";
import type { CreateMeasuringUnitPayload } from "@/lib/types/create-measuring-unit-payload";
import type { UpdateMeasuringUnitPayload } from "@/lib/types/update-measuring-unit-payload";

export const useGetUnits = (
  params?: {
    outletId?: string;
    page?: number;
    per_page?: number;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.UNITS, params)
    : null;
  return useApi<MeasuringUnitListResponse>(url, options);
};

export const useGetUnit = (
  id: number | string | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  return useApi<MeasuringUnit>(
    isLoggedIn && id ? API_ENDPOINTS.SINGLE_UNIT(id) : null,
    options,
  );
};

export const useCreateUnit = (
  options?: SWRMutationConfiguration<
    MeasuringUnit,
    APIError,
    string,
    CreateMeasuringUnitPayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (url: string, { arg }: { arg: CreateMeasuringUnitPayload }) => {
    const { data } = await api.post(url, arg);
    return data;
  };
  return useSWRMutation<MeasuringUnit, APIError, string, CreateMeasuringUnitPayload>(
    API_ENDPOINTS.UNITS,
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to create measuring unit",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useUpdateUnit = (
  options?: SWRMutationConfiguration<
    MeasuringUnit,
    APIError,
    string,
    { id: string | number; payload: UpdateMeasuringUnitPayload }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg }: { arg: { id: string | number; payload: UpdateMeasuringUnitPayload } }) => {
    const { data } = await api.patch(API_ENDPOINTS.SINGLE_UNIT(arg.id), arg.payload);
    return data;
  };
  return useSWRMutation<
    MeasuringUnit,
    APIError,
    string,
    { id: string | number; payload: UpdateMeasuringUnitPayload }
  >(
    "/api/admin/inventory/units/update",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to update measuring unit",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteUnit = (
  options?: SWRMutationConfiguration<
    { message: string },
    APIError,
    string,
    string
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  const fetcher = async (_key: string, { arg: id }: { arg: string }) => {
    const { data } = await api.delete(API_ENDPOINTS.SINGLE_UNIT(id));
    return data;
  };
  return useSWRMutation<{ message: string }, APIError, string, string>(
    "/api/admin/inventory/units/delete",
    fetcher,
    {
      onError(err) {
        toast({
          title: "Failed to delete unit",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useCreateMeasuringUnit = useCreateUnit;
export const useUpdateMeasuringUnit = useUpdateUnit;
export const useDeleteMeasuringUnit = useDeleteUnit;
export const useGetMeasuringUnits = useGetUnits;
