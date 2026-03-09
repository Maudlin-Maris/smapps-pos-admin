import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SalesRecord } from "@/hooks/use-financial-data";
import { outlets } from "@/data/outlets";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { TrendingUp, ShoppingCart, Wallet, Trophy, CalendarDays, Star } from "lucide-react";

interface SalesReportProps {
  sales: SalesRecord[];
  selectedOutlets: string[];
  dateRange: { from: Date; to: Date };
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

// Payment method distribution per outlet (percentages)
const outletPaymentSplits: Record<string, Record<string, number>> = {
  "outlet-1": { Cash: 0.45, Card: 0.30, "Mobile Money": 0.18, "Bank Transfer": 0.07 },
  "outlet-2": { Cash: 0.35, Card: 0.38, "Mobile Money": 0.22, "Bank Transfer": 0.05 },
  "outlet-3": { Cash: 0.30, Card: 0.42, "Mobile Money": 0.22, "Bank Transfer": 0.06 },
  "outlet-4": { Cash: 0.25, Card: 0.48, "Mobile Money": 0.20, "Bank Transfer": 0.07 },
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SalesReport({ sales, selectedOutlets, dateRange }: SalesReportProps) {
  const filteredSales = useMemo(() => {
    const fromStr = dateRange.from.toISOString().split("T")[0];
    const toStr = dateRange.to.toISOString().split("T")[0];
    return sales.filter(
      (s) => selectedOutlets.includes(s.outletId) && s.date >= fromStr && s.date <= toStr
    );
  }, [sales, selectedOutlets, dateRange]);

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

  // --- Daily sales trend ---
  const dailySalesTrend = useMemo(() => {
    const grouped: Record<string, { sales: number; otherIncome: number }> = {};
    filteredSales.forEach((s) => {
      if (!grouped[s.date]) grouped[s.date] = { sales: 0, otherIncome: 0 };
      grouped[s.date].sales += s.totalSales;
      grouped[s.date].otherIncome += s.otherIncome;
    });
    return Object.entries(grouped)
      .map(([date, d]) => ({
        date,
        displayDate: new Date(date).toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
        ...d,
        total: d.sales + d.otherIncome,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales]);

  // --- Sales by business day (day of week) ---
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

  // --- Top selling items (aggregated from all selected outlets) ---
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

  const topSellingItems = allItems.slice(0, 10);

  // --- Sales by item category ---
  const salesByCategory = useMemo(() => {
    const catMap: Record<string, { qty: number; revenue: number }> = {};
    allItems.forEach((item) => {
      if (!catMap[item.category]) catMap[item.category] = { qty: 0, revenue: 0 };
      catMap[item.category].qty += item.qty;
      catMap[item.category].revenue += item.revenue;
    });
    return Object.entries(catMap)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [allItems]);

  // --- Sales by payment method ---
  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = {};
    selectedOutlets.forEach((outletId) => {
      const splits = outletPaymentSplits[outletId];
      if (!splits) return;
      const outletSales = filteredSales
        .filter((s) => s.outletId === outletId)
        .reduce((sum, s) => sum + s.totalSales, 0);
      Object.entries(splits).forEach(([method, pct]) => {
        methods[method] = (methods[method] || 0) + outletSales * pct;
      });
    });
    return Object.entries(methods).map(([name, value]) => ({
      name,
      value: Math.round(value),
      color: PAYMENT_COLORS[name] || "hsl(var(--chart-5))",
    }));
  }, [selectedOutlets, filteredSales]);

  // Outlet pie distribution
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
            <CardTitle className="text-sm font-medium">Top Business Day</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topBusinessDay?.fullDay || "—"}</div>
            <p className="text-xs text-muted-foreground">{topBusinessDay ? formatCurrency(topBusinessDay.sales) : "No data"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Transaction</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgDailySales)}</div>
            <p className="text-xs text-muted-foreground">Across selected period</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Sales Trend + Payment Methods */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {dailySalesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailySalesTrend}>
                  <defs>
                    <linearGradient id="salesReportGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="displayDate" className="text-xs" />
                  <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  />
                  <Area type="monotone" dataKey="sales" name="Sales" stroke="hsl(var(--primary))" fill="url(#salesReportGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="otherIncome" name="Other Income" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">No sales data for selected period</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethodData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={2}>
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {paymentMethodData.map((pm) => (
                    <div key={pm.name} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{pm.name}</span>
                      <span className="font-medium">{formatCurrency(pm.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales by Business Day + Top Selling Items */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales by Business Day */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Sales by Business Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesByBusinessDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <Tooltip
                  formatter={(value: number, name: string) => [formatCurrency(value), name === "sales" ? "Total Sales" : "Avg Sales"]}
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                />
                <Bar dataKey="sales" name="Total Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {topBusinessDay && topBusinessDay.sales > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/5 p-3">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  <strong>{topBusinessDay.fullDay}</strong> is the top business day with{" "}
                  <strong>{formatCurrency(topBusinessDay.sales)}</strong> in sales
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4" /> Top Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellingItems.length > 0 ? (
                  topSellingItems.map((item, idx) => (
                    <TableRow key={item.name}>
                      <TableCell>
                        {idx < 3 ? (
                          <Badge variant={idx === 0 ? "default" : "secondary"} className="w-6 h-6 rounded-full flex items-center justify-center p-0 text-xs">
                            {idx + 1}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs ml-1.5">{idx + 1}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{item.category}</Badge></TableCell>
                      <TableCell className="text-right">{item.qty}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(item.revenue)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No item data</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Sales by Item Category + Outlet Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales by Item Category */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Item Category</CardTitle>
          </CardHeader>
          <CardContent>
            {salesByCategory.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={Math.max(200, salesByCategory.length * 40)}>
                  <BarChart data={salesByCategory} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <YAxis type="category" dataKey="category" width={110} className="text-xs" />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Items Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesByCategory.map((cat) => {
                      const totalItemRevenue = allItems.reduce((s, i) => s + i.revenue, 0);
                      const pct = totalItemRevenue > 0 ? ((cat.revenue / totalItemRevenue) * 100).toFixed(1) : "0";
                      return (
                        <TableRow key={cat.category}>
                          <TableCell className="font-medium">{cat.category}</TableCell>
                          <TableCell className="text-right">{cat.qty}</TableCell>
                          <TableCell className="text-right">{formatCurrency(cat.revenue)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{pct}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">No category data</div>
            )}
          </CardContent>
        </Card>

        {/* Sales by Outlet */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Outlet</CardTitle>
          </CardHeader>
          <CardContent>
            {outletDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={outletDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name.split(" ")[0]} (${(percent * 100).toFixed(0)}%)`}>
                      {outletDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Outlet</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Other Income</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesByOutlet.map((row) => (
                      <TableRow key={row.outletId}>
                        <TableCell className="font-medium">{row.outletName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.sales)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.otherIncome)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(row.total)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalSales)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalOtherIncome)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalRevenue)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">No outlet data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Full Sales by Item Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales by Item</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allItems.length > 0 ? (
                allItems.map((item) => (
                  <TableRow key={item.name}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{item.category}</Badge></TableCell>
                    <TableCell className="text-right">{item.qty}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(item.revenue)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(item.qty > 0 ? item.revenue / item.qty : 0)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">No item data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
