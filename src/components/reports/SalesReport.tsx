import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  ShoppingCart,
  Wallet,
  Trophy,
  CalendarDays,
  CalendarRange,
  Clock,
  CreditCard,
} from "lucide-react";
import {
  useGetSalesSummaryReport,
  useGetSalesSummaryByCashier,
  useGetSalesSummaryByDate,
  useGetSalesSummaryPaymentMethodsDaily,
} from "@/services/api/reports-api";
import { ResuablePagination } from "@/components/ui/reusable-pagination";
import { PAYMENT_COLORS, formatCurrency } from "./salesData";

interface SalesReportProps {
  sales?: any[]; // Kept for prop signature compatibility
  selectedOutlets: string[];
  dateRange: { from: Date; to: Date };
  /** When provided, controls cashier filter externally and hides the internal selector. */
  cashierFilter?: string;
  outlets?: any[];
}

export default function SalesReport({
  selectedOutlets,
  dateRange,
  cashierFilter,
}: SalesReportProps) {
  const [trendMetric, setTrendMetric] = useState<"sales" | "orders">("sales");
  const [paymentDailyOpen, setPaymentDailyOpen] = useState(false);

  // Pagination states
  const [datePage, setDatePage] = useState(1);
  const [datePerPage, setDatePerPage] = useState(10);

  const [cashierPage, setCashierPage] = useState(1);
  const [cashierPerPage, setCashierPerPage] = useState(10);

  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPerPage, setPaymentPerPage] = useState(10);

  const formattedFrom = dateRange.from.toISOString().split("T")[0];
  const formattedTo = dateRange.to.toISOString().split("T")[0];
  const outletIdParam =
    selectedOutlets.length === 1 && selectedOutlets[0] !== "all"
      ? selectedOutlets[0]
      : undefined;
  const cashierIdParam = cashierFilter === "all" ? undefined : cashierFilter;

  // 1. Overall sales summary data
  const { data: summaryReport, isLoading: isSummaryLoading } =
    useGetSalesSummaryReport({
      dateFrom: formattedFrom,
      dateTo: formattedTo,
      outletId: outletIdParam,
      cashierId: cashierIdParam,
    });

  // 2. Sales summary by date paginated data
  const { data: salesByDateData, isLoading: isSalesByDateLoading } =
    useGetSalesSummaryByDate({
      dateFrom: formattedFrom,
      dateTo: formattedTo,
      outletId: outletIdParam,
      cashierId: cashierIdParam,
      page: datePage,
      perPage: datePerPage,
    });

  // 3. Sales summary by cashier paginated data
  const { data: salesByCashierData, isLoading: isSalesByCashierLoading } =
    useGetSalesSummaryByCashier({
      dateFrom: formattedFrom,
      dateTo: formattedTo,
      outletId: outletIdParam,
      cashierId: cashierIdParam,
      page: cashierPage,
      perPage: cashierPerPage,
    });

  // 4. Daily payment method breakdown paginated data
  const {
    data: paymentMethodsDailyData,
    isLoading: isPaymentMethodsDailyLoading,
  } = useGetSalesSummaryPaymentMethodsDaily({
    dateFrom: formattedFrom,
    dateTo: formattedTo,
    outletId: outletIdParam,
    cashierId: cashierIdParam,
    page: paymentPage,
    perPage: paymentPerPage,
  });

  const summary = summaryReport?.data;
  const overview = summary?.overview || {
    totalRevenue: 0,
    totalSales: 0,
    totalOtherIncome: 0,
    transactionCount: 0,
    avgPerTransaction: 0,
    topBusinessDay: { day: "", fullDay: "", sales: 0, transactions: 0 },
  };

  const salesByBusinessDay = summary?.salesByBusinessDay || [];
  const paymentMethodData = useMemo(() => {
    const rawMethods = summary?.salesByPaymentMethod || [];
    return rawMethods.map((pm) => ({
      ...pm,
      color: PAYMENT_COLORS[pm.name] || "hsl(var(--chart-5))",
    }));
  }, [summary?.salesByPaymentMethod]);

  const salesByHour = summary?.salesByHour || [];
  const peakHour = useMemo(() => {
    if (salesByHour.length === 0) return null;
    return [...salesByHour].sort((a, b) => b.sales - a.sales)[0];
  }, [salesByHour]);

  const salesTrend = summary?.salesTrend || [];
  const salesByOutlet = summary?.salesByOutlet || [];

  const topPaymentMethod = paymentMethodData[0];
  const totalPaymentValue = paymentMethodData.reduce((s, p) => s + p.value, 0);

  if (isSummaryLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-xs text-muted-foreground">
          Loading sales summary...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-3 sm:p-0">
          <CardHeader className="hidden sm:flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <p className="text-xs text-muted-foreground sm:hidden mb-0.5">
              Total Revenue
            </p>
            <div className="text-lg sm:text-2xl font-bold">
              {formatCurrency(overview.totalRevenue)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Sales + Other Income
            </p>
          </CardContent>
        </Card>
        <Card className="p-3 sm:p-0">
          <CardHeader className="hidden sm:flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <p className="text-xs text-muted-foreground sm:hidden mb-0.5">
              Total Sales
            </p>
            <div className="text-lg sm:text-2xl font-bold">
              {formatCurrency(overview.totalSales)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {overview.transactionCount} transactions
            </p>
          </CardContent>
        </Card>
        <Card className="p-3 sm:p-0">
          <CardHeader className="hidden sm:flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Business Day
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <p className="text-xs text-muted-foreground sm:hidden mb-0.5">
              Top Day
            </p>
            <div className="text-lg sm:text-2xl font-bold">
              {overview.topBusinessDay?.fullDay || "—"}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {overview.topBusinessDay
                ? formatCurrency(overview.topBusinessDay.sales)
                : "No data"}
            </p>
          </CardContent>
        </Card>
        <Card className="p-3 sm:p-0">
          <CardHeader className="hidden sm:flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg per Transaction
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            <p className="text-xs text-muted-foreground sm:hidden mb-0.5">
              Avg / Transaction
            </p>
            <div className="text-lg sm:text-2xl font-bold">
              {formatCurrency(overview.avgPerTransaction)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Across selected period
            </p>
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
                <XAxis
                  dataKey="day"
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                  className="text-xs"
                  tick={{ fontSize: 10 }}
                  width={45}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === "sales" ? "Total Sales" : "Avg Sales",
                  ]}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="sales"
                  name="Total Sales"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            {overview.topBusinessDay && overview.topBusinessDay.sales > 0 && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/5 p-2 sm:p-3">
                <Trophy className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="text-xs sm:text-sm">
                  <strong>{overview.topBusinessDay.fullDay}</strong> is the top
                  day with{" "}
                  <strong>
                    {formatCurrency(overview.topBusinessDay.sales)}
                  </strong>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm sm:text-base">
              Sales by Payment Method
            </CardTitle>
            {paymentMethodData.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => setPaymentDailyOpen(true)}
              >
                <CalendarRange className="h-3.5 w-3.5" /> Daily
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            {paymentMethodData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={paymentMethodData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      className="text-xs"
                      interval={0}
                    />
                    <YAxis
                      tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 10 }}
                      width={45}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        formatCurrency(value),
                        "Sales",
                      ]}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                    />
                    <Bar dataKey="value" name="Sales" radius={[4, 4, 0, 0]}>
                      {paymentMethodData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            entry.name === topPaymentMethod?.name
                              ? "hsl(var(--primary))"
                              : "hsl(var(--muted-foreground) / 0.35)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {topPaymentMethod && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/5 p-2 sm:p-3">
                    <CreditCard className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-xs sm:text-sm">
                      <strong>{topPaymentMethod.name}</strong> leads with{" "}
                      <strong>{formatCurrency(topPaymentMethod.value)}</strong>
                      {totalPaymentValue > 0 && (
                        <span className="text-muted-foreground">
                          {" "}
                          (
                          {(
                            (topPaymentMethod.value / totalPaymentValue) *
                            100
                          ).toFixed(1)}
                          %)
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-[180px] items-center justify-center text-muted-foreground text-sm">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Net Sales by Time of Day */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Clock className="h-4 w-4" /> Net Sales by Time of Day
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {salesByHour.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart
                  data={salesByHour}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    className="text-xs"
                    interval={1}
                  />
                  <YAxis
                    tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 10 }}
                    width={45}
                  />
                  <Tooltip
                    formatter={(value: number, _name, item) => {
                      const p = item?.payload as
                        | { orders?: number }
                        | undefined;
                      return [
                        `${formatCurrency(value)} · ${p?.orders ?? 0} orders`,
                        "Net Sales",
                      ];
                    }}
                    labelFormatter={(_, payload) =>
                      (
                        payload?.[0]?.payload as
                          | { fullLabel?: string }
                          | undefined
                      )?.fullLabel || ""
                    }
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    cursor={{ stroke: "hsl(var(--muted-foreground) / 0.3)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    name="Net Sales"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={(props: any) => {
                      const { cx, cy, payload, index } = props;
                      const isPeak = payload?.hour === peakHour?.hour;
                      return (
                        <circle
                          key={index}
                          cx={cx}
                          cy={cy}
                          r={isPeak ? 5 : 3}
                          fill={
                            isPeak ? "hsl(var(--primary))" : "hsl(var(--card))"
                          }
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
              {peakHour && peakHour.sales > 0 && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/5 p-2 sm:p-3">
                  <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-xs sm:text-sm">
                    Peak hour <strong>{peakHour.fullLabel}</strong> with{" "}
                    <strong>{formatCurrency(peakHour.sales)}</strong> across{" "}
                    {peakHour.orders} orders
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground text-sm">
              No sales data for this period
            </div>
          )}
        </CardContent>
      </Card>

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
              <AreaChart
                data={salesTrend}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="salesTrendFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(var(--primary))"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="shortDate"
                  className="text-xs"
                  tick={{ fontSize: 11 }}
                  minTickGap={16}
                />
                <YAxis
                  tickFormatter={(v) =>
                    trendMetric === "sales"
                      ? `₦${(v / 1000).toFixed(0)}k`
                      : `${v}`
                  }
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
                  labelFormatter={(_, payload) =>
                    (
                      payload?.[0]?.payload as
                        | { displayDate?: string }
                        | undefined
                    )?.displayDate || ""
                  }
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={trendMetric === "sales" ? "sales" : "orders"}
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#salesTrendFill)"
                  dot={
                    salesTrend.length <= 31
                      ? { r: 3, fill: "hsl(var(--primary))" }
                      : false
                  }
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[220px] items-center justify-center text-muted-foreground text-sm">
              No sales data for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales by Date */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base">Sales by Date</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-right text-xs">Orders</TableHead>
                  <TableHead className="text-right text-xs">
                    Total Sales
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSalesByDateLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : salesByDateData?.data.items &&
                  salesByDateData.data.items.length > 0 ? (
                  salesByDateData.data.items.map((row) => (
                    <TableRow key={row.date}>
                      <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">
                        {row.displayDate}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">
                        {row.orders}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-xs sm:text-sm">
                        {formatCurrency(row.sales)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground text-xs"
                    >
                      No sales data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <ResuablePagination
            currentPage={datePage}
            totalPages={salesByDateData?.data.pagination.lastPage ?? 1}
            totalItems={salesByDateData?.data.pagination.total ?? 0}
            rowsPerPage={datePerPage}
            onPageChange={setDatePage}
            onRowsPerPageChange={setDatePerPage}
            isLoading={isSalesByDateLoading}
          />
        </CardContent>
      </Card>

      {/* Sales by Cashier + Sales by Outlet */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <CalendarDays className="h-4 w-4" /> Sales by Cashier
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 space-y-2">
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
                  {isSalesByCashierLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : salesByCashierData?.data.items &&
                    salesByCashierData.data.items.length > 0 ? (
                    <>
                      {salesByCashierData.data.items.map((row) => (
                        <TableRow key={row.cashier}>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            {row.cashier}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">
                            {row.transactions}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-xs sm:text-sm">
                            {formatCurrency(row.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell className="text-xs sm:text-sm">
                          Total
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">
                          {salesByCashierData.data.items.reduce(
                            (s, r) => s + r.transactions,
                            0,
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">
                          {formatCurrency(
                            salesByCashierData.data.items.reduce(
                              (s, r) => s + r.total,
                              0,
                            ),
                          )}
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground text-xs"
                      >
                        No cashier data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <ResuablePagination
              currentPage={cashierPage}
              totalPages={salesByCashierData?.data.pagination.lastPage ?? 1}
              totalItems={salesByCashierData?.data.pagination.total ?? 0}
              rowsPerPage={cashierPerPage}
              onPageChange={setCashierPage}
              onRowsPerPageChange={setCashierPerPage}
              isLoading={isSalesByCashierLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base">
              Sales by Outlet
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {salesByOutlet.length > 0 ? (
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Outlet</TableHead>
                      <TableHead className="text-right text-xs">
                        Sales
                      </TableHead>
                      <TableHead className="text-right text-xs">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesByOutlet.map((row) => (
                      <TableRow key={row.outletId}>
                        <TableCell className="font-medium text-xs sm:text-sm">
                          {row.outletName}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">
                          {formatCurrency(row.sales)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-xs sm:text-sm">
                          {formatCurrency(row.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell className="text-xs sm:text-sm">
                        Total
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">
                        {formatCurrency(
                          salesByOutlet.reduce((s, r) => s + r.sales, 0),
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">
                        {formatCurrency(
                          salesByOutlet.reduce((s, r) => s + r.total, 0),
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex h-[100px] items-center justify-center text-muted-foreground text-sm">
                No outlet data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods daily dialog */}
      <Dialog open={paymentDailyOpen} onOpenChange={setPaymentDailyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">
              Payment Methods — Daily Breakdown
            </DialogTitle>
            <DialogDescription className="text-xs">
              Estimated revenue per payment method, per day
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="max-h-[55vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    {paymentMethodData.map((pm) => (
                      <TableHead
                        key={pm.name}
                        className="text-right text-xs whitespace-nowrap"
                      >
                        {pm.name}
                      </TableHead>
                    ))}
                    <TableHead className="text-right text-xs">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPaymentMethodsDailyLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={paymentMethodData.length + 2}
                        className="text-center py-6"
                      >
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : paymentMethodsDailyData?.data.rows &&
                    paymentMethodsDailyData.data.rows.length > 0 ? (
                    <>
                      {paymentMethodsDailyData.data.rows.map((row) => (
                        <TableRow key={row.date}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {row.displayDate}
                          </TableCell>
                          {paymentMethodData.map((pm) => {
                            const methodVal =
                              row.methods.find((m) => m.name === pm.name)
                                ?.value ?? 0;
                            return (
                              <TableCell
                                key={pm.name}
                                className="text-right text-xs"
                              >
                                {formatCurrency(methodVal)}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-right text-xs font-semibold">
                            {formatCurrency(row.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell className="text-xs">
                          Total (all dates)
                        </TableCell>
                        {paymentMethodData.map((pm) => (
                          <TableCell
                            key={pm.name}
                            className="text-right text-xs"
                          >
                            {formatCurrency(
                              paymentMethodsDailyData.data.totalsByMethod?.find(
                                (m) => m.name === pm.name,
                              )?.value ?? 0,
                            )}
                          </TableCell>
                        ))}
                        <TableCell className="text-right text-xs">
                          {formatCurrency(
                            paymentMethodsDailyData.data.grandTotal,
                          )}
                        </TableCell>
                      </TableRow>
                    </>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={paymentMethodData.length + 2}
                        className="text-center text-muted-foreground text-xs"
                      >
                        No daily payment data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <ResuablePagination
              currentPage={paymentPage}
              totalPages={
                paymentMethodsDailyData?.data.pagination.lastPage ?? 1
              }
              totalItems={paymentMethodsDailyData?.data.pagination.total ?? 0}
              rowsPerPage={paymentPerPage}
              onPageChange={setPaymentPage}
              onRowsPerPageChange={setPaymentPerPage}
              isLoading={isPaymentMethodsDailyLoading}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
