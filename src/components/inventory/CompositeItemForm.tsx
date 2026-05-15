import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "./PaginationControls";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Plus, Pencil, Trash2, Layers, X, ChevronsUpDown, Check, Tag, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { InventoryItem } from "./InventoryItemForm";
import type { MeasuringUnit } from "./MeasuringUnitManager";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatNaira } from "@/lib/currency";
import { useSubstituteGroups } from "@/data/substituteGroups";
import ComponentSubstituteEditor from "./ComponentSubstituteEditor";
import { getProducibleWithSubstitutes, type ComponentSubstituteConfig } from "@/lib/composite-substitution";

export type ComponentRole = "primary" | "secondary";
export type CompositePricingMethod = "markup" | "margin" | "fixed";

/** Composite component. Substitute-related fields are optional & additive —
 *  legacy components without them behave exactly as before. */
export interface CompositeComponent extends ComponentSubstituteConfig {
  inventoryItemId: string;
  quantity: number;
  role: ComponentRole;
  /** Unit the quantity is expressed in. Undefined = the item's base unit.
   *  Otherwise must match one of the item's conversion `toUnitId`s. */
  unitId?: string;
}

export interface CompositeItem {
  id: string;
  name: string;
  menuItemId?: string;
  menuVariantId?: string;
  description: string;
  components: CompositeComponent[];
  outletId: string;
  /** Selling price per single serving / unit produced. Required for profit calc. */
  sellPrice?: number;
  /** Per-recipe override for packaging + staff + power allocation per unit produced.
   *  Falls back to the outlet-level default when undefined. */
  overheadPerUnit?: number;
  /** Pricing strategy used to derive sellPrice from total cost. */
  pricingMethod?: CompositePricingMethod;
  /** Value paired with pricingMethod (% for markup/margin, ₦ for fixed). */
  pricingValue?: number;
}

function calcCompositeSellPrice(totalCost: number, method: CompositePricingMethod, value: number): number {
  if (method === "fixed") return value;
  if (method === "markup") return totalCost * (1 + value / 100);
  if (method === "margin") {
    if (value >= 100) return totalCost * 10;
    return totalCost / (1 - value / 100);
  }
  return totalCost;
}

interface Props {
  composites: CompositeItem[];
  setComposites: React.Dispatch<React.SetStateAction<CompositeItem[]>>;
  inventoryItems: InventoryItem[];
  units: MeasuringUnit[];
  menuItems: { id: string; name: string; variants: { id: string; name: string }[] }[];
  readOnly?: boolean;
  selectedOutletId?: string;
}

const emptyForm = () => ({
  name: "",
  menuItemId: "" as string,
  menuVariantId: "" as string,
  description: "",
  components: [] as CompositeComponent[],
  sellPrice: "" as string | number,
  overheadPerUnit: "" as string | number,
  pricingMethod: "markup" as CompositePricingMethod,
  pricingValue: 30 as number,
});

