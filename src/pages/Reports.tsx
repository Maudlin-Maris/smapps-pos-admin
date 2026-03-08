import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign, Minus, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { outlets } from "@/data/outlets";

// Sample P&L data per outlet
interface PnLData {
  revenue: {
    sales: number;
    otherIncome: number;
  };
  costOfGoods: {
    inventory: number;
    directLabor: number;
  };
  expenses: {
    rent: number;
    utilities: number;
    salaries: number;
    marketing: number;
    maintenance: number;
    other: number;
  };
}

const outletPnLData: Record<string, PnLData> = {
  "outlet-1": {
    revenue: { sales: 42500, otherIncome: 1200 },
    costOfGoods: { inventory: 14800, directLabor: 4200 },
    expenses: { rent: 3500, utilities: 850, salaries: 8200, marketing: 1200, maintenance: 600, other: 450 },
  },
  "outlet-2": {
    revenue: { sales: 38200, otherIncome: 800 },
    costOfGoods: { inventory: 13500, directLabor: 3800 },
    expenses: { rent: 4200, utilities: 720, salaries: 7500, marketing: 950, maintenance: 400, other: 380 },
  },
  "outlet-3": {
    revenue: { sales: 28900, otherIncome: 500 },
    costOfGoods: { inventory: 5200, directLabor: 6800 },
    expenses: { rent: 2800, utilities: 550, salaries: 6200, marketing: 800, maintenance: 350, other: 300 },
  },
  "outlet-4": {
    revenue: { sales: 15600, otherIncome: 300 },
    costOfGoods: { inventory: 5800, directLabor: 2100 },
    expenses: { rent: 1800, utilities: 380, salaries: 3200, marketing: 500, maintenance: 200, other: 180 },
  },
};

