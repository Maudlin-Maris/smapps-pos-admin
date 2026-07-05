import { useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useGetSalesByItemReport,
  useGetSalesByItemItems,
  useGetSalesByItemTopSelling,
  useGetSalesByItemDaily,
} from "@/services/api/reports-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Star, Search, Info, CalendarRange } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ResuablePagination } from "@/components/ui/reusable-pagination";
import { formatCurrency } from "./salesData";

const COLUMN_HELP: Record<string, string> = {
  Item: "Product or service name. Pinned column — scroll horizontally to see all metrics.",
  Category: "Catalog category the item belongs to.",
  Qty: "Total units sold across the selected outlets and date range.",
  "Unit Cost":
    "Weighted average cost per unit (WAC) based on actual stock receipts.",
  "Total Cost":
    "Quantity × Unit Cost — total cost of goods sold for this item (COGS).",
  "Gross Rev.":
    "Revenue before any discounts or taxes are applied (list price × qty).",
  Discount:
    "Item-level discounts applied at checkout. Subtracted from gross revenue.",
  Tax: "Tax collected on this item. Pass-through to authorities — excluded from profit.",
  "Net Revenue":
    "Gross Revenue − Discount. The actual amount kept (excludes tax).",
  Profit:
    "Net Revenue − Total Cost. True profit after discounts and cost of goods.",
  Margin:
    "Profit ÷ Net Revenue × 100. Color-coded: ≥30% strong, 10–29% ok, <10% low.",
  Daily:
    "Open a daily breakdown of quantity and revenue across the selected period.",
};

function ColumnHeader({
  label,
  align = "left",
}: {
  label: string;
  align?: "left" | "right";
}) {
  const help = COLUMN_HELP[label];
  return (
    <span
      className={`inline-flex items-center gap-1 ${align === "right" ? "justify-end w-full" : ""}`}
    >
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
          <PopoverContent
            side="bottom"
            align="start"
            collisionPadding={12}
            className="w-[260px] text-xs leading-relaxed whitespace-normal break-words normal-case tracking-normal"
          >
            {help}
          </PopoverContent>
        </Popover>
      )}
    </span>
  );
}

interface Props {
  sales?: any[]; // For props compatibility
  selectedOutlets: string[];
  dateRange: { from: Date; to: Date };
  cashierFilter?: string;
}

