import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "./PaginationControls";
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
import { Plus, Search, Pencil, Copy, Trash2, Package, ArrowLeftRight, X, Calendar, ChevronDown, ChevronUp, AlertTriangle, Store, Info, TrendingUp, Tag } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { BusinessTypeId } from "@/data/businessTypes";
import type { PricingMethod } from "./StockAdjustmentHistory";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { outlets } from "@/data/outlets";
import { Label } from "@/components/ui/label";
import BarcodeScanner from "./BarcodeScanner";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { InventoryCategory } from "./InventoryCategoryManager";
import type { MeasuringUnit } from "./MeasuringUnitManager";

export interface ItemConversion {
  id: string;
  fromQuantity: number;
  toQuantity: number;
  toUnitId: string;
}

export interface ItemBatch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  initialQuantity?: number;
  costPrice?: number;
  createdAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  unitId: string;
  stock: number;
  minStock: number;
  costPrice: number;
  sellPrice?: number;
  pricingMethod?: PricingMethod;
  pricingValue?: number;
  status: "good" | "low" | "critical";
  conversions: ItemConversion[];
  outletId: string;
  batchNumber?: string;
  expiryDate?: string;
  batches?: ItemBatch[];
}

interface Props {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  categories: InventoryCategory[];
  units: MeasuringUnit[];
  onAdjustStock?: (item: InventoryItem) => void;
  readOnly?: boolean;
  selectedOutletId?: string;
  filterLowStock?: boolean;
  filterExpiryStatus?: "expired" | "expiring";
  /** Per-raw-material profit metrics keyed by inventory item id. */
  profitability?: Record<
    string,
    {
      weightedProfitPerUnit: number;
      totalContribution: number;
      hasAnyPricedRecipe: boolean;
      recipesUsing: { recipeId: string }[];
    }
  >;
}

type FormState = Omit<InventoryItem, "id" | "status">;

export const BATCH_EXPIRY_BUSINESS_TYPES = ["pharmacy", "grocery", "supermarket"];

const EXPIRY_SOON_DAYS = 90;

