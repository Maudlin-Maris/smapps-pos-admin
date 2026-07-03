import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  Eye,
  Clock,
  Truck,
  Upload,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useStockAdjustments,
  type StoredAdjustment,
} from "@/hooks/use-financial-data";
import {
  useGetInventoryItems,
  useAdjustInventoryItem,
  useCreateInventoryItem,
} from "@/services/api/inventory/item";
import { useGetInventoryAdjustments } from "@/services/api/inventory/live-inventory";
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
  type AdjustmentType,
} from "@/components/inventory/StockAdjustmentHistory";
import BulkReceiveStockDialog from "@/components/inventory/BulkReceiveStockDialog";
import BulkImportInventoryDialog from "@/components/inventory/BulkImportInventoryDialog";
import ProfitabilityView from "@/components/inventory/ProfitabilityView";
import { computeProfitability } from "@/lib/profitability";
import { useCompositesStore } from "@/hooks/use-composites-store";
import SubstituteGroupManager from "@/components/inventory/SubstituteGroupManager";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

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

type MenuItemOption = {
  id: string;
  name: string;
  variants: { id: string; name: string }[];
};

type Tab =
  | "stock"
  | "categories"
  | "units"
  | "composite"
  | "substitutes"
  | "adjustments"
  | "profitability";

