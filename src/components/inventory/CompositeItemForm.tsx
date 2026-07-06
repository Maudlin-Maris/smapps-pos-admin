import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResuablePagination } from "@/components/ui/reusable-pagination";
import { InventoryItemPicker } from "@/components/inventory/InventoryItemPicker";
import { useGetInventoryItem } from "@/services/api/inventory/item";
import { useGetItems, useGetItem } from "@/services/api/catalog/item";
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
  Plus,
  Pencil,
  Trash2,
  Layers,
  X,
  ChevronsUpDown,
  Check,
  Tag,
  TrendingUp,
  Info,
  Loader2,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { MeasuringUnit } from "./MeasuringUnitManager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatNaira } from "@/lib/currency";
import { useGetSubstituteGroups } from "@/services/api/inventory/substitute-group";
import ComponentSubstituteEditor from "./ComponentSubstituteEditor";
import {
  getProducibleWithSubstitutes,
  SubstituteGroup,
  type ComponentSubstituteConfig,
} from "@/lib/composite-substitution";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

import {
  useCreateComposite,
  useUpdateComposite,
  useDeleteComposite,
  useGetComposites,
} from "@/services/api/inventory/composite";
import { CatalogItem } from "@/lib/types/catalog-items-list-response";
import type { MenuItem } from "@/components/menu/MenuItemForm";

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
  item?: any;
  itemName?: string;
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

function calcCompositeSellPrice(
  totalCost: number,
  method: CompositePricingMethod,
  value: number,
): number {
  if (method === "fixed") return value;
  if (method === "markup") return totalCost * (1 + value / 100);
  if (method === "margin") {
    if (value >= 100) return totalCost * 10;
    return totalCost / (1 - value / 100);
  }
  return totalCost;
}

interface Props {
  onMutate: () => void;
  units: MeasuringUnit[];
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

export default function CompositeItemForm({
  onMutate,
  units,
  readOnly,
  selectedOutletId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CompositeItem | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, selectedOutletId]);

  const { data: compositesRes } = useGetComposites({
    outletId: selectedOutletId === "all" ? undefined : selectedOutletId,
    search: debouncedSearch.trim() || undefined,
    page,
    per_page: perPage,
  });



  const { data: subGroupsRes } = useGetSubstituteGroups({
    outletId: selectedOutletId === "all" ? undefined : selectedOutletId,
    per_page: DEFAULT_PAGE_SIZE,
  });
  const allGroups = subGroupsRes?.data ?? [];
  const groups = useMemo(
    () =>
      allGroups.filter(
        (g) => !selectedOutletId || g.outletId === selectedOutletId,
      ),
    [allGroups, selectedOutletId],
  );

