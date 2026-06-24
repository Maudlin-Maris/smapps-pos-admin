// Maps item categories within each outlet to a department.
// Used by the Sales by Department report.

import { outletItemSales } from "./salesData";

// Per-outlet category → department mapping. Matches realistic POS departments
// for each business type configured in src/data/outlets.ts.
const outletCategoryToDepartment: Record<string, Record<string, string>> = {
  // outlet-1: Downtown Flagship (restaurant) — but in salesData it carries grocery-like items
  "outlet-1": {
    Household: "Household",
    Groceries: "Grocery",
    Bakery: "Bakery",
    Dairy: "Dairy & Chilled",
  },
  // outlet-2: Mall Branch (retail) — restaurant-style items in salesData
  "outlet-2": {
    "Main Dishes": "Kitchen",
    Beverages: "Bar",
    Snacks: "Front of House",
  },
  // outlet-3: Airport Kiosk — salon-style items in salesData
  "outlet-3": {
    "Hair Services": "Hair Department",
    "Nail Services": "Nail Department",
    Grooming: "Grooming",
    "Skin Care": "Skin Care",
  },
  // outlet-4: Suburban Pharmacy — convenience items in salesData
  "outlet-4": {
    Snacks: "Convenience",
    Travel: "Travel Essentials",
    Electronics: "Electronics",
    Media: "Media",
    Beverages: "Beverages",
  },
};

export interface DepartmentSalesRow {
  department: string;
  outletId: string;
  outletName: string;
  qty: number;
  orders: number;
  revenue: number;
}

// Approximate average items-per-order basket size used to derive order counts
// from item-level sample data (no per-order linkage exists in mock data).
const AVG_BASKET_SIZE = 1.6;

/** Aggregate item sales into departments across the selected outlets. */
export function aggregateItemsByDepartment(selectedOutlets: string[], outlets: any[] = []): DepartmentSalesRow[] {
  const map: Record<string, DepartmentSalesRow> = {};
  selectedOutlets.forEach((outletId) => {
    const items = outletItemSales[outletId] || [];
    const mapping = outletCategoryToDepartment[outletId] || {};
    const outletName = outlets.find((o) => o.id === outletId)?.name || outletId;

    items.forEach((item) => {
      const dept = mapping[item.category] || item.category;
      const key = `${outletId}::${dept}`;
      if (!map[key]) {
        map[key] = { department: dept, outletId, outletName, qty: 0, orders: 0, revenue: 0 };
      }
      map[key].qty += item.qty;
      map[key].revenue += item.revenue;
    });
  });
  return Object.values(map)
    .map((r) => ({ ...r, orders: Math.max(1, Math.round(r.qty / AVG_BASKET_SIZE)) }))
    .sort((a, b) => b.revenue - a.revenue);
}
