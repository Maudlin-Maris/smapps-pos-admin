import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { outlets } from "@/data/outlets";
import {
  TrendingUp, TrendingDown, Users, ShoppingCart, Package,
  BarChart3, Target, Zap, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from "recharts";

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

// ── Sample data ──
const monthlySales = [
  { month: "Jan", sales: 1850000, orders: 420, customers: 180 },
  { month: "Feb", sales: 2100000, orders: 480, customers: 195 },
  { month: "Mar", sales: 1920000, orders: 440, customers: 170 },
  { month: "Apr", sales: 2450000, orders: 560, customers: 220 },
  { month: "May", sales: 2680000, orders: 610, customers: 245 },
  { month: "Jun", sales: 2890000, orders: 650, customers: 260 },
];

const topProducts = [
  { name: "Cappuccino", units: 1420, revenue: 2840000, growth: 12.5 },
  { name: "Club Sandwich", units: 890, revenue: 1780000, growth: 8.2 },
  { name: "Espresso", units: 1100, revenue: 1100000, growth: -3.1 },
  { name: "Croissant", units: 760, revenue: 760000, growth: 15.8 },
  { name: "Iced Latte", units: 650, revenue: 975000, growth: 22.3 },
];

const staffPerformance = [
  { name: "Adebayo J.", sales: 850000, transactions: 145, avgTicket: 5862, rating: 4.8 },
  { name: "Chioma O.", sales: 720000, transactions: 128, avgTicket: 5625, rating: 4.6 },
  { name: "Musa A.", sales: 680000, transactions: 132, avgTicket: 5152, rating: 4.5 },
  { name: "Ngozi E.", sales: 540000, transactions: 98, avgTicket: 5510, rating: 4.3 },
];

const categoryBreakdown = [
  { name: "Beverages", value: 4200000, color: "hsl(var(--chart-1))" },
  { name: "Food", value: 2800000, color: "hsl(var(--chart-2))" },
  { name: "Desserts", value: 1200000, color: "hsl(var(--chart-3))" },
  { name: "Other", value: 600000, color: "hsl(var(--chart-4))" },
];

const hourlyTraffic = Array.from({ length: 14 }, (_, i) => ({
  hour: `${i + 7}:00`,
  customers: Math.floor(Math.random() * 40 + (i >= 4 && i <= 7 ? 25 : 5)),
  sales: Math.floor(Math.random() * 200000 + (i >= 4 && i <= 7 ? 150000 : 30000)),
}));

type Tab = "trends" | "products" | "staff" | "forecasting";

export default function AdvancedReports() {
  const [tab, setTab] = useState<Tab>("trends");
  const [selectedOutlet, setSelectedOutlet] = useState("all");

  const currentMonth = monthlySales[monthlySales.length - 1];
  const prevMonth = monthlySales[monthlySales.length - 2];
  const salesGrowth = prevMonth ? ((currentMonth.sales - prevMonth.sales) / prevMonth.sales * 100) : 0;

  const tabs: { key: Tab; label: string }[] = [
    { key: "trends", label: "Trends & Analytics" },
    { key: "products", label: "Product Performance" },
    { key: "staff", label: "Staff Performance" },
    { key: "forecasting", label: "Forecasting" },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Advanced Insights</h1>
          <p className="text-sm text-muted-foreground mt-1">Trends, forecasting, and performance analytics</p>
        </div>
        <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outlets</SelectItem>
            {outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Monthly Revenue</p>
              <p className="text-xl font-heading font-bold">{fmt(currentMonth.sales)}</p>
            </div>
            <div className={cn("flex items-center gap-0.5 text-xs font-medium", salesGrowth >= 0 ? "text-success" : "text-destructive")}>
              {salesGrowth >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(salesGrowth).toFixed(1)}%
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Orders</p>
              <p className="text-xl font-heading font-bold">{currentMonth.orders}</p>
            </div>
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Avg. Order Value</p>
              <p className="text-xl font-heading font-bold">{fmt(Math.round(currentMonth.sales / currentMonth.orders))}</p>
            </div>
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Active Customers</p>
              <p className="text-xl font-heading font-bold">{currentMonth.customers}</p>
            </div>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap", tab === t.key ? "bg-card shadow-sm" : "text-muted-foreground")}>{t.label}</button>
        ))}
      </div>

      {tab === "trends" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-5">
              <h3 className="font-heading font-semibold mb-4">Revenue Trend</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlySales}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis tickFormatter={(v) => `₦${(v / 1000000).toFixed(1)}M`} className="text-xs" />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Area type="monotone" dataKey="sales" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-heading font-semibold mb-4">Sales by Category</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2}>
                      {categoryBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-4">Hourly Traffic & Sales</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyTraffic}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" className="text-xs" />
                  <YAxis yAxisId="left" className="text-xs" />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <Tooltip formatter={(v: number, name: string) => name === "sales" ? fmt(v) : v} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  <Bar yAxisId="left" dataKey="customers" name="Customers" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="sales" name="Sales" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {tab === "products" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">#</th>
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-right p-3 font-medium">Units Sold</th>
                  <th className="text-right p-3 font-medium">Revenue</th>
                  <th className="text-right p-3 font-medium">Growth</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.name} className="border-b hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-right">{p.units.toLocaleString()}</td>
                    <td className="p-3 text-right font-medium">{fmt(p.revenue)}</td>
                    <td className="p-3 text-right">
                      <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", p.growth >= 0 ? "text-success" : "text-destructive")}>
                        {p.growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(p.growth)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "staff" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staffPerformance.map((s, i) => (
            <Card key={s.name} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">
                    #{i + 1}
                  </div>
                  <div>
                    <h3 className="font-medium">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{s.transactions} transactions</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs bg-warning/15 text-warning">⭐ {s.rating}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Total Sales</p>
                  <p className="font-heading font-bold text-sm">{fmt(s.sales)}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Transactions</p>
                  <p className="font-heading font-bold">{s.transactions}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Avg. Ticket</p>
                  <p className="font-heading font-bold text-sm">{fmt(s.avgTicket)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "forecasting" && (
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-4">Revenue Forecast (Next 3 Months)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  ...monthlySales,
                  { month: "Jul", sales: 3050000, orders: 690, customers: 275 },
                  { month: "Aug", sales: 3200000, orders: 720, customers: 290 },
                  { month: "Sep", sales: 3100000, orders: 700, customers: 280 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={(v) => `₦${(v / 1000000).toFixed(1)}M`} className="text-xs" />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Line type="monotone" dataKey="sales" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="sales" stroke="hsl(var(--chart-4))" strokeWidth={2} strokeDasharray="5 5" data={[
                    { month: "Jun", sales: 2890000 },
                    { month: "Jul", sales: 3050000 },
                    { month: "Aug", sales: 3200000 },
                    { month: "Sep", sales: 3100000 },
                  ]} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { month: "July", predicted: 3050000, confidence: "85%" },
              { month: "August", predicted: 3200000, confidence: "78%" },
              { month: "September", predicted: 3100000, confidence: "72%" },
            ].map((f) => (
              <Card key={f.month} className="p-5 text-center">
                <p className="text-sm text-muted-foreground mb-1">{f.month} Forecast</p>
                <p className="text-2xl font-heading font-bold">{fmt(f.predicted)}</p>
                <Badge variant="secondary" className="mt-2 text-xs bg-accent/15 text-accent">
                  {f.confidence} confidence
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
