import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Eye, Clock, Truck, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useStockAdjustments, type StoredAdjustment } from "@/hooks/use-financial-data";
import { useGetInventoryItems, useAdjustInventoryItem, useCreateInventoryItem } from "@/services/api/inventory/item";
import { useGetInventoryCategories } from "@/services/api/inventory/category";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetOutlets } from "@/services/api/outlets";
import { useGetMeasuringUnits } from "@/services/api/inventory/unit";
import { useGetComposites } from "@/services/api/inventory/composite";
import { type MenuItem } from "@/components/menu/MenuItemForm";
import InventoryCategoryManager, {
  defaultCategories,
  type InventoryCategory,
} from "@/components/inventory/InventoryCategoryManager";
import MeasuringUnitManager, {
  defaultUnits,
  type MeasuringUnit,
} from "@/components/inventory/MeasuringUnitManager";
import InventoryItemForm, {
  type InventoryItem,
} from "@/components/inventory/InventoryItemForm";
import CompositeItemForm, {
  type CompositeItem,
} from "@/components/inventory/CompositeItemForm";
import StockAdjustmentHistory, {
  StockAdjustDialog,
  type StockAdjustment,
  type AdjustmentType,
} from "@/components/inventory/StockAdjustmentHistory";
import BulkReceiveStockDialog from "@/components/inventory/BulkReceiveStockDialog";
import BulkImportInventoryDialog from "@/components/inventory/BulkImportInventoryDialog";
import ProfitabilityView from "@/components/inventory/ProfitabilityView";
import { computeProfitability } from "@/lib/profitability";
import { defaultInventoryItems } from "@/data/inventoryItems";
import { useCompositesStore } from "@/hooks/use-composites-store";
import SubstituteGroupManager from "@/components/inventory/SubstituteGroupManager";

const defaultItems: InventoryItem[] = defaultInventoryItems;

const defaultComposites: CompositeItem[] = [
  { id: "c1", name: "Cappuccino", menuItemId: "m1", menuVariantId: "v1", description: "Classic cappuccino", components: [{ inventoryItemId: "i1", quantity: 0.02, role: "primary" }, { inventoryItemId: "i2", quantity: 0.15, role: "secondary" }, { inventoryItemId: "i4", quantity: 1, role: "secondary" }], outletId: "outlet-1", sellPrice: 1500, overheadPerUnit: 150 },
  { id: "c2", name: "Club Sandwich", menuItemId: "m4", description: "Triple-decker sandwich", components: [{ inventoryItemId: "i9", quantity: 2, role: "primary" }, { inventoryItemId: "i3", quantity: 0.005, role: "secondary" }], outletId: "outlet-3", sellPrice: 2500, overheadPerUnit: 200 },
  { id: "c3", name: "Hair Coloring Service", menuItemId: "m7", description: "Full color treatment", components: [{ inventoryItemId: "i7", quantity: 1, role: "primary" }, { inventoryItemId: "i8", quantity: 1, role: "secondary" }, { inventoryItemId: "i6", quantity: 0.03, role: "secondary" }], outletId: "outlet-5", sellPrice: 12000, overheadPerUnit: 800 },
];

const DEFAULT_OUTLET_OVERHEAD: Record<string, number> = {
  "outlet-1": 100,
  "outlet-2": 80,
  "outlet-3": 120,
  "outlet-5": 500,
  "outlet-6": 300,
};

function computeStatus(stock: number, min: number): InventoryItem["status"] {
  if (stock <= min * 0.3) return "critical";
  if (stock <= min) return "low";
  return "good";
}

type MenuItemOption = { id: string; name: string; variants: { id: string; name: string }[] };

type Tab = "stock" | "categories" | "units" | "composite" | "substitutes" | "adjustments" | "profitability";

