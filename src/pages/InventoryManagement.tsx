import { useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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
  { id: "i1", name: "Coffee Beans (Arabica)", sku: "CB-001", categoryId: "1", unitId: "1", stock: 45, minStock: 20, maxStock: 100, costPrice: 12.5, status: "good" },
  { id: "i2", name: "Whole Milk", sku: "ML-001", categoryId: "1", unitId: "3", stock: 12, minStock: 15, maxStock: 60, costPrice: 1.2, status: "low" },
  { id: "i3", name: "Sugar", sku: "SG-001", categoryId: "2", unitId: "1", stock: 30, minStock: 10, maxStock: 50, costPrice: 0.8, status: "good" },
  { id: "i4", name: "Paper Cups (12oz)", sku: "PC-012", categoryId: "3", unitId: "5", stock: 150, minStock: 200, maxStock: 1000, costPrice: 0.05, status: "low" },
  { id: "i5", name: "Croissant Dough", sku: "CD-001", categoryId: "2", unitId: "1", stock: 8, minStock: 5, maxStock: 25, costPrice: 3.0, status: "good" },
  { id: "i6", name: "Shampoo (Professional)", sku: "SH-001", categoryId: "4", unitId: "7", stock: 3, minStock: 5, maxStock: 20, costPrice: 8.0, status: "critical" },
  { id: "i7", name: "Hair Color Mix", sku: "HC-001", categoryId: "4", unitId: "8", stock: 18, minStock: 10, maxStock: 40, costPrice: 5.5, status: "good" },
  { id: "i8", name: "Disposable Gloves", sku: "DG-001", categoryId: "4", unitId: "6", stock: 2, minStock: 5, maxStock: 20, costPrice: 4.0, status: "critical" },
  { id: "i9", name: "Sandwich Bread", sku: "SB-001", categoryId: "2", unitId: "9", stock: 24, minStock: 10, maxStock: 50, costPrice: 1.5, status: "good" },
  { id: "i10", name: "Napkins", sku: "NP-001", categoryId: "3", unitId: "5", stock: 500, minStock: 200, maxStock: 2000, costPrice: 0.01, status: "good" },
];

const defaultComposites: CompositeItem[] = [
  { id: "c1", name: "Cappuccino", description: "Classic cappuccino", components: [{ inventoryItemId: "i1", quantity: 0.02 }, { inventoryItemId: "i2", quantity: 0.15 }, { inventoryItemId: "i4", quantity: 1 }] },
  { id: "c2", name: "Club Sandwich", description: "Triple-decker sandwich", components: [{ inventoryItemId: "i9", quantity: 2 }, { inventoryItemId: "i3", quantity: 0.005 }] },
  { id: "c3", name: "Hair Coloring Service", description: "Full color treatment", components: [{ inventoryItemId: "i7", quantity: 1 }, { inventoryItemId: "i8", quantity: 1 }, { inventoryItemId: "i6", quantity: 0.03 }] },
];

function computeStatus(stock: number, min: number): InventoryItem["status"] {
  if (stock <= min * 0.3) return "critical";
  if (stock <= min) return "low";
  return "good";
}

type Tab = "stock" | "categories" | "units" | "composite" | "adjustments";

export default function InventoryManagement() {
  const [tab, setTab] = useState<Tab>("stock");
  const [categories, setCategories] = useState<InventoryCategory[]>(defaultCategories);
  const [units, setUnits] = useState<MeasuringUnit[]>(defaultUnits);
  const [items, setItems] = useState<InventoryItem[]>(defaultItems);
  const [composites, setComposites] = useState<CompositeItem[]>(defaultComposites);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const lowStockCount = items.filter((i) => i.status === "low" || i.status === "critical").length;

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
    { key: "adjustments", label: `Adjustments${adjustments.length > 0 ? ` (${adjustments.length})` : ""}` },
    { key: "categories", label: "Categories" },
    { key: "units", label: "Units" },
    { key: "composite", label: "Composite Items" },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage stock, categories, units and composite items</p>
      </div>

      {lowStockCount > 0 && (
        <Card className="p-4 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <div>
              <p className="text-sm font-medium">{lowStockCount} items need restocking</p>
              <p className="text-xs text-muted-foreground">Items below minimum threshold</p>
            </div>
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
        <InventoryItemForm items={items} setItems={setItems} categories={categories} units={units} onAdjustStock={openAdjust} />
      )}
      {tab === "adjustments" && (
        <StockAdjustmentHistory adjustments={adjustments} inventoryItems={items} units={units} />
      )}
      {tab === "categories" && (
        <InventoryCategoryManager categories={categories} setCategories={setCategories} />
      )}
      {tab === "units" && (
        <MeasuringUnitManager units={units} setUnits={setUnits} />
      )}
      {tab === "composite" && (
        <CompositeItemForm composites={composites} setComposites={setComposites} inventoryItems={items} units={units} />
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
