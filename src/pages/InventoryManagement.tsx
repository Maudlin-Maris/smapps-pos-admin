import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useStockAdjustments, type StoredAdjustment } from "@/hooks/use-financial-data";
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
  // Restaurant (outlet-1, outlet-3)
  { id: "i1", name: "Coffee Beans (Arabica)", sku: "CB-001", categoryId: "1", unitId: "1", stock: 45, minStock: 20, costPrice: 12.5, status: "good", conversions: [{ id: "cv1", fromQuantity: 1, toQuantity: 50, toUnitId: "5" }], outletId: "outlet-1" },
  { id: "i2", name: "Whole Milk", sku: "ML-001", categoryId: "1", unitId: "3", stock: 12, minStock: 15, costPrice: 1.2, status: "low", conversions: [{ id: "cv2", fromQuantity: 1, toQuantity: 1000, toUnitId: "4" }], outletId: "outlet-1" },
  { id: "i3", name: "Sugar", sku: "SG-001", categoryId: "2", unitId: "1", stock: 30, minStock: 10, costPrice: 0.8, status: "good", conversions: [{ id: "cv3", fromQuantity: 1, toQuantity: 1000, toUnitId: "2" }], outletId: "outlet-1" },
  { id: "i4", name: "Paper Cups (12oz)", sku: "PC-012", categoryId: "3", unitId: "5", stock: 150, minStock: 200, costPrice: 0.05, status: "low", conversions: [], outletId: "outlet-3" },
  { id: "i5", name: "Croissant Dough", sku: "CD-001", categoryId: "2", unitId: "1", stock: 8, minStock: 5, costPrice: 3.0, status: "good", conversions: [{ id: "cv4", fromQuantity: 1, toQuantity: 10, toUnitId: "5" }], outletId: "outlet-3" },
  // Retail (outlet-2)
  { id: "i9", name: "Sandwich Bread", sku: "SB-001", categoryId: "2", unitId: "9", stock: 24, minStock: 10, costPrice: 1.5, status: "good", conversions: [], outletId: "outlet-2" },
  { id: "i10", name: "Napkins", sku: "NP-001", categoryId: "3", unitId: "5", stock: 500, minStock: 200, costPrice: 0.01, status: "good", conversions: [], outletId: "outlet-2" },
  // Pharmacy (outlet-4)
  { id: "i11", name: "Paracetamol 500mg", sku: "PH-001", categoryId: "5", unitId: "10", stock: 200, minStock: 50, costPrice: 0.15, status: "good", conversions: [{ id: "cv5", fromQuantity: 1, toQuantity: 12, toUnitId: "16" }], outletId: "outlet-4", batches: [
    { id: "b11a", batchNumber: "BT-2025-090", expiryDate: "2026-04-15", quantity: 50 },
    { id: "b11b", batchNumber: "BT-2026-001", expiryDate: "2027-06-15", quantity: 100 },
    { id: "b11c", batchNumber: "BT-2026-044", expiryDate: "2028-01-10", quantity: 50 },
  ] },
  { id: "i12", name: "Amoxicillin 250mg", sku: "PH-002", categoryId: "5", unitId: "10", stock: 80, minStock: 30, costPrice: 0.45, status: "good", conversions: [], outletId: "outlet-4", batches: [
    { id: "b12a", batchNumber: "BT-2025-180", expiryDate: "2026-05-01", quantity: 30 },
    { id: "b12b", batchNumber: "BT-2026-002", expiryDate: "2026-12-01", quantity: 50 },
  ] },
  { id: "i13", name: "Vitamin C 1000mg", sku: "PH-003", categoryId: "5", unitId: "7", stock: 15, minStock: 20, costPrice: 3.5, status: "low", conversions: [], outletId: "outlet-4", batches: [
    { id: "b13a", batchNumber: "BT-2025-118", expiryDate: "2026-04-10", quantity: 5 },
    { id: "b13b", batchNumber: "BT-2026-015", expiryDate: "2026-09-20", quantity: 10 },
  ] },
  { id: "i14", name: "Cough Syrup", sku: "PH-004", categoryId: "5", unitId: "7", stock: 40, minStock: 15, costPrice: 2.8, status: "good", conversions: [], outletId: "outlet-4", batches: [
    { id: "b14a", batchNumber: "BT-2026-045", expiryDate: "2028-01-30", quantity: 40 },
  ] },
  { id: "i15", name: "First Aid Bandages", sku: "PH-005", categoryId: "5", unitId: "6", stock: 5, minStock: 10, costPrice: 4.0, status: "critical", conversions: [], outletId: "outlet-4", batches: [
    { id: "b15a", batchNumber: "BT-2025-200", expiryDate: "2026-02-15", quantity: 5 },
  ] },
  // Salon (outlet-5)
  { id: "i6", name: "Shampoo (Professional)", sku: "SH-001", categoryId: "4", unitId: "7", stock: 3, minStock: 5, costPrice: 8.0, status: "critical", conversions: [], outletId: "outlet-5" },
  { id: "i7", name: "Hair Color Mix", sku: "HC-001", categoryId: "4", unitId: "8", stock: 18, minStock: 10, costPrice: 5.5, status: "good", conversions: [], outletId: "outlet-5" },
  { id: "i8", name: "Disposable Gloves", sku: "DG-001", categoryId: "4", unitId: "6", stock: 2, minStock: 5, costPrice: 4.0, status: "critical", conversions: [], outletId: "outlet-5" },
  { id: "i16", name: "Conditioner (Deep)", sku: "SL-002", categoryId: "4", unitId: "7", stock: 10, minStock: 5, costPrice: 9.0, status: "good", conversions: [], outletId: "outlet-5" },
  { id: "i17", name: "Hair Clips (Assorted)", sku: "SL-003", categoryId: "4", unitId: "10", stock: 50, minStock: 20, costPrice: 0.3, status: "good", conversions: [], outletId: "outlet-5" },
  // Barber (outlet-6)
  { id: "i18", name: "Clipper Oil", sku: "BR-001", categoryId: "4", unitId: "7", stock: 6, minStock: 3, costPrice: 4.5, status: "good", conversions: [], outletId: "outlet-6" },
  { id: "i19", name: "Aftershave Lotion", sku: "BR-002", categoryId: "4", unitId: "7", stock: 8, minStock: 5, costPrice: 6.0, status: "good", conversions: [], outletId: "outlet-6" },
  { id: "i20", name: "Razor Blades", sku: "BR-003", categoryId: "4", unitId: "10", stock: 10, minStock: 20, costPrice: 0.8, status: "low", conversions: [], outletId: "outlet-6" },
  { id: "i21", name: "Shaving Cream", sku: "BR-004", categoryId: "4", unitId: "8", stock: 12, minStock: 5, costPrice: 3.0, status: "good", conversions: [], outletId: "outlet-6" },
  // Grocery (outlet-7)
  { id: "i22", name: "Tomatoes (Fresh)", sku: "GR-001", categoryId: "6", unitId: "1", stock: 60, minStock: 20, costPrice: 1.2, status: "good", conversions: [], outletId: "outlet-7", batches: [
    { id: "b22a", batchNumber: "GR-TM-001", expiryDate: "2026-04-05", quantity: 25 },
    { id: "b22b", batchNumber: "GR-TM-002", expiryDate: "2026-04-20", quantity: 35 },
  ] },
  { id: "i23", name: "Onions", sku: "GR-002", categoryId: "6", unitId: "1", stock: 40, minStock: 15, costPrice: 0.8, status: "good", conversions: [], outletId: "outlet-7" },
  { id: "i24", name: "Palm Oil", sku: "GR-003", categoryId: "12", unitId: "3", stock: 25, minStock: 10, costPrice: 3.5, status: "good", conversions: [], outletId: "outlet-7", batches: [
    { id: "b24a", batchNumber: "GR-B-2026-03", expiryDate: "2027-03-20", quantity: 25 },
  ] },
  { id: "i25", name: "Basmati Rice 5kg", sku: "GR-004", categoryId: "12", unitId: "5", stock: 8, minStock: 15, costPrice: 8.0, status: "low", conversions: [], outletId: "outlet-7", batches: [
    { id: "b25a", batchNumber: "GR-B-2025-88", expiryDate: "2026-05-15", quantity: 3 },
    { id: "b25b", batchNumber: "GR-B-2026-22", expiryDate: "2026-09-15", quantity: 5 },
  ] },
  { id: "i26", name: "Instant Noodles (Carton)", sku: "GR-005", categoryId: "12", unitId: "11", stock: 14, minStock: 5, costPrice: 12.0, status: "good", conversions: [{ id: "cv6", fromQuantity: 1, toQuantity: 40, toUnitId: "5" }], outletId: "outlet-7", batches: [
    { id: "b26a", batchNumber: "GR-B-2026-12", expiryDate: "2026-06-10", quantity: 6 },
    { id: "b26b", batchNumber: "GR-B-2026-30", expiryDate: "2027-01-10", quantity: 8 },
  ] },
  // Supermarket (outlet-8)
  { id: "i27", name: "Full Cream Milk 1L", sku: "SM-001", categoryId: "7", unitId: "11", stock: 30, minStock: 20, costPrice: 1.8, status: "good", conversions: [{ id: "cv7", fromQuantity: 1, toQuantity: 12, toUnitId: "5" }], outletId: "outlet-8", batches: [
    { id: "b27a", batchNumber: "SM-2026-A1", expiryDate: "2026-04-12", quantity: 10 },
    { id: "b27b", batchNumber: "SM-2026-C3", expiryDate: "2026-05-25", quantity: 20 },
  ] },
  { id: "i28", name: "Cheddar Cheese Block", sku: "SM-002", categoryId: "7", unitId: "5", stock: 18, minStock: 10, costPrice: 5.5, status: "good", conversions: [], outletId: "outlet-8", batches: [
    { id: "b28a", batchNumber: "SM-2026-A2", expiryDate: "2026-04-30", quantity: 8 },
    { id: "b28b", batchNumber: "SM-2026-D1", expiryDate: "2026-06-30", quantity: 10 },
  ] },
  { id: "i29", name: "Frozen Chicken Wings 1kg", sku: "SM-003", categoryId: "7", unitId: "10", stock: 12, minStock: 20, costPrice: 6.0, status: "low", conversions: [], outletId: "outlet-8", batches: [
    { id: "b29a", batchNumber: "SM-2026-B1", expiryDate: "2026-05-15", quantity: 4 },
    { id: "b29b", batchNumber: "SM-2026-B5", expiryDate: "2026-08-15", quantity: 8 },
  ] },
  { id: "i30", name: "Toilet Tissue (Pack 12)", sku: "SM-004", categoryId: "3", unitId: "10", stock: 45, minStock: 15, costPrice: 4.5, status: "good", conversions: [], outletId: "outlet-8" },
  { id: "i31", name: "Detergent 2kg", sku: "SM-005", categoryId: "3", unitId: "5", stock: 22, minStock: 10, costPrice: 3.2, status: "good", conversions: [], outletId: "outlet-8" },
  // Wine & Liquor (outlet-9)
  { id: "i32", name: "Cabernet Sauvignon Reserve", sku: "WN-001", categoryId: "8", unitId: "7", stock: 24, minStock: 10, costPrice: 15.0, status: "good", conversions: [], outletId: "outlet-9" },
  { id: "i33", name: "Hennessy VS 750ml", sku: "WN-002", categoryId: "8", unitId: "7", stock: 8, minStock: 5, costPrice: 35.0, status: "good", conversions: [], outletId: "outlet-9" },
  { id: "i34", name: "Prosecco Brut", sku: "WN-003", categoryId: "8", unitId: "7", stock: 3, minStock: 6, costPrice: 12.0, status: "critical", conversions: [], outletId: "outlet-9" },
  { id: "i35", name: "Tonic Water (Pack 6)", sku: "WN-004", categoryId: "8", unitId: "10", stock: 20, minStock: 10, costPrice: 4.0, status: "good", conversions: [], outletId: "outlet-9" },
  // Clothing (outlet-10)
  { id: "i36", name: "Cotton T-Shirt Blank (White)", sku: "CL-001", categoryId: "9", unitId: "5", stock: 120, minStock: 30, costPrice: 3.5, status: "good", conversions: [], outletId: "outlet-10" },
  { id: "i37", name: "Denim Jeans (Unisex)", sku: "CL-002", categoryId: "9", unitId: "5", stock: 45, minStock: 15, costPrice: 12.0, status: "good", conversions: [], outletId: "outlet-10" },
  { id: "i38", name: "Sneakers (Running)", sku: "CL-003", categoryId: "9", unitId: "12", stock: 8, minStock: 10, costPrice: 25.0, status: "low", conversions: [], outletId: "outlet-10" },
  { id: "i39", name: "Leather Belt", sku: "CL-004", categoryId: "9", unitId: "5", stock: 30, minStock: 10, costPrice: 6.0, status: "good", conversions: [], outletId: "outlet-10" },
  // Electronics (outlet-11)
  { id: "i40", name: "USB-C Charging Cable", sku: "EL-001", categoryId: "10", unitId: "5", stock: 200, minStock: 50, costPrice: 1.5, status: "good", conversions: [], outletId: "outlet-11" },
  { id: "i41", name: "Wireless Earbuds", sku: "EL-002", categoryId: "10", unitId: "5", stock: 35, minStock: 15, costPrice: 18.0, status: "good", conversions: [], outletId: "outlet-11" },
  { id: "i42", name: "Phone Screen Protector", sku: "EL-003", categoryId: "10", unitId: "10", stock: 80, minStock: 30, costPrice: 0.8, status: "good", conversions: [], outletId: "outlet-11" },
  { id: "i43", name: "Power Bank 10000mAh", sku: "EL-004", categoryId: "10", unitId: "5", stock: 4, minStock: 10, costPrice: 12.0, status: "critical", conversions: [], outletId: "outlet-11" },
  { id: "i44", name: "Bluetooth Speaker", sku: "EL-005", categoryId: "10", unitId: "5", stock: 15, minStock: 8, costPrice: 22.0, status: "good", conversions: [], outletId: "outlet-11" },
  // Hair / Wig Store (outlet-12)
  { id: "i45", name: "Brazilian Body Wave 18\"", sku: "HW-001", categoryId: "11", unitId: "5", stock: 20, minStock: 8, costPrice: 45.0, status: "good", conversions: [], outletId: "outlet-12" },
  { id: "i46", name: "Lace Front Wig (Bob)", sku: "HW-002", categoryId: "11", unitId: "5", stock: 6, minStock: 5, costPrice: 65.0, status: "good", conversions: [], outletId: "outlet-12" },
  { id: "i47", name: "Closure 4x4 Straight", sku: "HW-003", categoryId: "11", unitId: "5", stock: 12, minStock: 5, costPrice: 30.0, status: "good", conversions: [], outletId: "outlet-12" },
  { id: "i48", name: "Wig Cap (Mesh)", sku: "HW-004", categoryId: "11", unitId: "10", stock: 3, minStock: 10, costPrice: 1.0, status: "critical", conversions: [], outletId: "outlet-12" },
  { id: "i49", name: "Edge Control Gel", sku: "HW-005", categoryId: "11", unitId: "5", stock: 25, minStock: 10, costPrice: 4.5, status: "good", conversions: [], outletId: "outlet-12" },
];

