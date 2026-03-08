import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { outlets } from "@/data/outlets";
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

const defaultItems: InventoryItem[] = [
  { id: "i1", name: "Coffee Beans (Arabica)", sku: "CB-001", categoryId: "1", unitId: "1", stock: 45, minStock: 20, costPrice: 12.5, status: "good", conversions: [{ id: "cv1", fromQuantity: 1, toQuantity: 50, toUnitId: "5" }], outletId: "outlet-1" },
  { id: "i2", name: "Whole Milk", sku: "ML-001", categoryId: "1", unitId: "3", stock: 12, minStock: 15, costPrice: 1.2, status: "low", conversions: [{ id: "cv2", fromQuantity: 1, toQuantity: 1000, toUnitId: "4" }], outletId: "outlet-1" },
  { id: "i3", name: "Sugar", sku: "SG-001", categoryId: "2", unitId: "1", stock: 30, minStock: 10, costPrice: 0.8, status: "good", conversions: [{ id: "cv3", fromQuantity: 1, toQuantity: 1000, toUnitId: "2" }], outletId: "outlet-1" },
  { id: "i4", name: "Paper Cups (12oz)", sku: "PC-012", categoryId: "3", unitId: "5", stock: 150, minStock: 200, costPrice: 0.05, status: "low", conversions: [], outletId: "outlet-2" },
  { id: "i5", name: "Croissant Dough", sku: "CD-001", categoryId: "2", unitId: "1", stock: 8, minStock: 5, costPrice: 3.0, status: "good", conversions: [{ id: "cv4", fromQuantity: 1, toQuantity: 10, toUnitId: "5" }], outletId: "outlet-2" },
  { id: "i6", name: "Shampoo (Professional)", sku: "SH-001", categoryId: "4", unitId: "7", stock: 3, minStock: 5, costPrice: 8.0, status: "critical", conversions: [], outletId: "outlet-3" },
  { id: "i7", name: "Hair Color Mix", sku: "HC-001", categoryId: "4", unitId: "8", stock: 18, minStock: 10, costPrice: 5.5, status: "good", conversions: [], outletId: "outlet-3" },
  { id: "i8", name: "Disposable Gloves", sku: "DG-001", categoryId: "4", unitId: "6", stock: 2, minStock: 5, costPrice: 4.0, status: "critical", conversions: [], outletId: "outlet-3" },
  { id: "i9", name: "Sandwich Bread", sku: "SB-001", categoryId: "2", unitId: "9", stock: 24, minStock: 10, costPrice: 1.5, status: "good", conversions: [], outletId: "outlet-4" },
  { id: "i10", name: "Napkins", sku: "NP-001", categoryId: "3", unitId: "5", stock: 500, minStock: 200, costPrice: 0.01, status: "good", conversions: [], outletId: "outlet-4" },
];

const defaultComposites: CompositeItem[] = [
  { id: "c1", name: "Cappuccino", menuItemId: "m1", menuVariantId: "v1", description: "Classic cappuccino", components: [{ inventoryItemId: "i1", quantity: 0.02, role: "primary" }, { inventoryItemId: "i2", quantity: 0.15, role: "secondary" }, { inventoryItemId: "i4", quantity: 1, role: "secondary" }], outletId: "outlet-1" },
  { id: "c2", name: "Club Sandwich", menuItemId: "m4", description: "Triple-decker sandwich", components: [{ inventoryItemId: "i9", quantity: 2, role: "primary" }, { inventoryItemId: "i3", quantity: 0.005, role: "secondary" }], outletId: "outlet-2" },
  { id: "c3", name: "Hair Coloring Service", menuItemId: "m7", description: "Full color treatment", components: [{ inventoryItemId: "i7", quantity: 1, role: "primary" }, { inventoryItemId: "i8", quantity: 1, role: "secondary" }, { inventoryItemId: "i6", quantity: 0.03, role: "secondary" }], outletId: "outlet-3" },
];

function computeStatus(stock: number, min: number): InventoryItem["status"] {
  if (stock <= min * 0.3) return "critical";
  if (stock <= min) return "low";
  return "good";
}

type MenuItemOption = { id: string; name: string; variants: { id: string; name: string }[] };

type Tab = "stock" | "categories" | "units" | "composite" | "adjustments";