export default function SalesByItem({
  selectedOutlets,
  dateRange,
  cashierFilter,
}: Props) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [dailyOpen, setDailyOpen] = useState<{
    name: string;
    qty: number;
    revenue: number;
  } | null>(null);

  // Pagination states
  const [topPage, setTopPage] = useState(1);
  const [topPerPage, setTopPerPage] = useState(5);

  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const formattedFrom = dateRange.from.toISOString().split("T")[0];
  const formattedTo = dateRange.to.toISOString().split("T")[0];
  const outletIdParam =
    selectedOutlets.length === 1 && selectedOutlets[0] !== "all"
      ? selectedOutlets[0]
      : undefined;
  const cashierIdParam = cashierFilter === "all" ? undefined : cashierFilter;

  // 1. High level item stats
  const { data: itemReportData, isLoading: isReportLoading } =
    useGetSalesByItemReport({
      dateFrom: formattedFrom,
      dateTo: formattedTo,
      outletId: outletIdParam,
      cashierId: cashierIdParam,
      search: debouncedSearch.trim() || undefined,
    });

  const report = itemReportData?.data || {
    uniqueItems: 0,
    totalQtySold: 0,
    netRevenue: 0,
    grossRevenue: 0,
    totalDiscount: 0,
    totalCost: 0,
    taxCollected: 0,
    trueProfit: 0,
    marginPercent: 0,
  };

  // 2. Items list paginated
  const { data: itemsResponse, isLoading: isItemsLoading } =
    useGetSalesByItemItems({
      dateFrom: formattedFrom,
      dateTo: formattedTo,
      outletId: outletIdParam,
      cashierId: cashierIdParam,
      search: debouncedSearch.trim() || undefined,
      page: itemsPage,
      perPage: itemsPerPage,
    });

  const paginatedItems = itemsResponse?.data.items || [];
  const itemsPagination = itemsResponse?.data.pagination || {
    total: 0,
    lastPage: 1,
  };

  // 3. Top selling items paginated
  const { data: topSellingResponse, isLoading: isTopLoading } =
    useGetSalesByItemTopSelling({
      dateFrom: formattedFrom,
      dateTo: formattedTo,
      outletId: outletIdParam,
      cashierId: cashierIdParam,
      page: topPage,
      perPage: topPerPage,
    });

  const topItems = topSellingResponse?.data.items || [];
  const topPagination = topSellingResponse?.data.pagination || {
    total: 0,
    lastPage: 1,
  };

  if (isReportLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-xs text-muted-foreground">
          Loading items summary...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <Card className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">Unique Items</p>
            <p className="text-lg sm:text-2xl font-bold">
              {report.uniqueItems}
            </p>
          </Card>
          <Card className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">Total Qty Sold</p>
            <p className="text-lg sm:text-2xl font-bold">
              {report.totalQtySold}
            </p>
          </Card>
          <Card className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">Net Revenue</p>
            <p className="text-lg sm:text-2xl font-bold">
              {formatCurrency(report.netRevenue)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Gross {formatCurrency(report.grossRevenue)} − Disc{" "}
              {formatCurrency(report.totalDiscount)}
            </p>
          </Card>
          <Card className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">Total Cost (COGS)</p>
            <p className="text-lg sm:text-2xl font-bold">
              {formatCurrency(report.totalCost)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Tax collected {formatCurrency(report.taxCollected)}
            </p>
          </Card>
          <Card className="p-3 sm:p-4 col-span-2 md:col-span-3 lg:col-span-1">
            <p className="text-xs text-muted-foreground">True Profit</p>
            <p className="text-lg sm:text-2xl font-bold text-primary">
              {formatCurrency(report.trueProfit)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Margin {report.marginPercent.toFixed(1)}% • Net of disc, ex-tax
            </p>
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
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Item</TableHead>
                    <TableHead className="text-right text-xs">Qty</TableHead>
                    <TableHead className="text-right text-xs">
                      Revenue
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isTopLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : topItems.length > 0 ? (
                    topItems.map((item, idx) => {
                      const rank = (topPage - 1) * topPerPage + idx;
                      return (
                        <TableRow key={item.name}>
                          <TableCell className="font-medium text-xs sm:text-sm">
                            <div className="flex items-center gap-1.5">
                              {rank < 3 ? (
                                <Badge
                                  variant={rank === 0 ? "default" : "secondary"}
                                  className="w-5 h-5 rounded-full flex items-center justify-center p-0 text-xs shrink-0"
                                >
                                  {rank + 1}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs w-5 text-center shrink-0">
                                  {rank + 1}
                                </span>
                              )}
                              <span className="truncate">{item.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">
                            {item.qty}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-xs sm:text-sm">
                            {formatCurrency(item.revenue)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground text-xs"
                      >
                        No items found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <ResuablePagination
              currentPage={topPage}
              totalPages={topPagination.lastPage}
              totalItems={topPagination.total}
              rowsPerPage={topPerPage}
              onPageChange={setTopPage}
              onRowsPerPageChange={setTopPerPage}
              isLoading={isTopLoading}
            />
          </CardContent>
        </Card>

        {/* All items table */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4 flex flex-row items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm sm:text-base">
              Sales by Item
            </CardTitle>
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
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sticky left-0 z-20 bg-card shadow-[1px_0_0_0_hsl(var(--border))] min-w-[180px]">
                      <ColumnHeader label="Item" />
                    </TableHead>
                    <TableHead className="text-xs">
                      <ColumnHeader label="Category" />
                    </TableHead>
                    <TableHead className="text-right text-xs">
                      <ColumnHeader label="Qty" align="right" />
                    </TableHead>
                    <TableHead className="text-right text-xs">
                      <ColumnHeader label="Unit Cost" align="right" />
                    </TableHead>
                    <TableHead className="text-right text-xs">
                      <ColumnHeader label="Total Cost" align="right" />
                    </TableHead>
                    <TableHead className="text-right text-xs">
                      <ColumnHeader label="Gross Rev." align="right" />
                    </TableHead>
                    <TableHead className="text-right text-xs">
                      <ColumnHeader label="Discount" align="right" />
                    </TableHead>
                    <TableHead className="text-right text-xs">
                      <ColumnHeader label="Tax" align="right" />
                    </TableHead>
                    <TableHead className="text-right text-xs">
                      <ColumnHeader label="Net Revenue" align="right" />
                    </TableHead>
                    <TableHead className="text-right text-xs">
                      <ColumnHeader label="Profit" align="right" />
                    </TableHead>
                    <TableHead className="text-right text-xs">
                      <ColumnHeader label="Margin" align="right" />
                    </TableHead>
                    <TableHead className="text-right text-xs w-[60px]">
                      <ColumnHeader label="Daily" align="right" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isItemsLoading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-6">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : paginatedItems.length > 0 ? (
                    paginatedItems.map((item) => (
                      <TableRow key={item.name} className="group">
                        <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap sticky left-0 z-10 bg-card group-hover:bg-muted/50 shadow-[1px_0_0_0_hsl(var(--border))] min-w-[180px]">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                          {item.category}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">
                          {item.qty}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                          {formatCurrency(item.unitCost)}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                          {formatCurrency(item.cost)}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm whitespace-nowrap">
                          {formatCurrency(item.grossRevenue)}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm text-destructive whitespace-nowrap">
                          {item.discount > 0
                            ? `−${formatCurrency(item.discount)}`
                            : formatCurrency(0)}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                          {formatCurrency(item.tax)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-xs sm:text-sm whitespace-nowrap">
                          {formatCurrency(item.revenue)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-semibold text-xs sm:text-sm whitespace-nowrap ${item.profit >= 0 ? "text-primary" : "text-destructive"}`}
                        >
                          {formatCurrency(item.profit)}
                        </TableCell>
                        <TableCell className="text-right text-xs sm:text-sm">
                          <Badge
                            variant={
                              item.margin >= 30
                                ? "default"
                                : item.margin >= 10
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-[10px] px-1.5 py-0"
                          >
                            {item.margin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() =>
                              setDailyOpen({
                                name: item.name,
                                qty: item.qty,
                                revenue: item.revenue,
                              })
                            }
                          >
                            <CalendarRange className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        className="text-center text-muted-foreground text-xs"
                      >
                        No items match
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <ResuablePagination
              currentPage={itemsPage}
              totalPages={itemsPagination.lastPage}
              totalItems={itemsPagination.total}
              rowsPerPage={itemsPerPage}
              onPageChange={setItemsPage}
              onRowsPerPageChange={setItemsPerPage}
              isLoading={isItemsLoading}
            />
          </CardContent>
        </Card>

        {/* Daily breakdown dialog */}
        <Dialog
          open={!!dailyOpen}
          onOpenChange={(o) => !o && setDailyOpen(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base">{dailyOpen?.name}</DialogTitle>
              <DialogDescription className="text-xs">
                Daily sales breakdown for the selected period
              </DialogDescription>
            </DialogHeader>
            {dailyOpen && (
              <DailyBreakdownWrapper
                itemName={dailyOpen.name}
                totalQty={dailyOpen.qty}
                totalRevenue={dailyOpen.revenue}
                outletId={outletIdParam}
                cashierId={cashierIdParam}
                dateFrom={formattedFrom}
                dateTo={formattedTo}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

function DailyBreakdownWrapper({
  itemName,
  totalQty,
  totalRevenue,
  outletId,
  cashierId,
  dateFrom,
  dateTo,
}: {
  itemName: string;
  totalQty: number;
  totalRevenue: number;
  outletId?: string;
  cashierId?: string;
  dateFrom: string;
  dateTo: string;
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data: dailyResponse, isLoading } = useGetSalesByItemDaily({
    dateFrom,
    dateTo,
    outletId,
    cashierId,
    itemName,
    page,
    perPage,
  });

  const dailyItems = dailyResponse?.data.items || [];
  const pagination = dailyResponse?.data.pagination || {
    total: 0,
    lastPage: 1,
  };
  const totals = dailyResponse?.data.totals || {
    qty: totalQty,
    revenue: totalRevenue,
  };

  return (
    <div className="space-y-2">
      <div className="max-h-[50vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-right text-xs">Qty</TableHead>
              <TableHead className="text-right text-xs">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : dailyItems.length > 0 ? (
              dailyItems.map((d) => (
                <TableRow key={d.date}>
                  <TableCell className="text-xs">{d.displayDate}</TableCell>
                  <TableCell className="text-right text-xs">{d.qty}</TableCell>
                  <TableCell className="text-right text-xs font-semibold">
                    {formatCurrency(d.revenue)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground text-xs"
                >
                  No daily breakdown data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="border-t pt-2">
        <Table>
          <TableBody>
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell className="text-xs">Total</TableCell>
              <TableCell className="text-right text-xs">{totals.qty}</TableCell>
              <TableCell className="text-right text-xs">
                {formatCurrency(totals.revenue)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <ResuablePagination
        currentPage={page}
        totalPages={pagination.lastPage}
        totalItems={pagination.total}
        rowsPerPage={perPage}
        onPageChange={setPage}
        onRowsPerPageChange={setPerPage}
        isLoading={isLoading}
      />
    </div>
  );
}
