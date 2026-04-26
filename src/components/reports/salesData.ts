// Shared sample data for Sales tabs (item-level + payment splits)
// unitCost = cost of production / acquisition per single unit (WAC-based)
// discount = total item-level discount applied (subtracted from gross revenue)
// tax = item-level tax collected (passed through, excluded from net revenue and profit)

export type OutletItemSale = {
  name: string;
  category: string;
  qty: number;
  revenue: number; // gross revenue (pre-discount, pre-tax)
  unitCost: number;
  discount: number; // total discount across qty
  tax: number; // total tax collected across qty
};

export const outletItemSales: Record<string, OutletItemSale[]> = {
  "outlet-1": [
    { name: "Detergent 2kg", category: "Household", qty: 42, revenue: 6300, unitCost: 110, discount: 315, tax: 472 },
    { name: "Rice 5kg", category: "Groceries", qty: 38, revenue: 5700, unitCost: 120, discount: 0, tax: 427 },
    { name: "Cooking Oil 1L", category: "Groceries", qty: 56, revenue: 4480, unitCost: 60, discount: 224, tax: 336 },
    { name: "Bread (White)", category: "Bakery", qty: 120, revenue: 3600, unitCost: 18, discount: 0, tax: 270 },
    { name: "Eggs (Tray)", category: "Groceries", qty: 34, revenue: 3400, unitCost: 75, discount: 170, tax: 255 },
    { name: "Sugar 1kg", category: "Groceries", qty: 62, revenue: 2480, unitCost: 28, discount: 0, tax: 186 },
    { name: "Milk 1L", category: "Dairy", qty: 48, revenue: 1920, unitCost: 26, discount: 96, tax: 144 },
    { name: "Butter 250g", category: "Dairy", qty: 30, revenue: 1500, unitCost: 32, discount: 0, tax: 112 },
  ],
  "outlet-2": [
    { name: "Grilled Chicken Combo", category: "Main Dishes", qty: 86, revenue: 12900, unitCost: 75, discount: 645, tax: 968 },
    { name: "Espresso Coffee", category: "Beverages", qty: 142, revenue: 7100, unitCost: 18, discount: 0, tax: 532 },
    { name: "Fresh Juice (L)", category: "Beverages", qty: 112, revenue: 6720, unitCost: 22, discount: 336, tax: 504 },
    { name: "Burger Meal", category: "Main Dishes", qty: 64, revenue: 5760, unitCost: 38, discount: 288, tax: 432 },
    { name: "Fried Rice", category: "Main Dishes", qty: 48, revenue: 4320, unitCost: 32, discount: 0, tax: 324 },
    { name: "Meat Pie", category: "Snacks", qty: 90, revenue: 2700, unitCost: 12, discount: 135, tax: 202 },
    { name: "Chin Chin Pack", category: "Snacks", qty: 65, revenue: 1950, unitCost: 10, discount: 0, tax: 146 },
  ],
  "outlet-3": [
    { name: "Premium Haircut", category: "Hair Services", qty: 24, revenue: 7200, unitCost: 60, discount: 360, tax: 540 },
    { name: "Hair Treatment", category: "Hair Services", qty: 18, revenue: 9000, unitCost: 140, discount: 0, tax: 675 },
    { name: "Manicure & Pedicure", category: "Nail Services", qty: 22, revenue: 6600, unitCost: 70, discount: 330, tax: 495 },
    { name: "Hair Coloring", category: "Hair Services", qty: 8, revenue: 6400, unitCost: 220, discount: 0, tax: 480 },
    { name: "Beard Trim", category: "Grooming", qty: 32, revenue: 4800, unitCost: 30, discount: 240, tax: 360 },
    { name: "Facial Treatment", category: "Skin Care", qty: 12, revenue: 3600, unitCost: 90, discount: 0, tax: 270 },
  ],
  "outlet-4": [
    { name: "Travel Snack Pack", category: "Snacks", qty: 68, revenue: 6800, unitCost: 45, discount: 340, tax: 510 },
    { name: "Neck Pillow", category: "Travel", qty: 22, revenue: 5500, unitCost: 110, discount: 0, tax: 412 },
    { name: "Earphones", category: "Electronics", qty: 18, revenue: 5400, unitCost: 160, discount: 270, tax: 405 },
    { name: "Magazine", category: "Media", qty: 44, revenue: 4400, unitCost: 55, discount: 0, tax: 330 },
    { name: "Bottled Water", category: "Beverages", qty: 120, revenue: 3600, unitCost: 12, discount: 180, tax: 270 },
    { name: "Chewing Gum", category: "Snacks", qty: 80, revenue: 1600, unitCost: 6, discount: 0, tax: 120 },
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
  const itemMap: Record<
    string,
    {
      name: string;
      category: string;
      qty: number;
      grossRevenue: number;
      discount: number;
      tax: number;
      revenue: number; // net revenue (gross - discount)
      cost: number;
      unitCost: number;
      profit: number;
      margin: number;
    }
  > = {};
  selectedOutlets.forEach((outletId) => {
    const items = outletItemSales[outletId] || [];
    items.forEach((item) => {
      const cost = item.unitCost * item.qty;
      if (!itemMap[item.name]) {
        itemMap[item.name] = {
          name: item.name,
          category: item.category,
          qty: item.qty,
          grossRevenue: item.revenue,
          discount: item.discount,
          tax: item.tax,
          revenue: item.revenue - item.discount,
          cost,
          unitCost: item.unitCost,
          profit: 0,
          margin: 0,
        };
      } else {
        const existing = itemMap[item.name];
        existing.qty += item.qty;
        existing.grossRevenue += item.revenue;
        existing.discount += item.discount;
        existing.tax += item.tax;
        existing.revenue += item.revenue - item.discount;
        existing.cost += cost;
        existing.unitCost = existing.qty > 0 ? existing.cost / existing.qty : item.unitCost;
      }
    });
  });
  return Object.values(itemMap)
    .map((i) => {
      // Net revenue excludes pass-through tax and is net of discounts.
      // Profit = net revenue - COGS.
      const profit = i.revenue - i.cost;
      const margin = i.revenue > 0 ? (profit / i.revenue) * 100 : 0;
      return { ...i, profit, margin };
    })
    .sort((a, b) => b.revenue - a.revenue);
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
