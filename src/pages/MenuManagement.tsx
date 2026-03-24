import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Copy, Upload } from "lucide-react";
import { toast } from "sonner";
import CategoryManager, { type Category } from "@/components/menu/CategoryManager";
import MenuItemForm, { type MenuItem } from "@/components/menu/MenuItemForm";
import MenuList from "@/components/menu/MenuList";
import CopyMenuDialog from "@/components/menu/CopyMenuDialog";
import ImportMenuDialog from "@/components/menu/ImportMenuDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { outlets } from "@/data/outlets";

const initialCategories: Category[] = [
  {
    id: "cat-1",
    name: "Food & Beverages",
    subcategories: [
      { id: "sub-1", name: "Hot Drinks" },
      { id: "sub-2", name: "Cold Drinks" },
      { id: "sub-3", name: "Pastries" },
      { id: "sub-4", name: "Sandwiches" },
    ],
  },
  {
    id: "cat-2",
    name: "Hair Services",
    subcategories: [
      { id: "sub-5", name: "Haircut" },
      { id: "sub-6", name: "Coloring" },
      { id: "sub-7", name: "Styling" },
    ],
  },
  {
    id: "cat-3",
    name: "Grocery",
    subcategories: [
      { id: "sub-8", name: "Fresh Produce" },
      { id: "sub-9", name: "Dairy" },
      { id: "sub-10", name: "Snacks" },
    ],
  },
];

