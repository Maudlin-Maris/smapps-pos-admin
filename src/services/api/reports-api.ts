import type { SWRConfiguration } from "swr";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "./api-hooks";
import { API_ENDPOINTS } from "./endpoints";
import { createUrlWithParams } from "@/lib/utils";
import type {
  TransactionDetailResponse,
  PaymentMethodsParams,
  PaymentMethodsResponse,
  TransactionsReportParams,
  TransactionsReportResponse,
  CashiersReportResponse,
  ProfitLossReportResponse,
  SalesByCategoryReportResponse,
  SalesByDepartmentReportResponse,
  SalesByItemReportResponse,
  SalesSummaryReportResponse,
  SalesByCategoryCategoriesParams,
  SalesByCategoryCategoriesResponse,
  SalesByCategoryDailyParams,
  SalesByCategoryDailyResponse,
  SalesByDepartmentDailyParams,
  SalesByDepartmentDailyResponse,
  SalesByDepartmentDepartmentsParams,
  SalesByDepartmentDepartmentsResponse,
  SalesByItemDailyParams,
  SalesByItemDailyResponse,
  SalesByItemItemsParams,
  SalesByItemItemsResponse,
  SalesByItemTopSellingParams,
  SalesByItemTopSellingResponse,
  SalesSummaryByCashierParams,
  SalesSummaryByCashierResponse,
  SalesSummaryByDateParams,
  SalesSummaryByDateResponse,
  SalesSummaryPaymentMethodsDailyParams,
  SalesSummaryPaymentMethodsDailyResponse,
  ReportsBaseParams,
} from "@/lib/types/reports";

// 1. Transaction Detail
export const useGetReportsTransactionDetail = (
  id: string | number | undefined,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn && id
    ? API_ENDPOINTS.REPORTS_TRANSACTION_DETAIL(id)
    : null;

  return useApi<TransactionDetailResponse>(url, options);
};

// 2. Payment Methods
export const useGetReportsTransactionsPaymentMethods = (
  params?: PaymentMethodsParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_TRANSACTIONS_PAYMENT_METHODS, params)
    : null;

  return useApi<PaymentMethodsResponse>(url, options);
};

// 3. Transactions Report
export const useGetReportsTransactions = (
  params?: TransactionsReportParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_TRANSACTIONS, params)
    : null;

  return useApi<TransactionsReportResponse>(url, options);
};

// 4. Cashiers Report
export const useGetCashiersReport = (
  params?: { outletId?: string },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_CASHIERS, params)
    : null;

  return useApi<CashiersReportResponse>(url, options);
};

// 5. Profit Loss
export const useGetProfitLossReport = (
  params?: ReportsBaseParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_PROFIT_LOSS, params)
    : null;

  return useApi<ProfitLossReportResponse>(url, options);
};

// 6. Sales by Category
export const useGetSalesByCategoryReport = (
  params?: ReportsBaseParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_SALES_BY_CATEGORY, params)
    : null;

  return useApi<SalesByCategoryReportResponse>(url, options);
};

// 7. Sales by Department
export const useGetSalesByDepartmentReport = (
  params?: ReportsBaseParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_SALES_BY_DEPARTMENT, params)
    : null;

  return useApi<SalesByDepartmentReportResponse>(url, options);
};

// 8. Sales by Item
export const useGetSalesByItemReport = (
  params?: ReportsBaseParams & { search?: string },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_SALES_BY_ITEM, params)
    : null;

  return useApi<SalesByItemReportResponse>(url, options);
};

// 9. Sales Summary
export const useGetSalesSummaryReport = (
  params?: ReportsBaseParams & {
    salesByDatePage?: number;
    salesByDatePerPage?: number;
    salesByCashierPage?: number;
    salesByCashierPerPage?: number;
    paymentDailyPage?: number;
    paymentDailyPerPage?: number;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_SALES_SUMMARY, params)
    : null;

  return useApi<SalesSummaryReportResponse>(url, options);
};

// 10. Sales by Category Categories
export const useGetSalesByCategoryCategories = (
  params?: SalesByCategoryCategoriesParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_SALES_BY_CATEGORY_CATEGORIES, params)
    : null;

  return useApi<SalesByCategoryCategoriesResponse>(url, options);
};

// 11. Sales by Category Daily
export const useGetSalesByCategoryDaily = (
  params?: SalesByCategoryDailyParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_SALES_BY_CATEGORY_DAILY, params)
    : null;

  return useApi<SalesByCategoryDailyResponse>(url, options);
};

// 12. Sales by Department Daily
export const useGetSalesByDepartmentDaily = (
  params?: SalesByDepartmentDailyParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_SALES_BY_DEPARTMENT_DAILY, params)
    : null;

  return useApi<SalesByDepartmentDailyResponse>(url, options);
};

// 13. Sales by Department Departments
export const useGetSalesByDepartmentDepartments = (
  params?: SalesByDepartmentDepartmentsParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_SALES_BY_DEPARTMENT_DEPARTMENTS, params)
    : null;

  return useApi<SalesByDepartmentDepartmentsResponse>(url, options);
};

// 14. Sales by Item Daily
export const useGetSalesByItemDaily = (
  params?: SalesByItemDailyParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_SALES_BY_ITEM_DAILY, params)
    : null;

  return useApi<SalesByItemDailyResponse>(url, options);
};

// 15. Sales by Item Items
export const useGetSalesByItemItems = (
  params?: SalesByItemItemsParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_SALES_BY_ITEM_ITEMS, params)
    : null;

  return useApi<SalesByItemItemsResponse>(url, options);
};

// 16. Sales by Item Top Selling
export const useGetSalesByItemTopSelling = (
  params?: SalesByItemTopSellingParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_SALES_BY_ITEM_TOP_SELLING, params)
    : null;

  return useApi<SalesByItemTopSellingResponse>(url, options);
};

// 17. Sales Summary by Cashier
export const useGetSalesSummaryByCashier = (
  params?: SalesSummaryByCashierParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_SALES_SUMMARY_BY_CASHIER, params)
    : null;

  return useApi<SalesSummaryByCashierResponse>(url, options);
};

// 18. Sales Summary by Date
export const useGetSalesSummaryByDate = (
  params?: SalesSummaryByDateParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_SALES_SUMMARY_BY_DATE, params)
    : null;

  return useApi<SalesSummaryByDateResponse>(url, options);
};

// 19. Sales Summary Payment Methods Daily
export const useGetSalesSummaryPaymentMethodsDaily = (
  params?: SalesSummaryPaymentMethodsDailyParams,
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams(API_ENDPOINTS.REPORTS_SALES_SUMMARY_PAYMENT_METHODS_DAILY, params)
    : null;

  return useApi<SalesSummaryPaymentMethodsDailyResponse>(url, options);
};
