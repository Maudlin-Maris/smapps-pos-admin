import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SalesRecord } from "@/hooks/use-financial-data";
import { CalendarRange, Star, Search, Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "@/components/inventory/PaginationControls";
import { aggregateItems, dailySalesShareFor, filterSales, formatCurrency } from "./salesData";

const COLUMN_HELP: Record<string, string> = {
  Item: "Product or service name. Pinned column — scroll horizontally to see all metrics.",
  Category: "Catalog category the item belongs to.",
  Qty: "Total units sold across the selected outlets and date range.",
  "Unit Cost": "Weighted average cost per unit (WAC) based on actual stock receipts.",
  "Total Cost": "Quantity × Unit Cost — total cost of goods sold for this item (COGS).",
  "Gross Rev.": "Revenue before any discounts or taxes are applied (list price × qty).",
  Discount: "Item-level discounts applied at checkout. Subtracted from gross revenue.",
  Tax: "Tax collected on this item. Pass-through to authorities — excluded from profit.",
  "Net Revenue": "Gross Revenue − Discount. The actual amount kept (excludes tax).",
  Profit: "Net Revenue − Total Cost. True profit after discounts and cost of goods.",
  Margin: "Profit ÷ Net Revenue × 100. Color-coded: ≥30% strong, 10–29% ok, <10% low.",
  Daily: "Open a daily breakdown of quantity and revenue across the selected period.",
};

function ColumnHeader({ label, align = "left" }: { label: string; align?: "left" | "right" }) {
  const help = COLUMN_HELP[label];
  return (
    <span className={`inline-flex items-center gap-1 ${align === "right" ? "justify-end w-full" : ""}`}>
      <span>{label}</span>
      {help && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`What is ${label}?`}
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Info className="h-3 w-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" collisionPadding={12} className="w-[260px] text-xs leading-relaxed whitespace-normal break-words normal-case tracking-normal">
            {help}
          </PopoverContent>
        </Popover>
      )}
    </span>
  );
}

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
  const totalGross = visibleItems.reduce((s, i) => s + i.grossRevenue, 0);
  const totalDiscount = visibleItems.reduce((s, i) => s + i.discount, 0);
  const totalTax = visibleItems.reduce((s, i) => s + i.tax, 0);
  const totalRevenue = visibleItems.reduce((s, i) => s + i.revenue, 0);
  const totalCost = visibleItems.reduce((s, i) => s + i.cost, 0);
  const totalProfit = totalRevenue - totalCost;
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const topItems = useMemo(() => allItems.slice(0, 5), [allItems]);

  const itemsPag = usePagination(visibleItems, 10);
  const topPag = usePagination(topItems, 5);

  return (
    <>
    <div className="space-y-4 sm:space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Card className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Unique Items</p>
          <p className="text-lg sm:text-2xl font-bold">{visibleItems.length}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Total Qty Sold</p>
          <p className="text-lg sm:text-2xl font-bold">{totalQty}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Net Revenue</p>
          <p className="text-lg sm:text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Gross {formatCurrency(totalGross)} − Disc {formatCurrency(totalDiscount)}
          </p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Total Cost (COGS)</p>
          <p className="text-lg sm:text-2xl font-bold">{formatCurrency(totalCost)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Tax collected {formatCurrency(totalTax)}</p>
        </Card>
        <Card className="p-3 sm:p-4 col-span-2 md:col-span-3 lg:col-span-1">
          <p className="text-xs text-muted-foreground">True Profit</p>
          <p className="text-lg sm:text-2xl font-bold text-primary">{formatCurrency(totalProfit)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Margin {overallMargin.toFixed(1)}% • Net of disc, ex-tax</p>
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
                  <TableHead className="text-xs sticky left-0 z-20 bg-card shadow-[1px_0_0_0_hsl(var(--border))] min-w-[180px]"><ColumnHeader label="Item" /></TableHead>
                  <TableHead className="text-xs"><ColumnHeader label="Category" /></TableHead>
                  <TableHead className="text-right text-xs"><ColumnHeader label="Qty" align="right" /></TableHead>
                  <TableHead className="text-right text-xs"><ColumnHeader label="Unit Cost" align="right" /></TableHead>
                  <TableHead className="text-right text-xs"><ColumnHeader label="Total Cost" align="right" /></TableHead>
                  <TableHead className="text-right text-xs"><ColumnHeader label="Gross Rev." align="right" /></TableHead>
                  <TableHead className="text-right text-xs"><ColumnHeader label="Discount" align="right" /></TableHead>
                  <TableHead className="text-right text-xs"><ColumnHeader label="Tax" align="right" /></TableHead>
                  <TableHead className="text-right text-xs"><ColumnHeader label="Net Revenue" align="right" /></TableHead>
                  <TableHead className="text-right text-xs"><ColumnHeader label="Profit" align="right" /></TableHead>
                  <TableHead className="text-right text-xs"><ColumnHeader label="Margin" align="right" /></TableHead>
                  <TableHead className="text-right text-xs w-[60px]"><ColumnHeader label="Daily" align="right" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itemsPag.paginatedItems.length > 0 ? (
                  itemsPag.paginatedItems.map((item) => (
                    <TableRow key={item.name} className="group">
                      <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap sticky left-0 z-10 bg-card group-hover:bg-muted/50 shadow-[1px_0_0_0_hsl(var(--border))] min-w-[180px]">{item.name}</TableCell>
                      <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{item.category}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">{item.qty}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{formatCurrency(item.unitCost)}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{formatCurrency(item.cost)}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm whitespace-nowrap">{formatCurrency(item.grossRevenue)}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm text-destructive whitespace-nowrap">
                        {item.discount > 0 ? `−${formatCurrency(item.discount)}` : formatCurrency(0)}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{formatCurrency(item.tax)}</TableCell>
                      <TableCell className="text-right font-semibold text-xs sm:text-sm whitespace-nowrap">{formatCurrency(item.revenue)}</TableCell>
                      <TableCell className={`text-right font-semibold text-xs sm:text-sm whitespace-nowrap ${item.profit >= 0 ? "text-primary" : "text-destructive"}`}>
                        {formatCurrency(item.profit)}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">
                        <Badge variant={item.margin >= 30 ? "default" : item.margin >= 10 ? "secondary" : "destructive"} className="text-[10px] px-1.5 py-0">
                          {item.margin.toFixed(1)}%
                        </Badge>
                      </TableCell>
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
                    <TableCell colSpan={12} className="text-center text-muted-foreground text-xs">No items match</TableCell>
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
          {dailyOpen && (
            <DailyBreakdownTable
              rows={buildDailyBreakdown(dailyOpen.qty, dailyOpen.revenue)}
              totalQty={dailyOpen.qty}
              totalRevenue={dailyOpen.revenue}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
