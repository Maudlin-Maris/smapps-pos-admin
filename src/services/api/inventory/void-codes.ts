import type { SWRConfiguration } from "swr";
import type { SWRMutationConfiguration } from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useApi, useApiMutation, type APIError } from "../api-hooks";
import { API_ENDPOINTS } from "../endpoints";
import { createUrlWithParams } from "@/lib/utils";
import { api } from "../base";

import type {
  VoidCodesResponse,
  UpdateVoidCodePayload,
  UpdateVoidCodeResponse,
  DeleteVoidCodeOverrideResponse,
  VoidCodeType,
} from "@/lib/types/void-codes";

export const useGetVoidCodes = (
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.VOID_CODES, {})
    : null;
  return useApi<VoidCodesResponse>(url, options);
};

export const useUpdateVoidCode = (
  options?: SWRMutationConfiguration<
    UpdateVoidCodeResponse,
    APIError,
    string | null,
    UpdateVoidCodePayload
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();
  return useApiMutation<UpdateVoidCodePayload, UpdateVoidCodeResponse>(
    API_ENDPOINTS.VOID_CODES,
    "PUT",
    undefined,
    {
      onError(err) {
        toast({
          title: "Failed to update void code",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};

export const useDeleteVoidCodeOverride = (
  options?: SWRMutationConfiguration<
    DeleteVoidCodeOverrideResponse,
    APIError,
    string | null,
    { outletId: string | number; type: VoidCodeType }
  > & { throwOnError?: boolean },
) => {
  const { toast } = useToast();

  const customRequestFunction = async (
    _key: string | null | undefined,
    { arg }: { arg: { outletId: string | number; type: VoidCodeType } }
  ) => {
    const { data } = await api.request({
      url: API_ENDPOINTS.VOID_CODES_OUTLET(arg.outletId, arg.type),
      method: "DELETE",
    });
    return data;
  };

  return useApiMutation<{ outletId: string | number; type: VoidCodeType }, DeleteVoidCodeOverrideResponse>(
    "/api/admin/void-codes/delete-override",
    "DELETE",
    customRequestFunction,
    {
      onError(err) {
        toast({
          title: "Failed to reset code override",
          description: err.response?.data?.message ?? "Please try again later",
          variant: "destructive",
        });
      },
      ...options,
    },
  );
};
