import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SalesRecord } from "@/hooks/use-financial-data";
import { CalendarRange, Crown, TrendingUp, Trophy } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import PaginationControls from "@/components/inventory/PaginationControls";
import { aggregateItems, dailySalesShareFor, filterSales, formatCurrency } from "./salesData";

interface Props {
  sales: SalesRecord[];
  selectedOutlets: string[];
  dateRange: { from: Date; to: Date };
  cashierFilter?: string;
}

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
        pctNum: totalRev > 0 ? (data.revenue / totalRev) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [allItems]);

  const totalQty = salesByCategory.reduce((s, c) => s + c.qty, 0);
  const totalRevenue = salesByCategory.reduce((s, c) => s + c.revenue, 0);

  const topCategory = salesByCategory[0];
  const topCategories = salesByCategory.slice(0, 5);

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

  const catPag = usePagination(salesByCategory, DEFAULT_PAGE_SIZE);

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
        {/* Top Selling Category (highlight) */}
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                <Crown className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm sm:text-base">Top Selling Category</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {topCategory ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold truncate">{topCategory.category}</p>
                    <p className="text-xs text-muted-foreground mt-1">Leader by revenue this period</p>
                  </div>
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <Trophy className="h-3 w-3" /> #1
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Revenue</p>
                    <p className="text-sm sm:text-base font-semibold">{formatCurrency(topCategory.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Qty Sold</p>
                    <p className="text-sm sm:text-base font-semibold">{topCategory.qty}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Share</p>
                    <p className="text-sm sm:text-base font-semibold">{topCategory.pct}%</p>
                  </div>
                </div>

                <div>
                  <Progress value={topCategory.pctNum} className="h-2" />
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {topCategory.pct}% of total category revenue
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-[180px] items-center justify-center text-muted-foreground text-sm">
                No data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Categories */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                <TrendingUp className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm sm:text-base">Top Selling Categories</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
            {topCategories.length > 0 ? (
              topCategories.map((cat, idx) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium truncate">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-muted-foreground">{cat.qty} qty</span>
                      <span className="font-semibold">{formatCurrency(cat.revenue)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={cat.pctNum} className="h-1.5 flex-1" />
                    <span className="text-[11px] text-muted-foreground w-10 text-right">{cat.pct}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-[180px] items-center justify-center text-muted-foreground text-sm">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
