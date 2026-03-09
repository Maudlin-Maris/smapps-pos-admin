import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SalesRecord } from "@/hooks/use-financial-data";
import { outlets } from "@/data/outlets";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, ShoppingCart, Wallet } from "lucide-react";

interface SalesReportProps {
  sales: SalesRecord[];
  selectedOutlets: string[];
  dateRange: { from: Date; to: Date };
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(value);

export default function SalesReport({ sales, selectedOutlets, dateRange }: SalesReportProps) {
  const filteredSales = useMemo(() => {
    const fromStr = dateRange.from.toISOString().split("T")[0];
    const toStr = dateRange.to.toISOString().split("T")[0];
    return sales.filter(
      (s) => selectedOutlets.includes(s.outletId) && s.date >= fromStr && s.date <= toStr
    );
  }, [sales, selectedOutlets, dateRange]);

  // Summary metrics
  const totalSales = filteredSales.reduce((sum, s) => sum + s.totalSales, 0);
  const totalOtherIncome = filteredSales.reduce((sum, s) => sum + s.otherIncome, 0);
  const totalRevenue = totalSales + totalOtherIncome;
  const avgDailySales = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

  // Sales by outlet
  const salesByOutlet = useMemo(() => {
    const grouped: Record<string, { sales: number; otherIncome: number; count: number }> = {};
    filteredSales.forEach((s) => {
      if (!grouped[s.outletId]) {
        grouped[s.outletId] = { sales: 0, otherIncome: 0, count: 0 };
      }
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

  // Daily sales trend
  const dailySalesTrend = useMemo(() => {
    const grouped: Record<string, { sales: number; otherIncome: number }> = {};
    filteredSales.forEach((s) => {
      if (!grouped[s.date]) {
        grouped[s.date] = { sales: 0, otherIncome: 0 };
      }
      grouped[s.date].sales += s.totalSales;
      grouped[s.date].otherIncome += s.otherIncome;
    });
    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        displayDate: new Date(date).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
        ...data,
        total: data.sales + data.otherIncome,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales]);

  // Pie chart data for outlet distribution
  const outletDistribution = salesByOutlet.map((o, idx) => ({
    name: o.outletName,
    value: o.total,
    color: COLORS[idx % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Sales + Other Income</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">{filteredSales.length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Other Income</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOtherIncome)}</div>
            <p className="text-xs text-muted-foreground">Tips, fees, etc.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgDailySales)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {dailySalesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailySalesTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="displayDate" className="text-xs" />
                  <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="sales" name="Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="otherIncome" name="Other Income" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No sales data for selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales by Outlet Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Outlet</CardTitle>
          </CardHeader>
          <CardContent>
            {outletDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={outletDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {outletDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No outlet data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Outlet</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Outlet</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Other Income</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesByOutlet.length > 0 ? (
                <>
                  {salesByOutlet.map((row) => (
                    <TableRow key={row.outletId}>
                      <TableCell className="font-medium">{row.outletName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.sales)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.otherIncome)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(row.total)}</TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalSales)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalOtherIncome)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalRevenue)}</TableCell>
                    <TableCell className="text-right">{filteredSales.length}</TableCell>
                  </TableRow>
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No sales data for selected period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Daily Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Sales Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Other Income</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailySalesTrend.length > 0 ? (
                dailySalesTrend.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="font-medium">
                      {new Date(row.date).toLocaleDateString("en-NG", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(row.sales)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.otherIncome)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(row.total)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No daily data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
