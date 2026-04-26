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

interface Props {
  adjustments: StoredAdjustment[];
  itemNames: ItemNameMap;
  totalRevenue: number;
}

interface Row {
  id: string;
  name: string;
  qty: number;
  unitCost: number;
  totalCost: number;
  attributedRevenue: number;
  profit: number;
  margin: number;
  share: number; // % of COGS
}

/**
 * Shows the contribution of each raw material / stock item to profit
 * during the selected period.
 *
 * Revenue is attributed to each consumed item proportionally to its
 * share of total COGS (cost-weighted attribution), giving a defensible
 * estimate of profit generated per raw material.
 */
export default function RawMaterialContribution({
  adjustments,
  itemNames,
  totalRevenue,
}: Props) {
  const { rows, totalCOGS, totalProfit } = useMemo(() => {
    const consumption = adjustments.filter((a) =>
      CONSUMPTION_TYPES.includes(a.type)
    );

    const grouped: Record<
      string,
      { name: string; qty: number; cost: number; entries: number }
    > = {};

    for (const a of consumption) {
      const id = a.inventoryItemId;
      if (!grouped[id]) {
        grouped[id] = {
          name: itemNames[id] || `Item ${id}`,
          qty: 0,
          cost: 0,
          entries: 0,
        };
      }
      grouped[id].qty += a.quantityChange;
      grouped[id].cost += a.costTotal;
      grouped[id].entries += 1;
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
          qty: g.qty,
          unitCost: g.qty > 0 ? g.cost / g.qty : 0,
          totalCost: g.cost,
          attributedRevenue,
          profit,
          margin,
          share: share * 100,
        };
      })
      .sort((a, b) => b.profit - a.profit);

    const totalProfit = rows.reduce((s, r) => s + r.profit, 0);

    return { rows, totalCOGS, totalProfit };
  }, [adjustments, itemNames, totalRevenue]);

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
            <h3 className="text-sm font-heading font-semibold">
              Raw Material Financial Contribution
            </h3>
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

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Raw Material</TableHead>
                <TableHead className="text-right">Qty Used</TableHead>
                <TableHead className="text-right">Cost / Unit</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">
                  <Tooltip>
                    <TooltipTrigger className="inline-flex items-center gap-1">
                      Revenue Earned
                      <Info className="h-3 w-3 opacity-60" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[240px] text-xs">
                      Revenue attributed to this raw material based on its
                      share of total cost of goods sold for the period.
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
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
                      units
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {fmt(r.unitCost)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {fmt(r.totalCost)}
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