const sampleMenuItems: MenuItemOption[] = [
  // Restaurant
  { id: "m1", name: "Cappuccino", variants: [{ id: "v1", name: "Regular" }, { id: "v2", name: "Small" }, { id: "v3", name: "Large" }] },
  { id: "m2", name: "Iced Latte", variants: [] },
  { id: "m3", name: "Croissant", variants: [] },
  { id: "m4", name: "Club Sandwich", variants: [] },
  { id: "m5", name: "Espresso", variants: [] },
  { id: "m20", name: "Chicken Wrap", variants: [] },
  { id: "m21", name: "Orange Juice", variants: [] },
  // Pharmacy
  { id: "m22", name: "Paracetamol 500mg", variants: [] },
  { id: "m23", name: "Vitamin C 1000mg", variants: [] },
  { id: "m24", name: "Cough Syrup", variants: [] },
  // Salon
  { id: "m6", name: "Women's Haircut", variants: [] },
  { id: "m7", name: "Full Color", variants: [] },
  { id: "m8", name: "Blowout", variants: [] },
  // Barber
  { id: "m27", name: "Men's Haircut", variants: [{ id: "v4", name: "Regular Cut" }, { id: "v5", name: "Fade" }, { id: "v6", name: "Skin Fade + Beard" }] },
  { id: "m28", name: "Hot Towel Shave", variants: [] },
  // Grocery
  { id: "m9", name: "Organic Apples", variants: [] },
  { id: "m29", name: "Tomatoes (1kg)", variants: [] },
  { id: "m30", name: "Basmati Rice 5kg", variants: [] },
  // Supermarket
  { id: "m32", name: "Full Cream Milk 1L", variants: [] },
  { id: "m33", name: "Cheddar Cheese 250g", variants: [] },
  // Wine & Liquor
  { id: "m36", name: "Cabernet Sauvignon Reserve", variants: [] },
  { id: "m37", name: "Hennessy VS 750ml", variants: [] },
  // Clothing
  { id: "m39", name: "Classic T-Shirt", variants: [{ id: "v7", name: "S" }, { id: "v8", name: "M" }, { id: "v9", name: "L" }, { id: "v10", name: "XL" }] },
  { id: "m40", name: "Slim Fit Jeans", variants: [{ id: "v11", name: "30" }, { id: "v12", name: "32" }, { id: "v13", name: "34" }] },
  // Electronics
  { id: "m42", name: "USB-C Cable 1m", variants: [] },
  { id: "m43", name: "Wireless Earbuds Pro", variants: [{ id: "v17", name: "Black" }, { id: "v18", name: "White" }] },
  { id: "m44", name: "Power Bank 10000mAh", variants: [] },
  // Hair / Wig Store
  { id: "m46", name: "Brazilian Body Wave", variants: [{ id: "v19", name: "14 inch" }, { id: "v20", name: "18 inch" }, { id: "v21", name: "22 inch" }] },
  { id: "m47", name: "Lace Front Wig (Bob)", variants: [] },
  { id: "m48", name: "4x4 Closure Straight", variants: [] },
];

