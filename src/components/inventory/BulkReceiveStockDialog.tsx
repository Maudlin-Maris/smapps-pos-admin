import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Package, TrendingUp, Truck, ChevronDown, ChevronUp, MapPin, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { InventoryItem } from "./InventoryItemForm";
import { BATCH_EXPIRY_BUSINESS_TYPES } from "./InventoryItemForm";
import type { MeasuringUnit } from "./MeasuringUnitManager";
import { useGetOutlets } from "@/services/api/outlets";
import { useBulkReceiveInventory } from "@/services/api/inventory/live-inventory";
import { useGetInventoryItems } from "@/services/api/inventory/item";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type { BusinessTypeId } from "@/data/businessTypes";
import type { StockReceivePricing, PricingMethod, AdjustmentType } from "./StockAdjustmentHistory";

const RETAIL_BUSINESS_TYPES: BusinessTypeId[] = [
  "grocery", "supermarket", "pharmacy", "wine_store", "clothing",
  "electronics", "hair_seller", "retail",
];

function calcSellPrice(costPrice: number, method: PricingMethod, value: number): number {
  if (method === "fixed") return value;
  if (method === "markup") return costPrice * (1 + value / 100);
  if (method === "margin") {
    if (value >= 100) return costPrice * 10;
    return costPrice / (1 - value / 100);
  }
  return costPrice;
}

interface ReceiveLineItem {
  itemId: string;
  selected: boolean;
  quantity: number;
  costPrice: number;
  expiryDate: string;
  pricingMethod: PricingMethod;
  pricingValue: number;
  sellPrice: number;
  expanded: boolean;
}

interface BulkReceiveStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  units: MeasuringUnit[];
  outletId: string;
  onSuccess?: () => void;
  onReceive: (
    itemId: string, type: AdjustmentType, quantity: number, reason: string,
    batchCostPrice?: number, batchNumber?: string, expiryDate?: string,
    pricing?: StockReceivePricing
  ) => void;
}

