import type { Transaction } from "@/components/TransactionsTable";

export interface ReportPagination {
  currentPage: number;
  perPage: number;
  lastPage: number;
  total: number;
  from: number;
  to: number;
  pageSizeOptions?: number[];
}

export type ReportsBaseParams = {
  dateFrom?: string;
  dateTo?: string;
  outletId?: string;
  cashierId?: string;
};

// 1. Transaction Detail
export interface TransactionDetailResponse {
  data: Transaction & { id: string };
}

// 2. Payment Methods
export type PaymentMethodsParams = {
  dateFrom?: string;
  dateTo?: string;
  outletId?: string;
};
export interface PaymentMethodsResponse {
  data: string[];
}

// 3. Transactions Report
export type TransactionsReportParams = {
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
  page?: number;
  per_page?: number;
  outletId?: string;
  cashierId?: string;
  search?: string;
};
export interface TransactionsReportResponse {
  data: Transaction[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

// 4. Cashiers Report
export interface CashiersReportResponse {
  data: {
    id: string;
    name: string;
  }[];
}

// 5. Profit Loss
export interface ProfitLossReportResponse {
  data: {
    pnl: {
      revenue: {
        sales: number;
        otherIncome: number;
      };
      costOfGoods: {
        inventory: number;
        directLabor: number;
      };
      expenses: {
        rent: number;
        utilities: number;
        salaries: number;
        marketing: number;
        maintenance: number;
        other: number;
      };
    };
    summary: {
      totalRevenue: number;
      totalCOGS: number;
      grossProfit: number;
      grossMargin: number;
      totalExpenses: number;
      netProfit: number;
      netMargin: number;
    };
    cogsItems: {
      inventoryItemId: string;
      name: string;
      unit: string;
      totalQty: number;
      avgCostPrice: number;
      totalCost: number;
      pctOfCOGS: string;
    }[];
    rawMaterials: {
      inventoryItemId: string;
      name: string;
      unit: string;
      qty: number;
      totalCost: number;
      avgCost: number;
      attributedRevenue: number;
      profit: number;
      margin: number;
      share: number;
    }[];
    outletComparison: {
      outletId: string;
      name: string;
      shortName: string;
      revenue: number;
      profit: number;
    }[];
    availableCashiers: string[];
    directLaborRate: number;
    filters: {
      outletId: string | null;
      outletLabel: string;
      cashier: string | null;
      dateFrom: string;
      dateTo: string;
    };
  };
}

// 6. Sales by Category Summary
export interface SalesByCategoryReportResponse {
  data: {
    categories: number;
    totalQtySold: number;
    totalRevenue: number;
    topSellingCategory: {
      category: string;
      qty: number;
      revenue: number;
      pct: string;
      pctNum: number;
    };
    topSellingCategories: {
      category: string;
      qty: number;
      revenue: number;
      pct: string;
      pctNum: number;
    }[];
    filters: {
      outletId: string | null;
      outletLabel: string;
      cashier: string | null;
      dateFrom: string;
      dateTo: string;
    };
  };
}

// 7. Sales by Department Summary
export interface SalesByDepartmentReportResponse {
  data: {
    departments: number;
    totalOrders: number;
    totalRevenue: number;
    topSellingDepartment: {
      department: string;
      outletId: string;
      outletName: string;
      orders: number;
      revenue: number;
      pct: string;
      pctNum: number;
    };
    topSellingDepartments: {
      department: string;
      outletId: string;
      outletName: string;
      orders: number;
      revenue: number;
      pct: string;
      pctNum: number;
    }[];
    filters: {
      outletId: string | null;
      outletLabel: string;
      cashier: string | null;
      dateFrom: string;
      dateTo: string;
    };
  };
}

// 8. Sales by Item Summary
export interface SalesByItemReportResponse {
  data: {
    uniqueItems: number;
    totalQtySold: number;
    netRevenue: number;
    grossRevenue: number;
    totalDiscount: number;
    totalCost: number;
    taxCollected: number;
    trueProfit: number;
    marginPercent: number;
    filters: {
      outletId: string | null;
      outletLabel: string;
      cashier: string | null;
      dateFrom: string;
      dateTo: string;
      search: string | null;
    };
  };
}

// 9. Sales Summary Main Overview
export interface SalesSummaryReportResponse {
  data: {
    overview: {
      totalRevenue: number;
      totalSales: number;
      totalOtherIncome: number;
      transactionCount: number;
      avgPerTransaction: number;
      topBusinessDay: {
        day: string;
        fullDay: string;
        sales: number;
        transactions: number;
      };
    };
    salesByBusinessDay: {
      day: string;
      fullDay: string;
      sales: number;
      avg: number;
      transactions: number;
    }[];
    salesByPaymentMethod: {
      name: string;
      value: number;
    }[];
    paymentMethodsDaily: {
      dates: string[];
      rows: {
        date: string;
        displayDate: string;
        methods: {
          name: string;
          value: number;
        }[];
        total: number;
      }[];
      pagination: ReportPagination;
      totalsByMethod: {
        name: string;
        value: number;
      }[];
      grandTotal: number;
    };
    salesByHour: {
      hour: number;
      label: string;
      fullLabel: string;
      sales: number;
      orders: number;
    }[];
    salesTrend: {
      date: string;
      displayDate: string;
      shortDate: string;
      sales: number;
      orders: number;
    }[];
    salesByDate: {
      items: {
        date: string;
        displayDate: string;
        sales: number;
        orders: number;
      }[];
      pagination: ReportPagination;
    };
    salesByCashier: {
      items: {
        cashier: string;
        total: number;
        transactions: number;
      }[];
      pagination: ReportPagination;
    };
    salesByOutlet: {
      outletId: string;
      outletName: string;
      sales: number;
      otherIncome: number;
      total: number;
      transactions: number;
    }[];
    availableCashiers: string[];
    filters: {
      outletId: string | null;
      outletLabel: string;
      cashier: string | null;
      dateFrom: string;
      dateTo: string;
      salesByDatePage: number;
      salesByDatePerPage: number;
      salesByCashierPage: number;
      salesByCashierPerPage: number;
      paymentDailyPage: number;
      paymentDailyPerPage: number;
    };
  };
}

// 10. Sales by Category - Categories Paginated
export type SalesByCategoryCategoriesParams = ReportsBaseParams & {
  page?: number;
  perPage?: number;
};
export interface SalesByCategoryCategoriesResponse {
  data: {
    items: {
      category: string;
      qty: number;
      revenue: number;
      pct: string;
      pctNum: number;
    }[];
    pagination: ReportPagination;
    filters: ReportsBaseParams & {
      page: number;
      perPage: number;
    };
  };
}

// 11. Sales by Category - Category Daily Breakdown
export type SalesByCategoryDailyParams = ReportsBaseParams & {
  category: string;
  page?: number;
  perPage?: number;
};
export interface SalesByCategoryDailyResponse {
  data: {
    category: string;
    items: {
      date: string;
      displayDate: string;
      qty: number;
      revenue: number;
    }[];
    pagination: ReportPagination;
    totals: {
      qty: number;
      revenue: number;
    };
    filters: ReportsBaseParams & {
      category: string;
      page: number;
      perPage: number;
    };
  };
}

// 12. Sales by Department - Department Daily Breakdown
export type SalesByDepartmentDailyParams = ReportsBaseParams & {
  department: string;
  page?: number;
  perPage?: number;
};
export interface SalesByDepartmentDailyResponse {
  data: {
    department: string;
    outletId: string;
    outletName: string;
    items: {
      date: string;
      displayDate: string;
      orders: number;
      revenue: number;
    }[];
    pagination: ReportPagination;
    totals: {
      orders: number;
      revenue: number;
    };
    filters: ReportsBaseParams & {
      department: string;
      page: number;
      perPage: number;
    };
  };
}

// 13. Sales by Department - Departments Paginated
export type SalesByDepartmentDepartmentsParams = ReportsBaseParams & {
  page?: number;
  perPage?: number;
};
export interface SalesByDepartmentDepartmentsResponse {
  data: {
    items: {
      department: string;
      outletId: string;
      outletName: string;
      orders: number;
      revenue: number;
      pct: string;
      pctNum: number;
    }[];
    pagination: ReportPagination;
    filters: ReportsBaseParams & {
      page: number;
      perPage: number;
    };
  };
}

// 14. Sales by Item - Item Daily Breakdown
export type SalesByItemDailyParams = ReportsBaseParams & {
  itemName: string;
  page?: number;
  perPage?: number;
};
export interface SalesByItemDailyResponse {
  data: {
    itemName: string;
    items: {
      date: string;
      displayDate: string;
      qty: number;
      revenue: number;
    }[];
    pagination?: ReportPagination;
    totals: {
      qty: number;
      revenue: number;
    };
    filters: ReportsBaseParams & {
      itemName: string;
      page?: number;
      perPage?: number;
    };
  };
}

// 15. Sales by Item - Items Paginated
export type SalesByItemItemsParams = ReportsBaseParams & {
  search?: string;
  page?: number;
  perPage?: number;
};
export interface SalesByItemItemsResponse {
  data: {
    items: {
      name: string;
      category: string;
      qty: number;
      unitCost: number;
      cost: number;
      grossRevenue: number;
      discount: number;
      tax: number;
      revenue: number;
      profit: number;
      margin: number;
    }[];
    pagination: ReportPagination;
    filters: ReportsBaseParams & {
      page: number;
      perPage: number;
      search?: string;
    };
  };
}

// 16. Sales by Item - Top Selling Paginated
export type SalesByItemTopSellingParams = ReportsBaseParams & {
  page?: number;
  perPage?: number;
};
export interface SalesByItemTopSellingResponse {
  data: {
    items: {
      name: string;
      qty: number;
      revenue: number;
    }[];
    pagination: ReportPagination;
    filters: ReportsBaseParams & {
      page: number;
      perPage: number;
    };
  };
}

// 17. Sales Summary by Cashier Paginated
export type SalesSummaryByCashierParams = ReportsBaseParams & {
  page?: number;
  perPage?: number;
};
export interface SalesSummaryByCashierResponse {
  data: {
    items: {
      cashier: string;
      total: number;
      transactions: number;
    }[];
    pagination: ReportPagination;
    filters: ReportsBaseParams & {
      page: number;
      perPage: number;
    };
  };
}

// 18. Sales Summary by Date Paginated
export type SalesSummaryByDateParams = ReportsBaseParams & {
  page?: number;
  perPage?: number;
};
export interface SalesSummaryByDateResponse {
  data: {
    items: {
      date: string;
      displayDate: string;
      sales: number;
      orders: number;
    }[];
    pagination: ReportPagination;
    filters: ReportsBaseParams & {
      page: number;
      perPage: number;
    };
  };
}

// 19. Sales Summary Payment Methods Daily Paginated
export type SalesSummaryPaymentMethodsDailyParams = ReportsBaseParams & {
  page?: number;
  perPage?: number;
};
export interface SalesSummaryPaymentMethodsDailyResponse {
  data: {
    dates: string[];
    rows: {
      date: string;
      displayDate: string;
      methods: {
        name: string;
        value: number;
      }[];
      total: number;
    }[];
    pagination: ReportPagination;
    totalsByMethod: {
      name: string;
      value: number;
    }[];
    grandTotal: number;
  };
}
