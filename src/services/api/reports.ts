import type { SWRConfiguration } from "swr";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "./api-hooks";
import { createUrlWithParams } from "@/lib/utils";
import { aggregateItems } from "@/components/reports/salesData";

export interface SalesByItemReportRow {
  name: string;
  category: string;
  qty: number;
  grossRevenue: number;
  discount: number;
  tax: number;
  revenue: number;
  cost: number;
  unitCost: number;
  profit: number;
  margin: number;
}

export const useGetSalesByItemReport = (
  params?: {
    outletIds?: string[];
    search?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  // Stringify array so URL params serializes properly
  const url = isLoggedIn
    ? createUrlWithParams("/api/admin/reports/sales-by-item", {
        outletIds: params?.outletIds?.join(","),
        search: params?.search,
      })
    : null;

  return useApi<SalesByItemReportRow[]>(url, {
    fetcher: async () => {
      // Simulate backend delay
      await new Promise((resolve) => setTimeout(resolve, 50));
      
      const outlets = params?.outletIds || [];
      let result = aggregateItems(outlets);

      if (params?.search) {
        const q = params.search.trim().toLowerCase();
        result = result.filter(
          (i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
        );
      }
      return result;
    },
    ...options,
  });
};
