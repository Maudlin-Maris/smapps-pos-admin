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
}

const EXPENSES_KEY = "financial_expenses";
const SALES_KEY = "financial_sales";

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

// Default sample sales
const defaultSales: SalesRecord[] = [
  { id: "s1", outletId: "outlet-1", date: "2026-03-01", totalSales: 1420, otherIncome: 40 },
  { id: "s2", outletId: "outlet-1", date: "2026-03-02", totalSales: 1380, otherIncome: 0 },
  { id: "s3", outletId: "outlet-1", date: "2026-03-03", totalSales: 1510, otherIncome: 60 },
  { id: "s4", outletId: "outlet-1", date: "2026-03-04", totalSales: 1290, otherIncome: 0 },
  { id: "s5", outletId: "outlet-1", date: "2026-03-05", totalSales: 1600, otherIncome: 80 },
  { id: "s6", outletId: "outlet-2", date: "2026-03-01", totalSales: 1250, otherIncome: 30 },
  { id: "s7", outletId: "outlet-2", date: "2026-03-02", totalSales: 1180, otherIncome: 0 },
  { id: "s8", outletId: "outlet-2", date: "2026-03-03", totalSales: 1340, otherIncome: 50 },
  { id: "s9", outletId: "outlet-2", date: "2026-03-04", totalSales: 1100, otherIncome: 0 },
  { id: "s10", outletId: "outlet-2", date: "2026-03-05", totalSales: 1450, otherIncome: 40 },
  { id: "s11", outletId: "outlet-3", date: "2026-03-01", totalSales: 980, otherIncome: 20 },
  { id: "s12", outletId: "outlet-3", date: "2026-03-02", totalSales: 920, otherIncome: 0 },
  { id: "s13", outletId: "outlet-3", date: "2026-03-03", totalSales: 1050, otherIncome: 30 },
  { id: "s14", outletId: "outlet-3", date: "2026-03-04", totalSales: 870, otherIncome: 0 },
  { id: "s15", outletId: "outlet-3", date: "2026-03-05", totalSales: 1100, otherIncome: 20 },
  { id: "s16", outletId: "outlet-4", date: "2026-03-01", totalSales: 520, otherIncome: 10 },
  { id: "s17", outletId: "outlet-4", date: "2026-03-02", totalSales: 480, otherIncome: 0 },
  { id: "s18", outletId: "outlet-4", date: "2026-03-03", totalSales: 550, otherIncome: 20 },
  { id: "s19", outletId: "outlet-4", date: "2026-03-04", totalSales: 430, otherIncome: 0 },
  { id: "s20", outletId: "outlet-4", date: "2026-03-05", totalSales: 600, otherIncome: 10 },
];

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
