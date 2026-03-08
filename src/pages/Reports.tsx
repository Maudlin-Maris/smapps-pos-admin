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
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign, Minus, FileSpreadsheet, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { outlets } from "@/data/outlets";
import { useExpenses, useSales, useStockAdjustments, buildPnL, type PnLData } from "@/hooks/use-financial-data";
import PnLStatement from "@/components/reports/PnLStatement";
import COGSBreakdown from "@/components/reports/COGSBreakdown";
import { exportPnLToExcel, exportPnLToPDF, buildCOGSItems } from "@/lib/report-export";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function Reports() {
  const [selectedOutletId, setSelectedOutletId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(new Date()));

  const { getExpensesByOutletAndPeriod } = useExpenses();
  const { getSalesByOutletAndPeriod } = useSales();
  const { getCOGSByOutletAndPeriod, getAdjustmentsByOutletAndPeriod } = useStockAdjustments();

  const isAllOutlets = selectedOutletId === "all";
  const outletIds = isAllOutlets ? outlets.map((o) => o.id) : [selectedOutletId];

  const filteredAdjustments = useMemo(
    () => getAdjustmentsByOutletAndPeriod(outletIds, dateFrom, dateTo),
    [outletIds, dateFrom, dateTo, getAdjustmentsByOutletAndPeriod]
  );

  // Item name map from default inventory (localStorage items could be loaded here too)
  const itemNames: Record<string, string> = useMemo(() => ({
    i1: "Coffee Beans (Arabica)", i2: "Whole Milk", i3: "Sugar",
    i4: "Paper Cups (12oz)", i5: "Croissant Dough", i6: "Shampoo (Professional)",
    i7: "Hair Color Mix", i8: "Disposable Gloves", i9: "Sandwich Bread", i10: "Napkins",
  }), []);

  const data = useMemo(() => {
    const filteredExpenses = getExpensesByOutletAndPeriod(outletIds, dateFrom, dateTo);
    const filteredSales = getSalesByOutletAndPeriod(outletIds, dateFrom, dateTo);
    const cogsInventory = getCOGSByOutletAndPeriod(outletIds, dateFrom, dateTo);
    const totalSales = filteredSales.reduce((s, r) => s + r.totalSales, 0);
    const cogsLabor = Math.round(totalSales * 0.10);
    return buildPnL(filteredExpenses, filteredSales, cogsInventory, cogsLabor);
  }, [selectedOutletId, dateFrom, dateTo, outletIds, getExpensesByOutletAndPeriod, getSalesByOutletAndPeriod, getCOGSByOutletAndPeriod]);

  const cogsItemRows = useMemo(
    () => buildCOGSItems(filteredAdjustments, itemNames),
    [filteredAdjustments, itemNames]
  );

  const outletLabel = isAllOutlets ? "All Outlets" : outlets.find((o) => o.id === selectedOutletId)?.name || selectedOutletId;

  const handleExportExcel = () => exportPnLToExcel(data, cogsItemRows, dateFrom, dateTo, outletLabel);
  const handleExportPDF = () => exportPnLToPDF(data, cogsItemRows, dateFrom, dateTo, outletLabel);

  const totalRevenue = data.revenue.sales + data.revenue.otherIncome;
  const totalCOGS = data.costOfGoods.inventory + data.costOfGoods.directLabor;
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = Object.values(data.expenses).reduce((a, b) => a + b, 0);
  const netProfit = grossProfit - totalExpenses;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

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

  const outletComparison = useMemo(() => {
    if (!isAllOutlets) return [];
    return outlets.map((o) => {
      const oExpenses = getExpensesByOutletAndPeriod([o.id], dateFrom, dateTo);
      const oSales = getSalesByOutletAndPeriod([o.id], dateFrom, dateTo);
      const rev = oSales.reduce((s, r) => s + r.totalSales + r.otherIncome, 0);
      const cogs = getCOGSByOutletAndPeriod([o.id], dateFrom, dateTo);
      const laborEst = Math.round(rev * 0.10);
      const exp = oExpenses.reduce((s, e) => s + e.amount, 0);
      return { name: o.name.split(" ")[0], revenue: rev, profit: rev - cogs - laborEst - exp };
    });
  }, [isAllOutlets, dateFrom, dateTo, getExpensesByOutletAndPeriod, getSalesByOutletAndPeriod]);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Profit & Loss</h1>
          <p className="text-sm text-muted-foreground mt-1">Financial performance from recorded data</p>
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
                  <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} className={cn("p-0 pointer-events-auto")} />
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">To</p>
                  <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} className={cn("p-0 pointer-events-auto")} />
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
        <PnLStatement data={data} dateFrom={dateFrom} dateTo={dateTo} />

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-heading font-semibold mb-4">Revenue Breakdown</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
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

      {/* COGS Breakdown */}
      <COGSBreakdown adjustments={filteredAdjustments} itemNames={itemNames} />

      {/* Outlet Comparison */}
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