export const RETAIL_BUSINESS_TYPES: BusinessTypeId[] = [
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

const emptyForm = (outletId: string = ""): FormState => ({
  name: "",
  sku: "",
  categoryId: "",
  unitId: "",
  stock: 0,
  minStock: 0,
  costPrice: 0,
  sellPrice: 0,
  pricingMethod: "markup",
  pricingValue: 30,
  conversions: [],
  outletId,
  batchNumber: "",
  expiryDate: "",
  batches: [],
});

function computeStatus(stock: number, min: number): InventoryItem["status"] {
  if (stock <= min * 0.3) return "critical";
  if (stock <= min) return "low";
  return "good";
}

/** Calculate expiry stats from batches */
export function getBatchExpiryStats(batches?: ItemBatch[]) {
  if (!batches || batches.length === 0) return { expired: 0, expiringSoon: 0, valid: 0, totalBatches: 0 };
  const now = new Date();
  const soonDate = new Date(Date.now() + EXPIRY_SOON_DAYS * 24 * 60 * 60 * 1000);
  let expired = 0;
  let expiringSoon = 0;
  let valid = 0;
  for (const b of batches) {
    if (!b.expiryDate) { valid += b.quantity; continue; }
    const exp = new Date(b.expiryDate);
    if (exp < now) expired += b.quantity;
    else if (exp < soonDate) expiringSoon += b.quantity;
    else valid += b.quantity;
  }
  return { expired, expiringSoon, valid, totalBatches: batches.length };
}

export default function InventoryItemForm({ items, setItems, categories, units, onAdjustStock, readOnly, selectedOutletId, filterLowStock, filterExpiryStatus, profitability }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(selectedOutletId));
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterExpiry, setFilterExpiry] = useState("all");
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const [syncToCatalog, setSyncToCatalog] = useState(true);

  const selectedOutlet = selectedOutletId && selectedOutletId !== "all" ? outlets.find(o => o.id === selectedOutletId) : null;
  const showBatchExpiry = selectedOutlet ? BATCH_EXPIRY_BUSINESS_TYPES.includes(selectedOutlet.businessType) : false;

  const isOutletBatchTracked = (oid: string) => {
    const o = outlets.find((x) => x.id === oid);
    return o ? BATCH_EXPIRY_BUSINESS_TYPES.includes(o.businessType) : false;
  };

  const isOutletRetail = (oid: string) => {
    const o = outlets.find((x) => x.id === oid);
    return o ? RETAIL_BUSINESS_TYPES.includes(o.businessType) : false;
  };


  const toggleBatchExpand = (itemId: string) => {
    setExpandedBatches(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const openNew = () => {
    setEditing(null);
    const seed = selectedOutletId && selectedOutletId !== "all" ? selectedOutletId : "";
    setForm(emptyForm(seed));
    setSyncToCatalog(true);
    setOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      sku: item.sku,
      categoryId: item.categoryId,
      unitId: item.unitId,
      stock: item.stock,
      minStock: item.minStock,
      costPrice: item.costPrice,
      sellPrice: item.sellPrice ?? Math.round(item.costPrice * 1.3 * 100) / 100,
      pricingMethod: item.pricingMethod ?? "markup",
      pricingValue: item.pricingValue ?? 30,
      conversions: item.conversions || [],
      outletId: item.outletId,
      batchNumber: item.batchNumber || "",
      expiryDate: item.expiryDate || "",
      batches: item.batches || [],
    });
    setSyncToCatalog(true);
    setOpen(true);
  };

  const handleClone = (item: InventoryItem) => {
    const cloned: InventoryItem = {
      ...item,
      id: crypto.randomUUID(),
      name: `${item.name} (Copy)`,
      sku: `${item.sku}-COPY`,
      conversions: item.conversions.map((c) => ({ ...c, id: crypto.randomUUID() })),
      batches: item.batches?.map(b => ({ ...b, id: crypto.randomUUID() })),
    };
    setItems((prev) => [...prev, cloned]);
    toast.success("Item cloned");
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    if (!form.categoryId || !form.unitId) {
      toast.error("Category and unit are required");
      return;
    }
    const targetOutletId = editing?.outletId || form.outletId || (selectedOutletId && selectedOutletId !== "all" ? selectedOutletId : "");
    if (!targetOutletId) {
      toast.error("Select an outlet before registering items");
      return;
    }
    if (form.conversions.length === 0) {
      toast.error("At least one unit conversion is required");
      return;
    }
    const hasIncompleteConversion = form.conversions.some(c => !c.toUnitId || c.fromQuantity <= 0 || c.toQuantity <= 0);
    if (hasIncompleteConversion) {
      toast.error("Please complete all conversion fields");
      return;
    }

    const batchTracked = isOutletBatchTracked(targetOutletId);
    const usesBatches = batchTracked && (form.batches?.length ?? 0) > 0;
    const resolvedStock = usesBatches
      ? (form.batches ?? []).reduce((sum, b) => sum + b.quantity, 0)
      : form.stock;
    const resolvedBatches = batchTracked
      ? (form.batches ?? []).map((b) => ({ ...b, id: b.id || crypto.randomUUID() }))
      : undefined;

    if (editing) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editing.id
            ? {
                ...i,
                ...form,
                outletId: targetOutletId,
                stock: resolvedStock,
                minStock: form.minStock,
                status: computeStatus(resolvedStock, form.minStock),
                batches: resolvedBatches,
              }
            : i,
        ),
      );
      toast.success("Item updated");
    } else {
      const newItem: InventoryItem = {
        id: crypto.randomUUID(),
        ...form,
        outletId: targetOutletId,
        stock: resolvedStock,
        minStock: form.minStock,
        status: computeStatus(resolvedStock, form.minStock),
        conversions: form.conversions.map((c) => ({ ...c, id: crypto.randomUUID() })),
        batches: resolvedBatches,
      };
      setItems((prev) => [...prev, newItem]);
      toast.success("Item registered");
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Item deleted");
  };

  // Conversion helpers
  const addConversion = () => {
    setForm((prev) => ({
      ...prev,
      conversions: [...prev.conversions, { id: crypto.randomUUID(), fromQuantity: 1, toQuantity: 1, toUnitId: "" }],
    }));
  };

  const updateConversion = (index: number, updates: Partial<ItemConversion>) => {
    setForm((prev) => ({
      ...prev,
      conversions: prev.conversions.map((c, i) => (i === index ? { ...c, ...updates } : c)),
    }));
  };

  const removeConversion = (index: number) => {
    setForm((prev) => ({
      ...prev,
      conversions: prev.conversions.filter((_, i) => i !== index),
    }));
  };

  // Batch helpers
  const addBatch = () => {
    setForm((prev) => ({
      ...prev,
      batches: [...(prev.batches || []), { id: crypto.randomUUID(), batchNumber: "", expiryDate: "", quantity: 0 }],
    }));
  };

  const updateBatch = (index: number, updates: Partial<ItemBatch>) => {
    setForm((prev) => ({
      ...prev,
      batches: (prev.batches || []).map((b, i) => (i === index ? { ...b, ...updates } : b)),
    }));
  };

  const removeBatch = (index: number) => {
    setForm((prev) => ({
      ...prev,
      batches: (prev.batches || []).filter((_, i) => i !== index),
    }));
  };

  const getUnit = (id: string) => units.find((u) => u.id === id);
  const getCategory = (id: string) => categories.find((c) => c.id === id);

  const filtered = items
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .filter((i) => filterCategory === "all" || i.categoryId === filterCategory)
    .filter((i) => !filterLowStock || i.status === "low" || i.status === "critical")
    .filter((i) => {
      if (!filterExpiryStatus) return true;
      const stats = getBatchExpiryStats(i.batches);
      if (filterExpiryStatus === "expired") return stats.expired > 0;
      if (filterExpiryStatus === "expiring") return stats.expiringSoon > 0;
      return true;
    })
    .filter((i) => {
      if (filterExpiry === "all") return true;
      const stats = getBatchExpiryStats(i.batches);
      if (filterExpiry === "expired") return stats.expired > 0;
      if (filterExpiry === "expiring_soon") return stats.expiringSoon > 0;
      if (filterExpiry === "valid") return stats.expired === 0 && stats.expiringSoon === 0;
      return true;
    });

  const { page, setPage, perPage, setPerPage, totalPages, paginatedItems, totalItems, pageSizeOptions } = usePagination(filtered);

  const batchStockTotal = (form.batches || []).reduce((sum, b) => sum + b.quantity, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showBatchExpiry && (
            <Select value={filterExpiry} onValueChange={setFilterExpiry}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Expiry Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expiry Status</SelectItem>
                <SelectItem value="expired">Has Expired Units</SelectItem>
                <SelectItem value="expiring_soon">Expiring Soon (90d)</SelectItem>
                <SelectItem value="valid">All Valid</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        {!readOnly && (
          <Button size="sm" onClick={openNew} className="w-fit">
            <Plus className="h-4 w-4 mr-1" /> Register Item
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

      <div className="grid gap-3">
        {paginatedItems.map((item) => {
          const unit = getUnit(item.unitId);
          const category = getCategory(item.categoryId);
          const expiryStats = getBatchExpiryStats(item.batches);
          const hasBatches = item.batches && item.batches.length > 0;
          const isExpanded = expandedBatches.has(item.id);
          return (
            <Card key={item.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                    item.status === "critical" ? "bg-destructive/10" : item.status === "low" ? "bg-warning/10" : "bg-success/10"
                  )}>
                    <Package className={cn(
                      "h-5 w-5",
                      item.status === "critical" ? "text-destructive" : item.status === "low" ? "text-warning" : "text-success"
                    )} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedOutletId === "all" && (() => {
                        const outlet = outlets.find(o => o.id === item.outletId);
                        return outlet ? (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                            {outlet.name}
                          </Badge>
                        ) : null;
                      })()}
                      {category && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{category.name}</Badge>}
                      {hasBatches && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {expiryStats.totalBatches} batch{expiryStats.totalBatches !== 1 ? "es" : ""}
                        </Badge>
                      )}
                      {expiryStats.expiringSoon > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-warning/30 text-warning">
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                          {expiryStats.expiringSoon} expiring soon
                        </Badge>
                      )}
                      {expiryStats.expired > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-destructive/30 text-destructive">
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                          {expiryStats.expired} expired
                        </Badge>
                      )}
                      {/* Fallback for legacy single-batch items without batches array */}
                      {!hasBatches && item.batchNumber && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">Batch: {item.batchNumber}</Badge>
                      )}
                      {!hasBatches && item.expiryDate && (() => {
                        const isExpired = new Date(item.expiryDate) < new Date();
                        const isExpiringSoon = !isExpired && new Date(item.expiryDate) < new Date(Date.now() + EXPIRY_SOON_DAYS * 24 * 60 * 60 * 1000);
                        return (
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", isExpired && "border-destructive/30 text-destructive", isExpiringSoon && "border-warning/30 text-warning")}>
                            <Calendar className="h-2.5 w-2.5 mr-0.5" />
                            Exp: {item.expiryDate}
                          </Badge>
                        );
                      })()}
                    </div>
                    {item.conversions?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.conversions.map((conv) => {
                          const fromUnit = getUnit(item.unitId);
                          const toUnit = getUnit(conv.toUnitId);
                          return (
                            <span key={conv.id} className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                              {conv.fromQuantity} {fromUnit?.abbreviation || "?"} = {conv.toQuantity} {toUnit?.abbreviation || "?"}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <p className="text-sm font-heading font-bold">
                      {item.stock} <span className="text-muted-foreground font-normal text-xs">{unit?.abbreviation || ""}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Min: {item.minStock}</p>
                  </div>
                  {(() => {
                    const p = profitability?.[item.id];
                    if (!p || !p.hasAnyPricedRecipe) return null;
                    const ppu = p.weightedProfitPerUnit;
                    const total = p.totalContribution;
                    const positive = ppu >= 0;
                    return (
                      <div className="text-right hidden md:block" title={`Weighted profit per ${unit?.abbreviation || "unit"} across ${p.recipesUsing.length} recipe(s)`}>
                        <p className={cn("text-sm font-heading font-bold", positive ? "text-success" : "text-destructive")}>
                          ₦{ppu.toFixed(2)}
                          <span className="text-muted-foreground font-normal text-xs">/{unit?.abbreviation || "u"}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">Stock value: ₦{total.toFixed(0)}</p>
                      </div>
                    );
                  })()}
                  <Badge
                    variant={item.status === "good" ? "default" : "secondary"}
                    className={cn(
                      "text-xs capitalize",
                      item.status === "critical" && "bg-destructive/10 text-destructive border-destructive/20",
                      item.status === "low" && "bg-warning/10 text-warning border-warning/20"
                    )}
                  >
                    {item.status}
                  </Badge>
                  {hasBatches && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleBatchExpand(item.id)} title="View batches">
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                  {!readOnly && (
                    <div className="flex gap-1 shrink-0">
                      {onAdjustStock && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-accent" onClick={() => onAdjustStock(item)} title="Adjust Stock">
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleClone(item)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded batch details */}
              {hasBatches && isExpanded && (
                <div className="mt-3 pt-3 border-t space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Batch Details</p>
                  {item.batches!.map((batch) => {
                    const now = new Date();
                    const exp = batch.expiryDate ? new Date(batch.expiryDate) : null;
                    const isExpired = exp ? exp < now : false;
                    const isExpiringSoon = exp && !isExpired ? exp < new Date(Date.now() + EXPIRY_SOON_DAYS * 24 * 60 * 60 * 1000) : false;
                    return (
                      <div key={batch.id} className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-md text-xs",
                        isExpired ? "bg-destructive/5 border border-destructive/20" :
                        isExpiringSoon ? "bg-warning/5 border border-warning/20" :
                        "bg-muted/50"
                      )}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="font-medium">{batch.batchNumber || "No batch #"}</span>
                            {batch.expiryDate && (
                              <span className={cn(
                                "flex items-center gap-1",
                                isExpired && "text-destructive",
                                isExpiringSoon && "text-warning"
                              )}>
                                <Calendar className="h-3 w-3" />
                                {isExpired ? "Expired" : "Exp"}: {batch.expiryDate}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                            {batch.costPrice !== undefined && (
                              <span>Cost: ₦{batch.costPrice.toFixed(2)}/unit</span>
                            )}
                            {batch.initialQuantity !== undefined && (
                              <span>Added Qty: {batch.initialQuantity}</span>
                            )}
                          </div>
                        </div>
                        <span className="font-heading font-bold shrink-0">
                          {batch.quantity} <span className="font-normal text-muted-foreground">{unit?.abbreviation || ""}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No inventory items found</p>
        )}
      </div>

      {/* Registration / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Inventory Item" : "Register Inventory Item"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            {(() => {
              const formOutlet = form.outletId ? outlets.find((o) => o.id === form.outletId) : null;
              return (
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5" /> Outlet *
                  </Label>
                  <Select
                    value={form.outletId || undefined}
                    onValueChange={(v) => setForm({ ...form, outletId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an outlet">
                        {formOutlet && (
                          <div className="flex items-center gap-2">
                            <span className="truncate">{formOutlet.name}</span>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {formOutlet.businessType.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {outlets.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          <div className="flex items-center gap-2">
                            <span>{o.name}</span>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {o.businessType.replace(/_/g, " ")}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editing && form.outletId && form.outletId !== editing.outletId && (
                    <p className="text-[11px] text-muted-foreground">
                      This item will be moved to the selected outlet on save.
                    </p>
                  )}
                </div>
              );
            })()}
            <div className="space-y-2">
              <label className="text-sm font-medium">Item Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Coffee Beans" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Barcode / SKU</label>
              <BarcodeScanner value={form.sku} onChange={(val) => setForm({ ...form, sku: val })} placeholder="Scan barcode or enter SKU" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit *</label>
                <Select value={form.unitId} onValueChange={(v) => setForm({ ...form, unitId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name} ({u.abbreviation})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cost per Unit</label>
              <p className="text-xs text-muted-foreground">The purchase cost for a single unit of this item. Updates automatically via Weighted Average Cost when new stock is added at a different price.</p>
              <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} placeholder="0.00" />
            </div>

            {(() => {
              const formShowBatchExpiry = isOutletBatchTracked(form.outletId);
              return (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        {formShowBatchExpiry && (form.batches?.length ?? 0) > 0 ? "Total Stock (from batches)" : "Current Stock"}
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="What is Current Stock?">
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent side="bottom" align="start" collisionPadding={12} className="w-[260px] text-xs leading-relaxed whitespace-normal break-words">
                            <p>The quantity of this item currently available at the selected outlet, expressed in its base unit (e.g., grams, ml, pieces). {formShowBatchExpiry ? "When batches are added, this is auto-calculated from the sum of all batch quantities." : ""}</p>
                          </PopoverContent>
                        </Popover>
                      </label>
                      {formShowBatchExpiry && (form.batches?.length ?? 0) > 0 ? (
                        <div className="h-10 flex items-center px-3 rounded-md border bg-muted text-sm font-medium">
                          {batchStockTotal}
                        </div>
                      ) : (
                        <Input
                          type="number"
                          min={0}
                          value={form.stock}
                          onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        Min Stock
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="What is Min Stock?">
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent side="bottom" align="end" collisionPadding={12} className="w-[260px] text-xs leading-relaxed whitespace-normal break-words">
                            <p>The reorder threshold. When current stock falls to or below this level, the item is flagged as "Low Stock" so you know to restock before running out.</p>
                          </PopoverContent>
                        </Popover>
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={form.minStock}
                        onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  {formShowBatchExpiry && (
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Batches</label>
                    <p className="text-xs text-muted-foreground">Track expiry per shipment.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addBatch} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Add Batch
                  </Button>
                </div>
                {(form.batches?.length ?? 0) === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-2 border border-dashed rounded-md">
                    No batches added yet.
                  </p>
                )}
                {(form.batches ?? []).map((batch, idx) => (
                  <div key={batch.id} className="grid grid-cols-[1fr_1fr_70px_28px] gap-1.5 items-end">
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">Batch #</label>
                      <Input
                        value={batch.batchNumber}
                        onChange={(e) => updateBatch(idx, { batchNumber: e.target.value })}
                        placeholder="BT-001"
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">Expiry</label>
                      <Input
                        type="date"
                        value={batch.expiryDate}
                        onChange={(e) => updateBatch(idx, { expiryDate: e.target.value })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">Qty</label>
                      <Input
                        type="number"
                        min={0}
                        value={batch.quantity}
                        onChange={(e) => updateBatch(idx, { quantity: Number(e.target.value) })}
                        className="h-7 text-xs"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeBatch(idx)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
                </>
              );
            })()}


            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Unit Conversions</label>
                  <p className="text-xs text-muted-foreground">How this item's unit converts to other measuring units</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addConversion} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>

              {form.conversions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-md">
                  No conversions added yet
                </p>
              )}

              {form.conversions.map((conv, idx) => {
                const itemUnit = getUnit(form.unitId);
                const toUnit = getUnit(conv.toUnitId);
                return (
                  <Card key={conv.id} className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Conversion {idx + 1}</p>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeConversion(idx)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Quantity</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={conv.fromQuantity}
                          onChange={(e) => updateConversion(idx, { fromQuantity: Number(e.target.value) })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Unit</label>
                        <div className="h-8 flex items-center px-3 rounded-md border bg-muted text-sm font-medium">
                          {itemUnit ? itemUnit.abbreviation : "—"}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground pt-4">=</span>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Quantity</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={conv.toQuantity}
                          onChange={(e) => updateConversion(idx, { toQuantity: Number(e.target.value) })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Unit</label>
                        <Select value={conv.toUnitId} onValueChange={(v) => updateConversion(idx, { toUnitId: v })}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.filter(u => u.id !== form.unitId).map((u) => (
                              <SelectItem key={u.id} value={u.id}>{u.name} ({u.abbreviation})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {itemUnit && toUnit && (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                        {conv.fromQuantity} {itemUnit.abbreviation} = {conv.toQuantity} {toUnit.abbreviation}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Register"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