export default function CompositeItemForm({ composites, setComposites, inventoryItems, units, menuItems, readOnly, selectedOutletId }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CompositeItem | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState("");
  const [allGroups] = useSubstituteGroups();
  const groups = useMemo(
    () => allGroups.filter((g) => !selectedOutletId || g.outletId === selectedOutletId),
    [allGroups, selectedOutletId]
  );

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (item: CompositeItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      menuItemId: item.menuItemId || "",
      menuVariantId: item.menuVariantId || "",
      description: item.description,
      components: [...item.components],
      sellPrice: item.sellPrice ?? "",
      overheadPerUnit: item.overheadPerUnit ?? "",
      pricingMethod: item.pricingMethod ?? "markup",
      pricingValue: item.pricingValue ?? 30,
    });
    setOpen(true);
  };

  const addComponent = () => {
    setForm((f) => ({
      ...f,
      components: [...f.components, { inventoryItemId: "", quantity: 1, role: "primary" as ComponentRole }],
    }));
  };

  const updateComponent = (index: number, field: keyof CompositeComponent, value: string | number) => {
    setForm((f) => {
      const updated = [...f.components];
      updated[index] = { ...updated[index], [field]: value };
      return { ...f, components: updated };
    });
  };

  const removeComponent = (index: number) => {
    setForm((f) => ({
      ...f,
      components: f.components.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Composite item name is required");
      return;
    }
    if (form.components.length === 0) {
      toast.error("Add at least one component");
      return;
    }
    const validComponents = form.components.filter((c) => c.inventoryItemId && c.quantity > 0);
    if (validComponents.length === 0) {
      toast.error("All components need a valid item and quantity");
      return;
    }

    const sellPriceNum =
      form.sellPrice === "" || form.sellPrice === null
        ? undefined
        : Number(form.sellPrice);
    const overheadNum =
      form.overheadPerUnit === "" || form.overheadPerUnit === null
        ? undefined
        : Number(form.overheadPerUnit);

    if (editing) {
      setComposites((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, name: form.name, menuItemId: form.menuItemId || undefined, menuVariantId: form.menuVariantId || undefined, description: form.description, components: validComponents, sellPrice: sellPriceNum, overheadPerUnit: overheadNum, pricingMethod: form.pricingMethod, pricingValue: form.pricingValue } : c))
      );
      toast.success("Composite item updated");
    } else {
      setComposites((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name: form.name, menuItemId: form.menuItemId || undefined, menuVariantId: form.menuVariantId || undefined, description: form.description, components: validComponents, outletId: selectedOutletId || "", sellPrice: sellPriceNum, overheadPerUnit: overheadNum, pricingMethod: form.pricingMethod, pricingValue: form.pricingValue },
      ]);
      toast.success("Composite item created");
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setComposites((prev) => prev.filter((c) => c.id !== id));
    toast.success("Composite item deleted");
  };

  const getItemName = (id: string) => inventoryItems.find((i) => i.id === id)?.name || "Unknown";
  const getItem = (id: string) => inventoryItems.find((i) => i.id === id);
  const getUnitAbbr = (unitId?: string) =>
    unitId ? units.find((u) => u.id === unitId)?.abbreviation || "" : "";
  /** Abbreviation for a component's selected unit (falls back to base unit). */
  const getComponentUnitAbbr = (comp: CompositeComponent) => {
    const item = getItem(comp.inventoryItemId);
    if (!item) return "";
    const unitId = comp.unitId || item.unitId;
    return getUnitAbbr(unitId);
  };
  /** Unit options available for a component: base unit + every conversion target. */
  const getComponentUnitOptions = (itemId: string) => {
    const item = getItem(itemId);
    if (!item) return [] as { id: string; label: string; baseUnitsPer: number }[];
    const baseUnit = units.find((u) => u.id === item.unitId);
    const opts: { id: string; label: string; baseUnitsPer: number }[] = [
      {
        id: item.unitId,
        label: baseUnit ? `${baseUnit.name} (${baseUnit.abbreviation})` : "Base unit",
        baseUnitsPer: 1,
      },
    ];
    (item.conversions || []).forEach((c) => {
      if (!c.toUnitId || c.toQuantity <= 0 || c.fromQuantity <= 0) return;
      const u = units.find((x) => x.id === c.toUnitId);
      if (!u) return;
      // 1 sub-unit = fromQuantity / toQuantity base units
      opts.push({
        id: c.toUnitId,
        label: `${u.name} (${u.abbreviation})`,
        baseUnitsPer: c.fromQuantity / c.toQuantity,
      });
    });
    return opts;
  };
  /** Cost per 1 of the component's selected unit. */
  const getComponentUnitCost = (comp: CompositeComponent) => {
    const item = getItem(comp.inventoryItemId);
    if (!item) return 0;
    const baseCost = item.costPrice ?? 0;
    if (!comp.unitId || comp.unitId === item.unitId) return baseCost;
    const opt = getComponentUnitOptions(comp.inventoryItemId).find((o) => o.id === comp.unitId);
    return baseCost * (opt?.baseUnitsPer ?? 1);
  };
  const getComponentLineCost = (comp: CompositeComponent) =>
    getComponentUnitCost(comp) * (comp.quantity || 0);
  /** Base units consumed per 1 composite unit produced. */
  const getComponentBaseUnitsConsumed = (comp: CompositeComponent) => {
    const item = getItem(comp.inventoryItemId);
    if (!item) return 0;
    let baseUnitsPer = 1;
    if (comp.unitId && comp.unitId !== item.unitId) {
      const opt = getComponentUnitOptions(comp.inventoryItemId).find((o) => o.id === comp.unitId);
      baseUnitsPer = opt?.baseUnitsPer ?? 1;
    }
    return (comp.quantity || 0) * baseUnitsPer;
  };
  /** Max producible composite units given current component stocks AND any
   *  configured substitutes. Falls back to primary-only when components have
   *  no substitute configuration (full backward compatibility). */
  const getProducibleQty = (components: CompositeComponent[]) => {
    if (components.length === 0) return { producible: 0, limitingId: undefined as string | undefined, hasComponents: false };
    const res = getProducibleWithSubstitutes(
      components,
      (c) => getComponentBaseUnitsConsumed(c),
      inventoryItems,
      groups,
    );
    return {
      producible: res.producible,
      limitingId: res.limitingId,
      hasComponents: components.some((c) => !!c.inventoryItemId),
      substituteHint: res.substituteHint,
    };
  };
  // Back-compat for card list rendering
  const getItemUnit = (id: string) => {
    const item = inventoryItems.find((i) => i.id === id);
    if (!item) return "";
    return units.find((u) => u.id === item.unitId)?.abbreviation || "";
  };
  const getItemCost = (id: string) => inventoryItems.find((i) => i.id === id)?.costPrice ?? 0;

  // Live cost economics for the form being edited.
  const rawCost = useMemo(
    () => form.components.reduce((sum, c) => sum + getComponentLineCost(c), 0),
    [form.components, inventoryItems, units]
  );
  const overheadValue = form.overheadPerUnit === "" ? 0 : Number(form.overheadPerUnit) || 0;
  const totalCost = rawCost + overheadValue;
  const sellNum = form.sellPrice === "" ? 0 : Number(form.sellPrice) || 0;
  const profit = sellNum - totalCost;
  const profitPositive = profit >= 0;
  const producibleInfo = useMemo(
    () => getProducibleQty(form.components),
    [form.components, inventoryItems, units]
  );
  const limitingItemName = producibleInfo.limitingId
    ? getItemName(producibleInfo.limitingId)
    : "";

  const filtered = composites.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const { page, setPage, perPage, setPerPage, totalPages, paginatedItems, totalItems, pageSizeOptions } = usePagination(filtered);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Input placeholder="Search composites..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {!readOnly && (
          <Button size="sm" onClick={openNew} className="w-fit">
            <Plus className="h-4 w-4 mr-1" /> Add Composite Item
          </Button>
        )}
      </div>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        perPage={perPage}
        totalItems={totalItems}
        pageSizeOptions={pageSizeOptions}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paginatedItems.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Layers className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-sm truncate">{item.name}</p>
                  {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                </div>
              </div>
              {!readOnly && (
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            <ul className="space-y-1.5">
              {item.components.map((comp, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className={cn("h-1.5 w-1.5 rounded-full", comp.role === "primary" ? "bg-primary" : "bg-muted-foreground/40")} />
                  {getItemName(comp.inventoryItemId)} — {comp.quantity} {getComponentUnitAbbr(comp) || getItemUnit(comp.inventoryItemId)}
                  <Badge variant={comp.role === "primary" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-4 ml-auto">
                    {comp.role}
                  </Badge>
                </li>
              ))}
            </ul>
            {(() => {
              const cardCost = item.components.reduce(
                (s, c) => s + getComponentLineCost(c),
                0
              ) + (item.overheadPerUnit ?? 0);
              const cardSell = item.sellPrice ?? 0;
              const cardProfit = cardSell - cardCost;
              const positive = cardProfit >= 0;
              return (
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="text-muted-foreground">Cost / unit</div>
                    <div className="font-medium tabular-nums">{formatNaira(cardCost)}</div>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <div className="text-muted-foreground">Sell / unit</div>
                    <div className="font-medium tabular-nums">{cardSell > 0 ? formatNaira(cardSell) : "—"}</div>
                  </div>
                  {cardSell > 0 && (
                    <div className="space-y-0.5 text-right">
                      <div className="text-muted-foreground">Profit</div>
                      <div className={cn("font-semibold tabular-nums", positive ? "text-success" : "text-destructive")}>
                        {formatNaira(cardProfit)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            {(() => {
              const info = getProducibleQty(item.components);
              if (!info.hasComponents) return null;
              return (
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Producible now</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "tabular-nums font-semibold",
                      info.producible === 0
                        ? "border-destructive/50 text-destructive"
                        : info.producible < 5
                          ? "border-warning/50 text-warning"
                          : "border-success/50 text-success"
                    )}
                  >
                    {info.producible} units
                  </Badge>
                </div>
              );
            })()}

          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">No composite items found</p>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="!w-full !max-w-none lg:!max-w-lg p-0 flex flex-col overflow-hidden [&>button]:z-10">
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle>{editing ? "Edit Composite Item" : "Create Composite Item"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Menu Item *</label>
              <MenuItemCombobox
                menuItems={menuItems}
                menuItemId={form.menuItemId}
                menuVariantId={form.menuVariantId}
                onSelect={(itemId, variantId, displayName) => {
                  setForm((f) => ({ ...f, menuItemId: itemId, menuVariantId: variantId, name: displayName }));
                }}
              />
              {form.name && (
                <p className="text-xs text-muted-foreground">Selected: <span className="font-medium text-foreground">{form.name}</span></p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Components</label>
                <Button type="button" variant="outline" size="sm" onClick={addComponent}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              {form.components.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">No components added yet</p>
              )}
              {form.components.map((comp, i) => {
                const unitOptions = comp.inventoryItemId
                  ? getComponentUnitOptions(comp.inventoryItemId)
                  : [];
                const item = getItem(comp.inventoryItemId);
                const activeUnitId = comp.unitId || item?.unitId || "";
                const unitCost = getComponentUnitCost(comp);
                const lineCost = unitCost * (comp.quantity || 0);
                return (
                  <div key={i} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <ItemCombobox
                        inventoryItems={inventoryItems}
                        value={comp.inventoryItemId}
                        onSelect={(v) => {
                          // Reset unit when the underlying item changes so we
                          // don't carry over a unitId that's no longer valid.
                          setForm((f) => {
                            const updated = [...f.components];
                            updated[i] = { ...updated[i], inventoryItemId: v, unitId: undefined };
                            return { ...f, components: updated };
                          });
                        }}
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeComponent(i)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input
                        type="number"
                        className="w-20"
                        value={comp.quantity}
                        onChange={(e) => updateComponent(i, "quantity", Number(e.target.value))}
                        min={0}
                        step={0.1}
                        placeholder="Qty"
                      />
                      {comp.inventoryItemId && unitOptions.length > 0 ? (
                        <Select
                          value={activeUnitId}
                          onValueChange={(v) => updateComponent(i, "unitId", v)}
                        >
                          <SelectTrigger className="h-9 w-32">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {unitOptions.map((opt) => (
                              <SelectItem key={opt.id} value={opt.id}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground w-10 shrink-0">
                          {getItemUnit(comp.inventoryItemId)}
                        </span>
                      )}
                      {comp.inventoryItemId && (
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          @ {formatNaira(unitCost)} = <span className="font-medium text-foreground">{formatNaira(lineCost)}</span>
                        </span>
                      )}
                      <div className="flex gap-1 ml-auto">
                        <Button
                          type="button"
                          variant={comp.role === "primary" ? "default" : "outline"}
                          size="sm"
                          className="h-7 text-xs px-2.5"
                          onClick={() => updateComponent(i, "role", "primary")}
                        >
                          Primary
                        </Button>
                        <Button
                          type="button"
                          variant={comp.role === "secondary" ? "secondary" : "outline"}
                          size="sm"
                          className="h-7 text-xs px-2.5"
                          onClick={() => updateComponent(i, "role", "secondary")}
                        >
                          Secondary
                        </Button>
                      </div>
                    </div>
                    {comp.inventoryItemId && (
                      <ComponentSubstituteEditor
                        originalItemId={comp.inventoryItemId}
                        config={comp}
                        onChange={(next) => {
                          setForm((f) => {
                            const updated = [...f.components];
                            updated[i] = { ...updated[i], ...next };
                            return { ...f, components: updated };
                          });
                        }}
                        inventoryItems={inventoryItems}
                        groups={groups}
                      />
                    )}
                  </div>
                );
              })}

              {producibleInfo.hasComponents && (
                <div className={cn(
                  "rounded-lg border p-3 flex items-center justify-between gap-3 text-xs",
                  producibleInfo.producible === 0
                    ? "border-destructive/40 bg-destructive/5"
                    : producibleInfo.producible < 5
                      ? "border-warning/40 bg-warning/5"
                      : "border-success/40 bg-success/5"
                )}>
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-muted-foreground">Producible from current stock</div>
                    {limitingItemName && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        Limited by <span className="font-medium text-foreground">{limitingItemName}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn(
                      "text-lg font-bold tabular-nums leading-none",
                      producibleInfo.producible === 0 ? "text-destructive" : "text-foreground"
                    )}>
                      {producibleInfo.producible}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">units</div>
                  </div>
                </div>
              )}
            </div>

            {/* Cost & Pricing — derived from components (BOM) */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <label className="text-sm font-medium">Cost & Selling Price</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="How is cost calculated?">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="start" collisionPadding={12} className="w-[280px] text-xs leading-relaxed whitespace-normal break-words">
                    <p>Raw cost is auto-calculated from each component's WAC × quantity. Add an optional overhead (packaging, staff, power) per unit produced. Then pick a pricing method — <strong>Markup %</strong>, <strong>Margin %</strong>, or <strong>Fixed Price</strong> — to derive the selling price.</p>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Cost summary */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Raw materials cost</span>
                  <span className="font-medium tabular-nums">{formatNaira(rawCost)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Overhead override (₦)</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.overheadPerUnit}
                    onChange={(e) =>
                      setForm({ ...form, overheadPerUnit: e.target.value === "" ? "" : Number(e.target.value) })
                    }
                    placeholder="Outlet default"
                    className="h-7 max-w-[120px] text-right"
                  />
                </div>
                <div className="flex items-center justify-between border-t pt-1.5 mt-1">
                  <span className="font-medium">Total cost / unit</span>
                  <span className="font-semibold tabular-nums">{formatNaira(totalCost)}</span>
                </div>
              </div>

              {/* Pricing method */}
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Pricing</label>
                  <Select
                    value={form.pricingMethod}
                    onValueChange={(v) => {
                      const method = v as CompositePricingMethod;
                      const newSell = totalCost > 0
                        ? Math.round(calcCompositeSellPrice(totalCost, method, form.pricingValue) * 100) / 100
                        : sellNum;
                      setForm({ ...form, pricingMethod: method, sellPrice: newSell });
                    }}
                  >
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markup">Markup %</SelectItem>
                      <SelectItem value="margin">Margin %</SelectItem>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {form.pricingMethod === "fixed" ? "Price" : "%"}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.pricingValue}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const newSell = totalCost > 0
                        ? Math.round(calcCompositeSellPrice(totalCost, form.pricingMethod, val) * 100) / 100
                        : sellNum;
                      setForm({ ...form, pricingValue: val, sellPrice: newSell });
                    }}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Sell Price (₦)</label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.sellPrice}
                    onChange={(e) =>
                      setForm({ ...form, sellPrice: e.target.value === "" ? "" : Number(e.target.value) })
                    }
                    className="h-9"
                  />
                </div>
              </div>

              {totalCost > 0 && sellNum > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <TrendingUp className={cn("h-3.5 w-3.5", profitPositive ? "text-success" : "text-destructive")} />
                  <span className={cn("font-medium", profitPositive ? "text-success" : "text-destructive")}>
                    {formatNaira(profit)}/unit profit
                  </span>
                  <span className="text-muted-foreground">
                    ({((profit / totalCost) * 100).toFixed(1)}% markup · {((profit / sellNum) * 100).toFixed(1)}% margin)
                  </span>
                </div>
              )}
            </div>

          </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MenuItemCombobox({
  menuItems,
  menuItemId,
  menuVariantId,
  onSelect,
}: {
  menuItems: { id: string; name: string; variants: { id: string; name: string }[] }[];
  menuItemId: string;
  menuVariantId: string;
  onSelect: (itemId: string, variantId: string, displayName: string) => void;
}) {
  const [open, setOpen] = useState(false);

  // Build flat list: menu items + their variants
  const options = useMemo(() => {
    const list: { key: string; itemId: string; variantId: string; label: string; isVariant: boolean }[] = [];
    for (const mi of menuItems) {
      if (mi.variants.length === 0) {
        list.push({ key: mi.id, itemId: mi.id, variantId: "", label: mi.name, isVariant: false });
      } else {
        for (const v of mi.variants) {
          list.push({ key: `${mi.id}-${v.id}`, itemId: mi.id, variantId: v.id, label: `${mi.name} — ${v.name}`, isVariant: true });
        }
      }
    }
    return list;
  }, [menuItems]);

  const selectedLabel = options.find(
    (o) => o.itemId === menuItemId && o.variantId === menuVariantId
  )?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal h-9 text-sm">
          <span className="truncate">{selectedLabel || "Search menu items..."}</span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search menu items..." />
          <CommandList>
            <CommandEmpty>No menu items found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.key}
                  value={opt.label}
                  onSelect={() => {
                    onSelect(opt.itemId, opt.variantId, opt.label);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-3.5 w-3.5", menuItemId === opt.itemId && menuVariantId === opt.variantId ? "opacity-100" : "opacity-0")} />
                  <span className={opt.isVariant ? "ml-1" : "font-medium"}>{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ItemCombobox({
  inventoryItems,
  value,
  onSelect,
}: {
  inventoryItems: InventoryItem[];
  value: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedName = inventoryItems.find((i) => i.id === value)?.name;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="flex-1 justify-between font-normal h-9 text-sm">
          <span className="truncate">{selectedName || "Select item..."}</span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search items..." />
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              {inventoryItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-3.5 w-3.5", value === item.id ? "opacity-100" : "opacity-0")} />
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