export default function InventoryManagement() {
  const [tab, setTab] = useState<Tab>("stock");

  const [stockPage, setStockPage] = useState(1);
  const [stockPerPage, setStockPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [stockSearch, setStockSearch] = useState("");
  const [stockCategory, setStockCategory] = useState("all");

  const [selectedOutletId, setSelectedOutletId] = useState<string>("all");

  const [adjustmentsPage, setAdjustmentsPage] = useState(1);
  const [adjustmentsPerPage, setAdjustmentsPerPage] =
    useState(DEFAULT_PAGE_SIZE);
  const [adjustmentsSearch, setAdjustmentsSearch] = useState("");
  const [adjustmentsFilterType, setAdjustmentsFilterType] =
    useState<string>("all");
  const [adjustmentsFilterItem, setAdjustmentsFilterItem] =
    useState<string>("all");

  useEffect(() => {
    setAdjustmentsPage(1);
  }, [
    selectedOutletId,
    adjustmentsSearch,
    adjustmentsFilterType,
    adjustmentsFilterItem,
  ]);

  const { data: outletsRes } = useGetOutlets();
  const outlets = useMemo(() => outletsRes || [], [outletsRes]);

  const { data: unitsRes, mutate: mutateUnits } = useGetMeasuringUnits({
    page: 1,
    per_page: DEFAULT_PAGE_SIZE,
  });
  const units = useMemo(() => unitsRes?.data || defaultUnits, [unitsRes]);

  const { data: compositesRes, mutate: mutateComposites } = useGetComposites({
    outletId: selectedOutletId === "all" ? undefined : selectedOutletId,
    page: 1,
    per_page: DEFAULT_PAGE_SIZE,
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

  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [bulkReceiveOpen, setBulkReceiveOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [showExpiringSoon, setShowExpiringSoon] = useState(false);
  const [outletOverheadDefaults, setOutletOverheadDefaults] = useState<
    Record<string, number>
  >(DEFAULT_OUTLET_OVERHEAD);

  const isAllOutlets = selectedOutletId === "all";

  const { data: categoriesResponse, mutate: mutateCategories } =
    useGetInventoryCategories({
      page: 1,
      per_page: DEFAULT_PAGE_SIZE,
    });

  const {
    data: itemsResponse,
    isLoading: isItemsLoading,
    mutate: mutateItems,
  } = useGetInventoryItems(
    {
      page: stockPage,
      per_page: stockPerPage,
      search: stockSearch.trim() || undefined,
      categoryId: stockCategory === "all" ? undefined : stockCategory,
      outletId: selectedOutletId === "all" ? undefined : selectedOutletId,
    },
    { keepPreviousData: true },
  );

  const { data: allItemsResponse, mutate: mutateAllItems } =
    useGetInventoryItems({
      per_page: DEFAULT_PAGE_SIZE,
      outletId: selectedOutletId === "all" ? undefined : selectedOutletId,
    });

  const {
    data: adjustmentsResponse,
    isLoading: isAdjustmentsLoading,
    mutate: mutateAdjustments,
  } = useGetInventoryAdjustments(
    {
      page: adjustmentsPage,
      per_page: adjustmentsPerPage,
      outletId: selectedOutletId === "all" ? undefined : selectedOutletId,
      search: adjustmentsSearch.trim() || undefined,
      type: adjustmentsFilterType === "all" ? undefined : adjustmentsFilterType,
      inventoryItemId:
        adjustmentsFilterItem === "all" ? undefined : adjustmentsFilterItem,
    } as any,
    { keepPreviousData: true },
  );

  const createItemMutation = useCreateInventoryItem();
  const adjustMutation = useAdjustInventoryItem();

  const items = useMemo<InventoryItem[]>(() => {
    return (itemsResponse?.data as any as InventoryItem[]) || [];
  }, [itemsResponse]);

  const allItems = useMemo<InventoryItem[]>(() => {
    return (allItemsResponse?.data as any as InventoryItem[]) || [];
  }, [allItemsResponse]);

  const outletItems = allItems;

  const categories = categoriesResponse?.data || [];

  const outletAdjustments = useMemo(() => {
    return adjustmentsResponse?.data ?? [];
  }, [adjustmentsResponse]);

  const lowStockCount = outletItems.filter(
    (i) => i.status === "low" || i.status === "critical",
  ).length;

  const EXPIRY_SOON_DAYS = 90;
  const now = new Date();
  const soonDate = new Date(
    Date.now() + EXPIRY_SOON_DAYS * 24 * 60 * 60 * 1000,
  );

  const { expiredItemCount, expiringSoonItemCount } = useMemo(() => {
    let expiredCount = 0;
    let soonCount = 0;
    for (const item of outletItems) {
      if (item.batches && item.batches.length > 0) {
        const hasExpired = item.batches.some(
          (b) => b.expiryDate && new Date(b.expiryDate) < now,
        );
        const hasExpiringSoon = item.batches.some((b) => {
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

  const handleAdjustStock = async (
    itemId: string,
    type: AdjustmentType,
    quantity: number,
    reason: string,
    batchCostPrice?: number,
    batchNumber?: string,
    expiryDate?: string,
    pricing?: import("@/components/inventory/StockAdjustmentHistory").StockReceivePricing,
  ) => {
    const item = allItems.find((i) => i.id === itemId);
    if (!item) return;

    const previousStock = item.stock;
    const recordedCostPrice =
      (type === "add" || type === "returned") && batchCostPrice
        ? batchCostPrice
        : item.costPrice;
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
        },
      });

      const newStock =
        type === "add" || type === "returned"
          ? previousStock + quantity
          : Math.max(0, previousStock - quantity);

      await mutateItems();
      await mutateAllItems();
      await mutateCategories();
      await mutateComposites();
      await mutateAdjustments();

      // Handle catalog sync for retail business types
      if (pricing?.syncToCatalog && type === "add") {
        toast.success(
          `Stock received: ${previousStock} → ${newStock} | Sell price: ₦${pricing.sellPrice.toFixed(2)} | Catalog updated automatically`,
          { duration: 5000 },
        );
      } else {
        toast.success(
          `Stock adjusted: ${previousStock} → ${newStock} (cost: ₦${costTotal.toFixed(2)})`,
        );
      }
    } catch (e: any) {
      toast.error(
        e.response?.data?.message || e.message || "Failed to adjust stock",
      );
    }
  };

  const handleImport = async (newItems: InventoryItem[]) => {
    try {
      for (const item of newItems) {
        await createItemMutation.trigger({
          outletId:
            item.outletId ||
            (selectedOutletId === "all" ? "" : selectedOutletId),
          name: item.name,
          description: item.description || "",
          sku: item.sku,
          categoryId: item.categoryId,
          unitId: item.unitId,
          costPrice: item.costPrice,
          sellingPrice: item.sellingPrice || 0,
          stock: item.stock,
          minStock: item.minStock,
          pricingMethod: item.pricingMethod || "markup",
          pricingValue: item.pricingValue || 0,
          conversions: (item.conversions || []).map((c) => ({
            fromQuantity: c.fromQuantity,
            toQuantity: c.toQuantity,
            toUnitId: c.toUnitId,
            sellable: c.sellable ?? true,
            sellPrice: c.sellPrice ?? 0,
          })),
          batches: (item.batches || []).map((b) => ({
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
      toast.error(
        e.response?.data?.message || e.message || "Failed to import items",
      );
    }
  };

  const openAdjust = (item: InventoryItem) => {
    setAdjustItem(item);
    setAdjustOpen(true);
  };

  // const profitability = useMemo(
  //   () =>
  //     computeProfitability({
  //       inventoryItems: outletItems,
  //       composites: outletComposites,
  //       outletOverheadDefaults,
  //     }),
  //   [outletItems, outletComposites, outletOverheadDefaults],
  // );

  const tabs: { key: Tab; label: string }[] = [
    { key: "stock", label: "Stock Items" },
    // { key: "profitability", label: "Profitability" },
    {
      key: "adjustments",
      label: `Adjustments${outletAdjustments.length > 0 ? ` (${outletAdjustments.length})` : ""}`,
    },
    { key: "categories", label: "Categories" },
    { key: "units", label: "Units" },
    { key: "composite", label: "Composite Items" },
    { key: "substitutes", label: "Substitute Groups" },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">
            Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage stock, categories, units and composite items
          </p>
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
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
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
                  <p className="text-sm font-medium">
                    {lowStockCount} items need restocking
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Items below minimum threshold
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 border-warning/30 text-warning hover:bg-warning/10 hover:text-warning"
                onClick={() => {
                  setTab("stock");
                  setShowLowStock((prev) => !prev);
                  if (!showLowStock) {
                    setShowExpired(false);
                    setShowExpiringSoon(false);
                  }
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
                  <p className="text-sm font-medium">
                    {expiredItemCount} items have expired batches
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Items with batches past their expiry date
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  setTab("stock");
                  setShowExpired((prev) => !prev);
                  if (!showExpired) {
                    setShowLowStock(false);
                    setShowExpiringSoon(false);
                  }
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
                  <p className="text-sm font-medium">
                    {expiringSoonItemCount} items expiring soon
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Items with batches expiring within 90 days
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 border-orange-400/30 text-orange-500 hover:bg-orange-100/50 hover:text-orange-600"
                onClick={() => {
                  setTab("stock");
                  setShowExpiringSoon((prev) => !prev);
                  if (!showExpiringSoon) {
                    setShowLowStock(false);
                    setShowExpired(false);
                  }
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
              tab === t.key ? "bg-card shadow-sm" : "text-muted-foreground",
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
          onMutate={() => {
            mutateItems();
            mutateAllItems();
          }}
          categories={categories}
          units={units}
          onAdjustStock={isAllOutlets ? undefined : openAdjust}
          readOnly={false}
          selectedOutletId={selectedOutletId}
          filterLowStock={showLowStock}
          filterExpiryStatus={
            showExpired ? "expired" : showExpiringSoon ? "expiring" : undefined
          }
          // profitability={profitability.rawMaterials}
        />
      )}
      {/* {tab === "profitability" && (
        <ProfitabilityView
          inventoryItems={outletItems}
          composites={outletComposites}
          units={units}
          outletOverheadDefaults={outletOverheadDefaults}
          setOutletOverheadDefaults={setOutletOverheadDefaults}
          selectedOutletId={selectedOutletId}
        />
      )} */}
      {tab === "adjustments" &&
        (isAdjustmentsLoading && !adjustmentsResponse ? (
          <Card className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading adjustments...
          </Card>
        ) : (
          <StockAdjustmentHistory
            adjustments={outletAdjustments}
            inventoryItems={outletItems}
            units={units}
            page={adjustmentsPage}
            onPageChange={setAdjustmentsPage}
            perPage={adjustmentsPerPage}
            onPerPageChange={setAdjustmentsPerPage}
            totalPages={adjustmentsResponse?.meta?.last_page ?? 1}
            totalItems={
              adjustmentsResponse?.meta?.total ?? outletAdjustments.length
            }
            search={adjustmentsSearch}
            onSearchChange={setAdjustmentsSearch}
            filterType={adjustmentsFilterType}
            onFilterTypeChange={setAdjustmentsFilterType}
            filterItem={adjustmentsFilterItem}
            onFilterItemChange={setAdjustmentsFilterItem}
            isLoading={isAdjustmentsLoading}
            outletId={selectedOutletId}
          />
        ))}
      {tab === "categories" && (
        <InventoryCategoryManager onMutate={mutateCategories} />
      )}
      {tab === "units" && (
        <MeasuringUnitManager onMutate={mutateUnits} />
      )}
      {tab === "composite" && (
        <CompositeItemForm
          onMutate={mutateComposites}
          units={units}
          readOnly={isAllOutlets}
          selectedOutletId={selectedOutletId}
        />
      )}
      {tab === "substitutes" && (
        <SubstituteGroupManager
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
        onSuccess={() => {
          mutateItems();
          mutateAllItems();
          mutateAdjustments();
        }}
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