const initialMenuItems: MenuItem[] = [
  // Restaurant — Downtown Flagship (outlet-1)
  { id: "m1", name: "Cappuccino", description: "Rich espresso with steamed milk foam", category: "Food & Beverages", subcategory: "Hot Drinks", price: 3.5, quantity: 150, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "HD-001", status: "active", images: [], trackInventory: false, outletId: "outlet-1", variants: [{ id: "v1", name: "Regular", price: 4.5, quantity: 50, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: true, sku: "HD-001-R", status: "active" }, { id: "v2", name: "Small", price: 3.5, quantity: 50, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: false, sku: "HD-001-S", status: "active" }, { id: "v3", name: "Large", price: 5.5, quantity: 50, salePrice: 4.99, salePeriodStart: new Date("2026-03-01"), salePeriodEnd: new Date("2026-03-31"), trackInventory: true, sku: "HD-001-L", status: "inactive" }] },
  { id: "m2", name: "Iced Latte", description: "Chilled espresso with cold milk", category: "Food & Beverages", subcategory: "Cold Drinks", price: 5.0, quantity: 80, salePrice: 3.99, salePeriodStart: new Date("2026-03-01"), salePeriodEnd: new Date("2026-03-31"), sku: "CD-001", status: "active", images: [], trackInventory: true, outletId: "outlet-1", variants: [] },
  { id: "m3", name: "Croissant", description: "Buttery French pastry", category: "Food & Beverages", subcategory: "Pastries", price: 3.25, quantity: 40, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "PS-001", status: "active", images: [], trackInventory: false, outletId: "outlet-1", variants: [] },
  // Retail — Mall Branch (outlet-2)
  { id: "m4", name: "Club Sandwich", description: "Triple-decker with turkey and bacon", category: "Food & Beverages", subcategory: "Sandwiches", price: 8.5, quantity: 20, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "SW-001", status: "inactive", images: [], trackInventory: false, outletId: "outlet-2", variants: [] },
  { id: "m5", name: "Espresso", description: "Double shot espresso", category: "Food & Beverages", subcategory: "Hot Drinks", price: 3.0, quantity: 200, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "HD-002", status: "active", images: [], trackInventory: true, outletId: "outlet-2", variants: [] },
  // Restaurant — Airport Kiosk (outlet-3)
  { id: "m20", name: "Chicken Wrap", description: "Grilled chicken with lettuce wrap", category: "Food & Beverages", subcategory: "Sandwiches", price: 7.5, quantity: 30, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "SW-002", status: "active", images: [], trackInventory: true, outletId: "outlet-3", variants: [] },
  { id: "m21", name: "Orange Juice", description: "Freshly squeezed orange juice", category: "Food & Beverages", subcategory: "Cold Drinks", price: 4.0, quantity: 60, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "CD-002", status: "active", images: [], trackInventory: false, outletId: "outlet-3", variants: [] },
  // Pharmacy — Suburban Pharmacy (outlet-4)
  { id: "m22", name: "Paracetamol 500mg", description: "Pain relief tablets, pack of 12", category: "Grocery", subcategory: "Fresh Produce", price: 2.5, quantity: 500, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "6901234567890", status: "active", images: [], trackInventory: true, outletId: "outlet-4", variants: [] },
  { id: "m23", name: "Vitamin C 1000mg", description: "Effervescent vitamin C tablets", category: "Grocery", subcategory: "Dairy", price: 8.99, quantity: 120, salePrice: 6.99, salePeriodStart: new Date("2026-03-01"), salePeriodEnd: new Date("2026-04-30"), sku: "6901234567891", status: "active", images: [], trackInventory: true, outletId: "outlet-4", variants: [] },
  { id: "m24", name: "Cough Syrup", description: "Adult cough & cold relief 200ml", category: "Grocery", subcategory: "Fresh Produce", price: 5.5, quantity: 80, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "6901234567892", status: "active", images: [], trackInventory: true, outletId: "outlet-4", variants: [] },
  { id: "m25", name: "Digital Thermometer", description: "Fast-read digital thermometer", category: "Grocery", subcategory: "Fresh Produce", price: 12.0, quantity: 30, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "6901234567893", status: "active", images: [], trackInventory: true, outletId: "outlet-4", variants: [] },
  // Salon — Glow Beauty Salon (outlet-5)
  { id: "m6", name: "Women's Haircut", description: "Cut and style for women", category: "Hair Services", subcategory: "Haircut", price: 35.0, quantity: 0, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "HC-001", status: "active", images: [], trackInventory: false, outletId: "outlet-5", variants: [] },
  { id: "m7", name: "Full Color", description: "Complete hair coloring service", category: "Hair Services", subcategory: "Coloring", price: 85.0, quantity: 0, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "CL-001", status: "active", images: [], trackInventory: false, outletId: "outlet-5", variants: [] },
  { id: "m8", name: "Blowout", description: "Professional blow dry and style", category: "Hair Services", subcategory: "Styling", price: 35.0, quantity: 0, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "ST-001", status: "active", images: [], trackInventory: false, outletId: "outlet-5", variants: [] },
  { id: "m26", name: "Deep Conditioning Treatment", description: "Intensive hair repair mask", category: "Hair Services", subcategory: "Styling", price: 25.0, quantity: 0, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "ST-002", status: "active", images: [], trackInventory: false, outletId: "outlet-5", variants: [] },
  // Barber — Sharp Cuts Barber (outlet-6)
  { id: "m27", name: "Men's Haircut", description: "Classic men's cut and style", category: "Hair Services", subcategory: "Haircut", price: 15.0, quantity: 0, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "BR-HC-001", status: "active", images: [], trackInventory: false, outletId: "outlet-6", variants: [{ id: "v4", name: "Regular Cut", price: 15.0, quantity: 0, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: false, sku: "BR-HC-001-R", status: "active" }, { id: "v5", name: "Fade", price: 20.0, quantity: 0, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: false, sku: "BR-HC-001-F", status: "active" }, { id: "v6", name: "Skin Fade + Beard", price: 30.0, quantity: 0, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: false, sku: "BR-HC-001-SFB", status: "active" }] },
  { id: "m28", name: "Hot Towel Shave", description: "Traditional straight razor shave", category: "Hair Services", subcategory: "Styling", price: 20.0, quantity: 0, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "BR-SH-001", status: "active", images: [], trackInventory: false, outletId: "outlet-6", variants: [] },
  // Grocery — FreshMart Grocery (outlet-7)
  { id: "m9", name: "Organic Apples", description: "Fresh organic apples per kg", category: "Grocery", subcategory: "Fresh Produce", price: 4.99, quantity: 150, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "5012345678901", status: "active", images: [], trackInventory: true, outletId: "outlet-7", variants: [] },
  { id: "m29", name: "Tomatoes (1kg)", description: "Vine-ripened tomatoes", category: "Grocery", subcategory: "Fresh Produce", price: 2.5, quantity: 200, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "5012345678902", status: "active", images: [], trackInventory: true, outletId: "outlet-7", variants: [] },
  { id: "m30", name: "Basmati Rice 5kg", description: "Premium long grain basmati rice", category: "Grocery", subcategory: "Snacks", price: 12.0, quantity: 80, salePrice: 9.99, salePeriodStart: new Date("2026-03-15"), salePeriodEnd: new Date("2026-04-15"), sku: "5012345678903", status: "active", images: [], trackInventory: true, outletId: "outlet-7", variants: [] },
  { id: "m31", name: "Palm Oil 1L", description: "Pure palm oil for cooking", category: "Grocery", subcategory: "Snacks", price: 5.5, quantity: 60, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "5012345678904", status: "active", images: [], trackInventory: true, outletId: "outlet-7", variants: [] },
  // Supermarket — MegaMart Supermarket (outlet-8)
  { id: "m32", name: "Full Cream Milk 1L", description: "Fresh full cream milk", category: "Grocery", subcategory: "Dairy", price: 2.5, quantity: 300, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "7012345678901", status: "active", images: [], trackInventory: true, outletId: "outlet-8", variants: [] },
  { id: "m33", name: "Cheddar Cheese 250g", description: "Aged cheddar cheese block", category: "Grocery", subcategory: "Dairy", price: 6.99, quantity: 80, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "7012345678902", status: "active", images: [], trackInventory: true, outletId: "outlet-8", variants: [] },
  { id: "m34", name: "Frozen Chicken Wings 1kg", description: "IQF chicken wings", category: "Grocery", subcategory: "Fresh Produce", price: 8.5, quantity: 50, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "7012345678903", status: "active", images: [], trackInventory: true, outletId: "outlet-8", variants: [] },
  { id: "m35", name: "Laundry Detergent 2kg", description: "Heavy-duty washing powder", category: "Grocery", subcategory: "Snacks", price: 5.99, quantity: 100, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "7012345678904", status: "active", images: [], trackInventory: true, outletId: "outlet-8", variants: [] },
  // Wine & Liquor — Vine & Spirit (outlet-9)
  { id: "m36", name: "Cabernet Sauvignon Reserve", description: "Full-bodied red wine, 750ml", category: "Grocery", subcategory: "Snacks", price: 28.0, quantity: 24, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "8012345678901", status: "active", images: [], trackInventory: true, outletId: "outlet-9", variants: [] },
  { id: "m37", name: "Hennessy VS 750ml", description: "Cognac, Very Special", category: "Grocery", subcategory: "Snacks", price: 55.0, quantity: 12, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "8012345678902", status: "active", images: [], trackInventory: true, outletId: "outlet-9", variants: [] },
  { id: "m38", name: "Prosecco Brut", description: "Italian sparkling wine, 750ml", category: "Grocery", subcategory: "Snacks", price: 18.0, quantity: 30, salePrice: 14.99, salePeriodStart: new Date("2026-03-01"), salePeriodEnd: new Date("2026-03-31"), sku: "8012345678903", status: "active", images: [], trackInventory: true, outletId: "outlet-9", variants: [] },
  // Clothing — Urban Threads (outlet-10)
  { id: "m39", name: "Classic T-Shirt", description: "100% cotton unisex tee", category: "Grocery", subcategory: "Snacks", price: 15.0, quantity: 200, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "9012345678901", status: "active", images: [], trackInventory: true, outletId: "outlet-10", variants: [{ id: "v7", name: "S", price: 15.0, quantity: 50, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: true, sku: "9012345678901-S", status: "active" }, { id: "v8", name: "M", price: 15.0, quantity: 80, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: true, sku: "9012345678901-M", status: "active" }, { id: "v9", name: "L", price: 15.0, quantity: 50, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: true, sku: "9012345678901-L", status: "active" }, { id: "v10", name: "XL", price: 16.0, quantity: 20, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: true, sku: "9012345678901-XL", status: "active" }] },
  { id: "m40", name: "Slim Fit Jeans", description: "Stretch denim slim fit", category: "Grocery", subcategory: "Snacks", price: 45.0, quantity: 60, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "9012345678902", status: "active", images: [], trackInventory: true, outletId: "outlet-10", variants: [{ id: "v11", name: "30", price: 45.0, quantity: 15, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: true, sku: "9012345678902-30", status: "active" }, { id: "v12", name: "32", price: 45.0, quantity: 20, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: true, sku: "9012345678902-32", status: "active" }, { id: "v13", name: "34", price: 45.0, quantity: 25, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: true, sku: "9012345678902-34", status: "active" }] },
  { id: "m41", name: "Running Sneakers", description: "Lightweight performance shoes", category: "Grocery", subcategory: "Snacks", price: 65.0, quantity: 30, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "9012345678903", status: "active", images: [], trackInventory: true, outletId: "outlet-10", variants: [{ id: "v14", name: "US 8", price: 65.0, quantity: 8, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: true, sku: "9012345678903-8", status: "active" }, { id: "v15", name: "US 9", price: 65.0, quantity: 10, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: true, sku: "9012345678903-9", status: "active" }, { id: "v16", name: "US 10", price: 65.0, quantity: 12, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: true, sku: "9012345678903-10", status: "active" }] },
  // Electronics — TechZone (outlet-11)
  { id: "m42", name: "USB-C Cable 1m", description: "Fast-charge USB-C to USB-C cable", category: "Grocery", subcategory: "Snacks", price: 8.0, quantity: 300, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "1012345678901", status: "active", images: [], trackInventory: true, outletId: "outlet-11", variants: [] },
  { id: "m43", name: "Wireless Earbuds Pro", description: "Active noise cancellation earbuds", category: "Grocery", subcategory: "Snacks", price: 49.99, quantity: 50, salePrice: 39.99, salePeriodStart: new Date("2026-03-01"), salePeriodEnd: new Date("2026-03-31"), sku: "1012345678902", status: "active", images: [], trackInventory: true, outletId: "outlet-11", variants: [{ id: "v17", name: "Black", price: 49.99, quantity: 25, salePrice: 39.99, salePeriodStart: new Date("2026-03-01"), salePeriodEnd: new Date("2026-03-31"), trackInventory: true, sku: "1012345678902-BK", status: "active" }, { id: "v18", name: "White", price: 49.99, quantity: 25, salePrice: 39.99, salePeriodStart: new Date("2026-03-01"), salePeriodEnd: new Date("2026-03-31"), trackInventory: true, sku: "1012345678902-WH", status: "active" }] },
  { id: "m44", name: "Power Bank 10000mAh", description: "Portable fast-charging power bank", category: "Grocery", subcategory: "Snacks", price: 25.0, quantity: 40, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "1012345678903", status: "active", images: [], trackInventory: true, outletId: "outlet-11", variants: [] },
  { id: "m45", name: "Bluetooth Speaker", description: "Waterproof portable speaker", category: "Grocery", subcategory: "Snacks", price: 35.0, quantity: 20, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "1012345678904", status: "active", images: [], trackInventory: true, outletId: "outlet-11", variants: [] },
  // Hair / Wig Store — Crown Hair Gallery (outlet-12)
  { id: "m10", name: "Trail Mix", description: "Mixed nuts and dried fruits", category: "Grocery", subcategory: "Snacks", price: 5.99, quantity: 60, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "SN-001", status: "active", images: [], trackInventory: false, outletId: "outlet-12", variants: [] },
  { id: "m46", name: "Brazilian Body Wave 18\"", description: "100% human hair bundle", category: "Grocery", subcategory: "Snacks", price: 85.0, quantity: 20, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "2012345678901", status: "active", images: [], trackInventory: true, outletId: "outlet-12", variants: [{ id: "v19", name: "14 inch", price: 65.0, quantity: 8, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: true, sku: "2012345678901-14", status: "active" }, { id: "v20", name: "18 inch", price: 85.0, quantity: 6, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: true, sku: "2012345678901-18", status: "active" }, { id: "v21", name: "22 inch", price: 110.0, quantity: 6, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: true, sku: "2012345678901-22", status: "active" }] },
  { id: "m47", name: "Lace Front Wig (Bob)", description: "Pre-plucked lace front wig", category: "Grocery", subcategory: "Snacks", price: 120.0, quantity: 8, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "2012345678902", status: "active", images: [], trackInventory: true, outletId: "outlet-12", variants: [] },
  { id: "m48", name: "4x4 Closure Straight", description: "Swiss lace closure piece", category: "Grocery", subcategory: "Snacks", price: 55.0, quantity: 15, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "2012345678903", status: "active", images: [], trackInventory: true, outletId: "outlet-12", variants: [] },
  { id: "m49", name: "Edge Control Gel", description: "Strong-hold edge control", category: "Grocery", subcategory: "Snacks", price: 8.0, quantity: 40, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "2012345678904", status: "active", images: [], trackInventory: true, outletId: "outlet-12", variants: [] },
];

