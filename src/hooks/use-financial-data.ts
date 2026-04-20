import { useState, useEffect, useCallback } from "react";

export interface Expense {
  id: string;
  outletId: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // ISO date string
  description: string;
  recurring: boolean;
  recurringPeriod?: "weekly" | "monthly" | "quarterly" | "yearly";
}

export type ExpenseCategory = "rent" | "utilities" | "salaries" | "marketing" | "maintenance" | "other";

export const expenseCategories: { value: ExpenseCategory; label: string }[] = [
  { value: "rent", label: "Rent" },
  { value: "utilities", label: "Utilities" },
  { value: "salaries", label: "Salaries & Wages" },
  { value: "marketing", label: "Marketing" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

export interface SalesRecord {
  id: string;
  outletId: string;
  date: string;
  totalSales: number;
  otherIncome: number;
  cashier?: string;
}

const EXPENSES_KEY = "financial_expenses";
const SALES_KEY = "financial_sales";
const DATA_VERSION_KEY = "financial_data_version";
const CURRENT_DATA_VERSION = 3; // Bump when default data schema changes

// Clear stale localStorage when data version changes
(function migrateStorage() {
  const stored = localStorage.getItem(DATA_VERSION_KEY);
  if (stored !== String(CURRENT_DATA_VERSION)) {
    localStorage.removeItem(EXPENSES_KEY);
    localStorage.removeItem(SALES_KEY);
    localStorage.removeItem("financial_adjustments");
    localStorage.setItem(DATA_VERSION_KEY, String(CURRENT_DATA_VERSION));
  }
})();

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Default sample expenses
const defaultExpenses: Expense[] = [
  { id: "e1", outletId: "outlet-1", category: "rent", amount: 3500, date: "2026-03-01", description: "Monthly rent", recurring: true, recurringPeriod: "monthly" },
  { id: "e2", outletId: "outlet-1", category: "utilities", amount: 850, date: "2026-03-05", description: "Electricity & water", recurring: true, recurringPeriod: "monthly" },
  { id: "e3", outletId: "outlet-1", category: "salaries", amount: 8200, date: "2026-03-01", description: "Staff salaries", recurring: true, recurringPeriod: "monthly" },
  { id: "e4", outletId: "outlet-1", category: "marketing", amount: 1200, date: "2026-03-10", description: "Social media ads", recurring: false },
  { id: "e5", outletId: "outlet-1", category: "maintenance", amount: 600, date: "2026-03-15", description: "Equipment repair", recurring: false },
  { id: "e6", outletId: "outlet-1", category: "other", amount: 450, date: "2026-03-20", description: "Misc supplies", recurring: false },
  { id: "e7", outletId: "outlet-2", category: "rent", amount: 4200, date: "2026-03-01", description: "Monthly rent", recurring: true, recurringPeriod: "monthly" },
  { id: "e8", outletId: "outlet-2", category: "utilities", amount: 720, date: "2026-03-05", description: "Electricity & water", recurring: true, recurringPeriod: "monthly" },
  { id: "e9", outletId: "outlet-2", category: "salaries", amount: 7500, date: "2026-03-01", description: "Staff salaries", recurring: true, recurringPeriod: "monthly" },
  { id: "e10", outletId: "outlet-2", category: "marketing", amount: 950, date: "2026-03-12", description: "Flyer printing", recurring: false },
  { id: "e11", outletId: "outlet-2", category: "maintenance", amount: 400, date: "2026-03-18", description: "Plumbing fix", recurring: false },
  { id: "e12", outletId: "outlet-2", category: "other", amount: 380, date: "2026-03-22", description: "Office supplies", recurring: false },
  { id: "e13", outletId: "outlet-3", category: "rent", amount: 2800, date: "2026-03-01", description: "Monthly rent", recurring: true, recurringPeriod: "monthly" },
  { id: "e14", outletId: "outlet-3", category: "utilities", amount: 550, date: "2026-03-05", description: "Electricity", recurring: true, recurringPeriod: "monthly" },
  { id: "e15", outletId: "outlet-3", category: "salaries", amount: 6200, date: "2026-03-01", description: "Staff salaries", recurring: true, recurringPeriod: "monthly" },
  { id: "e16", outletId: "outlet-3", category: "marketing", amount: 800, date: "2026-03-08", description: "Instagram promotion", recurring: false },
  { id: "e17", outletId: "outlet-3", category: "maintenance", amount: 350, date: "2026-03-14", description: "Cleaning service", recurring: false },
  { id: "e18", outletId: "outlet-3", category: "other", amount: 300, date: "2026-03-25", description: "Uniforms", recurring: false },
  { id: "e19", outletId: "outlet-4", category: "rent", amount: 1800, date: "2026-03-01", description: "Monthly rent", recurring: true, recurringPeriod: "monthly" },
  { id: "e20", outletId: "outlet-4", category: "utilities", amount: 380, date: "2026-03-05", description: "Electricity", recurring: true, recurringPeriod: "monthly" },
  { id: "e21", outletId: "outlet-4", category: "salaries", amount: 3200, date: "2026-03-01", description: "Staff salaries", recurring: true, recurringPeriod: "monthly" },
  { id: "e22", outletId: "outlet-4", category: "marketing", amount: 500, date: "2026-03-09", description: "Local newspaper ad", recurring: false },
  { id: "e23", outletId: "outlet-4", category: "maintenance", amount: 200, date: "2026-03-16", description: "AC servicing", recurring: false },
  { id: "e24", outletId: "outlet-4", category: "other", amount: 180, date: "2026-03-28", description: "Stationery", recurring: false },
];

// Default sample sales — generated across ~60 days with multiple records per outlet per day
// to provide realistic data for trend charts and pagination testing.
const OUTLET_CASHIERS: Record<string, string[]> = {
  "outlet-1": ["Amina", "Tunde", "Blessing"],
  "outlet-2": ["Chidi", "Fatima", "Ngozi"],
  "outlet-3": ["Grace", "Emeka", "Yetunde"],
  "outlet-4": ["Kemi", "Dayo", "Ifeoma"],
};

// Base daily sales magnitude per outlet (NGN)
const OUTLET_BASE: Record<string, number> = {
  "outlet-1": 1450,
  "outlet-2": 1300,
  "outlet-3": 980,
  "outlet-4": 520,
};

function generateSales(): SalesRecord[] {
  const records: SalesRecord[] = [];
  const start = new Date("2026-02-01");
  const days = 60; // Feb 1 -> Apr 1 2026
  let counter = 1;

  // Deterministic pseudo-random so totals are stable across reloads
  const rand = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  for (let d = 0; d < days; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const dateStr = date.toISOString().split("T")[0];
    const dow = date.getDay();
    // Weekend uplift (Sat=6, Sun=0), midweek dip
    const dayMultiplier = dow === 6 ? 1.45 : dow === 0 ? 1.25 : dow === 5 ? 1.15 : dow === 2 ? 0.85 : 1;

    Object.entries(OUTLET_BASE).forEach(([outletId, base], outletIdx) => {
      const cashiers = OUTLET_CASHIERS[outletId];
      // 2-4 transactions per outlet per day
      const txnCount = 2 + Math.floor(rand(d * 31 + outletIdx * 7) * 3);
      for (let t = 0; t < txnCount; t++) {
        const r = rand(d * 131 + outletIdx * 17 + t * 3);
        const variance = 0.7 + r * 0.6; // 0.7 - 1.3
        const totalSales = Math.round(base * dayMultiplier * variance);
        const otherIncome = r > 0.7 ? Math.round(base * 0.04 * r) : 0;
        const cashier = cashiers[Math.floor(rand(d * 11 + t * 5 + outletIdx) * cashiers.length)];
        records.push({
          id: `s${counter++}`,
          outletId,
          date: dateStr,
          totalSales,
          otherIncome,
          cashier,
        });
      }
    });
  }
  return records;
}

const defaultSales: SalesRecord[] = generateSales();

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(() => loadFromStorage(EXPENSES_KEY, defaultExpenses));

  useEffect(() => {
    saveToStorage(EXPENSES_KEY, expenses);
  }, [expenses]);

  const addExpense = useCallback((expense: Omit<Expense, "id">) => {
    const newExpense: Expense = { ...expense, id: crypto.randomUUID() };
    setExpenses((prev) => [newExpense, ...prev]);
    return newExpense;
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const getExpensesByOutletAndPeriod = useCallback(
    (outletIds: string[], from: Date, to: Date) => {
      const fromStr = from.toISOString().split("T")[0];
      const toStr = to.toISOString().split("T")[0];
      return expenses.filter(
        (e) => outletIds.includes(e.outletId) && e.date >= fromStr && e.date <= toStr
      );
    },
    [expenses]
  );

  return { expenses, addExpense, updateExpense, deleteExpense, getExpensesByOutletAndPeriod };
}

export function useSales() {
  const [sales, setSales] = useState<SalesRecord[]>(() => loadFromStorage(SALES_KEY, defaultSales));

  useEffect(() => {
    saveToStorage(SALES_KEY, sales);
  }, [sales]);

  const getSalesByOutletAndPeriod = useCallback(
    (outletIds: string[], from: Date, to: Date) => {
      const fromStr = from.toISOString().split("T")[0];
      const toStr = to.toISOString().split("T")[0];
      return sales.filter(
        (s) => outletIds.includes(s.outletId) && s.date >= fromStr && s.date <= toStr
      );
    },
    [sales]
  );

  return { sales, setSales, getSalesByOutletAndPeriod };
}

// Stock adjustments persistence
const ADJUSTMENTS_KEY = "financial_adjustments";

export interface StoredAdjustment {
  id: string;
  inventoryItemId: string;
  type: string;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: string;
  outletId: string;
  costPrice: number;
  costTotal: number;
}

// Consumption types that count toward COGS
const CONSUMPTION_TYPES = ["remove", "damaged"];

// Sample seed adjustments for demo
const defaultAdjustments: StoredAdjustment[] = [
  { id: "adj1", inventoryItemId: "i1", type: "remove", quantityChange: 5, previousStock: 50, newStock: 45, reason: "Daily usage", timestamp: "2026-03-02T10:00:00Z", outletId: "outlet-1", costPrice: 12.5, costTotal: 62.5 },
  { id: "adj2", inventoryItemId: "i2", type: "remove", quantityChange: 3, previousStock: 15, newStock: 12, reason: "Daily usage", timestamp: "2026-03-02T10:00:00Z", outletId: "outlet-1", costPrice: 1.2, costTotal: 3.6 },
  { id: "adj3", inventoryItemId: "i3", type: "remove", quantityChange: 2, previousStock: 32, newStock: 30, reason: "Weekly baking", timestamp: "2026-03-03T09:00:00Z", outletId: "outlet-1", costPrice: 0.8, costTotal: 1.6 },
  { id: "adj4", inventoryItemId: "i4", type: "remove", quantityChange: 50, previousStock: 200, newStock: 150, reason: "Daily cups used", timestamp: "2026-03-01T08:00:00Z", outletId: "outlet-2", costPrice: 0.05, costTotal: 2.5 },
  { id: "adj5", inventoryItemId: "i5", type: "remove", quantityChange: 2, previousStock: 10, newStock: 8, reason: "Baked croissants", timestamp: "2026-03-03T07:00:00Z", outletId: "outlet-2", costPrice: 3.0, costTotal: 6.0 },
  { id: "adj6", inventoryItemId: "i6", type: "remove", quantityChange: 2, previousStock: 5, newStock: 3, reason: "Client services", timestamp: "2026-03-04T14:00:00Z", outletId: "outlet-3", costPrice: 8.0, costTotal: 16.0 },
  { id: "adj7", inventoryItemId: "i7", type: "remove", quantityChange: 2, previousStock: 20, newStock: 18, reason: "Color treatments", timestamp: "2026-03-04T14:00:00Z", outletId: "outlet-3", costPrice: 5.5, costTotal: 11.0 },
  { id: "adj8", inventoryItemId: "i8", type: "damaged", quantityChange: 3, previousStock: 5, newStock: 2, reason: "Torn packaging", timestamp: "2026-03-05T09:00:00Z", outletId: "outlet-3", costPrice: 4.0, costTotal: 12.0 },
  { id: "adj9", inventoryItemId: "i9", type: "remove", quantityChange: 6, previousStock: 30, newStock: 24, reason: "Sandwich prep", timestamp: "2026-03-03T08:00:00Z", outletId: "outlet-4", costPrice: 1.5, costTotal: 9.0 },
  { id: "adj10", inventoryItemId: "i1", type: "add", quantityChange: 10, previousStock: 45, newStock: 55, reason: "New shipment", timestamp: "2026-03-04T11:00:00Z", outletId: "outlet-1", costPrice: 12.5, costTotal: 125.0 },
];

export function useStockAdjustments() {
  const [adjustments, setAdjustments] = useState<StoredAdjustment[]>(() =>
    loadFromStorage(ADJUSTMENTS_KEY, defaultAdjustments)
  );

  useEffect(() => {
    saveToStorage(ADJUSTMENTS_KEY, adjustments);
  }, [adjustments]);

  const addAdjustment = useCallback((adj: StoredAdjustment) => {
    setAdjustments((prev) => [adj, ...prev]);
  }, []);

  const getCOGSByOutletAndPeriod = useCallback(
    (outletIds: string[], from: Date, to: Date) => {
      const fromStr = from.toISOString().split("T")[0];
      const toStr = to.toISOString().split("T")[0];
      return adjustments
        .filter((a) => {
          const adjDate = a.timestamp.split("T")[0];
          return (
            outletIds.includes(a.outletId) &&
            adjDate >= fromStr &&
            adjDate <= toStr &&
            CONSUMPTION_TYPES.includes(a.type)
          );
        })
        .reduce((sum, a) => sum + a.costTotal, 0);
    },
    [adjustments]
  );

  const getAdjustmentsByOutletAndPeriod = useCallback(
    (outletIds: string[], from: Date, to: Date) => {
      const fromStr = from.toISOString().split("T")[0];
      const toStr = to.toISOString().split("T")[0];
      return adjustments.filter((a) => {
        const adjDate = a.timestamp.split("T")[0];
        return outletIds.includes(a.outletId) && adjDate >= fromStr && adjDate <= toStr;
      });
    },
    [adjustments]
  );

  return { adjustments, setAdjustments, addAdjustment, getCOGSByOutletAndPeriod, getAdjustmentsByOutletAndPeriod };
}

export interface PnLData {
  revenue: { sales: number; otherIncome: number };
  costOfGoods: { inventory: number; directLabor: number };
  expenses: { rent: number; utilities: number; salaries: number; marketing: number; maintenance: number; other: number };
}

export function buildPnL(
  filteredExpenses: Expense[],
  filteredSales: SalesRecord[],
  cogsInventory: number,
  cogsLabor: number
): PnLData {
  const result: PnLData = {
    revenue: { sales: 0, otherIncome: 0 },
    costOfGoods: { inventory: cogsInventory, directLabor: cogsLabor },
    expenses: { rent: 0, utilities: 0, salaries: 0, marketing: 0, maintenance: 0, other: 0 },
  };

  for (const s of filteredSales) {
    result.revenue.sales += s.totalSales;
    result.revenue.otherIncome += s.otherIncome;
  }

  for (const e of filteredExpenses) {
    if (e.category in result.expenses) {
      result.expenses[e.category] += e.amount;
    }
  }

  return result;
}