export default function BulkReceiveStockDialog({
  open, onOpenChange, items, units, outletId, onSuccess, onReceive,
}: BulkReceiveStockDialogProps) {
  const { trigger: triggerBulkReceive, isMutating: isReceiving } = useBulkReceiveInventory();
  const [search, setSearch] = useState("");
  const { data: outlets = [] } = useGetOutlets();
  const [reason, setReason] = useState("");
  const [syncToCatalog, setSyncToCatalog] = useState(true);
  const [lineItems, setLineItems] = useState<ReceiveLineItem[]>([]);
  const [activeOutletId, setActiveOutletId] = useState<string>(
    outletId && outletId !== "all" ? outletId : (outlets[0]?.id ?? "")
  );

  // Outlet selector is always available on the form regardless of context
  const effectiveOutletId = activeOutletId;
  const outlet = outlets.find(o => o.id === effectiveOutletId);
  const isRetail = outlet ? RETAIL_BUSINESS_TYPES.includes(outlet.businessType) : false;
  const isBatchTracked = outlet ? BATCH_EXPIRY_BUSINESS_TYPES.includes(outlet.businessType) : false;

  const { data: searchItemsRes } = useGetInventoryItems(
    open && effectiveOutletId ? {
      outletId: effectiveOutletId,
      search: search.trim() || undefined,
      per_page: DEFAULT_PAGE_SIZE,
    } : undefined
  );

  const outletItems = useMemo<InventoryItem[]>(() => {
    if (!searchItemsRes?.data) return [];
    return searchItemsRes.data.map((apiItem) => {
      const fullItem = items.find(x => x.id === apiItem.id || x.sku === apiItem.sku);
      return {
        id: apiItem.id,
        name: apiItem.name || fullItem?.name || "",
        description: fullItem?.description || "",
        sku: apiItem.sku || fullItem?.sku || "",
        categoryId: apiItem.categoryId || fullItem?.categoryId || "1",
        unitId: apiItem.unitId || fullItem?.unitId || "5",
        stock: apiItem.stock ?? apiItem.quantity ?? fullItem?.stock ?? 0,
        minStock: fullItem?.minStock ?? 0,
        costPrice: apiItem.costPrice ?? fullItem?.costPrice ?? 0,
        sellPrice: fullItem?.sellPrice ?? 0,
        pricingMethod: fullItem?.pricingMethod ?? "markup",
        pricingValue: fullItem?.pricingValue ?? 30,
        status: fullItem?.status ?? "good",
        conversions: fullItem?.conversions ?? [
          { id: Math.random().toString(), fromQuantity: 1, toQuantity: 1, toUnitId: apiItem.unitId || "5", sellable: true, sellPrice: fullItem?.sellPrice ?? 0 }
        ],
        outletId: apiItem.outletId || fullItem?.outletId || effectiveOutletId,
        batchNumber: fullItem?.batchNumber ?? "",
        expiryDate: fullItem?.expiryDate ?? "",
        batches: fullItem?.batches ?? [],
      };
    });
  }, [searchItemsRes, items, effectiveOutletId]);

  // Initialize line items when dialog opens or active outlet changes
  useEffect(() => {
    if (open) {
      setLineItems([]);
      setReason("");
      setSyncToCatalog(true);
    }
  }, [open, effectiveOutletId]);

  useEffect(() => {
    if (open && outletItems.length > 0) {
      setLineItems((prev) => {
        const next = [...prev];
        outletItems.forEach((item) => {
          if (!next.some((li) => li.itemId === item.id)) {
            next.push({
              itemId: item.id,
              selected: false,
              quantity: 0,
              costPrice: item.costPrice ?? 0,
              expiryDate: "",
              pricingMethod: "markup" as PricingMethod,
              pricingValue: 30,
              sellPrice: Math.round((item.costPrice ?? 0) * 1.3 * 100) / 100,
              expanded: false,
            });
          }
        });
        return next;
      });
    }
  }, [open, outletItems]);

  // Reset active outlet when dialog (re)opens
  useEffect(() => {
    if (open) {
      setActiveOutletId(outletId && outletId !== "all" ? outletId : (outlets[0]?.id ?? ""));
      setSearch("");
    }
  }, [open, outletId]);

  const updateLine = (itemId: string, updates: Partial<ReceiveLineItem>) => {
    setLineItems(prev => prev.map(li => {
      if (li.itemId !== itemId) return li;
      const updated = { ...li, ...updates };
      // Recalculate sell price if cost or pricing changed
      if (("costPrice" in updates || "pricingMethod" in updates || "pricingValue" in updates) && updated.costPrice > 0) {
        updated.sellPrice = Math.round(calcSellPrice(updated.costPrice, updated.pricingMethod, updated.pricingValue) * 100) / 100;
      }
      return updated;
    }));
  };

  const filteredItems = useMemo(() => {
    return outletItems;
  }, [outletItems]);

  const selectedLines = lineItems.filter(li => li.selected && li.quantity > 0);
  const totalItems = selectedLines.length;
  const totalCost = selectedLines.reduce((sum, li) => sum + li.quantity * li.costPrice, 0);
  const totalRetail = selectedLines.reduce((sum, li) => sum + li.quantity * li.sellPrice, 0);

  const handleReceiveAll = async () => {
    if (selectedLines.length === 0) {
      toast.error("Select at least one item with a quantity to receive");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a shipment note / reason");
      return;
    }

    const invalidLines = selectedLines.filter(li => li.costPrice <= 0);
    if (invalidLines.length > 0) {
      toast.error("All selected items must have a cost price greater than 0");
      return;
    }

    const batchTimestamp = new Date().toISOString().slice(0, 16).replace("T", " ");

    try {
      await triggerBulkReceive({
        outletId: effectiveOutletId,
        reason: reason.trim(),
        reference: `REC-${Date.now()}`,
        lines: selectedLines.map(line => ({
          inventoryItemId: line.itemId,
          quantity: line.quantity,
          costPrice: line.costPrice,
          batchNumber: isBatchTracked ? batchTimestamp : undefined,
          expiryDate: isBatchTracked ? line.expiryDate || undefined : undefined,
        })),
      });

      toast.success(`Received ${totalItems} items from shipment`, { duration: 4000 });
      onSuccess?.();
      onOpenChange(false);
    } catch (e: any) {
      // Handled
    }
  };

  const getUnit = (item: InventoryItem) => units.find(u => u.id === item.unitId)?.abbreviation || "";

  const selectAll = () => {
    const visibleIds = new Set(filteredItems.map(i => i.id));
    const allSelected = filteredItems.every(fi => lineItems.find(li => li.itemId === fi.id)?.selected);
    setLineItems(prev => prev.map(li =>
      visibleIds.has(li.itemId) ? { ...li, selected: !allSelected } : li
    ));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!w-full !max-w-none lg:!max-w-3xl p-0 flex flex-col overflow-hidden [&>button]:z-10">
        <SheetHeader className="px-6 pt-6 pb-5 border-b bg-gradient-to-br from-primary/5 via-background to-background">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center shrink-0">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg leading-tight">Receive Shipment</SheetTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select items, enter quantities and cost, then receive in one go.
              </p>
            </div>
          </div>

          {/* Destination outlet selector */}
          <div className="mt-4 rounded-lg border bg-card px-3 py-2.5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-accent-foreground/70" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Receive into outlet</p>
              <p className="text-xs text-muted-foreground/80 truncate">
                {outlet ? `${outletItems.length} item${outletItems.length === 1 ? "" : "s"} available at this location` : "Choose a destination location"}
              </p>
            </div>
            <Select value={activeOutletId} onValueChange={setActiveOutletId}>
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue placeholder="Select outlet" />
              </SelectTrigger>
              <SelectContent>
                {outlets.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    <div className="flex items-center gap-2">
                      <Store className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{o.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SheetHeader>

        {/* Search + select all */}
        <div className="px-6 py-3 flex items-center gap-3 border-b bg-muted/30">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={selectAll} className="shrink-0">
            {filteredItems.every(fi => lineItems.find(li => li.itemId === fi.id)?.selected) ? "Deselect All" : "Select All"}
          </Button>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1.5 min-h-0">
          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No items found</p>
            </div>
          )}
          {filteredItems.map(item => {
            const line = lineItems.find(li => li.itemId === item.id);
            if (!line) return null;
            const profit = line.sellPrice - line.costPrice;
            const unit = getUnit(item);

            return (
              <div
                key={item.id}
                className={cn(
                  "border rounded-lg transition-all",
                  line.selected ? "border-primary/40 bg-primary/[0.02]" : "border-border"
                )}
              >
                {/* Main row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <Checkbox
                    checked={line.selected}
                    onCheckedChange={(checked) => updateLine(item.id, { selected: !!checked })}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <Badge variant="outline" className="text-[10px] shrink-0">{item.sku}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      In stock: {item.stock} {unit} · Cost: ₦{item.costPrice.toFixed(2)}
                      {item.status !== "good" && (
                        <span className={cn("ml-2", item.status === "critical" ? "text-destructive" : "text-warning")}>
                          ● {item.status}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Quick qty + cost inputs */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-20">
                      <NumericInput
                        min={0}
                        precision={0}
                        placeholder="Qty"
                        value={line.quantity || ""}
                        onChange={(val) => updateLine(item.id, {
                          quantity: val || 0,
                          selected: (val || 0) > 0 ? true : line.selected,
                        })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <NumericInput
                        min={0}
                        step={0.01}
                        precision={2}
                        placeholder="Cost"
                        value={line.costPrice || ""}
                        onChange={(val) => updateLine(item.id, { costPrice: val || 0 })}
                        className="h-8 text-sm"
                      />
                    </div>
                    {(isRetail || isBatchTracked) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => updateLine(item.id, { expanded: !line.expanded })}
                      >
                        {line.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded pricing + expiry */}
                {line.expanded && (isRetail || isBatchTracked) && (
                  <div className="px-4 pb-3 pt-1 border-t border-dashed space-y-3 ml-10">
                    {isBatchTracked && (
                      <div className="w-48">
                        <label className="text-xs font-medium text-muted-foreground">Expiry Date</label>
                        <Input
                          type="date"
                          value={line.expiryDate}
                          onChange={(e) => updateLine(item.id, { expiryDate: e.target.value })}
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                    )}
                    {isRetail && (
                      <div className="flex items-end gap-3 flex-wrap">
                        <div className="w-32">
                          <label className="text-xs font-medium text-muted-foreground">Pricing</label>
                          <Select value={line.pricingMethod} onValueChange={(v) => updateLine(item.id, { pricingMethod: v as PricingMethod })}>
                            <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="markup">Markup %</SelectItem>
                              <SelectItem value="margin">Margin %</SelectItem>
                              <SelectItem value="fixed">Fixed Price</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-24">
                          <label className="text-xs font-medium text-muted-foreground">
                            {line.pricingMethod === "fixed" ? "Price" : "%"}
                          </label>
                           <NumericInput
                            min={0}
                            step={0.01}
                            precision={2}
                            value={line.pricingValue}
                            onChange={(val) => updateLine(item.id, { pricingValue: val || 0 })}
                            className="h-8 text-sm mt-1"
                          />
                        </div>
                        <div className="w-28">
                          <label className="text-xs font-medium text-muted-foreground">Sell Price</label>
                           <NumericInput
                            min={0}
                            step={0.01}
                            precision={2}
                            value={line.sellPrice}
                            onChange={(val) => {
                              const sp = val || 0;
                              updateLine(item.id, { sellPrice: sp });
                            }}
                            className="h-8 text-sm mt-1"
                          />
                        </div>
                        {line.costPrice > 0 && line.sellPrice > 0 && (
                          <div className="flex items-center gap-1.5 text-xs pb-1">
                            <TrendingUp className={cn("h-3.5 w-3.5", profit >= 0 ? "text-success" : "text-destructive")} />
                            <span className={cn("font-medium", profit >= 0 ? "text-success" : "text-destructive")}>
                              ₦{profit.toFixed(2)}/unit
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer summary + actions */}
        <div className="border-t px-6 py-4 space-y-4 bg-muted/20">
          {/* Shipment note */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Shipment Note <span className="text-destructive">*</span></label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. PO #1234 from ABC Supplier, Weekly restock delivery..."
              rows={2}
            />
          </div>

          {/* Catalog sync toggle for retail */}
          {isRetail && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/20">
              <div className="space-y-0.5">
                <Label htmlFor="bulk-sync-catalog" className="text-sm font-medium cursor-pointer">
                  Auto-update catalog for all items
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Update catalog quantities and sell prices for all received items
                </p>
              </div>
              <Switch id="bulk-sync-catalog" checked={syncToCatalog} onCheckedChange={setSyncToCatalog} />
            </div>
          )}

          {/* Summary bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{totalItems}</span> items selected
              </span>
              <span className="text-muted-foreground">
                Total cost: <span className="font-semibold text-foreground">₦{totalCost.toFixed(2)}</span>
              </span>
              {isRetail && totalRetail > 0 && (
                <span className="text-muted-foreground">
                  Retail value: <span className="font-semibold text-success">₦{totalRetail.toFixed(2)}</span>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleReceiveAll} disabled={totalItems === 0} isLoading={isReceiving}>
                <Truck className="h-4 w-4 mr-2" />
                Receive {totalItems > 0 ? `${totalItems} Items` : "Stock"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
