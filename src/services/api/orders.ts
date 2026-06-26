import type { SWRConfiguration } from "swr";
import { useApi } from "./api-hooks";
import { createUrlWithParams } from "@/lib/utils";
import type { POSOrder } from "@/data/posData";
import { useAuth } from "@/contexts/AuthContext";

export const useGetOrders = (
  params?: {
    outletId?: string;
    search?: string;
    paymentFilter?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams("/api/orders", params)
    : null;
  return useApi<POSOrder[]>(url, options);
};
