import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "./PaginationControls";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { Search, ArrowUpRight, ArrowDownRight, History, Tag, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import type { InventoryItem, ItemBatch } from "./InventoryItemForm";
import { BATCH_EXPIRY_BUSINESS_TYPES } from "./InventoryItemForm";
import type { MeasuringUnit } from "./MeasuringUnitManager";
import { useGetOutlets } from "@/services/api/outlets";
import { type BusinessTypeId } from "@/data/businessTypes";

export type AdjustmentType = "add" | "remove" | "damaged" | "returned";

export interface StockAdjustment {
  id: string;
  inventoryItemId: string;
  type: AdjustmentType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: Date;
  outletId: string;
  costPrice: number;
  costTotal: number;
  batchNumber?: string;
  expiryDate?: string;
  sellPrice?: number;
  pricingMethod?: "markup" | "margin" | "fixed";
  pricingValue?: number;
  syncToCatalog?: boolean;
}

const adjustmentTypeLabels: Record<AdjustmentType, string> = {
  add: "Stock Added",
  remove: "Stock Removed",
  damaged: "Damaged",
  returned: "Returned",
};

export type PricingMethod = "markup" | "margin" | "fixed";

export interface StockReceivePricing {
  method: PricingMethod;
  value: number;
  sellPrice: number;
  syncToCatalog: boolean;
}

/** Business types where inventory items ARE catalog products (not recipe ingredients) */
const RETAIL_BUSINESS_TYPES: BusinessTypeId[] = [
  "grocery", "supermarket", "pharmacy", "wine_store", "clothing",
  "electronics", "hair_seller", "retail",
];

function isRetailType(outletId: string, outlets: any[]): boolean {
  const outlet = outlets.find(o => o.id === outletId);
  if (!outlet) return false;
  return RETAIL_BUSINESS_TYPES.includes(outlet.businessType);
}

function calcSellPrice(costPrice: number, method: PricingMethod, value: number): number {
  if (method === "fixed") return value;
  if (method === "markup") return costPrice * (1 + value / 100);
  if (method === "margin") {
    if (value >= 100) return costPrice * 10; // cap
    return costPrice / (1 - value / 100);
  }
  return costPrice;
}

function calcValueFromSellPrice(costPrice: number, sellPrice: number, method: PricingMethod): number {
  if (method === "fixed") return sellPrice;
  if (method === "markup") return costPrice > 0 ? ((sellPrice - costPrice) / costPrice) * 100 : 0;
  if (method === "margin") return sellPrice > 0 ? ((sellPrice - costPrice) / sellPrice) * 100 : 0;
  return 0;
}

interface AdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onAdjust: (
    itemId: string, type: AdjustmentType, quantity: number, reason: string,
    batchCostPrice?: number, batchNumber?: string, expiryDate?: string,
    pricing?: StockReceivePricing
  ) => void;
  /** Current catalog sell price for the item, if known */
  currentSellPrice?: number;
  /** Name of the outlet currently being worked on */
  outletName?: string;
}

