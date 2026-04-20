import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SalesRecord } from "@/hooks/use-financial-data";
import { outlets } from "@/data/outlets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { TrendingUp, ShoppingCart, Wallet, Trophy, CalendarDays, Star, User, CalendarRange } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "@/components/inventory/PaginationControls";

interface SalesReportProps {
  sales: SalesRecord[];
  selectedOutlets: string[];
  dateRange: { from: Date; to: Date };
  /** When provided, controls cashier filter externally and hides the internal selector. */
  cashierFilter?: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
const PAYMENT_COLORS: Record<string, string> = {
  Cash: "hsl(var(--chart-1))",
  Card: "hsl(var(--chart-2))",
  "Mobile Money": "hsl(var(--chart-3))",
  "Bank Transfer": "hsl(var(--chart-4))",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(value);

// --- Sample item-level sales data per outlet ---
const outletItemSales: Record<string, { name: string; category: string; qty: number; revenue: number }[]> = {
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

const outletPaymentSplits: Record<string, Record<string, number>> = {
  "outlet-1": { Cash: 0.45, Card: 0.30, "Mobile Money": 0.18, "Bank Transfer": 0.07 },
  "outlet-2": { Cash: 0.35, Card: 0.38, "Mobile Money": 0.22, "Bank Transfer": 0.05 },
  "outlet-3": { Cash: 0.30, Card: 0.42, "Mobile Money": 0.22, "Bank Transfer": 0.06 },
  "outlet-4": { Cash: 0.25, Card: 0.48, "Mobile Money": 0.20, "Bank Transfer": 0.07 },
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SalesReport({ sales, selectedOutlets, dateRange, cashierFilter }: SalesReportProps) {
  const [internalCashier, setInternalCashier] = useState<string>("all");
  const isControlled = cashierFilter !== undefined;
  const selectedCashier = isControlled ? (cashierFilter as string) : internalCashier;
  const setSelectedCashier = isControlled ? () => {} : setInternalCashier;

  // Get unique cashiers from sales matching outlet/date filters
  const availableCashiers = useMemo(() => {
    const fromStr = dateRange.from.toISOString().split("T")[0];
    const toStr = dateRange.to.toISOString().split("T")[0];
    const names = new Set<string>();
    sales.forEach((s) => {
      if (selectedOutlets.includes(s.outletId) && s.date >= fromStr && s.date <= toStr && s.cashier) {
        names.add(s.cashier);
      }
    });
    return Array.from(names).sort();
  }, [sales, selectedOutlets, dateRange]);

  const filteredSales = useMemo(() => {
    const fromStr = dateRange.from.toISOString().split("T")[0];
    const toStr = dateRange.to.toISOString().split("T")[0];
    return sales.filter(
      (s) =>
        selectedOutlets.includes(s.outletId) &&
        s.date >= fromStr &&
        s.date <= toStr &&
        (selectedCashier === "all" || s.cashier === selectedCashier)
    );
  }, [sales, selectedOutlets, dateRange, selectedCashier]);

  const totalSales = filteredSales.reduce((sum, s) => sum + s.totalSales, 0);
  const totalOtherIncome = filteredSales.reduce((sum, s) => sum + s.otherIncome, 0);
  const totalRevenue = totalSales + totalOtherIncome;
  const avgDailySales = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

  // --- Sales by outlet ---
  const salesByOutlet = useMemo(() => {
    const grouped: Record<string, { sales: number; otherIncome: number; count: number }> = {};
    filteredSales.forEach((s) => {
      if (!grouped[s.outletId]) grouped[s.outletId] = { sales: 0, otherIncome: 0, count: 0 };
      grouped[s.outletId].sales += s.totalSales;
      grouped[s.outletId].otherIncome += s.otherIncome;
      grouped[s.outletId].count += 1;
    });
    return Object.entries(grouped).map(([outletId, data]) => ({
      outletId,
      outletName: outlets.find((o) => o.id === outletId)?.name || outletId,
      ...data,
      total: data.sales + data.otherIncome,
    }));
  }, [filteredSales]);

  // --- Sales by date ---
  const salesByDate = useMemo(() => {
    const grouped: Record<string, { sales: number; orders: number }> = {};
    filteredSales.forEach((s) => {
      if (!grouped[s.date]) grouped[s.date] = { sales: 0, orders: 0 };
      grouped[s.date].sales += s.totalSales;
      grouped[s.date].orders += 1;
    });
    return Object.entries(grouped)
      .map(([date, d]) => ({
        date,
        displayDate: new Date(date).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
        sales: d.sales,
        orders: d.orders,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredSales]);

  // --- Sales by business day ---
  const salesByBusinessDay = useMemo(() => {
    const dayTotals: Record<number, { sales: number; count: number }> = {};
    filteredSales.forEach((s) => {
      const day = new Date(s.date).getDay();
      if (!dayTotals[day]) dayTotals[day] = { sales: 0, count: 0 };
      dayTotals[day].sales += s.totalSales;
      dayTotals[day].count += 1;
    });
    return DAY_NAMES.map((name, idx) => ({
      day: name.slice(0, 3),
      fullDay: name,
      sales: dayTotals[idx]?.sales || 0,
      avg: dayTotals[idx] ? dayTotals[idx].sales / dayTotals[idx].count : 0,
      transactions: dayTotals[idx]?.count || 0,
    }));
  }, [filteredSales]);

  const topBusinessDay = useMemo(() => {
    const sorted = [...salesByBusinessDay].sort((a, b) => b.sales - a.sales);
    return sorted[0];
  }, [salesByBusinessDay]);

  // --- All items aggregated ---
  const allItems = useMemo(() => {
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
  }, [selectedOutlets]);

  // --- Sales by item category ---
  const salesByCategory = useMemo(() => {
    const catMap: Record<string, { qty: number; revenue: number }> = {};
    allItems.forEach((item) => {
      if (!catMap[item.category]) catMap[item.category] = { qty: 0, revenue: 0 };
      catMap[item.category].qty += item.qty;
      catMap[item.category].revenue += item.revenue;
    });
    const totalItemRevenue = allItems.reduce((s, i) => s + i.revenue, 0);
    return Object.entries(catMap)
      .map(([category, data]) => ({ category, ...data, pct: totalItemRevenue > 0 ? ((data.revenue / totalItemRevenue) * 100).toFixed(1) : "0" }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [allItems]);

  // --- Sales by payment method ---
  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = {};
    selectedOutlets.forEach((outletId) => {
      const splits = outletPaymentSplits[outletId];
      if (!splits) return;
      const outletSalesTotal = filteredSales
        .filter((s) => s.outletId === outletId)
        .reduce((sum, s) => sum + s.totalSales, 0);
      Object.entries(splits).forEach(([method, pct]) => {
        methods[method] = (methods[method] || 0) + outletSalesTotal * pct;
      });
    });
    return Object.entries(methods).map(([name, value]) => ({
      name,
      value: Math.round(value),
      color: PAYMENT_COLORS[name] || "hsl(var(--chart-5))",
    }));
  }, [selectedOutlets, filteredSales]);

  const outletDistribution = salesByOutlet.map((o, idx) => ({
    name: o.outletName,
    value: o.total,
    color: COLORS[idx % COLORS.length],
  }));

  // --- Sales by Cashier ---
  const salesByCashier = useMemo(() => {
    const grouped: Record<string, { sales: number; otherIncome: number; count: number }> = {};
    filteredSales.forEach((s) => {
      const name = s.cashier || "Unknown";
      if (!grouped[name]) grouped[name] = { sales: 0, otherIncome: 0, count: 0 };
      grouped[name].sales += s.totalSales;
      grouped[name].otherIncome += s.otherIncome;
      grouped[name].count += 1;
    });
    return Object.entries(grouped)
      .map(([cashier, data]) => ({
        cashier,
        sales: data.sales,
        otherIncome: data.otherIncome,
        total: data.sales + data.otherIncome,
        transactions: data.count,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredSales]);

  // --- Daily breakdown helpers (proportional spread by daily sales share) ---
  const dailySalesShare = useMemo(() => {
    const grouped: Record<string, number> = {};
    let total = 0;
    filteredSales.forEach((s) => {
      grouped[s.date] = (grouped[s.date] || 0) + s.totalSales;
      total += s.totalSales;
    });
    const dates = Object.keys(grouped).sort();
    return { perDay: grouped, total, dates };
  }, [filteredSales]);

  const buildDailyBreakdown = (totalQty: number, totalRevenue: number) => {
    const { perDay, total, dates } = dailySalesShare;
    if (total === 0 || dates.length === 0) return [];
    return dates.map((date) => {
      const share = perDay[date] / total;
      return {
        date,
        displayDate: new Date(date).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" }),
        qty: Math.round(totalQty * share),
        revenue: Math.round(totalRevenue * share),
      };
    });
  };

  // Dialog state for daily breakdowns
  const [itemDailyOpen, setItemDailyOpen] = useState<{ name: string; qty: number; revenue: number } | null>(null);
  const [categoryDailyOpen, setCategoryDailyOpen] = useState<{ category: string; qty: number; revenue: number } | null>(null);
  const [paymentDailyOpen, setPaymentDailyOpen] = useState(false);

  // Pagination hooks
  const topItemsPag = usePagination(allItems, 5);
  const allItemsPag = usePagination(allItems, 10);
  const categoryPag = usePagination(salesByCategory, 10);
  const salesByDatePag = usePagination(salesByDate, 10);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cashier Filter (hidden when controlled by parent) */}
      {!isControlled && availableCashiers.length > 0 && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedCashier} onValueChange={setSelectedCashier}>
            <SelectTrigger className="w-[150px] sm:w-[180px] h-8 sm:h-9 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cashiers</SelectItem>
              {availableCashiers.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 sm:p-0">
          <CardHeader className="hidden sm:flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <p className="text-xs text-muted-foreground sm:hidden mb-0.5">Total Revenue</p>
            <div className="text-lg sm:text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Sales + Other Income</p>
          </CardContent>
        </Card>
        <Card className="p-3 sm:p-0">
          <CardHeader className="hidden sm:flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <p className="text-xs text-muted-foreground sm:hidden mb-0.5">Total Sales</p>
            <div className="text-lg sm:text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{filteredSales.length} transactions</p>
          </CardContent>
        </Card>
        <Card className="p-3 sm:p-0">
          <CardHeader className="hidden sm:flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Business Day</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <p className="text-xs text-muted-foreground sm:hidden mb-0.5">Top Day</p>
            <div className="text-lg sm:text-2xl font-bold">{topBusinessDay?.fullDay || "—"}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{topBusinessDay ? formatCurrency(topBusinessDay.sales) : "No data"}</p>
          </CardContent>
        </Card>
        <Card className="p-3 sm:p-0">
          <CardHeader className="hidden sm:flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Transaction</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <p className="text-xs text-muted-foreground sm:hidden mb-0.5">Avg / Transaction</p>
            <div className="text-lg sm:text-2xl font-bold">{formatCurrency(avgDailySales)}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Across selected period</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales by Business Day + Payment Methods */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <CalendarDays className="h-4 w-4" /> Sales by Business Day
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salesByBusinessDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} className="text-xs" tick={{ fontSize: 10 }} width={45} />
                <Tooltip
                  formatter={(value: number, name: string) => [formatCurrency(value), name === "sales" ? "Total Sales" : "Avg Sales"]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                />
                <Bar dataKey="sales" name="Total Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {topBusinessDay && topBusinessDay.sales > 0 && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/5 p-2 sm:p-3">
                <Trophy className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs sm:text-sm">
                  <strong>{topBusinessDay.fullDay}</strong> is the top day with{" "}
                  <strong>{formatCurrency(topBusinessDay.sales)}</strong>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base">Sales by Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            {paymentMethodData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" paddingAngle={2}>
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ fontSize: "12px" }} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {paymentMethodData.map((pm) => (
                    <div key={pm.name} className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground">{pm.name}</span>
                      <span className="font-medium">{formatCurrency(pm.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-[180px] items-center justify-center text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales by Date + Sales by Item */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base">Sales by Date</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2">
            <PaginationControls
              page={salesByDatePag.page}
              totalPages={salesByDatePag.totalPages}
              perPage={salesByDatePag.perPage}
              totalItems={salesByDatePag.totalItems}
              pageSizeOptions={salesByDatePag.pageSizeOptions}
              onPageChange={salesByDatePag.setPage}
              onPerPageChange={salesByDatePag.setPerPage}
            />
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-right text-xs">Orders</TableHead>
                    <TableHead className="text-right text-xs">Total Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesByDatePag.paginatedItems.length > 0 ? (
                    salesByDatePag.paginatedItems.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">{row.displayDate}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">{row.orders}</TableCell>
                        <TableCell className="text-right font-semibold text-xs sm:text-sm">{formatCurrency(row.sales)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground text-xs">No sales data</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base">Sales by Item</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2">
            <PaginationControls
              page={allItemsPag.page}
              totalPages={allItemsPag.totalPages}
              perPage={allItemsPag.perPage}
              totalItems={allItemsPag.totalItems}
              pageSizeOptions={allItemsPag.pageSizeOptions}
              onPageChange={allItemsPag.setPage}
              onPerPageChange={allItemsPag.setPerPage}
            />
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Item</TableHead>
                    <TableHead className="text-right text-xs">Qty</TableHead>
                    <TableHead className="text-right text-xs">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allItemsPag.paginatedItems.length > 0 ? (
                    allItemsPag.paginatedItems.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium text-xs sm:text-sm">{item.name}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">{item.qty}</TableCell>
                        <TableCell className="text-right font-semibold text-xs sm:text-sm">{formatCurrency(item.revenue)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground text-xs">No item data</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Items + Sales by Item Category */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Star className="h-4 w-4" /> Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2">
            <PaginationControls
              page={topItemsPag.page}
              totalPages={topItemsPag.totalPages}
              perPage={topItemsPag.perPage}
              totalItems={topItemsPag.totalItems}
              pageSizeOptions={topItemsPag.pageSizeOptions}
              onPageChange={topItemsPag.setPage}
              onPerPageChange={topItemsPag.setPerPage}
            />
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Item</TableHead>
                    <TableHead className="text-right text-xs">Qty</TableHead>
                    <TableHead className="text-right text-xs">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topItemsPag.paginatedItems.length > 0 ? (
                    topItemsPag.paginatedItems.map((item, idx) => (
                      <TableRow key={item.name}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          <div className="flex items-center gap-1.5">
                            {(topItemsPag.page - 1) * topItemsPag.perPage + idx < 3 ? (
                              <Badge variant={(topItemsPag.page - 1) * topItemsPag.perPage + idx === 0 ? "default" : "secondary"} className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center p-0 text-[10px] sm:text-xs shrink-0">
                                {(topItemsPag.page - 1) * topItemsPag.perPage + idx + 1}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-[10px] sm:text-xs w-4 sm:w-5 text-center shrink-0">{(topItemsPag.page - 1) * topItemsPag.perPage + idx + 1}</span>
                            )}
                            <span className="truncate">{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">{item.qty}</TableCell>
                        <TableCell className="text-right font-semibold text-xs sm:text-sm">{formatCurrency(item.revenue)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground text-xs">No item data</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base">Sales by Item Category</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2">
            <PaginationControls
              page={categoryPag.page}
              totalPages={categoryPag.totalPages}
              perPage={categoryPag.perPage}
              totalItems={categoryPag.totalItems}
              pageSizeOptions={categoryPag.pageSizeOptions}
              onPageChange={categoryPag.setPage}
              onPerPageChange={categoryPag.setPerPage}
            />
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-right text-xs">Qty</TableHead>
                    <TableHead className="text-right text-xs">Revenue</TableHead>
                    <TableHead className="text-right text-xs">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryPag.paginatedItems.length > 0 ? (
                    categoryPag.paginatedItems.map((cat) => (
                      <TableRow key={cat.category}>
                        <TableCell className="font-medium text-xs sm:text-sm">{cat.category}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">{cat.qty}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(cat.revenue)}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs sm:text-sm">{cat.pct}%</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground text-xs">No category data</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales by Cashier + Sales by Outlet */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {salesByCashier.length > 0 && (
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <User className="h-4 w-4" /> Sales by Cashier
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Cashier</TableHead>
                      <TableHead className="text-right text-xs">Txns</TableHead>
                      <TableHead className="text-right text-xs">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesByCashier.map((row) => (
                      <TableRow key={row.cashier}>
                        <TableCell className="font-medium text-xs sm:text-sm">{row.cashier}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">{row.transactions}</TableCell>
                        <TableCell className="text-right font-semibold text-xs sm:text-sm">{formatCurrency(row.total)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell className="text-xs sm:text-sm">Total</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">{filteredSales.length}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(totalRevenue)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base">Sales by Outlet</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {outletDistribution.length > 0 ? (
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Outlet</TableHead>
                      <TableHead className="text-right text-xs">Sales</TableHead>
                      <TableHead className="text-right text-xs">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesByOutlet.map((row) => (
                      <TableRow key={row.outletId}>
                        <TableCell className="font-medium text-xs sm:text-sm">{row.outletName}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(row.sales)}</TableCell>
                        <TableCell className="text-right font-semibold text-xs sm:text-sm">{formatCurrency(row.total)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell className="text-xs sm:text-sm">Total</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(totalSales)}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(totalRevenue)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex h-[100px] items-center justify-center text-muted-foreground text-sm">No outlet data</div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
