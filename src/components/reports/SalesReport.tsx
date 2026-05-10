import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { TrendingUp, ShoppingCart, Wallet, Trophy, CalendarDays, User, CalendarRange, Clock, CreditCard } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "@/components/inventory/PaginationControls";
import { outletPaymentSplits, PAYMENT_COLORS, formatCurrency, filterSales, dailySalesShareFor } from "./salesData";

interface SalesReportProps {
  sales: SalesRecord[];
  selectedOutlets: string[];
  dateRange: { from: Date; to: Date };
  /** When provided, controls cashier filter externally and hides the internal selector. */
  cashierFilter?: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Sales Summary — high-level overview only.
 * Item-level and category-level breakdowns live in their own tabs (SalesByItem, SalesByCategory).
 */
export default function SalesReport({ sales, selectedOutlets, dateRange, cashierFilter }: SalesReportProps) {
  const [internalCashier, setInternalCashier] = useState<string>("all");
  const isControlled = cashierFilter !== undefined;
  const selectedCashier = isControlled ? (cashierFilter as string) : internalCashier;
  const setSelectedCashier = isControlled ? () => {} : setInternalCashier;

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

  const filteredSales = useMemo(
    () => filterSales(sales, selectedOutlets, dateRange, selectedCashier),
    [sales, selectedOutlets, dateRange, selectedCashier]
  );

  const totalSales = filteredSales.reduce((sum, s) => sum + s.totalSales, 0);
  const totalOtherIncome = filteredSales.reduce((sum, s) => sum + s.otherIncome, 0);
  const totalRevenue = totalSales + totalOtherIncome;
  const avgPerTxn = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

  // Sales by outlet
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

  // Sales by date — include every day in the selected range, even when there are zero orders
  const salesByDate = useMemo(() => {
    const grouped: Record<string, { sales: number; orders: number }> = {};
    filteredSales.forEach((s) => {
      if (!grouped[s.date]) grouped[s.date] = { sales: 0, orders: 0 };
      grouped[s.date].sales += s.totalSales;
      grouped[s.date].orders += 1;
    });

    const rows: { date: string; displayDate: string; sales: number; orders: number }[] = [];
    const cursor = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const rangeEnd = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());
    // Don't list future dates — they're guaranteed to be empty for a typical business view.
    const end = rangeEnd > todayMidnight ? todayMidnight : rangeEnd;

    while (cursor <= end) {
      const year = cursor.getFullYear();
      const month = String(cursor.getMonth() + 1).padStart(2, "0");
      const day = String(cursor.getDate()).padStart(2, "0");
      const date = `${year}-${month}-${day}`;
      const dayData = grouped[date] || { sales: 0, orders: 0 };

      rows.push({
        date,
        displayDate: cursor.toLocaleDateString("en-NG", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        sales: dayData.sales,
        orders: dayData.orders,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return rows.sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredSales, dateRange]);

  // Sales by business day
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

  const topBusinessDay = useMemo(
    () => [...salesByBusinessDay].sort((a, b) => b.sales - a.sales)[0],
    [salesByBusinessDay]
  );

  // Payment methods
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

  // Cashier leaderboard
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
        total: data.sales + data.otherIncome,
        transactions: data.count,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredSales]);

  const dailyShare = useMemo(() => dailySalesShareFor(filteredSales), [filteredSales]);
  const [paymentDailyOpen, setPaymentDailyOpen] = useState(false);

  const salesByDatePag = usePagination(salesByDate, 20);
  const cashierPag = usePagination(salesByCashier, 10);
  const paymentDailyPag = usePagination(dailyShare.dates, 10);
  const [trendMetric, setTrendMetric] = useState<"sales" | "orders">("sales");

  // Chronological trend (oldest -> newest) for the line chart
  const salesTrend = useMemo(
    () =>
      [...salesByDate]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((d) => ({
          ...d,
          shortDate: new Date(d.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
        })),
    [salesByDate]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cashier Filter (hidden when controlled) */}
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
            <div className="text-lg sm:text-2xl font-bold">{formatCurrency(avgPerTxn)}</div>
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
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm sm:text-base">Sales by Payment Method</CardTitle>
            {paymentMethodData.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setPaymentDailyOpen(true)}>
                <CalendarRange className="h-3.5 w-3.5" /> Daily
              </Button>
            )}
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

      {/* Sales Trend */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp className="h-4 w-4" /> Sales Trend
            </CardTitle>
            <div className="inline-flex rounded-md border border-border bg-muted/40 p-0.5">
              <button
                type="button"
                onClick={() => setTrendMetric("sales")}
                className={`px-3 py-1 text-xs rounded-sm transition-colors ${
                  trendMetric === "sales"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sales
              </button>
              <button
                type="button"
                onClick={() => setTrendMetric("orders")}
                className={`px-3 py-1 text-xs rounded-sm transition-colors ${
                  trendMetric === "orders"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Orders
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {salesTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="shortDate" className="text-xs" tick={{ fontSize: 11 }} minTickGap={16} />
                <YAxis
                  tickFormatter={(v) => (trendMetric === "sales" ? `₦${(v / 1000).toFixed(0)}k` : `${v}`)}
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                  width={50}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value: number) => [
                    trendMetric === "sales" ? formatCurrency(value) : value,
                    trendMetric === "sales" ? "Sales" : "Orders",
                  ]}
                  labelFormatter={(_, payload) => (payload?.[0]?.payload as { displayDate?: string } | undefined)?.displayDate || ""}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey={trendMetric === "sales" ? "sales" : "orders"}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#salesTrendFill)"
                  dot={salesTrend.length <= 31 ? { r: 3, fill: "hsl(var(--primary))" } : false}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-muted-foreground text-sm">No sales data for this period</div>
          )}
        </CardContent>
      </Card>

      {/* Sales by Date */}
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

      {/* Sales by Cashier + Sales by Outlet */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {salesByCashier.length > 0 && (
          <Card>
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <User className="h-4 w-4" /> Sales by Cashier
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 space-y-2">
              <PaginationControls
                page={cashierPag.page}
                totalPages={cashierPag.totalPages}
                perPage={cashierPag.perPage}
                totalItems={cashierPag.totalItems}
                pageSizeOptions={cashierPag.pageSizeOptions}
                onPageChange={cashierPag.setPage}
                onPerPageChange={cashierPag.setPerPage}
              />
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
                    {cashierPag.paginatedItems.map((row) => (
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
            {salesByOutlet.length > 0 ? (
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

      {/* Payment Methods daily dialog */}
      <Dialog open={paymentDailyOpen} onOpenChange={setPaymentDailyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">Payment Methods — Daily Breakdown</DialogTitle>
            <DialogDescription className="text-xs">
              Estimated revenue per payment method, per day
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <PaginationControls
              page={paymentDailyPag.page}
              totalPages={paymentDailyPag.totalPages}
              perPage={paymentDailyPag.perPage}
              totalItems={paymentDailyPag.totalItems}
              pageSizeOptions={paymentDailyPag.pageSizeOptions}
              onPageChange={paymentDailyPag.setPage}
              onPerPageChange={paymentDailyPag.setPerPage}
            />
            <div className="max-h-[55vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    {paymentMethodData.map((pm) => (
                      <TableHead key={pm.name} className="text-right text-xs whitespace-nowrap">{pm.name}</TableHead>
                    ))}
                    <TableHead className="text-right text-xs">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentDailyPag.paginatedItems.map((date) => {
                    const dayTotal = dailyShare.perDay[date];
                    const share = dailyShare.total > 0 ? dayTotal / dailyShare.total : 0;
                    return (
                      <TableRow key={date}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(date).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}
                        </TableCell>
                        {paymentMethodData.map((pm) => (
                          <TableCell key={pm.name} className="text-right text-xs">{formatCurrency(Math.round(pm.value * share))}</TableCell>
                        ))}
                        <TableCell className="text-right text-xs font-semibold">{formatCurrency(dayTotal)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell className="text-xs">Total (all dates)</TableCell>
                    {paymentMethodData.map((pm) => (
                      <TableCell key={pm.name} className="text-right text-xs">{formatCurrency(pm.value)}</TableCell>
                    ))}
                    <TableCell className="text-right text-xs">{formatCurrency(dailyShare.total)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
