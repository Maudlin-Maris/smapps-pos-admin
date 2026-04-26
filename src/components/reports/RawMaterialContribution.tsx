import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Info } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StoredAdjustment } from "@/hooks/use-financial-data";

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const CONSUMPTION_TYPES = ["remove", "damaged"];

interface ItemNameMap {
  [id: string]: string;
}

interface ItemUnitMap {
  [id: string]: string;
}

interface Props {
  adjustments: StoredAdjustment[];
  itemNames: ItemNameMap;
  itemUnits?: ItemUnitMap;
  totalRevenue: number;
  /** Period total inventory COGS from P&L. Used as the markup denominator so
   *  Revenue Earned per material = cost × (totalRevenue / totalCOGS). */
  totalCOGS?: number;
}

interface Row {
  id: string;
  name: string;
  unit: string;
  qty: number;
  totalCost: number;
  avgCost: number;
  attributedRevenue: number;
  profit: number;
  margin: number;
  share: number;
}

const COLUMN_DEFINITIONS: { label: string; description: string }[] = [
  { label: "Raw Material", description: "Inventory item consumed during the period (with its share of total COGS)." },
  { label: "Qty Used", description: "Total quantity consumed during the period, shown in the item's base unit (e.g., g, kg, loaves)." },
  { label: "Avg Cost", description: "Total cost of all units consumed during the period, valued at Weighted Average Cost (WAC)." },
  { label: "Revenue Earned", description: "Revenue attributed to this raw material based on its share of total cost of goods sold for the period." },
  { label: "Profit", description: "Revenue earned minus the total cost. Positive values mean the material contributed profit." },
  { label: "Margin", description: "Profit as a percentage of attributed revenue for this raw material." },
];

export default function RawMaterialContribution({
  adjustments,
  itemNames,
  itemUnits = {},
  totalRevenue,
}: Props) {
  const { rows, totalCOGS, totalProfit } = useMemo(() => {
    const consumption = adjustments.filter((a) =>
      CONSUMPTION_TYPES.includes(a.type)
    );

    const grouped: Record<
      string,
      { name: string; unit: string; qty: number; cost: number }
    > = {};

    for (const a of consumption) {
      const id = a.inventoryItemId;
      if (!grouped[id]) {
        grouped[id] = {
          name: itemNames[id] || `Item ${id}`,
          unit: itemUnits[id] || "units",
          qty: 0,
          cost: 0,
        };
      }
      grouped[id].qty += a.quantityChange;
      grouped[id].cost += a.costTotal;
    }

    const totalCOGS = Object.values(grouped).reduce((s, g) => s + g.cost, 0);

    const rows: Row[] = Object.entries(grouped)
      .map(([id, g]) => {
        const share = totalCOGS > 0 ? g.cost / totalCOGS : 0;
        const attributedRevenue = totalRevenue * share;
        const profit = attributedRevenue - g.cost;
        const margin =
          attributedRevenue > 0 ? (profit / attributedRevenue) * 100 : 0;
        return {
          id,
          name: g.name,
          unit: g.unit,
          qty: g.qty,
          totalCost: g.cost,
          avgCost: g.cost,
          attributedRevenue,
          profit,
          margin,
          share: share * 100,
        };
      })
      .sort((a, b) => b.profit - a.profit);

    const totalProfit = rows.reduce((s, r) => s + r.profit, 0);

    return { rows, totalCOGS, totalProfit };
  }, [adjustments, itemNames, itemUnits, totalRevenue]);

  const {
    page,
    setPage,
    perPage,
    setPerPage,
    totalPages,
    paginatedItems,
    totalItems,
    pageSizeOptions,
  } = usePagination(rows, 10);

  if (rows.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-heading font-semibold mb-2">
          Raw Material Contribution
        </h3>
        <p className="text-sm text-muted-foreground">
          No inventory consumption recorded for this period.
        </p>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 p-4 border-b">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-heading font-semibold">
                Raw Material Financial Contribution
              </h3>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Column explanations"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[300px] text-xs space-y-1.5">
                  <p className="font-semibold">Column reference</p>
                  <ul className="space-y-1">
                    {COLUMN_DEFINITIONS.map((c) => (
                      <li key={c.label}>
                        <span className="font-medium">{c.label}:</span>{" "}
                        <span className="text-muted-foreground">{c.description}</span>
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cost incurred and revenue earned from each raw material consumed
              during the selected period.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {rows.length} item{rows.length !== 1 && "s"}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              COGS {fmt(totalCOGS)}
            </Badge>
            <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                totalProfit >= 0
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive"
              )}
            >
              Profit {fmt(totalProfit)}
            </Badge>
          </div>
        </div>

        <div className="flex items-start gap-2 px-4 py-2.5 bg-muted/40 border-b text-[11px] text-muted-foreground">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            Example: if you sold a sandwich made with 2 loaves of bread, the
            row for <span className="font-medium">Bread</span> shows the cost
            of those 2 loaves, and the share of sandwich revenue attributed to
            them — letting you isolate profit from each ingredient, separate
            from the finished product's profit.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2.5 border-b">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows per page</span>
            <Select
              value={String(perPage)}
              onValueChange={(v) => setPerPage(Number(v))}
            >
              <SelectTrigger className="h-8 w-[72px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              {(page - 1) * perPage + 1}-
              {Math.min(page * perPage, totalItems)} of {totalItems}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {COLUMN_DEFINITIONS.map((col, i) => (
                  <TableHead
                    key={col.label}
                    className={i === 0 ? "" : "text-right"}
                  >
                    <Tooltip>
                      <TooltipTrigger
                        className={cn(
                          "inline-flex items-center gap-1",
                          i !== 0 && "ml-auto"
                        )}
                      >
                        {col.label}
                        <Info className="h-3 w-3 opacity-60" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[240px] text-xs">
                        {col.description}
                      </TooltipContent>
                    </Tooltip>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-sm">
                    <div className="flex flex-col">
                      <span>{r.name}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {r.share.toFixed(1)}% of COGS
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {r.qty}
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {r.unit}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {fmt(r.avgCost)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {fmt(r.attributedRevenue)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-sm font-mono font-semibold",
                      r.profit >= 0 ? "text-success" : "text-destructive"
                    )}
                  >
                    <span className="inline-flex items-center justify-end gap-1">
                      {r.profit >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {fmt(r.profit)}
                    </span>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-sm",
                      r.margin >= 0
                        ? "text-muted-foreground"
                        : "text-destructive"
                    )}
                  >
                    {r.margin.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </TooltipProvider>
  );
}
