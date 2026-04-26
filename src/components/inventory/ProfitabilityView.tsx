import { useMemo, useState, Fragment } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, ChevronUp, TrendingUp, Info, Settings2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { computeProfitability } from "@/lib/profitability";
import type { CompositeItem } from "./CompositeItemForm";
import type { InventoryItem } from "./InventoryItemForm";
import type { MeasuringUnit } from "./MeasuringUnitManager";
import { outlets } from "@/data/outlets";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "./PaginationControls";

interface Props {
  inventoryItems: InventoryItem[];
  composites: CompositeItem[];
  units: MeasuringUnit[];
  outletOverheadDefaults: Record<string, number>;
  setOutletOverheadDefaults: (next: Record<string, number>) => void;
  selectedOutletId: string;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

const fmtCompact = (v: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);

export default function ProfitabilityView({
  inventoryItems,
  composites,
  units,
  outletOverheadDefaults,
  setOutletOverheadDefaults,
  selectedOutletId,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const isAll = selectedOutletId === "all";
  const visibleOutlets = isAll ? outlets : outlets.filter((o) => o.id === selectedOutletId);

  const result = useMemo(
    () =>
      computeProfitability({
        inventoryItems,
        composites,
        outletOverheadDefaults,
      }),
    [inventoryItems, composites, outletOverheadDefaults]
  );

  const rows = useMemo(() => {
    return inventoryItems
      .map((it) => {
        const r = result.rawMaterials[it.id];
        const unit = units.find((u) => u.id === it.unitId);
        return {
          item: it,
          unitAbbr: unit?.abbreviation || "unit",
          ...r,
        };
      })
      .filter((row) =>
        search.trim()
          ? row.item.name.toLowerCase().includes(search.toLowerCase().trim())
          : true
      )
      .sort((a, b) => b.totalContribution - a.totalContribution);
  }, [inventoryItems, units, result, search]);

  const totalProfitPotential = rows.reduce((s, r) => s + r.totalContribution, 0);
  const recipesPriced = Object.values(result.recipes).filter((r) => r.profit !== undefined).length;
  const recipesUnpriced = Object.values(result.recipes).length - recipesPriced;
  const topItem = rows.find((r) => r.weightedProfitPerUnit > 0);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const { page, setPage, perPage, setPerPage, totalPages, paginatedItems, totalItems, pageSizeOptions } =
    usePagination(rows);

  return (
    <>
      <div className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Profit potential"
            value={fmtCompact(totalProfitPotential)}
            hint="Sum of (weighted profit/unit × current stock) across all raw materials."
            icon={<TrendingUp className="h-4 w-4 text-success" />}
          />
          <KpiCard
            label="Recipes priced"
            value={`${recipesPriced} / ${recipesPriced + recipesUnpriced}`}
            hint="Recipes with a selling price. Unpriced recipes contribute zero profit until a price is set."
            icon={<Sparkles className="h-4 w-4 text-primary" />}
          />
          <KpiCard
            label="Top leverage item"
            value={topItem ? topItem.item.name : "—"}
            hint="Raw material with the highest weighted profit per unit consumed."
          />
          <KpiCard
            label="Best profit / unit"
            value={topItem ? `${fmt(topItem.weightedProfitPerUnit)} / ${topItem.unitAbbr}` : "—"}
            hint="Each unit (e.g. gram, ml, slice) of this material drives this much profit on average."
          />
        </div>

        {/* Settings + search */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Input
            placeholder="Search raw materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" size="sm" onClick={() => setShowSettings((s) => !s)} className="gap-2 w-fit">
            <Settings2 className="h-4 w-4" />
            {showSettings ? "Hide" : "Configure"} overhead defaults
          </Button>
        </div>

        {showSettings && (
          <Card className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Outlet overhead per unit produced (₦)</p>
                <p className="text-xs text-muted-foreground">
                  Allocates packaging, staff time, electricity and rent to every recipe in this outlet. Recipes can override this individually.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleOutlets.map((o) => (
                <div key={o.id} className="space-y-1">
                  <label className="text-xs font-medium">{o.name}</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={outletOverheadDefaults[o.id] ?? ""}
                    onChange={(e) =>
                      setOutletOverheadDefaults({
                        ...outletOverheadDefaults,
                        [o.id]: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        <PaginationControls
          page={page}
          totalPages={totalPages}
          perPage={perPage}
          totalItems={totalItems}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />

        {/* Ranking table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">#</th>
                  <th className="text-left px-3 py-2 font-medium">Raw material</th>
                  <th className="text-right px-3 py-2 font-medium">Stock</th>
                  <th className="text-right px-3 py-2 font-medium">
                    <HeaderHint label="Unit cost" hint="Weighted average cost per unit (WAC)." />
                  </th>
                  <th className="text-right px-3 py-2 font-medium">
                    <HeaderHint
                      label="Profit / unit"
                      hint="Weighted average profit each single unit of this material generates across every recipe that uses it."
                    />
                  </th>
                  <th className="text-right px-3 py-2 font-medium">
                    <HeaderHint
                      label="Total contribution"
                      hint="Profit potential of current stock = profit/unit × stock."
                    />
                  </th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center text-muted-foreground py-8">
                      No raw materials match.
                    </td>
                  </tr>
                )}
                {paginatedItems.map((row, idx) => {
                  const rank = (page - 1) * perPage + idx + 1;
                  const isOpen = expanded.has(row.item.id);
                  const hasUsage = row.recipesUsing.length > 0;
                  const profitPositive = row.weightedProfitPerUnit > 0;
                  const profitNegative = row.weightedProfitPerUnit < 0;
                  return (
                    <Fragment key={row.item.id}>
                      <tr className="border-t">
                        <td className="px-3 py-2 text-muted-foreground">{rank}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{row.item.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {hasUsage ? `${row.recipesUsing.length} recipe${row.recipesUsing.length > 1 ? "s" : ""}` : "Unused in recipes"}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {row.item.stock} <span className="text-muted-foreground text-xs">{row.unitAbbr}</span>
                        </td>
                        <td className="px-3 py-2 text-right">{fmt(row.unitCost)}</td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right font-medium",
                            profitPositive && "text-success",
                            profitNegative && "text-destructive"
                          )}
                        >
                          {row.hasAnyPricedRecipe ? `${fmt(row.weightedProfitPerUnit)} / ${row.unitAbbr}` : "—"}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2 text-right font-semibold",
                            profitPositive && "text-success",
                            profitNegative && "text-destructive"
                          )}
                        >
                          {row.hasAnyPricedRecipe ? fmt(row.totalContribution) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {hasUsage && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggle(row.item.id)}
                              aria-label="Toggle recipe drill-down"
                            >
                              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          )}
                        </td>
                      </tr>
                      {isOpen && hasUsage && (
                        <tr className="bg-muted/30">
                          <td colSpan={7} className="px-3 py-3">
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Per-recipe contribution
                              </p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead className="text-muted-foreground">
                                    <tr>
                                      <th className="text-left py-1 pr-3">Recipe</th>
                                      <th className="text-right py-1 px-2">Qty / serving</th>
                                      <th className="text-right py-1 px-2">Sell price</th>
                                      <th className="text-right py-1 px-2">Recipe profit</th>
                                      <th className="text-right py-1 px-2">Margin</th>
                                      <th className="text-right py-1 pl-2">Profit / unit raw</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.recipesUsing.map((rec) => {
                                      const r = result.recipes[rec.recipeId];
                                      return (
                                        <tr key={rec.recipeId} className="border-t border-border/50">
                                          <td className="py-1.5 pr-3">{rec.recipeName}</td>
                                          <td className="py-1.5 px-2 text-right">
                                            {rec.quantityPerServing} {row.unitAbbr}
                                          </td>
                                          <td className="py-1.5 px-2 text-right">
                                            {r.sellPrice ? fmt(r.sellPrice) : <Badge variant="outline" className="text-[10px]">No price</Badge>}
                                          </td>
                                          <td
                                            className={cn(
                                              "py-1.5 px-2 text-right",
                                              rec.recipeProfit > 0 && "text-success",
                                              rec.recipeProfit < 0 && "text-destructive"
                                            )}
                                          >
                                            {rec.hasSellPrice ? fmt(rec.recipeProfit) : "—"}
                                          </td>
                                          <td className="py-1.5 px-2 text-right">
                                            {rec.recipeMargin !== undefined ? `${rec.recipeMargin.toFixed(1)}%` : "—"}
                                          </td>
                                          <td
                                            className={cn(
                                              "py-1.5 pl-2 text-right font-medium",
                                              rec.profitPerRawUnit > 0 && "text-success",
                                              rec.profitPerRawUnit < 0 && "text-destructive"
                                            )}
                                          >
                                            {rec.hasSellPrice ? fmt(rec.profitPerRawUnit) : "—"}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <p className="text-[11px] text-muted-foreground">
          Profit / unit raw = recipe profit ÷ qty of raw material per serving. Weighted average across recipes is weighted by the qty each recipe consumes.
        </p>
      </div>
    </>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
        {icon}
        <span>{label}</span>
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" aria-label={`What is ${label}?`} className="text-muted-foreground hover:text-foreground transition-colors">
              <Info className="h-3 w-3 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" collisionPadding={12} className="w-[260px] text-xs leading-relaxed whitespace-normal break-words">
            {hint}
          </PopoverContent>
        </Popover>
      </div>
      <div className="font-heading font-bold text-lg truncate">{value}</div>
    </Card>
  );
}

function HeaderHint({ label, hint }: { label: string; hint: string }) {
  return (
    <span className="inline-flex items-center gap-1 justify-end">
      {label}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" aria-label={`What is ${label}?`} onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground transition-colors">
            <Info className="h-3 w-3 opacity-60" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="end" collisionPadding={12} className="w-[260px] text-xs leading-relaxed whitespace-normal break-words normal-case tracking-normal">
          {hint}
        </PopoverContent>
      </Popover>
    </span>
  );
}