const sampleMenuItems: MenuItemOption[] = [
  { id: "m1", name: "Cappuccino", variants: [{ id: "v1", name: "Regular" }, { id: "v2", name: "Small" }, { id: "v3", name: "Large" }] },
  { id: "m2", name: "Iced Latte", variants: [] },
  { id: "m3", name: "Croissant", variants: [] },
  { id: "m4", name: "Club Sandwich", variants: [] },
  { id: "m5", name: "Espresso", variants: [] },
  { id: "m6", name: "Men's Haircut", variants: [] },
  { id: "m7", name: "Full Color", variants: [] },
  { id: "m8", name: "Blowout", variants: [] },
  { id: "m9", name: "Organic Apples", variants: [] },
  { id: "m10", name: "Trail Mix", variants: [] },
];

export default function InventoryManagement() {
  const [tab, setTab] = useState<Tab>("stock");
  const [categories, setCategories] = useState<InventoryCategory[]>(defaultCategories);
  const [units, setUnits] = useState<MeasuringUnit[]>(defaultUnits);
  const [items, setItems] = useState<InventoryItem[]>(defaultItems);
  const [composites, setComposites] = useState<CompositeItem[]>(defaultComposites);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedOutletId, setSelectedOutletId] = useState<string>("all");
  const [showLowStock, setShowLowStock] = useState(false);

  const isAllOutlets = selectedOutletId === "all";

  const outletItems = useMemo(
    () => isAllOutlets ? items : items.filter((i) => i.outletId === selectedOutletId),
    [items, selectedOutletId, isAllOutlets]
  );

  const outletComposites = useMemo(
    () => isAllOutlets ? composites : composites.filter((c) => c.outletId === selectedOutletId),
    [composites, selectedOutletId, isAllOutlets]
  );

  const outletAdjustments = useMemo(
    () => isAllOutlets ? adjustments : adjustments.filter((a) => a.outletId === selectedOutletId),
    [adjustments, selectedOutletId, isAllOutlets]
  );

  const lowStockCount = outletItems.filter((i) => i.status === "low" || i.status === "critical").length;

  const handleAdjustStock = (itemId: string, type: AdjustmentType, quantity: number, reason: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const previousStock = item.stock;
    let newStock: number;
    if (type === "set") {
      newStock = quantity;
    } else if (type === "add" || type === "returned") {
      newStock = previousStock + quantity;
    } else {
      newStock = Math.max(0, previousStock - quantity);
    }

    const quantityChange = type === "set" ? Math.abs(newStock - previousStock) : quantity;

    const adjustment: StockAdjustment = {
      id: crypto.randomUUID(),
      inventoryItemId: itemId,
      type,
      quantityChange,
      previousStock,
      newStock,
      reason,
      timestamp: new Date(),
      outletId: item.outletId,
    };

    setAdjustments((prev) => [adjustment, ...prev]);
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, stock: newStock, status: computeStatus(newStock, i.minStock) }
          : i
      )
    );
    toast.success(`Stock adjusted: ${previousStock} → ${newStock}`);
  };

  const openAdjust = (item: InventoryItem) => {
    setAdjustItem(item);
    setAdjustOpen(true);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "stock", label: "Stock Items" },
    { key: "adjustments", label: `Adjustments${outletAdjustments.length > 0 ? ` (${outletAdjustments.length})` : ""}` },
    { key: "categories", label: "Categories" },
    { key: "units", label: "Units" },
    { key: "composite", label: "Composite Items" },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage stock, categories, units and composite items</p>
        </div>
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
              }}
            >
              <Eye className="h-3.5 w-3.5" />
              {showLowStock ? "Show All" : "View Items"}
            </Button>
          </div>
        </Card>
      )}

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
          items={outletItems}
          setItems={setItems}
          categories={categories}
          units={units}
          onAdjustStock={isAllOutlets ? undefined : openAdjust}
          readOnly={isAllOutlets}
          selectedOutletId={selectedOutletId}
          filterLowStock={showLowStock}
        />
      )}
      {tab === "adjustments" && (
        <StockAdjustmentHistory adjustments={outletAdjustments} inventoryItems={outletItems} units={units} />
      )}
      {tab === "categories" && (
        <InventoryCategoryManager categories={categories} setCategories={setCategories} />
      )}
      {tab === "units" && (
        <MeasuringUnitManager units={units} setUnits={setUnits} />
      )}
      {tab === "composite" && (
        <CompositeItemForm
          composites={outletComposites}
          setComposites={setComposites}
          inventoryItems={outletItems}
          units={units}
          menuItems={sampleMenuItems}
          readOnly={isAllOutlets}
          selectedOutletId={selectedOutletId}
        />
      )}

      <StockAdjustDialog
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        item={adjustItem}
        onAdjust={handleAdjustStock}
      />
    </div>
  );
}