export default function InventoryManagement() {
  const [tab, setTab] = useState<Tab>("stock");
  
  // Search, filter, and page states for server-side operations in the stock items list tab
  const [stockPage, setStockPage] = useState(1);
  const [stockPerPage, setStockPerPage] = useState(15);
  const [stockSearch, setStockSearch] = useState("");
  const [stockCategory, setStockCategory] = useState("all");
  
  const [selectedOutletId, setSelectedOutletId] = useState<string>("all");

  const { data: outletsRes } = useGetOutlets();
  const outlets = useMemo(() => outletsRes || [], [outletsRes]);

  const { data: unitsRes, mutate: mutateUnits } = useGetMeasuringUnits({ page: 1, per_page: 100 });
  const units = useMemo(() => unitsRes?.data || defaultUnits, [unitsRes]);

  const { data: compositesRes, mutate: mutateComposites } = useGetComposites({
    outletId: selectedOutletId === "all" ? undefined : selectedOutletId,
    page: 1,
    per_page: 100,
  });

  const composites = useMemo<CompositeItem[]>(() => {
    if (!compositesRes?.data) return [];
    return compositesRes.data.map((c) => ({
      id: c.id,
      name: c.name,
      description: "",
      components: c.components.map((comp) => ({
        inventoryItemId: comp.inventoryItemId,
        quantity: comp.quantity,
        role: comp.role,
      })),
      outletId: c.outletId,
      sellPrice: c.sellPrice,
    }));
  }, [compositesRes]);
  
  const { adjustments: storedAdjustments, addAdjustment } = useStockAdjustments();
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [bulkReceiveOpen, setBulkReceiveOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);
  const [outletOverheadDefaults, setOutletOverheadDefaults] =
    useState<Record<string, number>>(DEFAULT_OUTLET_OVERHEAD);

  const isAllOutlets = selectedOutletId === "all";

  // Category SWR hook
  const { data: categoriesResponse, mutate: mutateCategories } = useGetInventoryCategories({
    page: 1,
    per_page: 100,
  });

  // Fetch only the paginated items for the stock table
  const { data: itemsResponse, isLoading: isItemsLoading, mutate: mutateItems } = useGetInventoryItems({
    page: stockPage,
    per_page: stockPerPage,
    search: stockSearch.trim() || undefined,
    categoryId: stockCategory === "all" ? undefined : stockCategory,
    outletId: selectedOutletId === "all" ? undefined : selectedOutletId,
  });

  // Fetch all items (up to 1000) for tabs that require global calculations (profitability, composite, substitutes, adjustments)
  const { data: allItemsResponse, mutate: mutateAllItems } = useGetInventoryItems({
    per_page: 20,
    outletId: selectedOutletId === "all" ? undefined : selectedOutletId,
  });

  const createItemMutation = useCreateInventoryItem();
  const adjustMutation = useAdjustInventoryItem();

  const mapApiItemToInventoryItem = (apiItem: any): InventoryItem => {
    const mockItem = defaultItems.find(x => x.id === apiItem.id || x.sku === apiItem.sku);
    const stock = apiItem.quantity ?? apiItem.stock ?? mockItem?.stock ?? 0;
    const minStock = apiItem.minStock ?? apiItem.reorderLevel ?? mockItem?.minStock ?? 0;

    return {
      id: apiItem.id,
      name: apiItem.name || mockItem?.name || "",
      description: apiItem.description ?? mockItem?.description ?? "",
      sku: apiItem.sku || mockItem?.sku || "",
      categoryId: apiItem.categoryId ?? mockItem?.categoryId ?? "1",
      unitId: apiItem.unitId ?? mockItem?.unitId ?? "5", // pcs fallback
      stock: stock,
      minStock: minStock,
      costPrice: apiItem.costPrice ?? mockItem?.costPrice ?? 0,
      sellPrice: apiItem.sellPrice ?? mockItem?.sellPrice ?? 0,
      pricingMethod: apiItem.pricingMethod ?? mockItem?.pricingMethod ?? "markup",
      pricingValue: apiItem.pricingValue ?? mockItem?.pricingValue ?? 30,
      status: computeStatus(stock, minStock),
      conversions: apiItem.conversions ?? mockItem?.conversions ?? [
        { id: crypto.randomUUID(), fromQuantity: 1, toQuantity: 1, toUnitId: apiItem.unitId ?? mockItem?.unitId ?? "5", sellable: true, sellPrice: apiItem.sellPrice ?? mockItem?.sellPrice ?? 0 }
      ],
      outletId: apiItem.outletId ?? mockItem?.outletId ?? selectedOutletId,
      batchNumber: apiItem.batchNumber ?? mockItem?.batchNumber ?? "",
      expiryDate: apiItem.expiryDate ?? mockItem?.expiryDate ?? "",
      batches: apiItem.batches ?? mockItem?.batches ?? [],
    };
  };

  const items = useMemo<InventoryItem[]>(() => {
    if (!itemsResponse?.data) return [];
    return itemsResponse.data.map(mapApiItemToInventoryItem);
  }, [itemsResponse]);

  const allItems = useMemo<InventoryItem[]>(() => {
    if (!allItemsResponse?.data) return [];
    return allItemsResponse.data.map(mapApiItemToInventoryItem);
  }, [allItemsResponse]);

  const outletItems = allItems;

  const categories = useMemo<InventoryCategory[]>(() => {
    if (!categoriesResponse?.data) return [];
    return categoriesResponse.data.map(cat => {
      const count = allItems.filter(item => item.categoryId === cat.id).length;
      return {
        id: cat.id,
        name: cat.name,
        description: cat.description || "",
        itemCount: count,
      };
    });
  }, [categoriesResponse, allItems]);

  const outletComposites = useMemo(
    () => isAllOutlets ? composites : composites.filter((c) => c.outletId === selectedOutletId),
    [composites, selectedOutletId, isAllOutlets]
  );

  const outletAdjustments = useMemo(
    () => isAllOutlets ? adjustments : adjustments.filter((a) => a.outletId === selectedOutletId),
    [adjustments, selectedOutletId, isAllOutlets]
  );

  const lowStockCount = outletItems.filter((i) => i.status === "low" || i.status === "critical").length;

  const EXPIRY_SOON_DAYS = 90;
  const now = new Date();
  const soonDate = new Date(Date.now() + EXPIRY_SOON_DAYS * 24 * 60 * 60 * 1000);

  const { expiredItemCount, expiringSoonItemCount } = useMemo(() => {
    let expiredCount = 0;
    let soonCount = 0;
    for (const item of outletItems) {
      if (item.batches && item.batches.length > 0) {
        const hasExpired = item.batches.some(b => b.expiryDate && new Date(b.expiryDate) < now);
        const hasExpiringSoon = item.batches.some(b => {
          if (!b.expiryDate) return false;
          const exp = new Date(b.expiryDate);
          return exp >= now && exp < soonDate;
        });
        if (hasExpired) expiredCount++;
        if (hasExpiringSoon) soonCount++;
      } else if (item.expiryDate) {
        const exp = new Date(item.expiryDate);
        if (exp < now) expiredCount++;
        else if (exp < soonDate) soonCount++;
      }
    }
    return { expiredItemCount: expiredCount, expiringSoonItemCount: soonCount };
  }, [outletItems]);

  const handleAdjustStock = async (itemId: string, type: AdjustmentType, quantity: number, reason: string, batchCostPrice?: number, batchNumber?: string, expiryDate?: string, pricing?: import("@/components/inventory/StockAdjustmentHistory").StockReceivePricing) => {
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return;

    const previousStock = item.stock;
    const recordedCostPrice = (type === "add" || type === "returned") && batchCostPrice ? batchCostPrice : item.costPrice;
    const costTotal = quantity * recordedCostPrice;

    try {
      await adjustMutation.trigger({
        id: itemId,
        payload: {
          type: type === "add" || type === "returned" ? "add" : "remove",
          quantity,
          reason,
          costPrice: recordedCostPrice,
          notes: batchNumber ? `Batch: ${batchNumber}` : undefined,
        }
      });

      const newStock = type === "add" || type === "returned" ? previousStock + quantity : Math.max(0, previousStock - quantity);

      const adjustment: StockAdjustment = {
        id: crypto.randomUUID(),
        inventoryItemId: itemId,
        type,
        quantityChange: quantity,
        previousStock,
        newStock,
        reason,
        timestamp: new Date(),
        outletId: item.outletId,
        costPrice: recordedCostPrice,
        costTotal,
        batchNumber,
        expiryDate,
        sellPrice: pricing?.sellPrice,
        pricingMethod: pricing?.method,
        pricingValue: pricing?.value,
        syncToCatalog: pricing?.syncToCatalog,
      };

      setAdjustments((prev) => [adjustment, ...prev]);

      // Also persist to localStorage for COGS reporting
      const storedAdj: StoredAdjustment = {
        ...adjustment,
        timestamp: adjustment.timestamp.toISOString(),
      };
      addAdjustment(storedAdj);

      await mutateItems();
      await mutateAllItems();
      await mutateCategories();
      await mutateComposites();

      // Handle catalog sync for retail business types
      if (pricing?.syncToCatalog && type === "add") {
        toast.success(
          `Stock received: ${previousStock} → ${newStock} | Sell price: ₦${pricing.sellPrice.toFixed(2)} | Catalog updated automatically`,
          { duration: 5000 }
        );
      } else {
        toast.success(`Stock adjusted: ${previousStock} → ${newStock} (cost: ₦${costTotal.toFixed(2)})`);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to adjust stock");
    }
  };

  const handleImport = async (newItems: InventoryItem[]) => {
    try {
      for (const item of newItems) {
        await createItemMutation.trigger({
          outletId: item.outletId || (selectedOutletId === "all" ? "" : selectedOutletId),
          name: item.name,
          description: item.description || "",
          sku: item.sku,
          categoryId: item.categoryId,
          unitId: item.unitId,
          costPrice: item.costPrice,
          sellingPrice: item.sellPrice || 0,
          stock: item.stock,
          minStock: item.minStock,
          pricingMethod: item.pricingMethod || "markup",
          pricingValue: item.pricingValue || 0,
          conversions: (item.conversions || []).map(c => ({
            fromQuantity: c.fromQuantity,
            toQuantity: c.toQuantity,
            toUnitId: c.toUnitId,
            sellable: c.sellable ?? true,
            sellPrice: c.sellPrice ?? 0,
          })),
          batches: (item.batches || []).map(b => ({
            batchNumber: b.batchNumber,
            expiryDate: b.expiryDate ? new Date(b.expiryDate) : new Date(),
            quantity: b.quantity,
            costPrice: b.costPrice ?? item.costPrice ?? 0,
          })),
        });
      }
      await mutateItems();
      await mutateAllItems();
      toast.success(`Successfully imported ${newItems.length} items`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to import items");
    }
  };

  const openAdjust = (item: InventoryItem) => {
    setAdjustItem(item);
    setAdjustOpen(true);
  };

  const profitability = useMemo(
    () =>
      computeProfitability({
        inventoryItems: outletItems,
        composites: outletComposites,
        outletOverheadDefaults,
      }),
    [outletItems, outletComposites, outletOverheadDefaults]
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "stock", label: "Stock Items" },
    { key: "profitability", label: "Profitability" },
    { key: "adjustments", label: `Adjustments${outletAdjustments.length > 0 ? ` (${outletAdjustments.length})` : ""}` },
    { key: "categories", label: "Categories" },
    { key: "units", label: "Units" },
    { key: "composite", label: "Composite Items" },
    { key: "substitutes", label: "Substitute Groups" },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage stock, categories, units and composite items</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={() => setBulkImportOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button
            size="sm"
            className="gap-2"
            onClick={() => setBulkReceiveOpen(true)}
          >
            <Truck className="h-4 w-4" />
            Receive Shipment
          </Button>
          <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outlets</SelectItem>
              {outlets.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {lowStockCount > 0 && (
          <Card className="p-4 border-warning/30 bg-warning/5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                <div>
                  <p className="text-sm font-medium">{lowStockCount} items need restocking</p>
                  <p className="text-xs text-muted-foreground">Items below minimum threshold</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 border-warning/30 text-warning hover:bg-warning/10 hover:text-warning"
                onClick={() => {
                  setTab("stock");
                  setShowLowStock((prev) => !prev);
                  if (!showLowStock) { setShowExpired(false); setShowExpiringSoon(false); }
                }}
              >
                <Eye className="h-3.5 w-3.5" />
                {showLowStock ? "Show All" : "View Items"}
              </Button>
            </div>
          </Card>
        )}

        {expiredItemCount > 0 && (
          <Card className="p-4 border-destructive/30 bg-destructive/5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-medium">{expiredItemCount} items have expired batches</p>
                  <p className="text-xs text-muted-foreground">Items with batches past their expiry date</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  setTab("stock");
                  setShowExpired((prev) => !prev);
                  if (!showExpired) { setShowLowStock(false); setShowExpiringSoon(false); }
                }}
              >
                <Eye className="h-3.5 w-3.5" />
                {showExpired ? "Show All" : "View Items"}
              </Button>
            </div>
          </Card>
        )}

        {expiringSoonItemCount > 0 && (
          <Card className="p-4 border-orange-400/30 bg-orange-50 dark:bg-orange-950/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{expiringSoonItemCount} items expiring soon</p>
                  <p className="text-xs text-muted-foreground">Items with batches expiring within 90 days</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 border-orange-400/30 text-orange-500 hover:bg-orange-100/50 hover:text-orange-600"
                onClick={() => {
                  setTab("stock");
                  setShowExpiringSoon((prev) => !prev);
                  if (!showExpiringSoon) { setShowLowStock(false); setShowExpired(false); }
                }}
              >
                <Eye className="h-3.5 w-3.5" />
                {showExpiringSoon ? "Show All" : "View Items"}
              </Button>
            </div>
          </Card>
        )}
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
              tab === t.key ? "bg-card shadow-sm" : "text-muted-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stock" && (
        <InventoryItemForm
          items={items}
          totalItems={itemsResponse?.meta?.total ?? 0}
          page={stockPage}
          onPageChange={setStockPage}
          perPage={stockPerPage}
          onPerPageChange={setStockPerPage}
          search={stockSearch}
          onSearchChange={setStockSearch}
          filterCategory={stockCategory}
          onFilterCategoryChange={setStockCategory}
          isLoading={isItemsLoading}
          onMutate={() => { mutateItems(); mutateAllItems(); }}
          categories={categories}
          units={units}
          onAdjustStock={isAllOutlets ? undefined : openAdjust}
          readOnly={false}
          selectedOutletId={selectedOutletId}
          filterLowStock={showLowStock}
          filterExpiryStatus={showExpired ? "expired" : showExpiringSoon ? "expiring" : undefined}
          profitability={profitability.rawMaterials}
        />
      )}
      {tab === "profitability" && (
        <ProfitabilityView
          inventoryItems={outletItems}
          composites={outletComposites}
          units={units}
          outletOverheadDefaults={outletOverheadDefaults}
          setOutletOverheadDefaults={setOutletOverheadDefaults}
          selectedOutletId={selectedOutletId}
        />
      )}
      {tab === "adjustments" && (
        <StockAdjustmentHistory adjustments={outletAdjustments} inventoryItems={outletItems} units={units} />
      )}
      {tab === "categories" && (
        <InventoryCategoryManager categories={categories} onMutate={mutateCategories} />
      )}
      {tab === "units" && (
        <MeasuringUnitManager units={units} onMutate={mutateUnits} />
      )}
      {tab === "composite" && (
        <CompositeItemForm
          composites={outletComposites}
          onMutate={mutateComposites}
          inventoryItems={outletItems}
          units={units}
          menuItems={sampleMenuItems}
          readOnly={isAllOutlets}
          selectedOutletId={selectedOutletId}
        />
      )}
      {tab === "substitutes" && (
        <SubstituteGroupManager
          inventoryItems={outletItems}
          selectedOutletId={isAllOutlets ? undefined : selectedOutletId}
          readOnly={isAllOutlets}
        />
      )}

      <StockAdjustDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        item={adjustItem}
        onAdjust={handleAdjustStock}
        outletName={outlets.find((o) => o.id === selectedOutletId)?.name}
      />

      <BulkReceiveStockDialog
        open={bulkReceiveOpen}
        onOpenChange={setBulkReceiveOpen}
        items={allItems}
        units={units}
        outletId={selectedOutletId}
        onReceive={handleAdjustStock}
      />

      <BulkImportInventoryDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        categories={categories}
        units={units}
        selectedOutletId={selectedOutletId}
        existingItems={allItems}
        onImport={handleImport}
      />
    </div>
  );
}