const defaultComposites: CompositeItem[] = [
  { id: "c1", name: "Cappuccino", menuItemId: "m1", menuVariantId: "v1", description: "Classic cappuccino", components: [{ inventoryItemId: "i1", quantity: 0.02, role: "primary" }, { inventoryItemId: "i2", quantity: 0.15, role: "secondary" }, { inventoryItemId: "i4", quantity: 1, role: "secondary" }], outletId: "outlet-1" },
  { id: "c2", name: "Club Sandwich", menuItemId: "m4", description: "Triple-decker sandwich", components: [{ inventoryItemId: "i9", quantity: 2, role: "primary" }, { inventoryItemId: "i3", quantity: 0.005, role: "secondary" }], outletId: "outlet-3" },
  { id: "c3", name: "Hair Coloring Service", menuItemId: "m7", description: "Full color treatment", components: [{ inventoryItemId: "i7", quantity: 1, role: "primary" }, { inventoryItemId: "i8", quantity: 1, role: "secondary" }, { inventoryItemId: "i6", quantity: 0.03, role: "secondary" }], outletId: "outlet-5" },
];

function computeStatus(stock: number, min: number): InventoryItem["status"] {
  if (stock <= min * 0.3) return "critical";
  if (stock <= min) return "low";
  return "good";
}

