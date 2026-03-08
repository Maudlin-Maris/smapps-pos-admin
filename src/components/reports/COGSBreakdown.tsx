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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { StoredAdjustment } from "@/hooks/use-financial-data";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

const CONSUMPTION_TYPES = ["remove", "damaged"];

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface ItemNameMap {
  [id: string]: string;
}

interface Props {
  adjustments: StoredAdjustment[];
  itemNames: ItemNameMap;
}

interface COGSItem {
  name: string;
  totalCost: number;
  totalQty: number;
  avgCostPrice: number;
  adjustmentCount: number;
}

export default function COGSBreakdown({ adjustments, itemNames }: Props) {
  const consumptionAdj = adjustments.filter((a) =>
    CONSUMPTION_TYPES.includes(a.type)
  );

  // Group by inventory item
  const grouped = consumptionAdj.reduce<Record<string, COGSItem>>((acc, a) => {
    const key = a.inventoryItemId;
    if (!acc[key]) {
      acc[key] = {
        name: itemNames[key] || `Item ${key}`,
        totalCost: 0,
        totalQty: 0,
        avgCostPrice: 0,
        adjustmentCount: 0,
      };
    }
    acc[key].totalCost += a.costTotal;
    acc[key].totalQty += a.quantityChange;
    acc[key].adjustmentCount += 1;
    return acc;
  }, {});

  // Calculate avg cost and sort descending
  const items = Object.values(grouped)
    .map((item) => ({
      ...item,
      avgCostPrice: item.totalQty > 0 ? item.totalCost / item.totalQty : 0,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  const totalCOGS = items.reduce((s, i) => s + i.totalCost, 0);

  const chartData = items.slice(0, 8).map((item) => ({
    name: item.name.length > 15 ? item.name.slice(0, 14) + "…" : item.name,
    cost: item.totalCost,
  }));

  if (items.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-sm font-heading font-semibold mb-2">
          COGS Breakdown
        </h3>
        <p className="text-sm text-muted-foreground">
          No inventory consumption recorded for this period.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-sm font-heading font-semibold">
          COGS Breakdown by Item
        </h3>
        <Badge variant="secondary" className="text-xs">
          {items.length} item{items.length !== 1 && "s"} · {fmt(totalCOGS)}
        </Badge>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="px-4 pt-4 pb-2">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ left: 10, right: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `$${v.toFixed(0)}`}
                  className="text-xs"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  className="text-xs"
                />
                <Tooltip
                  formatter={(v: number) => fmt(v)}
                  labelClassName="text-sm font-medium"
                />
                <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border-t">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty Used</TableHead>
              <TableHead className="text-right">Avg Cost</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
              <TableHead className="text-right">% of COGS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.name}>
                <TableCell className="font-medium text-sm">
                  {item.name}
                </TableCell>
                <TableCell className="text-right text-sm font-mono">
                  {item.totalQty}
                </TableCell>
                <TableCell className="text-right text-sm font-mono">
                  {fmt(item.avgCostPrice)}
                </TableCell>
                <TableCell className="text-right text-sm font-mono font-semibold">
                  {fmt(item.totalCost)}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {totalCOGS > 0
                    ? ((item.totalCost / totalCOGS) * 100).toFixed(1)
                    : "0"}
                  %
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
