// Shared sample data for Sales tabs (item-level + payment splits)

export const outletItemSales: Record<
  string,
  { name: string; category: string; qty: number; revenue: number }[]
> = {
  "outlet-1": [
    { name: "Detergent 2kg", category: "Household", qty: 42, revenue: 6300 },
    { name: "Rice 5kg", category: "Groceries", qty: 38, revenue: 5700 },
    { name: "Cooking Oil 1L", category: "Groceries", qty: 56, revenue: 4480 },
    { name: "Bread (White)", category: "Bakery", qty: 120, revenue: 3600 },
    { name: "Eggs (Tray)", category: "Groceries", qty: 34, revenue: 3400 },
    { name: "Sugar 1kg", category: "Groceries", qty: 62, revenue: 2480 },
    { name: "Milk 1L", category: "Dairy", qty: 48, revenue: 1920 },
    { name: "Butter 250g", category: "Dairy", qty: 30, revenue: 1500 },
  ],
  "outlet-2": [
    { name: "Grilled Chicken Combo", category: "Main Dishes", qty: 86, revenue: 12900 },
    { name: "Espresso Coffee", category: "Beverages", qty: 142, revenue: 7100 },
    { name: "Fresh Juice (L)", category: "Beverages", qty: 112, revenue: 6720 },
    { name: "Burger Meal", category: "Main Dishes", qty: 64, revenue: 5760 },
    { name: "Fried Rice", category: "Main Dishes", qty: 48, revenue: 4320 },
    { name: "Meat Pie", category: "Snacks", qty: 90, revenue: 2700 },
    { name: "Chin Chin Pack", category: "Snacks", qty: 65, revenue: 1950 },
  ],
  "outlet-3": [
    { name: "Premium Haircut", category: "Hair Services", qty: 24, revenue: 7200 },
    { name: "Hair Treatment", category: "Hair Services", qty: 18, revenue: 9000 },
    { name: "Manicure & Pedicure", category: "Nail Services", qty: 22, revenue: 6600 },
    { name: "Hair Coloring", category: "Hair Services", qty: 8, revenue: 6400 },
    { name: "Beard Trim", category: "Grooming", qty: 32, revenue: 4800 },
    { name: "Facial Treatment", category: "Skin Care", qty: 12, revenue: 3600 },
  ],
  "outlet-4": [
    { name: "Travel Snack Pack", category: "Snacks", qty: 68, revenue: 6800 },
    { name: "Neck Pillow", category: "Travel", qty: 22, revenue: 5500 },
    { name: "Earphones", category: "Electronics", qty: 18, revenue: 5400 },
    { name: "Magazine", category: "Media", qty: 44, revenue: 4400 },
    { name: "Bottled Water", category: "Beverages", qty: 120, revenue: 3600 },
    { name: "Chewing Gum", category: "Snacks", qty: 80, revenue: 1600 },
  ],
};

export const outletPaymentSplits: Record<string, Record<string, number>> = {
  "outlet-1": { Cash: 0.45, Card: 0.30, "Mobile Money": 0.18, "Bank Transfer": 0.07 },
  "outlet-2": { Cash: 0.35, Card: 0.38, "Mobile Money": 0.22, "Bank Transfer": 0.05 },
  "outlet-3": { Cash: 0.30, Card: 0.42, "Mobile Money": 0.22, "Bank Transfer": 0.06 },
  "outlet-4": { Cash: 0.25, Card: 0.48, "Mobile Money": 0.20, "Bank Transfer": 0.07 },
};

export const PAYMENT_COLORS: Record<string, string> = {
  Cash: "hsl(var(--chart-1))",
  Card: "hsl(var(--chart-2))",
  "Mobile Money": "hsl(var(--chart-3))",
  "Bank Transfer": "hsl(var(--chart-4))",
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(value);

export function filterSales<T extends { outletId: string; date: string; cashier?: string }>(
  sales: T[],
  selectedOutlets: string[],
  dateRange: { from: Date; to: Date },
  cashier?: string
) {
  const fromStr = dateRange.from.toISOString().split("T")[0];
  const toStr = dateRange.to.toISOString().split("T")[0];
  return sales.filter(
    (s) =>
      selectedOutlets.includes(s.outletId) &&
      s.date >= fromStr &&
      s.date <= toStr &&
      (!cashier || cashier === "all" || s.cashier === cashier)
  );
}

export function aggregateItems(selectedOutlets: string[]) {
  const itemMap: Record<string, { name: string; category: string; qty: number; revenue: number }> = {};
  selectedOutlets.forEach((outletId) => {
    const items = outletItemSales[outletId] || [];
    items.forEach((item) => {
      if (!itemMap[item.name]) {
        itemMap[item.name] = { ...item };
      } else {
        itemMap[item.name].qty += item.qty;
        itemMap[item.name].revenue += item.revenue;
      }
    });
  });
  return Object.values(itemMap).sort((a, b) => b.revenue - a.revenue);
}

export function dailySalesShareFor(filteredSales: { date: string; totalSales: number }[]) {
  const grouped: Record<string, number> = {};
  let total = 0;
  filteredSales.forEach((s) => {
    grouped[s.date] = (grouped[s.date] || 0) + s.totalSales;
    total += s.totalSales;
  });
  const dates = Object.keys(grouped).sort();
  return { perDay: grouped, total, dates };
}
