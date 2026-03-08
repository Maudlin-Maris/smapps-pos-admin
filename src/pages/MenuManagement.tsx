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
  { id: "m1", name: "Cappuccino", description: "Rich espresso with steamed milk foam", category: "Food & Beverages", subcategory: "Hot Drinks", price: 3.5, quantity: 150, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "HD-001", status: "active", images: [], trackInventory: false, outletId: "outlet-1", variants: [{ id: "v1", name: "Regular", price: 4.5, quantity: 50, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: true, sku: "HD-001-R", status: "active" }, { id: "v2", name: "Small", price: 3.5, quantity: 50, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: false, sku: "HD-001-S", status: "active" }, { id: "v3", name: "Large", price: 5.5, quantity: 50, salePrice: 4.99, salePeriodStart: new Date("2026-03-01"), salePeriodEnd: new Date("2026-03-31"), trackInventory: true, sku: "HD-001-L", status: "inactive" }] },
  { id: "m2", name: "Iced Latte", description: "Chilled espresso with cold milk", category: "Food & Beverages", subcategory: "Cold Drinks", price: 5.0, quantity: 80, salePrice: 3.99, salePeriodStart: new Date("2026-03-01"), salePeriodEnd: new Date("2026-03-31"), sku: "CD-001", status: "active", images: [], trackInventory: true, outletId: "outlet-1", variants: [] },
  { id: "m3", name: "Croissant", description: "Buttery French pastry", category: "Food & Beverages", subcategory: "Pastries", price: 3.25, quantity: 40, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "PS-001", status: "active", images: [], trackInventory: false, outletId: "outlet-1", variants: [] },
  { id: "m4", name: "Club Sandwich", description: "Triple-decker with turkey and bacon", category: "Food & Beverages", subcategory: "Sandwiches", price: 8.5, quantity: 20, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "SW-001", status: "inactive", images: [], trackInventory: false, outletId: "outlet-2", variants: [] },
  { id: "m5", name: "Espresso", description: "Double shot espresso", category: "Food & Beverages", subcategory: "Hot Drinks", price: 3.0, quantity: 200, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "HD-002", status: "active", images: [], trackInventory: true, outletId: "outlet-2", variants: [] },
  { id: "m6", name: "Men's Haircut", description: "Classic men's cut and style", category: "Hair Services", subcategory: "Haircut", price: 25.0, quantity: 0, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "HC-001", status: "active", images: [], trackInventory: false, outletId: "outlet-1", variants: [] },
  { id: "m7", name: "Full Color", description: "Complete hair coloring service", category: "Hair Services", subcategory: "Coloring", price: 85.0, quantity: 0, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "CL-001", status: "active", images: [], trackInventory: false, outletId: "outlet-3", variants: [] },
  { id: "m8", name: "Blowout", description: "Professional blow dry and style", category: "Hair Services", subcategory: "Styling", price: 35.0, quantity: 0, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "ST-001", status: "active", images: [], trackInventory: false, outletId: "outlet-3", variants: [] },
  { id: "m9", name: "Organic Apples", description: "Fresh organic apples per kg", category: "Grocery", subcategory: "Fresh Produce", price: 4.99, quantity: 150, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "FP-001", status: "active", images: [], trackInventory: true, outletId: "outlet-2", variants: [] },
  { id: "m10", name: "Trail Mix", description: "Mixed nuts and dried fruits", category: "Grocery", subcategory: "Snacks", price: 5.99, quantity: 60, salePrice: null, salePeriodStart: null, salePeriodEnd: null, sku: "SN-001", status: "active", images: [], trackInventory: false, outletId: "outlet-4", variants: [] },
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
          <h1 className="text-2xl font-heading font-bold tracking-tight">Menu Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage items, categories and pricing</p>
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
    </div>
  );
}