export function StockAdjustDialog({ open, onOpenChange, item, onAdjust, currentSellPrice, outletName }: AdjustDialogProps) {
  const { data: outlets = [] } = useGetOutlets();
  const [type, setType] = useState<AdjustmentType>("add");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");
  const [batchCostPrice, setBatchCostPrice] = useState<number>(0);
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("new");
  const [returnBatchId, setReturnBatchId] = useState<string>("new");

  // Pricing state
  const [pricingMethod, setPricingMethod] = useState<PricingMethod>("markup");
  const [pricingValue, setPricingValue] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [syncToCatalog, setSyncToCatalog] = useState<boolean>(true);

  const showRetailPricing = item ? isRetailType(item.outletId, outlets) : false;

  // Check if this item's outlet is batch-tracked
  const selectedOutlet = item ? outlets.find(o => o.id === item.outletId) : null;
  const isBatchTracked = selectedOutlet ? BATCH_EXPIRY_BUSINESS_TYPES.includes(selectedOutlet.businessType) : false;
  const hasBatches = item?.batches && item.batches.length > 0;
  const isAddType = type === "add";
  const isReturnType = type === "returned";
  const isRemoveType = type === "remove" || type === "damaged";

  // Reset pricing when dialog opens or item changes
  useEffect(() => {
    if (item && open) {
      setBatchCostPrice(item.costPrice);
      const existingSellPrice = currentSellPrice || item.costPrice * 1.3; // default 30% markup
      setSellPrice(existingSellPrice);
      const defaultMarkup = item.costPrice > 0
        ? ((existingSellPrice - item.costPrice) / item.costPrice) * 100
        : 30;
      setPricingMethod("markup");
      setPricingValue(Math.round(defaultMarkup * 100) / 100);
    }
  }, [item, open, currentSellPrice]);

  // Recalculate sell price when cost or pricing params change
  useEffect(() => {
    if (isAddType && showRetailPricing && batchCostPrice > 0) {
      const newSellPrice = calcSellPrice(batchCostPrice, pricingMethod, pricingValue);
      setSellPrice(Math.round(newSellPrice * 100) / 100);
    }
  }, [batchCostPrice, pricingMethod, pricingValue, isAddType, showRetailPricing]);

  const handleSellPriceDirectChange = (newSellPrice: number) => {
    setSellPrice(newSellPrice);
    if (batchCostPrice > 0) {
      const newValue = calcValueFromSellPrice(batchCostPrice, newSellPrice, pricingMethod);
      setPricingValue(Math.round(newValue * 100) / 100);
    }
  };

  const handleSave = () => {
    if (quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (isAddType && batchCostPrice <= 0) {
      toast.error("Please enter the cost per unit for this batch");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for this adjustment");
      return;
    }
    if (isBatchTracked && isReturnType && returnBatchId === "new" && !expiryDate) {
      toast.error("Please select a batch to return to, or provide expiry date for a new batch");
      return;
    }
    if (!item) return;

    // For removals from specific batch, validate quantity
    if (isRemoveType && hasBatches && selectedBatchId !== "new") {
      const batch = item.batches!.find(b => b.id === selectedBatchId);
      if (batch && quantity > batch.quantity) {
        toast.error(`Cannot remove more than ${batch.quantity} from this batch`);
        return;
      }
    }

    // For returns to existing batch, pass that batch's info
    let finalBatchNumber = batchNumber;
    let finalExpiryDate = expiryDate;
    if (isReturnType && isBatchTracked && returnBatchId !== "new" && hasBatches) {
      const targetBatch = item.batches!.find(b => b.id === returnBatchId);
      if (targetBatch) {
        finalBatchNumber = targetBatch.batchNumber;
        finalExpiryDate = targetBatch.expiryDate;
      }
    }

    const pricing: StockReceivePricing | undefined = (isAddType && showRetailPricing) ? {
      method: pricingMethod,
      value: pricingValue,
      sellPrice,
      syncToCatalog,
    } : undefined;

    onAdjust(
      item.id,
      type,
      quantity,
      reason,
      isAddType ? batchCostPrice : undefined,
      isBatchTracked && isAddType ? (finalBatchNumber || new Date().toISOString().slice(0, 16).replace("T", " ")) : (isBatchTracked && isReturnType ? finalBatchNumber : undefined),
      isBatchTracked && isAddType ? finalExpiryDate : (isBatchTracked && isReturnType ? finalExpiryDate : undefined),
      pricing
    );
    setType("add");
    setQuantity(0);
    setReason("");
    setBatchCostPrice(0);
    setBatchNumber("");
    setExpiryDate("");
    setSelectedBatchId("new");
    setReturnBatchId("new");
    setPricingMethod("markup");
    setPricingValue(0);
    setSellPrice(0);
    setSyncToCatalog(true);
    onOpenChange(false);
  };

  const previewStock = item
    ? (isAddType || isReturnType)
        ? item.stock + quantity
        : item.stock - quantity
    : 0;

  const profitPerUnit = isAddType && batchCostPrice > 0 ? sellPrice - batchCostPrice : 0;
  const totalProfit = profitPerUnit * quantity;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!w-full !max-w-none lg:!max-w-lg p-0 flex flex-col overflow-hidden [&>button]:z-10">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle>
            {isAddType && showRetailPricing ? "Receive Stock" : "Adjust Stock"} — {item?.name}
          </SheetTitle>
          {outletName && (
            <p className="text-xs text-muted-foreground mt-1">
              Outlet: <span className="font-medium text-foreground">{outletName}</span>
            </p>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="text-sm text-muted-foreground">Current Stock</span>
            <span className="font-heading font-bold">{item?.stock ?? 0}</span>
          </div>

          {/* Show current batches for context */}
          {hasBatches && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Current Batches</p>
              {item!.batches!.map((b) => {
                const exp = b.expiryDate ? new Date(b.expiryDate) : null;
                const isExpired = exp ? exp < new Date() : false;
                return (
                  <div key={b.id} className={cn(
                    "flex items-center justify-between px-3 py-1.5 rounded text-xs",
                    isExpired ? "bg-destructive/5 text-destructive" : "bg-muted/50"
                  )}>
                    <span>{b.batchNumber} {b.expiryDate ? `· Exp: ${b.expiryDate}` : ""}</span>
                    <span className="font-medium">{b.quantity}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Adjustment Type</label>
            <Select value={type} onValueChange={(v) => setType(v as AdjustmentType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="add">{showRetailPricing ? "Receive New Stock" : "Add Stock (New Batch)"}</SelectItem>
                <SelectItem value="remove">Remove Stock</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* For removals, allow selecting which batch to remove from */}
          {isRemoveType && hasBatches && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Remove from batch</label>
              <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Oldest first (FEFO)</SelectItem>
                  {item!.batches!.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.batchNumber} · {b.quantity} units · Exp: {b.expiryDate || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* For returns, allow selecting which batch to return to */}
          {isReturnType && isBatchTracked && hasBatches && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Return to batch</label>
              <Select value={returnBatchId} onValueChange={setReturnBatchId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Create new batch</SelectItem>
                  {item!.batches!.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.batchNumber} · {b.quantity} units · Exp: {b.expiryDate || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <NumericInput
                min={0}
                precision={0}
                value={quantity}
                onChange={(val) => setQuantity(val || 0)}
              />
            </div>
            
            {isAddType && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Cost per unit (₦)</label>
                <NumericInput
                  min={0}
                  step={0.01}
                  precision={2}
                  value={batchCostPrice}
                  onChange={(val) => setBatchCostPrice(val || 0)}
                />
              </div>
            )}
          </div>

          {/* Batch info for new stock additions or new-batch returns */}
          {isBatchTracked && isAddType && (
            <div className="border-t pt-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Date</label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* ── Pricing Section (Retail business types only, on stock add) ── */}
          {isAddType && showRetailPricing && (
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-accent" />
                <label className="text-sm font-semibold">Sell Price & Markup</label>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Set the retail price for this item. Choose a pricing method or enter the sell price directly.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Pricing Method</label>
                  <Select value={pricingMethod} onValueChange={(v) => setPricingMethod(v as PricingMethod)}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markup">Markup %</SelectItem>
                      <SelectItem value="margin">Margin %</SelectItem>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {pricingMethod === "markup" ? "Markup %" : pricingMethod === "margin" ? "Margin %" : "Sell Price (₦)"}
                  </label>
                  <NumericInput
                    min={0}
                    step={0.01}
                    precision={2}
                    value={pricingValue}
                    onChange={(val) => setPricingValue(val || 0)}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Sell Price (₦)</label>
                <NumericInput
                  min={0}
                  step={0.01}
                  precision={2}
                  value={sellPrice}
                  onChange={(val) => handleSellPriceDirectChange(val || 0)}
                  className="h-9"
                />
              </div>

              {/* Profit preview */}
              {batchCostPrice > 0 && sellPrice > 0 && quantity > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20">
                  <TrendingUp className="h-4 w-4 text-success shrink-0" />
                  <div className="flex-1 text-xs space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit per unit</span>
                      <span className={cn("font-medium", profitPerUnit >= 0 ? "text-success" : "text-destructive")}>
                        ₦{profitPerUnit.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total profit ({quantity} units)</span>
                      <span className={cn("font-semibold", totalProfit >= 0 ? "text-success" : "text-destructive")}>
                        ₦{totalProfit.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Effective margin</span>
                      <span className="font-medium">
                        {sellPrice > 0 ? (((sellPrice - batchCostPrice) / sellPrice) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sync to catalog toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/5 border border-accent/20">
                <div className="space-y-0.5">
                  <Label htmlFor="sync-catalog" className="text-sm font-medium cursor-pointer">
                    Auto-update catalog
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically update catalog quantity and sell price when stock is received
                  </p>
                </div>
                <Switch
                  id="sync-catalog"
                  checked={syncToCatalog}
                  onCheckedChange={setSyncToCatalog}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason <span className="text-destructive">*</span></label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isAddType && showRetailPricing
                ? "e.g. Received new shipment from supplier, Purchase order #1234..."
                : "e.g. Received new shipment, Monthly recount..."}
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/20">
            <span className="text-sm font-medium">New Stock</span>
            <span className="font-heading font-bold text-accent">{previewStock}</span>
          </div>
        </div>
        </div>
        <SheetFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>
            {isAddType && showRetailPricing ? "Receive Stock" : "Confirm Adjustment"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface HistoryProps {
  adjustments: StockAdjustment[];
  inventoryItems: InventoryItem[];
  units: MeasuringUnit[];
  page: number;
  onPageChange: (p: number) => void;
  perPage: number;
  onPerPageChange: (pp: number) => void;
  totalPages: number;
  totalItems: number;
  search: string;
  onSearchChange: (s: string) => void;
  filterType: string;
  onFilterTypeChange: (t: string) => void;
  filterItem: string;
  onFilterItemChange: (i: string) => void;
}

export default function StockAdjustmentHistory({
  adjustments,
  inventoryItems,
  units,
  page,
  onPageChange,
  perPage,
  onPerPageChange,
  totalPages,
  totalItems,
  search,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterItem,
  onFilterItemChange,
}: HistoryProps) {
  const getItemName = (id: string) => inventoryItems.find((i) => i.id === id)?.name || "Deleted Item";
  const getItemUnit = (id: string) => {
    const item = inventoryItems.find((i) => i.id === id);
    if (!item) return "";
    return units.find((u) => u.id === item.unitId)?.abbreviation || "";
  };

  const isPositive = (type: AdjustmentType) => type === "add" || type === "returned";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search adjustments..." value={search} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterItem} onValueChange={onFilterItemChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Items" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            {inventoryItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={onFilterTypeChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="add">Stock Added</SelectItem>
            <SelectItem value="remove">Stock Removed</SelectItem>
            <SelectItem value="set">Stock Set</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {adjustments.length === 0 ? (
        <div className="text-center py-12">
          <History className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No adjustment history yet</p>
          <p className="text-xs text-muted-foreground mt-1">Stock changes will appear here</p>
        </div>
      ) : (
        <>
        <PaginationControls
          page={page}
          totalPages={totalPages}
          perPage={perPage}
          totalItems={totalItems}
          pageSizeOptions={[5, 10, 20, 50]}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
        />
        <div className="grid gap-2">
          {adjustments.map((adj) => (
            <Card key={adj.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                    isPositive(adj.type) ? "bg-success/10" : "bg-destructive/10"
                  )}>
                    {isPositive(adj.type) ? (
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{getItemName(adj.inventoryItemId)}</p>
                    <p className="text-xs text-muted-foreground truncate">{adj.reason}</p>
                    {adj.batchNumber && (
                      <p className="text-[10px] text-muted-foreground">Batch: {adj.batchNumber} {adj.expiryDate ? `· Exp: ${adj.expiryDate}` : ""}</p>
                    )}
                    {adj.syncToCatalog && adj.sellPrice && (
                      <p className="text-[10px] text-accent">
                        Catalog synced · Sell: ₦{adj.sellPrice.toFixed(2)}
                        {adj.pricingMethod && adj.pricingValue ? ` (${adj.pricingMethod} ${adj.pricingValue}%)` : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-heading font-bold",
                      isPositive(adj.type) ? "text-success" : "text-destructive"
                    )}>
                      {isPositive(adj.type) ? "+" : "-"}{Math.abs(adj.quantityChange)} {getItemUnit(adj.inventoryItemId)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {adj.previousStock} → {adj.newStock}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] capitalize whitespace-nowrap">
                    {adjustmentTypeLabels[adj.type]}
                  </Badge>
                  <p className="text-xs text-muted-foreground whitespace-nowrap hidden md:block">
                    {format(new Date(adj.timestamp), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </>)}
    </div>
  );
}
