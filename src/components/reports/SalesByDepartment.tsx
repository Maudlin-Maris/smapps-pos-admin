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
import PaginationControls from "@/components/inventory/PaginationControls";
import { dailySalesShareFor, filterSales, formatCurrency } from "./salesData";
import { aggregateItemsByDepartment } from "./departmentMapping";

interface Props {
  sales: SalesRecord[];
  selectedOutlets: string[];
  dateRange: { from: Date; to: Date };
  cashierFilter?: string;
}

export default function SalesByDepartment({ sales, selectedOutlets, dateRange, cashierFilter }: Props) {
  const [dailyOpen, setDailyOpen] = useState<{ department: string; orders: number; revenue: number } | null>(null);

  const filteredSales = useMemo(
    () => filterSales(sales, selectedOutlets, dateRange, cashierFilter),
    [sales, selectedOutlets, dateRange, cashierFilter]
  );

  const salesByDepartment = useMemo(() => {
    const rows = aggregateItemsByDepartment(selectedOutlets);
    const totalRev = rows.reduce((s, r) => s + r.revenue, 0);
    return rows
      .map((r) => ({
        ...r,
        pct: totalRev > 0 ? ((r.revenue / totalRev) * 100).toFixed(1) : "0",
        pctNum: totalRev > 0 ? (r.revenue / totalRev) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [selectedOutlets]);

  const totalOrders = salesByDepartment.reduce((s, c) => s + c.orders, 0);
  const totalRevenue = salesByDepartment.reduce((s, c) => s + c.revenue, 0);

  const topDepartment = salesByDepartment[0];
  const topDepartments = salesByDepartment.slice(0, 5);

  const dailyShare = useMemo(() => dailySalesShareFor(filteredSales), [filteredSales]);

  const buildDailyBreakdown = (orders: number, revenue: number) => {
    const { perDay, total, dates } = dailyShare;
    if (total === 0 || dates.length === 0) return [];
    return dates.map((date) => {
      const share = perDay[date] / total;
      return {
        date,
        displayDate: new Date(date).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" }),
        orders: Math.max(0, Math.round(orders * share)),
        revenue: Math.round(revenue * share),
      };
    });
  };

  const deptPag = usePagination(salesByDepartment, 10);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Departments</p>
          <p className="text-lg sm:text-2xl font-bold">{salesByDepartment.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Total Orders</p>
          <p className="text-lg sm:text-2xl font-bold">{totalOrders}</p>
        </Card>
        <Card className="p-3 sm:p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-lg sm:text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Top Selling Department (highlight) */}
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                <Crown className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm sm:text-base">Top Selling Department</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {topDepartment ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold truncate">{topDepartment.department}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {topDepartment.outletName} · Leader by revenue this period
                    </p>
                  </div>
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <Trophy className="h-3 w-3" /> #1
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Revenue</p>
                    <p className="text-sm sm:text-base font-semibold">{formatCurrency(topDepartment.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Orders</p>
                    <p className="text-sm sm:text-base font-semibold">{topDepartment.orders}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Share</p>
                    <p className="text-sm sm:text-base font-semibold">{topDepartment.pct}%</p>
                  </div>
                </div>

                <div>
                  <Progress value={topDepartment.pctNum} className="h-2" />
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {topDepartment.pct}% of total department revenue
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

        {/* Top Departments by Revenue */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                <TrendingUp className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm sm:text-base">Top Departments by Revenue</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
            {topDepartments.length > 0 ? (
              topDepartments.map((d, idx) => (
                <div key={`${d.outletId}-${d.department}`} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium truncate">{d.department}</span>
                      <span className="text-[11px] text-muted-foreground truncate">· {d.outletName}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-muted-foreground">{d.orders} orders</span>
                      <span className="font-semibold">{formatCurrency(d.revenue)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={d.pctNum} className="h-1.5 flex-1" />
                    <span className="text-[11px] text-muted-foreground w-10 text-right">{d.pct}%</span>
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
          <CardTitle className="text-sm sm:text-base">Sales by Department</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2">
          <PaginationControls
            page={deptPag.page}
            totalPages={deptPag.totalPages}
            perPage={deptPag.perPage}
            totalItems={deptPag.totalItems}
            pageSizeOptions={deptPag.pageSizeOptions}
            onPageChange={deptPag.setPage}
            onPerPageChange={deptPag.setPerPage}
          />
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Outlet</TableHead>
                  <TableHead className="text-right text-xs">Orders</TableHead>
                  <TableHead className="text-right text-xs">Revenue</TableHead>
                  <TableHead className="text-right text-xs">%</TableHead>
                  <TableHead className="text-right text-xs w-[80px]">Daily</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deptPag.paginatedItems.length > 0 ? (
                  deptPag.paginatedItems.map((d) => (
                    <TableRow key={`${d.outletName}-${d.department}`}>
                      <TableCell className="font-medium text-xs sm:text-sm">{d.department}</TableCell>
                      <TableCell className="text-muted-foreground text-xs sm:text-sm">{d.outletName}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">{d.orders}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">{formatCurrency(d.revenue)}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs sm:text-sm">{d.pct}%</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setDailyOpen({ department: `${d.department} (${d.outletName})`, orders: d.orders, revenue: d.revenue })}
                        >
                          <CalendarRange className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground text-xs">No department data</TableCell>
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
            <DialogTitle className="text-base">{dailyOpen?.department}</DialogTitle>
            <DialogDescription className="text-xs">Daily department sales breakdown for the selected period</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-right text-xs">Orders</TableHead>
                  <TableHead className="text-right text-xs">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyOpen && buildDailyBreakdown(dailyOpen.orders, dailyOpen.revenue).map((d) => (
                  <TableRow key={d.date}>
                    <TableCell className="text-xs">{d.displayDate}</TableCell>
                    <TableCell className="text-right text-xs">{d.orders}</TableCell>
                    <TableCell className="text-right text-xs font-semibold">{formatCurrency(d.revenue)}</TableCell>
                  </TableRow>
                ))}
                {dailyOpen && (
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell className="text-xs">Total</TableCell>
                    <TableCell className="text-right text-xs">{dailyOpen.orders}</TableCell>
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
