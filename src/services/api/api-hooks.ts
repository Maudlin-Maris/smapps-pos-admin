import type { AxiosError } from "axios";
import type { SWRConfiguration } from "swr";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { Pagination } from "@/lib/types/paginated-response";
import { createUrlWithParams } from "@/lib/utils";
import type { FetcherResponse } from "swr/_internal";
import type { SWRInfiniteConfiguration } from "swr/infinite";
import useSWRInfinite from "swr/infinite";
import type { SWRMutationConfiguration } from "swr/mutation";
import { api } from "./base";

export type APIError = AxiosError<{
  message?: string;
  errors?: Record<string, Array<string>>;
}>;

export type MutationKey = string | null | undefined;

const fetcher = async (url: string) => {
  const { data } = await api.get(url);
  return data;
};

export const useApi = <T>(
  url: MutationKey,
  options?: SWRConfiguration,
  logoutOn401 = true,
  showToastOnError = true,
) => {
  const { logout } = useAuth();
  const { toast } = useToast();

  const swrResponse = useSWR<T, APIError>(url ?? null, fetcher, {
    onError: (error) => {
      const errMessage = error?.response?.data?.message ?? error?.message;
      if (showToastOnError) {
        toast({
          title: "Request Failed",
          description: errMessage?.length < 40 ? errMessage : "Request Failed",
          variant: "destructive",
        });
      }
      if (error?.response?.status === 401 && logoutOn401) {
        logout();
      }
    },
    errorRetryCount: 1,
    ...options,
  });
  return {
    ...swrResponse,
    key: url,
  };
};

export const useApiMutation = <TPayload = unknown, TResponse = unknown>(
  url: MutationKey,
  method: "POST" | "PUT" | "DELETE" | "PATCH",
  customRequestFunction?: (
    url: MutationKey,
    {
      arg,
    }: {
      arg: TPayload;
    },
  ) => FetcherResponse<TResponse>,
  options?: SWRMutationConfiguration<
    TResponse,
    APIError,
    MutationKey,
    TPayload
  > & { throwOnError?: boolean },
) => {
  const request = async (path: MutationKey, { arg }: { arg: TPayload }) => {
    if (!path) {
      return undefined;
    }
    const { data } = await api.request({
      url: path,
      method,
      data: arg,
    });
    return data;
  };

  return useSWRMutation<TResponse, APIError, MutationKey, TPayload, unknown>(
    url,
    customRequestFunction || request,
    {
      throwOnError: true,
      ...options,
    },
  );
};

export const useApiInfinite = <TData extends { pagination: Pagination }>(
  url: string | null,
  params?: Record<string, string | number | boolean | undefined>,
  pageLimit = DEFAULT_PAGE_SIZE,
  options?: SWRInfiniteConfiguration,
  dataFetcher?: (key: string) => Promise<TData>,
) => {
  const resolvedFetcher =
    dataFetcher ?? (fetcher as (key: string) => Promise<TData>);
  const { data, mutate, error, size, setSize, isLoading, isValidating } =
    useSWRInfinite<TData, APIError>(
      (pageIndex, previousPageData: TData | undefined) => {
        if (
          (previousPageData &&
            previousPageData?.pagination?.current_page ===
              previousPageData?.pagination?.last_page) ||
          !url
        )
          return null;
        const apiUrl = createUrlWithParams(url, {
          ...params,
          page: pageIndex + 1,
          per_page: pageLimit,
        });
        return apiUrl;
      },
      resolvedFetcher,
      options,
    );

  const firstPage = data?.[0];
  const lastPage = data?.[data.length - 1];

  const isDataFound = Boolean(firstPage && firstPage?.pagination?.total !== 0);

  const reachedLastPage = Boolean(
    lastPage &&
    lastPage?.pagination?.current_page === lastPage?.pagination?.last_page,
  );

  const showFetchingSpinner =
    (isLoading || isValidating || !data || data?.length === 0) &&
    size !== data?.length &&
    !error;

  return {
    data,
    error,
    mutate,
    size,
    setSize,
    isValidating,
    isLoading,
    isDataFound,
    showFetchingSpinner,
    reachedLastPage,
  };
};
