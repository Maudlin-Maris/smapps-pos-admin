import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Package, TrendingUp, Tag, Truck, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { InventoryItem } from "./InventoryItemForm";
import { BATCH_EXPIRY_BUSINESS_TYPES } from "./InventoryItemForm";
import type { MeasuringUnit } from "./MeasuringUnitManager";
import { outlets } from "@/data/outlets";
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
  onReceive: (
    itemId: string, type: AdjustmentType, quantity: number, reason: string,
    batchCostPrice?: number, batchNumber?: string, expiryDate?: string,
    pricing?: StockReceivePricing
  ) => void;
}

export default function BulkReceiveStockDialog({
  open, onOpenChange, items, units, outletId, onReceive,
}: BulkReceiveStockDialogProps) {
  const [search, setSearch] = useState("");
  const [reason, setReason] = useState("");
  const [syncToCatalog, setSyncToCatalog] = useState(true);
  const [lineItems, setLineItems] = useState<ReceiveLineItem[]>([]);
  const [activeOutletId, setActiveOutletId] = useState<string>(
    outletId && outletId !== "all" ? outletId : (outlets[0]?.id ?? "")
  );

  const isAllMode = outletId === "all";
  const effectiveOutletId = isAllMode ? activeOutletId : outletId;
  const outlet = outlets.find(o => o.id === effectiveOutletId);
  const isRetail = outlet ? RETAIL_BUSINESS_TYPES.includes(outlet.businessType) : false;
  const isBatchTracked = outlet ? BATCH_EXPIRY_BUSINESS_TYPES.includes(outlet.businessType) : false;

  const outletItems = useMemo(
    () => items.filter(i => i.outletId === effectiveOutletId),
    [items, effectiveOutletId]
  );

  // Initialize line items when dialog opens or active outlet changes
  useEffect(() => {
    if (open) {
      setLineItems(outletItems.map(item => ({
        itemId: item.id,
        selected: false,
        quantity: 0,
        costPrice: item.costPrice,
        expiryDate: "",
        pricingMethod: "markup" as PricingMethod,
        pricingValue: 30,
        sellPrice: Math.round(item.costPrice * 1.3 * 100) / 100,
        expanded: false,
      })));
      setSearch("");
      setReason("");
      setSyncToCatalog(true);
    }
  }, [open, outletItems]);

  // Reset active outlet when dialog (re)opens
  useEffect(() => {
    if (open) {
      setActiveOutletId(outletId && outletId !== "all" ? outletId : (outlets[0]?.id ?? ""));
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
    const q = search.toLowerCase();
    return outletItems.filter(item =>
      item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q)
    );
  }, [outletItems, search]);

  const selectedLines = lineItems.filter(li => li.selected && li.quantity > 0);
  const totalItems = selectedLines.length;
  const totalCost = selectedLines.reduce((sum, li) => sum + li.quantity * li.costPrice, 0);
  const totalRetail = selectedLines.reduce((sum, li) => sum + li.quantity * li.sellPrice, 0);

  const handleReceiveAll = () => {
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

    for (const line of selectedLines) {
      const pricing: StockReceivePricing | undefined = isRetail ? {
        method: line.pricingMethod,
        value: line.pricingValue,
        sellPrice: line.sellPrice,
        syncToCatalog,
      } : undefined;

      onReceive(
        line.itemId,
        "add",
        line.quantity,
        reason,
        line.costPrice,
        isBatchTracked ? batchTimestamp : undefined,
        isBatchTracked ? line.expiryDate || undefined : undefined,
        pricing
      );
    }

    toast.success(`Received ${totalItems} items from shipment`, { duration: 4000 });
    onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg">Receive Shipment</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select items, enter quantities, and receive all at once{!isAllMode && outlet ? ` — ${outlet.name}` : ""}
              </p>
            </div>
            {isAllMode && (
              <Select value={activeOutletId} onValueChange={setActiveOutletId}>
                <SelectTrigger className="w-[200px] h-9">
                  <SelectValue placeholder="Select outlet" />
                </SelectTrigger>
                <SelectContent>
                  {outlets.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </DialogHeader>

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
                      <Input
                        type="number"
                        min={0}
                        placeholder="Qty"
                        value={line.quantity || ""}
                        onChange={(e) => updateLine(item.id, {
                          quantity: Number(e.target.value),
                          selected: Number(e.target.value) > 0 ? true : line.selected,
                        })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Cost"
                        value={line.costPrice || ""}
                        onChange={(e) => updateLine(item.id, { costPrice: Number(e.target.value) })}
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
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={line.pricingValue}
                            onChange={(e) => updateLine(item.id, { pricingValue: Number(e.target.value) })}
                            className="h-8 text-sm mt-1"
                          />
                        </div>
                        <div className="w-28">
                          <label className="text-xs font-medium text-muted-foreground">Sell Price</label>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={line.sellPrice}
                            onChange={(e) => {
                              const sp = Number(e.target.value);
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
              <Button onClick={handleReceiveAll} disabled={totalItems === 0}>
                <Truck className="h-4 w-4 mr-2" />
                Receive {totalItems > 0 ? `${totalItems} Items` : "Stock"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