function aggregatePnL(outletIds: string[]): PnLData {
  const result: PnLData = {
    revenue: { sales: 0, otherIncome: 0 },
    costOfGoods: { inventory: 0, directLabor: 0 },
    expenses: { rent: 0, utilities: 0, salaries: 0, marketing: 0, maintenance: 0, other: 0 },
  };
  for (const id of outletIds) {
    const d = outletPnLData[id];
    if (!d) continue;
    result.revenue.sales += d.revenue.sales;
    result.revenue.otherIncome += d.revenue.otherIncome;
    result.costOfGoods.inventory += d.costOfGoods.inventory;
    result.costOfGoods.directLabor += d.costOfGoods.directLabor;
    result.expenses.rent += d.expenses.rent;
    result.expenses.utilities += d.expenses.utilities;
    result.expenses.salaries += d.expenses.salaries;
    result.expenses.marketing += d.expenses.marketing;
    result.expenses.maintenance += d.expenses.maintenance;
    result.expenses.other += d.expenses.other;
  }
  return result;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function pct(part: number, total: number) {
  if (total === 0) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

interface LineRowProps {
  label: string;
  amount: number;
  total?: number;
  bold?: boolean;
  positive?: boolean;
  indent?: boolean;
}

function LineRow({ label, amount, total, bold, positive, indent }: LineRowProps) {
  return (
    <div className={cn("flex items-center justify-between py-2 px-3", bold && "font-semibold", indent && "pl-8")}>
      <span className={cn("text-sm", indent && "text-muted-foreground")}>{label}</span>
      <div className="flex items-center gap-4">
        {total !== undefined && (
          <span className="text-xs text-muted-foreground w-14 text-right">{pct(amount, total)}</span>
        )}
        <span className={cn(
          "text-sm font-mono w-24 text-right",
          bold && "font-bold",
          positive === true && "text-success",
          positive === false && "text-destructive"
        )}>
          {fmt(amount)}
        </span>
      </div>
    </div>
  );
}

export default function Reports() {
  const [selectedOutletId, setSelectedOutletId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(new Date()));

  const isAllOutlets = selectedOutletId === "all";

  const data = useMemo(() => {
    const ids = isAllOutlets ? Object.keys(outletPnLData) : [selectedOutletId];
    return aggregatePnL(ids);
  }, [selectedOutletId, isAllOutlets]);

  const totalRevenue = data.revenue.sales + data.revenue.otherIncome;
  const totalCOGS = data.costOfGoods.inventory + data.costOfGoods.directLabor;
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = Object.values(data.expenses).reduce((a, b) => a + b, 0);
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Chart data
  const breakdownData = [
    { name: "COGS", value: totalCOGS, color: "hsl(var(--chart-5))" },
    { name: "Expenses", value: totalExpenses, color: "hsl(var(--chart-3))" },
    { name: "Net Profit", value: Math.max(0, netProfit), color: "hsl(var(--chart-1))" },
  ];

  const expenseBreakdown = [
    { name: "Rent", value: data.expenses.rent },
    { name: "Utilities", value: data.expenses.utilities },
    { name: "Salaries", value: data.expenses.salaries },
    { name: "Marketing", value: data.expenses.marketing },
    { name: "Maintenance", value: data.expenses.maintenance },
    { name: "Other", value: data.expenses.other },
  ];

  // Outlet comparison data (only when "all" selected)
  const outletComparison = useMemo(() => {
    if (!isAllOutlets) return [];
    return outlets.map((o) => {
      const d = outletPnLData[o.id];
      if (!d) return null;
      const rev = d.revenue.sales + d.revenue.otherIncome;
      const cogs = d.costOfGoods.inventory + d.costOfGoods.directLabor;
      const exp = Object.values(d.expenses).reduce((a, b) => a + b, 0);
      return { name: o.name.split(" ")[0], revenue: rev, profit: rev - cogs - exp };
    }).filter(Boolean);
  }, [isAllOutlets]);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Profit & Loss</h1>
          <p className="text-sm text-muted-foreground mt-1">Financial performance summary</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outlets</SelectItem>
              {outlets.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-9">
                <CalendarIcon className="h-3.5 w-3.5" />
                {format(dateFrom, "MMM d")} – {format(dateTo, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex flex-col sm:flex-row">
                <div className="p-3 border-b sm:border-b-0 sm:border-r">
                  <p className="text-xs font-medium text-muted-foreground mb-2">From</p>
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(d) => d && setDateFrom(d)}
                    className={cn("p-0 pointer-events-auto")}
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">To</p>
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(d) => d && setDateTo(d)}
                    className={cn("p-0 pointer-events-auto")}
                  />
                </div>
              </div>
              <div className="flex gap-1.5 p-3 border-t">
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setDateFrom(startOfMonth(new Date())); setDateTo(endOfMonth(new Date())); }}>This Month</Button>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setDateFrom(startOfMonth(subMonths(new Date(), 1))); setDateTo(endOfMonth(subMonths(new Date(), 1))); }}>Last Month</Button>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { setDateFrom(startOfMonth(subMonths(new Date(), 2))); setDateTo(endOfMonth(new Date())); }}>Last 3 Months</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-lg font-heading font-bold">{fmt(totalRevenue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gross Profit</p>
              <p className="text-lg font-heading font-bold">{fmt(grossProfit)}</p>
              <p className="text-xs text-muted-foreground">{grossMargin.toFixed(1)}% margin</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
              <Minus className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
              <p className="text-lg font-heading font-bold">{fmt(totalExpenses)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", netProfit >= 0 ? "bg-success/10" : "bg-destructive/10")}>
              {netProfit >= 0 ? <TrendingUp className="h-5 w-5 text-success" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Net Profit</p>
              <p className={cn("text-lg font-heading font-bold", netProfit >= 0 ? "text-success" : "text-destructive")}>{fmt(netProfit)}</p>
              <p className="text-xs text-muted-foreground">{netMargin.toFixed(1)}% margin</p>
            </div>
          </div>
        </Card>
      </div>

      {/* P&L Statement + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Statement */}
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-heading font-semibold text-sm">Income Statement</h2>
            <Badge variant="secondary" className="text-xs">
              {format(dateFrom, "MMM d")} – {format(dateTo, "MMM d, yyyy")}
            </Badge>
          </div>
          <div className="divide-y">
            {/* Revenue */}
            <div>
              <div className="px-3 pt-3 pb-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Revenue</p>
              </div>
              <LineRow label="Sales Revenue" amount={data.revenue.sales} total={totalRevenue} indent />
              <LineRow label="Other Income" amount={data.revenue.otherIncome} total={totalRevenue} indent />
              <div className="border-t border-dashed mx-3" />
              <LineRow label="Total Revenue" amount={totalRevenue} bold />
            </div>

            {/* COGS */}
            <div>
              <div className="px-3 pt-3 pb-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cost of Goods Sold</p>
              </div>
              <LineRow label="Inventory Costs" amount={data.costOfGoods.inventory} total={totalRevenue} indent />
              <LineRow label="Direct Labor" amount={data.costOfGoods.directLabor} total={totalRevenue} indent />
              <div className="border-t border-dashed mx-3" />
              <LineRow label="Total COGS" amount={totalCOGS} bold />
            </div>

            {/* Gross Profit */}
            <div className="bg-success/5">
              <LineRow label="Gross Profit" amount={grossProfit} total={totalRevenue} bold positive={grossProfit >= 0} />
            </div>

            {/* Expenses */}
            <div>
              <div className="px-3 pt-3 pb-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Operating Expenses</p>
              </div>
              <LineRow label="Rent" amount={data.expenses.rent} total={totalRevenue} indent />
              <LineRow label="Utilities" amount={data.expenses.utilities} total={totalRevenue} indent />
              <LineRow label="Salaries & Wages" amount={data.expenses.salaries} total={totalRevenue} indent />
              <LineRow label="Marketing" amount={data.expenses.marketing} total={totalRevenue} indent />
              <LineRow label="Maintenance" amount={data.expenses.maintenance} total={totalRevenue} indent />
              <LineRow label="Other Expenses" amount={data.expenses.other} total={totalRevenue} indent />
              <div className="border-t border-dashed mx-3" />
              <LineRow label="Total Expenses" amount={totalExpenses} bold />
            </div>

            {/* Net Profit */}
            <div className={cn(netProfit >= 0 ? "bg-success/5" : "bg-destructive/5")}>
              <LineRow label="Net Profit / (Loss)" amount={netProfit} total={totalRevenue} bold positive={netProfit >= 0} />
            </div>
          </div>
        </Card>

        {/* Revenue Breakdown Pie */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-heading font-semibold mb-4">Revenue Breakdown</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {breakdownData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-heading font-semibold mb-4">Expense Breakdown</h3>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseBreakdown} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                  <YAxis type="category" dataKey="name" width={80} className="text-xs" />
                  <Tooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Outlet Comparison (only when "All Outlets") */}
      {isAllOutlets && outletComparison.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-heading font-semibold mb-4">Outlet Comparison</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outletComparison} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Net Profit" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
