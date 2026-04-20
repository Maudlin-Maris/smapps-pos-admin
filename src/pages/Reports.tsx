import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, subDays, startOfYear, startOfYear as soy, endOfYear, subYears } from "date-fns";
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign, Minus, FileSpreadsheet, FileText, User, X } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { outlets } from "@/data/outlets";
import { useExpenses, useSales, useStockAdjustments, buildPnL, type PnLData } from "@/hooks/use-financial-data";
import PnLStatement from "@/components/reports/PnLStatement";
import COGSBreakdown from "@/components/reports/COGSBreakdown";
import SalesReport from "@/components/reports/SalesReport";
import ReportTransactions from "@/components/reports/ReportTransactions";
import { exportPnLToExcel, exportPnLToPDF, buildCOGSItems } from "@/lib/report-export";

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<string>("pnl");
  const [selectedOutletId, setSelectedOutletId] = useState<string>("all");
  const [selectedCashier, setSelectedCashier] = useState<string>("all");
  const defaultFrom = startOfMonth(new Date());
  const defaultTo = endOfMonth(new Date());
  const [dateFrom, setDateFrom] = useState<Date>(defaultFrom);
  const [dateTo, setDateTo] = useState<Date>(defaultTo);
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(new Date()));

  const isFiltered =
    selectedOutletId !== "all" ||
    selectedCashier !== "all" ||
    dateFrom.getTime() !== defaultFrom.getTime() ||
    dateTo.getTime() !== defaultTo.getTime();

  const clearFilters = () => {
    setSelectedOutletId("all");
    setSelectedCashier("all");
    setDateFrom(defaultFrom);
    setDateTo(defaultTo);
    setCalendarMonth(startOfMonth(new Date()));
  };

  const get12h = (d: Date) => {
    const h24 = d.getHours();
    const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return { h12, minute: d.getMinutes(), period };
  };
  const setTimeParts = (base: Date, h12: number, minute: number, period: "AM" | "PM") => {
    let h24 = h12 % 12;
    if (period === "PM") h24 += 12;
    const d = new Date(base);
    d.setHours(h24, minute, period === "PM" ? 59 : 0, period === "PM" ? 999 : 0);
    return d;
  };
  const applyPreset = (from: Date, to: Date) => {
    setDateFrom(from);
    setDateTo(to);
    // Focus calendar so the FROM month is visible in the left pane
    setCalendarMonth(new Date(from.getFullYear(), from.getMonth(), 1));
  };

  const { getExpensesByOutletAndPeriod } = useExpenses();
  const { sales, getSalesByOutletAndPeriod } = useSales();
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

  // Available cashiers within current outlet scope (date-independent so filter is always usable)
  const availableCashiers = useMemo(() => {
    const names = new Set<string>();
    sales.forEach((s) => {
      if (outletIds.includes(s.outletId) && s.cashier) {
        names.add(s.cashier);
      }
    });
    return Array.from(names).sort();
  }, [sales, outletIds]);

  // Reset cashier selection if it's no longer valid for the current outlet
  useMemo(() => {
    if (selectedCashier !== "all" && !availableCashiers.includes(selectedCashier)) {
      setSelectedCashier("all");
    }
    return null;
  }, [availableCashiers, selectedCashier]);

  const data = useMemo(() => {
    const filteredExpenses = getExpensesByOutletAndPeriod(outletIds, dateFrom, dateTo);
    let filteredSales = getSalesByOutletAndPeriod(outletIds, dateFrom, dateTo);
    if (selectedCashier !== "all") {
      filteredSales = filteredSales.filter((s) => s.cashier === selectedCashier);
    }
    const cogsInventory = getCOGSByOutletAndPeriod(outletIds, dateFrom, dateTo);
    const totalSales = filteredSales.reduce((s, r) => s + r.totalSales, 0);
    const cogsLabor = Math.round(totalSales * 0.10);
    return buildPnL(filteredExpenses, filteredSales, cogsInventory, cogsLabor);
  }, [selectedOutletId, selectedCashier, dateFrom, dateTo, outletIds, getExpensesByOutletAndPeriod, getSalesByOutletAndPeriod, getCOGSByOutletAndPeriod]);

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
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight">Reports</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Financial performance & analytics</p>
          </div>
          {activeTab === "pnl" && (
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="gap-1 h-8 text-xs sm:h-9 sm:text-sm" onClick={handleExportExcel}>
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1 h-8 text-xs sm:h-9 sm:text-sm" onClick={handleExportPDF}>
                <FileText className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
          <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
            <SelectTrigger className="w-[150px] sm:w-[180px] h-8 sm:h-9 text-xs sm:text-sm shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outlets</SelectItem>
              {outlets.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedCashier}
            onValueChange={setSelectedCashier}
            disabled={availableCashiers.length === 0}
          >
            <SelectTrigger className="w-[150px] sm:w-[180px] h-8 sm:h-9 text-xs sm:text-sm shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <User className="h-3.5 w-3.5 shrink-0" />
                <SelectValue placeholder="All Cashiers" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cashiers</SelectItem>
              {availableCashiers.map((name) => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-8 sm:h-9 text-xs sm:text-sm shrink-0">
                <CalendarIcon className="h-3.5 w-3.5" />
                {format(dateFrom, "MMM d, h:mm a")} – {format(dateTo, "MMM d, yyyy, h:mm a")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex flex-col sm:flex-row">
                <div className="flex flex-col gap-1 p-2 border-b sm:border-b-0 sm:border-r min-w-[140px]">
                  {(() => {
                    const presets = [
                      { label: "Today", get: () => { const n = new Date(); return [startOfDay(n), endOfDay(n)] as const; } },
                      { label: "Yesterday", get: () => { const y = subDays(new Date(), 1); return [startOfDay(y), endOfDay(y)] as const; } },
                      { label: "Last 7 days", get: () => [startOfDay(subDays(new Date(), 6)), endOfDay(new Date())] as const },
                      { label: "Last 30 days", get: () => [startOfDay(subDays(new Date(), 29)), endOfDay(new Date())] as const },
                      { label: "This Month", get: () => [startOfMonth(new Date()), endOfMonth(new Date())] as const },
                      { label: "Last Month", get: () => [startOfMonth(subMonths(new Date(), 1)), endOfMonth(subMonths(new Date(), 1))] as const },
                      { label: "Year to date", get: () => [startOfYear(new Date()), endOfDay(new Date())] as const },
                      { label: "Last year", get: () => { const ly = subYears(new Date(), 1); return [startOfYear(ly), endOfYear(ly)] as const; } },
                    ];
                    const sameDay = (a: Date, b: Date) =>
                      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
                    return presets.map((preset) => {
                      const [pFrom, pTo] = preset.get();
                      const active = sameDay(pFrom, dateFrom) && sameDay(pTo, dateTo);
                      return (
                        <Button
                          key={preset.label}
                          size="sm"
                          variant={active ? "secondary" : "ghost"}
                          className={cn(
                            "justify-start text-xs h-8 font-normal",
                            active && "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                          )}
                          onClick={() => applyPreset(pFrom, pTo)}
                        >
                          {preset.label}
                        </Button>
                      );
                    });
                  })()}
                </div>
                <div className="p-3">
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    selected={{ from: dateFrom, to: dateTo }}
                    onSelect={(range) => {
                      if (!range) return;
                      if (range.from) {
                        // Preserve current time-of-day on dateFrom
                        const f = new Date(range.from);
                        f.setHours(dateFrom.getHours(), dateFrom.getMinutes(), 0, 0);
                        setDateFrom(f);
                      }
                      if (range.to) {
                        const t = new Date(range.to);
                        t.setHours(dateTo.getHours(), dateTo.getMinutes(), 59, 999);
                        setDateTo(t);
                      } else if (range.from) {
                        const t = new Date(range.from);
                        t.setHours(23, 59, 59, 999);
                        setDateTo(t);
                      }
                    }}
                    className={cn("p-0 pointer-events-auto")}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 px-3 py-2.5 border-t bg-muted/30">
                {([
                  { label: "From", value: dateFrom, set: setDateFrom },
                  { label: "To", value: dateTo, set: setDateTo },
                ] as const).map(({ label, value, set }) => {
                  const { h12, minute, period } = get12h(value);
                  return (
                    <div key={label} className="flex flex-col gap-1">
                      <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium min-w-[90px]">{format(value, "MMM d, yyyy")}</span>
                        <Select value={String(h12)} onValueChange={(v) => set(setTimeParts(value, Number(v), minute, period))}>
                          <SelectTrigger className="h-7 w-[58px] text-xs px-2"><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-[220px]">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                              <SelectItem key={h} value={String(h)} className="text-xs">{String(h).padStart(2, "0")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs">:</span>
                        <Select value={String(minute).padStart(2, "0")} onValueChange={(v) => set(setTimeParts(value, h12, Number(v), period))}>
                          <SelectTrigger className="h-7 w-[58px] text-xs px-2"><SelectValue /></SelectTrigger>
                          <SelectContent className="max-h-[220px]">
                            {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                              <SelectItem key={m} value={String(m).padStart(2, "0")} className="text-xs">{String(m).padStart(2, "0")}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex rounded-md border overflow-hidden">
                          {(["AM", "PM"] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => set(setTimeParts(value, h12, minute, p))}
                              className={cn(
                                "px-2 h-7 text-[10px] font-medium transition-colors",
                                period === p ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 h-8 sm:h-9 text-xs sm:text-sm shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear filters</span>
              <span className="sm:hidden">Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="pnl" className="flex-1 sm:flex-none text-xs sm:text-sm">Profit & Loss</TabsTrigger>
          <TabsTrigger value="sales" className="flex-1 sm:flex-none text-xs sm:text-sm">Sales Report</TabsTrigger>
          <TabsTrigger value="transactions" className="flex-1 sm:flex-none text-xs sm:text-sm">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="pnl" className="space-y-6 mt-6">
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
                      <XAxis type="number" tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} className="text-xs" />
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
                    <YAxis tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                    <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Net Profit" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sales" className="mt-6">
          <SalesReport sales={sales} selectedOutlets={outletIds} dateRange={{ from: dateFrom, to: dateTo }} cashierFilter={selectedCashier} />
        </TabsContent>

        <TabsContent value="transactions" className="mt-6">
          <ReportTransactions selectedOutlets={outletIds} dateRange={{ from: dateFrom, to: dateTo }} cashierFilter={selectedCashier} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
