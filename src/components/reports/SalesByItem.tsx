import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SalesRecord } from "@/hooks/use-financial-data";
import { CalendarRange, Star, Search } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "@/components/inventory/PaginationControls";
import { aggregateItems, dailySalesShareFor, filterSales, formatCurrency } from "./salesData";

interface Props {
  sales: SalesRecord[];
  selectedOutlets: string[];
  dateRange: { from: Date; to: Date };
  cashierFilter?: string;
}

export default function SalesByItem({ sales, selectedOutlets, dateRange, cashierFilter }: Props) {
  const [search, setSearch] = useState("");
  const [dailyOpen, setDailyOpen] = useState<{ name: string; qty: number; revenue: number } | null>(null);

  const filteredSales = useMemo(
    () => filterSales(sales, selectedOutlets, dateRange, cashierFilter),
    [sales, selectedOutlets, dateRange, cashierFilter]
  );

  const allItems = useMemo(() => aggregateItems(selectedOutlets), [selectedOutlets]);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter(
      (i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
    );
  }, [allItems, search]);

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

  const totalQty = visibleItems.reduce((s, i) => s + i.qty, 0);
  const totalRevenue = visibleItems.reduce((s, i) => s + i.revenue, 0);
  const topItems = useMemo(() => allItems.slice(0, 5), [allItems]);

  const itemsPag = usePagination(visibleItems, 10);
  const topPag = usePagination(topItems, 5);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Unique Items</p>
          <p className="text-lg sm:text-2xl font-bold">{visibleItems.length}</p>
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

      {/* Top items */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Star className="h-4 w-4" /> Top Selling Items
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2">
          <PaginationControls
            page={topPag.page}
            totalPages={topPag.totalPages}
            perPage={topPag.perPage}
            totalItems={topPag.totalItems}
            pageSizeOptions={topPag.pageSizeOptions}
            onPageChange={topPag.setPage}
            onPerPageChange={topPag.setPerPage}
          />
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Item</TableHead>
                  <TableHead className="text-right text-xs">Qty</TableHead>
                  <TableHead className="text-right text-xs">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPag.paginatedItems.map((item, idx) => {
                  const rank = (topPag.page - 1) * topPag.perPage + idx;
                  return (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5">
                          {rank < 3 ? (
                            <Badge variant={rank === 0 ? "default" : "secondary"} className="w-5 h-5 rounded-full flex items-center justify-center p-0 text-xs shrink-0">
                              {rank + 1}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs w-5 text-center shrink-0">{rank + 1}</span>
                          )}
                          <span className="truncate">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">{item.qty}</TableCell>
                      <TableCell className="text-right font-semibold text-xs sm:text-sm">{formatCurrency(item.revenue)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* All items table */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4 flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-sm sm:text-base">Sales by Item</CardTitle>
          <div className="relative w-full max-w-[220px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item or category..."
              className="h-8 pl-7 text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2">
          <PaginationControls
            page={itemsPag.page}
            totalPages={itemsPag.totalPages}
            perPage={itemsPag.perPage}
            totalItems={itemsPag.totalItems}
            pageSizeOptions={itemsPag.pageSizeOptions}
            onPageChange={itemsPag.setPage}
            onPerPageChange={itemsPag.setPerPage}
          />
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Item</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-right text-xs">Qty</TableHead>
                  <TableHead className="text-right text-xs">Revenue</TableHead>
                  <TableHead className="text-right text-xs w-[80px]">Daily</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsPag.paginatedItems.length > 0 ? (
                  itemsPag.paginatedItems.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium text-xs sm:text-sm">{item.name}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground">{item.category}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">{item.qty}</TableCell>
                      <TableCell className="text-right font-semibold text-xs sm:text-sm">{formatCurrency(item.revenue)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setDailyOpen({ name: item.name, qty: item.qty, revenue: item.revenue })}
                        >
                          <CalendarRange className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground text-xs">No items match</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Daily breakdown dialog */}
      <Dialog open={!!dailyOpen} onOpenChange={(o) => !o && setDailyOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{dailyOpen?.name}</DialogTitle>
            <DialogDescription className="text-xs">Daily sales breakdown for the selected period</DialogDescription>
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