type MenuItemOption = { id: string; name: string; variants: { id: string; name: string }[] };

type Tab = "stock" | "categories" | "units" | "composite" | "adjustments";

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
  const [categories, setCategories] = useState<InventoryCategory[]>(defaultCategories);
  const [units, setUnits] = useState<MeasuringUnit[]>(defaultUnits);
  const [items, setItems] = useState<InventoryItem[]>(defaultItems);
  const [composites, setComposites] = useState<CompositeItem[]>(defaultComposites);
  const { adjustments: storedAdjustments, addAdjustment } = useStockAdjustments();
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

  const handleAdjustStock = (itemId: string, type: AdjustmentType, quantity: number, reason: string, batchCostPrice?: number, batchNumber?: string, expiryDate?: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const previousStock = item.stock;
    let newStock: number;
    let newAverageCost = item.costPrice;
    let updatedBatches = item.batches ? [...item.batches.map(b => ({ ...b }))] : undefined;
    
    if (type === "set") {
      newStock = quantity;
    } else if (type === "add" || type === "returned") {
      newStock = previousStock + quantity;
      
      // Calculate Weighted Average Cost (WAC)
      if (batchCostPrice !== undefined && batchCostPrice > 0 && newStock > 0) {
        const currentTotalValue = previousStock * item.costPrice;
        const newBatchValue = quantity * batchCostPrice;
        newAverageCost = (currentTotalValue + newBatchValue) / newStock;
      }

      // Add new batch entry if batch-tracked
      if (batchNumber && expiryDate && updatedBatches) {
        updatedBatches.push({
          id: crypto.randomUUID(),
          batchNumber,
          expiryDate,
          quantity,
        });
      } else if (batchNumber && expiryDate && !updatedBatches) {
        updatedBatches = [{
          id: crypto.randomUUID(),
          batchNumber,
          expiryDate,
          quantity,
        }];
      }
    } else {
      newStock = Math.max(0, previousStock - quantity);

      // For removals, reduce from batches using FEFO (First Expiry, First Out)
      if (updatedBatches && updatedBatches.length > 0) {
        // Sort by expiry date ascending (earliest first)
        updatedBatches.sort((a, b) => {
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        });
        let remaining = quantity;
        for (const batch of updatedBatches) {
          if (remaining <= 0) break;
          const deduct = Math.min(batch.quantity, remaining);
          batch.quantity -= deduct;
          remaining -= deduct;
        }
        // Remove empty batches
        updatedBatches = updatedBatches.filter(b => b.quantity > 0);
      }
    }

    const quantityChange = type === "set" ? Math.abs(newStock - previousStock) : quantity;
    
    const recordedCostPrice = (type === "add" || type === "returned") && batchCostPrice ? batchCostPrice : item.costPrice;
    const costTotal = quantityChange * recordedCostPrice;

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
      costPrice: recordedCostPrice,
      costTotal,
      batchNumber,
      expiryDate,
    };

    setAdjustments((prev) => [adjustment, ...prev]);

    // Also persist to localStorage for COGS reporting
    const storedAdj: StoredAdjustment = {
      ...adjustment,
      timestamp: adjustment.timestamp.toISOString(),
    };
    addAdjustment(storedAdj);

    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { 
              ...i, 
              stock: newStock, 
              costPrice: newAverageCost,
              status: computeStatus(newStock, i.minStock),
              batches: updatedBatches,
            }
          : i
      )
    );
    
    const costChangeMsg = newAverageCost !== item.costPrice 
      ? ` | Avg cost updated: ₦${item.costPrice.toFixed(2)} → ₦${newAverageCost.toFixed(2)}`
      : "";
    toast.success(`Stock adjusted: ${previousStock} → ${newStock} (cost: ₦${costTotal.toFixed(2)})${costChangeMsg}`);
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