  const createCompositeMutation = useCreateComposite();
  const updateCompositeMutation = useUpdateComposite();
  const deleteCompositeMutation = useDeleteComposite();

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      name: item.name,
      menuItemId: item.menuItemId || "",
      menuVariantId: item.menuVariantId || "",
      description: item.description,
      components: item.components.map((comp: any) => ({
        ...comp,
        item: comp.item || undefined,
      })),
      sellPrice: item.sellPrice ?? "",
      overheadPerUnit: item.overheadPerUnit ?? "",
      pricingMethod: (item.pricingMethod as CompositePricingMethod) ?? "markup",
      pricingValue: item.pricingValue ?? 30,
    });
    setOpen(true);
  };

  const addComponent = () => {
    setForm((f) => ({
      ...f,
      components: [
        ...f.components,
        { inventoryItemId: "", quantity: 1, role: "primary" as ComponentRole },
      ],
    }));
  };

  const updateComponent = (
    index: number,
    field: keyof CompositeComponent,
    value: string | number,
  ) => {
    setForm((f) => {
      const arr = [...f.components];
      arr[index] = { ...arr[index], [field]: value };
      return { ...f, components: arr };
    });
  };

  const removeComponent = (index: number) => {
    setForm((f) => ({
      ...f,
      components: f.components.filter((_, i) => i !== index),
    }));
  };

  const handleItemLoaded = useCallback((index: number, item: any) => {
    setForm((f) => {
      const updated = [...f.components];
      if (updated[index] && !updated[index].item) {
        updated[index] = { ...updated[index], item };
      }
      return { ...f, components: updated };
    });
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Composite item name is required");
      return;
    }
    if (form.components.length === 0) {
      toast.error("Add at least one component");
      return;
    }
    const validComponents = form.components.filter(
      (c) => c.inventoryItemId && c.quantity > 0,
    );
    if (validComponents.length === 0) {
      toast.error("All components need a valid item and quantity");
      return;
    }

    const sellPriceNum =
      form.sellPrice === "" || form.sellPrice === null
        ? 0
        : Number(form.sellPrice);

    const generatedSku = form.menuItemId
      ? `RECIPE-${form.menuItemId}`
      : `RECIPE-${form.name.toUpperCase().replace(/\s+/g, "-")}`;

    const componentsPayload = validComponents.map((c) => ({
      inventoryItemId: c.inventoryItemId,
      quantity: c.quantity,
      role: c.role as "primary" | "secondary",
      unitId: c.unitId || undefined,
      allowSubstitute: c.allowSubstitute,
      substituteMode: c.substituteMode,
      substitutes: c.substitutes?.map((s) => ({
        inventoryItemId: s.inventoryItemId,
        priority: s.priority,
        conversionRatio: s.conversionRatio,
      })),
      substituteGroupIds: c.substituteGroupIds,
    }));

    try {
      if (editing) {
        await updateCompositeMutation.trigger({
          id: editing.id,
          payload: {
            name: form.name,
            sku: generatedSku,
            sellPrice: sellPriceNum,
            description: form.description,
            components: componentsPayload,
            outletId: selectedOutletId || "",
          },
        });
        toast.success("Composite item updated");
      } else {
        await createCompositeMutation.trigger({
          name: form.name,
          sku: generatedSku,
          sellPrice: sellPriceNum,
          description: form.description,
          components: componentsPayload,
          outletId: selectedOutletId || "",
        });
        toast.success("Composite item created");
      }
      onMutate();
      setOpen(false);
    } catch (e: any) {
      toast.error(
        e.response?.data?.message ||
          e.message ||
          "Failed to save composite item",
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCompositeMutation.trigger(id);
      toast.success("Composite item deleted");
      onMutate();
    } catch (e: any) {
      toast.error(
        e.response?.data?.message ||
          e.message ||
          "Failed to delete composite item",
      );
    }
  };

  // Live cost economics for the form being edited.
  const rawCost = useMemo(() => {
    return form.components.reduce((sum, comp) => {
      const item = comp.item;
      if (!item) return sum;
      const baseCost = item.costPrice ?? 0;
      if (!comp.unitId || comp.unitId === item.unitId) {
        return sum + baseCost * (comp.quantity || 0);
      }
      // Find conversion target baseUnitsPer
      let baseUnitsPer = 1;
      const conversion = (item.conversions || []).find(
        (c: any) => c.toUnitId === comp.unitId,
      );
      if (
        conversion &&
        conversion.toQuantity > 0 &&
        conversion.fromQuantity > 0
      ) {
        baseUnitsPer = conversion.fromQuantity / conversion.toQuantity;
      }
      return sum + baseCost * baseUnitsPer * (comp.quantity || 0);
    }, 0);
  }, [form.components]);

  const getProducibleQty = (components: CompositeComponent[]) => {
    if (components.length === 0)
      return {
        producible: 0,
        limitingId: undefined as string | undefined,
        hasComponents: false,
      };
    const loadedItems = components.map((c) => c.item).filter(Boolean);
    const res = getProducibleWithSubstitutes(
      components,
      (c) => {
        const item = c.item;
        if (!item) return 0;
        let baseUnitsPer = 1;
        if (c.unitId && c.unitId !== item.unitId) {
          const conversion = (item.conversions || []).find(
            (conv: any) => conv.toUnitId === c.unitId,
          );
          if (
            conversion &&
            conversion.toQuantity > 0 &&
            conversion.fromQuantity > 0
          ) {
            baseUnitsPer = conversion.fromQuantity / conversion.toQuantity;
          }
        }
        return (c.quantity || 0) * baseUnitsPer;
      },
      loadedItems,
      groups,
    );
    return {
      producible: res.producible,
      limitingId: res.limitingId,
      hasComponents: components.some((c) => !!c.inventoryItemId),
      substituteHint: res.substituteHint,
    };
  };

  const overheadValue =
    form.overheadPerUnit === "" ? 0 : Number(form.overheadPerUnit) || 0;
  const totalCost = rawCost + overheadValue;
  const sellNum = form.sellPrice === "" ? 0 : Number(form.sellPrice) || 0;
  const profit = sellNum - totalCost;
  const profitPositive = profit >= 0;
  const producibleInfo = useMemo(
    () => getProducibleQty(form.components),
    [form.components, groups],
  );
  const limitingItemName = useMemo(() => {
    if (!producibleInfo.limitingId) return "";
    const comp = form.components.find((c) => c.inventoryItemId === producibleInfo.limitingId);
    return comp?.item?.name || comp?.itemName || "Unknown";
  }, [producibleInfo.limitingId, form.components]);

  const totalPages = compositesRes?.meta?.last_page || 1;
  const totalItems = compositesRes?.meta?.total || 0;
  const displayComposites = compositesRes?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search composites..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {!readOnly && (
          <Button size="sm" onClick={openNew} className="w-fit">
            <Plus className="h-4 w-4 mr-1" /> Add Composite Item
          </Button>
        )}
      </div>

      <ResuablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={totalItems}
        rowsPerPage={perPage}
        onRowsPerPageChange={setPerPage}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayComposites.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Layers className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-sm truncate">
                    {item.name}
                  </p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
              {!readOnly && (
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(item)}
                    disabled={deleteCompositeMutation.isMutating}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteCompositeMutation.isMutating}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
            <ul className="space-y-1.5">
              {item.components.map((comp, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      comp.role === "primary"
                        ? "bg-primary"
                        : "bg-muted-foreground/40",
                    )}
                  />
                  {comp.itemName || "—"} — {comp.quantity}{" "}
                  {comp.unitAbbr || "—"}
                  <Badge
                    variant={comp.role === "primary" ? "default" : "secondary"}
                    className="text-[10px] px-1.5 py-0 h-4 ml-auto"
                  >
                    {comp.role}
                  </Badge>
                </li>
              ))}
            </ul>
            {(() => {
              const cardSell = item.sellPrice ?? 0;
              return (
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="text-muted-foreground">Cost / unit</div>
                    <div className="font-medium tabular-nums">—</div>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <div className="text-muted-foreground">Sell / unit</div>
                    <div className="font-medium tabular-nums">
                      {cardSell > 0 ? formatNaira(cardSell) : "—"}
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Producible now</span>
              <Badge
                variant="outline"
                className="tabular-nums font-semibold border-muted/30 text-muted-foreground"
              >
                — units
              </Badge>
            </div>
          </Card>
        ))}
        {displayComposites.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">
            No composite items found
          </p>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="!w-full !max-w-none lg:!max-w-lg p-0 flex flex-col overflow-hidden [&>button]:z-10"
        >
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle>
              {editing ? "Edit Composite Item" : "Create Composite Item"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Menu Item *</label>
                <MenuItemCombobox
                  menuItemId={form.menuItemId}
                  menuVariantId={form.menuVariantId}
                  outletId={
                    selectedOutletId === "all" ? undefined : selectedOutletId
                  }
                  onSelect={(itemId, variantId, displayName) => {
                    setForm((f) => ({
                      ...f,
                      menuItemId: itemId,
                      menuVariantId: variantId,
                      name: displayName,
                    }));
                  }}
                />
                {form.name && (
                  <p className="text-xs text-muted-foreground">
                    Selected:{" "}
                    <span className="font-medium text-foreground">
                      {form.name}
                    </span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Brief description"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Components</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addComponent}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                {form.components.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">
                    No components added yet
                  </p>
                )}
                {form.components.map((comp, i) => (
                  <CompositeComponentRow
                    key={i}
                    comp={comp}
                    i={i}
                    selectedOutletId={selectedOutletId}
                    units={units}
                    groups={groups}
                    updateComponent={updateComponent}
                    removeComponent={removeComponent}
                    onItemLoaded={handleItemLoaded}
                    setForm={setForm}
                  />
                ))}

                {producibleInfo.hasComponents && (
                  <div
                    className={cn(
                      "rounded-lg border p-3 flex items-center justify-between gap-3 text-xs",
                      producibleInfo.producible === 0
                        ? "border-destructive/40 bg-destructive/5"
                        : producibleInfo.producible < 5
                          ? "border-warning/40 bg-warning/5"
                          : "border-success/40 bg-success/5",
                    )}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-muted-foreground">
                        Producible from current stock
                      </div>
                      {limitingItemName && (
                        <div className="text-[11px] text-muted-foreground truncate">
                          Limited by{" "}
                          <span className="font-medium text-foreground">
                            {limitingItemName}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className={cn(
                          "text-lg font-bold tabular-nums leading-none",
                          producibleInfo.producible === 0
                            ? "text-destructive"
                            : "text-foreground",
                        )}
                      >
                        {producibleInfo.producible}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
                        units
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cost & Pricing — derived from components (BOM) */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <label className="text-sm font-medium">
                    Cost & Selling Price
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="How is cost calculated?"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="bottom"
                      align="start"
                      collisionPadding={12}
                      className="w-[280px] text-xs leading-relaxed whitespace-normal break-words"
                    >
                      <p>
                        Raw cost is auto-calculated from each component's WAC ×
                        quantity. Add an optional overhead (packaging, staff,
                        power) per unit produced. Then pick a pricing method —{" "}
                        <strong>Markup %</strong>, <strong>Margin %</strong>, or{" "}
                        <strong>Fixed Price</strong> — to derive the selling
                        price.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Cost summary */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Raw materials cost
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatNaira(rawCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">
                      Overhead override (₦)
                    </span>
                    <NumericInput
                      min={0}
                      step={0.01}
                      precision={2}
                      value={form.overheadPerUnit}
                      onChange={(val) =>
                        setForm({
                          ...form,
                          overheadPerUnit: val === null ? "" : val,
                        })
                      }
                      placeholder="Outlet default"
                      className="h-7 max-w-[120px] text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t pt-1.5 mt-1">
                    <span className="font-medium">Total cost / unit</span>
                    <span className="font-semibold tabular-nums">
                      {formatNaira(totalCost)}
                    </span>
                  </div>
                </div>

                {/* Pricing method */}
                <div className="grid grid-cols-[1fr_1fr_1fr] gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Pricing
                    </label>
                    <Select
                      value={form.pricingMethod}
                      onValueChange={(v) => {
                        const method = v as CompositePricingMethod;
                        const newSell =
                          totalCost > 0
                            ? Math.round(
                                calcCompositeSellPrice(
                                  totalCost,
                                  method,
                                  form.pricingValue,
                                ) * 100,
                              ) / 100
                            : sellNum;
                        setForm({
                          ...form,
                          pricingMethod: method,
                          sellPrice: newSell,
                        });
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
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
                    <NumericInput
                      min={0}
                      step={0.01}
                      precision={2}
                      value={form.pricingValue}
                      onChange={(val) => {
                        const val_ = val || 0;
                        const newSell =
                          totalCost > 0
                            ? Math.round(
                                calcCompositeSellPrice(
                                  totalCost,
                                  form.pricingMethod,
                                  val_,
                                ) * 100,
                              ) / 100
                            : sellNum;
                        setForm({
                          ...form,
                          pricingValue: val_,
                          sellPrice: newSell,
                        });
                      }}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Sell Price (₦)
                    </label>
                    <NumericInput
                      min={0}
                      step={0.01}
                      precision={2}
                      value={form.sellPrice}
                      onChange={(val) =>
                        setForm({ ...form, sellPrice: val === null ? "" : val })
                      }
                      className="h-9"
                    />
                  </div>
                </div>

                {totalCost > 0 && sellNum > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp
                      className={cn(
                        "h-3.5 w-3.5",
                        profitPositive ? "text-success" : "text-destructive",
                      )}
                    />
                    <span
                      className={cn(
                        "font-medium",
                        profitPositive ? "text-success" : "text-destructive",
                      )}
                    >
                      {formatNaira(profit)}/unit profit
                    </span>
                    <span className="text-muted-foreground">
                      ({((profit / totalCost) * 100).toFixed(1)}% markup ·{" "}
                      {((profit / sellNum) * 100).toFixed(1)}% margin)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                createCompositeMutation.isMutating ||
                updateCompositeMutation.isMutating
              }
            >
              {createCompositeMutation.isMutating ||
              updateCompositeMutation.isMutating
                ? "Saving..."
                : editing
                  ? "Update"
                  : "Create"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MenuItemCombobox({
  menuItemId,
  menuVariantId,
  onSelect,
  outletId,
}: {
  menuItemId: string;
  menuVariantId: string;
  onSelect: (itemId: string, variantId: string, displayName: string) => void;
  outletId?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 500);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch search results
  const {
    data: searchRes,
    isLoading,
    isValidating,
  } = useGetItems(
    isOpen
      ? {
          search: debouncedSearch.trim() || undefined,
          per_page: DEFAULT_PAGE_SIZE,
          outletId,
        }
      : undefined,
  );

  const searchItems = (searchRes?.data || []) as unknown as MenuItem[];

  // Fetch single item details if menuItemId is set but not in current search results
  const { data: singleRes } = useGetItem(
    menuItemId && !searchItems.some((i) => i.id === menuItemId)
      ? menuItemId
      : undefined,
  );

  // Build flat list: menu items + their variants
  const options = useMemo(() => {
    const list: {
      key: string;
      itemId: string;
      variantId: string;
      label: string;
      isVariant: boolean;
    }[] = [];
    const items = [...searchItems];
    const singleItem = singleRes as unknown as MenuItem | undefined;
    if (singleItem && !items.some((i) => i.id === singleItem.id)) {
      items.push(singleItem);
    }

    for (const mi of items) {
      if (!mi.variants || mi.variants.length === 0) {
        list.push({
          key: mi.id,
          itemId: mi.id,
          variantId: "",
          label: mi.name,
          isVariant: false,
        });
      } else {
        for (const v of mi.variants) {
          list.push({
            key: `${mi.id}-${v.id}`,
            itemId: mi.id,
            variantId: v.id,
            label: `${mi.name} — ${v.name}`,
            isVariant: true,
          });
        }
      }
    }
    return list;
  }, [searchItems, singleRes]);

  const selectedOption = options.find(
    (o) => o.itemId === menuItemId && o.variantId === menuVariantId,
  );
  const selectedLabel = selectedOption?.label;

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Clear search on open change
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  const handleClear = () => {
    onSelect("", "", "");
    setIsOpen(false);
  };

  const handleSelectOption = (opt: (typeof options)[number]) => {
    onSelect(opt.itemId, opt.variantId, opt.label);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2 relative w-full" ref={containerRef}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group w-full justify-between font-normal h-9 text-xs px-2 truncate"
      >
        {selectedLabel ? (
          <span className="truncate group-hover:text-accent-foreground">
            {selectedLabel}
          </span>
        ) : menuItemId ? (
          <span className="truncate text-muted-foreground group-hover:text-accent-foreground">
            {menuItemId}
          </span>
        ) : (
          <span className="text-muted-foreground group-hover:text-accent-foreground">
            Search menu items...
          </span>
        )}
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-1" />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 border border-border rounded-lg bg-popover shadow-md pointer-events-auto flex flex-col overflow-hidden">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search menu items..."
              className="flex h-9 w-full rounded-md bg-transparent py-2 text-xs outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="max-h-[190px] overflow-y-auto p-1 min-h-0">
            {isLoading || isValidating ? (
              <div className="py-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching items...</span>
              </div>
            ) : options.length === 0 && !menuItemId ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No menu items found.
              </div>
            ) : (
              <div className="space-y-0.5">
                {menuItemId && (
                  <button
                    type="button"
                    className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-left"
                    onClick={handleClear}
                  >
                    <X className="h-3.5 w-3.5 mr-2" />
                    <span>Clear selection</span>
                  </button>
                )}

                {options.map((opt) => {
                  const isSelected =
                    menuItemId === opt.itemId &&
                    menuVariantId === opt.variantId;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      className={cn(
                        "group relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-xs outline-none transition-colors text-left",
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground",
                      )}
                      onClick={() => handleSelectOption(opt)}
                    >
                      <Check
                        className={cn(
                          "h-3.5 w-3.5 mr-2 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span
                        className={cn(
                          "truncate",
                          opt.isVariant ? "ml-1" : "font-medium",
                        )}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface CompositeComponentRowProps {
  comp: CompositeComponent;
  i: number;
  selectedOutletId?: string;
  units: MeasuringUnit[];
  groups: SubstituteGroup[];
  updateComponent: (index: number, field: keyof CompositeComponent, value: any) => void;
  removeComponent: (index: number) => void;
  onItemLoaded: (index: number, item: any) => void;
  setForm: React.Dispatch<React.SetStateAction<any>>;
}

function CompositeComponentRow({
  comp,
  i,
  selectedOutletId,
  units,
  groups,
  updateComponent,
  removeComponent,
  onItemLoaded,
  setForm,
}: CompositeComponentRowProps) {
  const { data: fetchedItem } = useGetInventoryItem(
    comp.inventoryItemId && !comp.item ? comp.inventoryItemId : undefined
  );

  useEffect(() => {
    if (fetchedItem && !comp.item) {
      onItemLoaded(i, fetchedItem);
    }
  }, [fetchedItem, comp.item, i, onItemLoaded]);

  const item = comp.item || fetchedItem;

  const unitOptions = useMemo(() => {
    if (!item) return [];
    const baseUnit = units.find((u) => u.id === item.unitId);
    const opts = [
      {
        id: item.unitId,
        label: baseUnit ? `${baseUnit.name} (${baseUnit.abbreviation})` : "Base unit",
        baseUnitsPer: 1,
      },
    ];
    (item.conversions || []).forEach((c: any) => {
      if (!c.toUnitId || c.toQuantity <= 0 || c.fromQuantity <= 0) return;
      const u = units.find((x) => x.id === c.toUnitId);
      if (!u) return;
      opts.push({
        id: c.toUnitId,
        label: `${u.name} (${u.abbreviation})`,
        baseUnitsPer: c.fromQuantity / c.toQuantity,
      });
    });
    return opts;
  }, [item, units]);

  const activeUnitId = comp.unitId || item?.unitId || "";

  const unitCost = useMemo(() => {
    if (!item) return 0;
    const baseCost = item.costPrice ?? 0;
    if (!comp.unitId || comp.unitId === item.unitId) return baseCost;
    const opt = unitOptions.find((o) => o.id === comp.unitId);
    return baseCost * (opt?.baseUnitsPer ?? 1);
  }, [item, comp.unitId, unitOptions]);

  const lineCost = unitCost * (comp.quantity || 0);

  const defaultAbbr = useMemo(() => {
    if (!item) return "";
    return units.find((u) => u.id === item.unitId)?.abbreviation || "";
  }, [item, units]);

  return (
    <div className="space-y-2 p-3 border rounded-lg">
      <div className="flex items-center gap-2">
        <InventoryItemPicker
          selectedId={comp.inventoryItemId}
          outletId={selectedOutletId === "all" ? undefined : selectedOutletId}
          placeholder="Search component..."
          triggerPlaceholder="Select component item"
          onSelect={(id, selectedItem) => {
            setForm((f: any) => {
              const updated = [...f.components];
              updated[i] = {
                ...updated[i],
                inventoryItemId: id,
                unitId: undefined,
                item: selectedItem || undefined,
              };
              return { ...f, components: updated };
            });
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => removeComponent(i)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <NumericInput
          className="w-20"
          value={comp.quantity}
          onChange={(val) => updateComponent(i, "quantity", val || 0)}
          min={0}
          step={0.1}
          precision={2}
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
            {defaultAbbr}
          </span>
        )}
        {comp.inventoryItemId && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            @ {formatNaira(unitCost)} ={" "}
            <span className="font-medium text-foreground">
              {formatNaira(lineCost)}
            </span>
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
      {comp.inventoryItemId && item && (
        <ComponentSubstituteEditor
          originalItemId={comp.inventoryItemId}
          config={comp}
          onChange={(next) => {
            setForm((f: any) => {
              const updated = [...f.components];
              updated[i] = { ...updated[i], ...next };
              return { ...f, components: updated };
            });
          }}
          groups={groups}
          outletId={selectedOutletId === "all" ? undefined : selectedOutletId}
        />
      )}
    </div>
  );
}
