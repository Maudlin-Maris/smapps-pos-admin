import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SalesRecord } from "@/hooks/use-financial-data";
import { CalendarRange } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "@/components/inventory/PaginationControls";
import { aggregateItems, dailySalesShareFor, filterSales, formatCurrency } from "./salesData";

interface Props {
  sales: SalesRecord[];
  selectedOutlets: string[];
  dateRange: { from: Date; to: Date };
  cashierFilter?: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function SalesByCategory({ sales, selectedOutlets, dateRange, cashierFilter }: Props) {
  const [dailyOpen, setDailyOpen] = useState<{ category: string; qty: number; revenue: number } | null>(null);

  const filteredSales = useMemo(
    () => filterSales(sales, selectedOutlets, dateRange, cashierFilter),
    [sales, selectedOutlets, dateRange, cashierFilter]
  );

  const allItems = useMemo(() => aggregateItems(selectedOutlets), [selectedOutlets]);

  const salesByCategory = useMemo(() => {
    const catMap: Record<string, { qty: number; revenue: number }> = {};
    allItems.forEach((item) => {
      if (!catMap[item.category]) catMap[item.category] = { qty: 0, revenue: 0 };
      catMap[item.category].qty += item.qty;
      catMap[item.category].revenue += item.revenue;
    });
    const totalRev = allItems.reduce((s, i) => s + i.revenue, 0);
    return Object.entries(catMap)
      .map(([category, data]) => ({
        category,
        ...data,
        pct: totalRev > 0 ? ((data.revenue / totalRev) * 100).toFixed(1) : "0",
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [allItems]);

  const totalQty = salesByCategory.reduce((s, c) => s + c.qty, 0);
  const totalRevenue = salesByCategory.reduce((s, c) => s + c.revenue, 0);

  const dailyShare = useMemo(() => dailySalesShareFor(filteredSales), [filteredSales]);

  const buildDailyBreakdown = (totalQty: number, totalRevenue: number) => {
    const { perDay, total, dates } = dailyShare;
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

  const chartData = salesByCategory.map((c, idx) => ({
    name: c.category,
    value: c.revenue,
    color: COLORS[idx % COLORS.length],
  }));

  const catPag = usePagination(salesByCategory, 10);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Categories</p>
          <p className="text-lg sm:text-2xl font-bold">{salesByCategory.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Total Qty Sold</p>
          <p className="text-lg sm:text-2xl font-bold">{totalQty}</p>
        </Card>
        <Card className="p-3 sm:p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-lg sm:text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base">Revenue Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" paddingAngle={2}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: "12px" }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base">Sales by Category</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2">
            <PaginationControls
              page={catPag.page}
              totalPages={catPag.totalPages}
              perPage={catPag.perPage}
              totalItems={catPag.totalItems}
              pageSizeOptions={catPag.pageSizeOptions}
              onPageChange={catPag.setPage}
              onPerPageChange={catPag.setPerPage}
            />
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-right text-xs">Qty</TableHead>
                    <TableHead className="text-right text-xs">Revenue</TableHead>
                    <TableHead className="text-right text-xs">%</TableHead>
                    <TableHead className="text-right text-xs w-[80px]">Daily</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catPag.paginatedItems.length > 0 ? (
                    catPag.paginatedItems.map((cat) => (
                      <TableRow key={cat.category}>
                        <TableCell className="font-medium text-xs sm:text-sm">{cat.category}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">{cat.qty}</TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(cat.revenue)}</TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs sm:text-sm">{cat.pct}%</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setDailyOpen({ category: cat.category, qty: cat.qty, revenue: cat.revenue })}
                          >
                            <CalendarRange className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground text-xs">No category data</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!dailyOpen} onOpenChange={(o) => !o && setDailyOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{dailyOpen?.category}</DialogTitle>
            <DialogDescription className="text-xs">Daily category sales breakdown for the selected period</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-right text-xs">Qty</TableHead>
                  <TableHead className="text-right text-xs">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyOpen && buildDailyBreakdown(dailyOpen.qty, dailyOpen.revenue).map((d) => (
                  <TableRow key={d.date}>
                    <TableCell className="text-xs">{d.displayDate}</TableCell>
                    <TableCell className="text-right text-xs">{d.qty}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">{formatCurrency(d.revenue)}</TableCell>
                  </TableRow>
                ))}
                {dailyOpen && (
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell className="text-xs">Total</TableCell>
                    <TableCell className="text-right text-xs">{dailyOpen.qty}</TableCell>
                    <TableCell className="text-right text-xs">{formatCurrency(dailyOpen.revenue)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