export default function MenuManagement() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(initialMenuItems);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit" | "clone">("add");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedOutletId, setSelectedOutletId] = useState<string>("all");
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const isAllOutlets = selectedOutletId === "all";
  const currentOutlet = outlets.find((o) => o.id === selectedOutletId);

  const outletItems = useMemo(
    () => isAllOutlets ? menuItems : menuItems.filter((m) => m.outletId === selectedOutletId),
    [menuItems, selectedOutletId, isAllOutlets]
  );

  const handleSave = (item: MenuItem) => {
    const finalItem = { ...item, outletId: selectedOutletId };
    setMenuItems((prev) => {
      const exists = prev.find((m) => m.id === finalItem.id);
      if (exists) {
        toast.success("Menu item updated");
        return prev.map((m) => (m.id === finalItem.id ? finalItem : m));
      }
      toast.success("Menu item added");
      return [...prev, finalItem];
    });
    setEditingItem(null);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleClone = (item: MenuItem) => {
    const cloned: MenuItem = {
      ...item,
      id: crypto.randomUUID(),
      name: `${item.name} (Copy)`,
      sku: "",
      variants: item.variants.map((v) => ({ ...v, id: crypto.randomUUID(), sku: "" })),
    };
    setEditingItem(cloned);
    setFormMode("clone");
    setFormOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingId) return;
    setMenuItems((prev) => prev.filter((m) => m.id !== deletingId));
    setDeleteConfirmOpen(false);
    setDeletingId(null);
    toast.success("Menu item deleted");
  };

  const handleCopyToOutlet = (itemIds: string[], targetOutletId: string, priceOverrides?: Record<string, { basePrice?: number; variantPrices?: Record<string, number> }>) => {
    const targetOutlet = outlets.find((o) => o.id === targetOutletId);
    const copiedItems = itemIds
      .map((id) => menuItems.find((m) => m.id === id))
      .filter(Boolean)
      .map((item) => ({
        ...item!,
        id: crypto.randomUUID(),
        price: priceOverrides?.[item!.id]?.basePrice ?? item!.price,
        sku: "",
        outletId: targetOutletId,
        variants: item!.variants.map((v) => ({
          ...v,
          id: crypto.randomUUID(),
          price: priceOverrides?.[item!.id]?.variantPrices?.[v.id] ?? v.price,
          sku: "",
        })),
      }));

    setMenuItems((prev) => [...prev, ...copiedItems]);
    toast.success(`${copiedItems.length} item${copiedItems.length > 1 ? "s" : ""} copied to ${targetOutlet?.name}`);
  };

  const handleBulkImport = (items: MenuItem[]) => {
    const withOutlet = items.map((i) => ({ ...i, outletId: selectedOutletId }));
    setMenuItems((prev) => [...prev, ...withOutlet]);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Product Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage products, services, categories and pricing</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          {!isAllOutlets && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="w-fit gap-1.5"
                onClick={() => setCopyDialogOpen(true)}
                disabled={outletItems.length === 0}
              >
                <Copy className="h-4 w-4" /> Copy to Outlet
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-fit gap-1.5"
                onClick={() => setImportDialogOpen(true)}
              >
                <Upload className="h-4 w-4" /> Import Excel
              </Button>
              <Button
                size="sm"
                className="w-fit"
                onClick={() => { setEditingItem(null); setFormMode("add"); setFormOpen(true); }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <CategoryManager
          categories={categories}
          onCategoriesChange={setCategories}
          selectedSubcategory={selectedSubcategory}
          onSelectSubcategory={setSelectedSubcategory}
        />
        <div className="lg:col-span-3">
          <MenuList
            items={outletItems}
            selectedSubcategory={selectedSubcategory}
            onEdit={handleEdit}
            onDelete={(id) => { setDeletingId(id); setDeleteConfirmOpen(true); }}
            onClone={handleClone}
            showOutlet={isAllOutlets}
            readOnly={isAllOutlets}
            outlets={outlets}
          />
        </div>
      </div>

      {!isAllOutlets && (
        <MenuItemForm
          open={formOpen}
          onOpenChange={(open) => { setFormOpen(open); if (!open) { setEditingItem(null); setFormMode("add"); } }}
          categories={categories}
          item={editingItem}
          onSave={handleSave}
          mode={formMode}
        />
      )}

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>Are you sure you want to delete this item? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!isAllOutlets && currentOutlet && (
        <CopyMenuDialog
          open={copyDialogOpen}
          onOpenChange={setCopyDialogOpen}
          items={outletItems}
          currentOutletId={selectedOutletId}
          currentOutletName={currentOutlet.name}
          outlets={outlets}
          onCopy={handleCopyToOutlet}
        />
      )}

      {!isAllOutlets && (
        <ImportMenuDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onImport={handleBulkImport}
        />
      )}
    </div>
  );
}
