import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Copy, Upload, Loader2 } from "lucide-react";
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
import { defaultInventoryItems } from "@/data/inventoryItems";
import { upsertCompositeFromMenu, removeCompositesForMenu } from "@/hooks/use-composites-store";
import type { CompositeItem, CompositeComponent } from "@/components/inventory/CompositeItemForm";

import { useGetOutlets } from "@/services/api/outlets";
import {
  useGetCategories,
} from "@/services/api/catalog/category";
import {
  useGetItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useCopyItemsToOutlet,
  useCloneItem,
  useImportCatalog,
} from "@/services/api/catalog/item";

export default function MenuManagement() {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit" | "clone">("add");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedOutletId, setSelectedOutletId] = useState<string>("all");
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: outletsData, isLoading: isOutletsLoading } = useGetOutlets();
  const outlets = outletsData || [];

  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isValidating: isCategoriesValidating,
    size: categoriesSize,
    setSize: setCategoriesSize,
    reachedLastPage: categoriesReachedLastPage,
    mutate: mutateCategories,
  } = useGetCategories(
    selectedOutletId !== "all" ? { outletId: selectedOutletId } : undefined
  );
  const categories = useMemo(() => {
    return categoriesData ? categoriesData.flatMap((page) => page.data) : [];
  }, [categoriesData]);

  const { data: itemsData, isLoading: isItemsLoading, mutate: mutateItems } = useGetItems(
    selectedOutletId !== "all" ? { outletId: selectedOutletId } : undefined
  );
  const menuItems = (itemsData?.data || []) as unknown as MenuItem[];

  const { trigger: triggerCreateItem, isMutating: isCreatingItem } = useCreateItem();
  const { trigger: triggerUpdateItem, isMutating: isUpdatingItem } = useUpdateItem(editingItem?.id);
  const { trigger: triggerDeleteItem, isMutating: isDeletingItem } = useDeleteItem(deletingId ?? undefined);
  const { trigger: triggerCopyItems, isMutating: isCopyingItems } = useCopyItemsToOutlet();
  const { trigger: triggerCloneItem, isMutating: isCloningItems } = useCloneItem(editingItem?.id);
  const { trigger: triggerImport, isMutating: isImporting } = useImportCatalog();

  const isMutating = isCreatingItem || isUpdatingItem || isDeletingItem || isCopyingItems || isCloningItems || isImporting;
  const isLoading = isOutletsLoading || isCategoriesLoading || isItemsLoading;

  const isAllOutlets = selectedOutletId === "all";
  const currentOutlet = outlets.find((o) => o.id === selectedOutletId);

  const outletItems = useMemo(
    () => isAllOutlets ? menuItems : menuItems.filter((m) => m.outletId === selectedOutletId),
    [menuItems, selectedOutletId, isAllOutlets]
  );

  const syncCompositeForMenuItem = (item: MenuItem, outletId: string) => {
    if (item.itemType !== "composite") {
      // If switched away from composite, remove any linked composite for this outlet
      removeCompositesForMenu(item.id, outletId);
      return;
    }
    const components: CompositeComponent[] = (item.ingredients ?? [])
      .filter((g) => g.inventoryItemId && g.quantity > 0)
      .map((g, idx) => ({
        inventoryItemId: g.inventoryItemId,
        quantity: g.quantity,
        unitId: g.unitId,
        role: idx === 0 ? "primary" : "secondary",
      }));
    if (components.length === 0) return;
    const composite: CompositeItem = {
      id: crypto.randomUUID(),
      name: item.name,
      menuItemId: item.id,
      description: item.description,
      components,
      outletId,
      sellPrice: item.price || undefined,
      pricingMethod: item.pricingMethod === "markup" || item.pricingMethod === "margin" || item.pricingMethod === "fixed"
        ? item.pricingMethod
        : undefined,
      pricingValue: item.pricingValue,
    };
    upsertCompositeFromMenu(composite);
  };

  const handleSave = async (item: MenuItem, targetOutletIds: string[]) => {
    try {
      const primaryOutletId = targetOutletIds[0] ?? selectedOutletId;
      const additionalOutlets = targetOutletIds.slice(1);

      if (formMode === "clone" && editingItem) {
        await triggerCloneItem({
          name: item.name,
          outletId: primaryOutletId,
          sku: item.sku || null,
        });
        toast.success("Menu item cloned successfully");
        mutateItems();
        setEditingItem(null);
        return;
      }

      const exists = menuItems.find((m) => m.id === item.id);

      const buildPayload = (outletId: string, isCopy = false) => {
        return {
          outletId,
          name: item.name,
          description: item.description,
          category: item.category,
          categoryId: categories.find((c) => c.name === item.category)?.id,
          price: item.price,
          quantity: item.quantity,
          salePrice: item.salePrice,
          salePeriodStart: item.salePeriodStart ? (item.salePeriodStart instanceof Date ? item.salePeriodStart.toISOString().split("T")[0] : String(item.salePeriodStart).split("T")[0]) : null,
          salePeriodEnd: item.salePeriodEnd ? (item.salePeriodEnd instanceof Date ? item.salePeriodEnd.toISOString().split("T")[0] : String(item.salePeriodEnd).split("T")[0]) : null,
          sku: isCopy ? "" : item.sku,
          status: item.status,
          itemType: item.itemType || "simple",
          pricingStrategy: item.pricingStrategy || "base",
          linkedInventoryItemId: item.linkedInventoryItemId || null,
          addToInventory: item.trackInventory,
          sellingUnit: item.sellingUnit || "pcs",
          costPrice: item.costPrice || null,
          pricingMethod: item.pricingMethod || null,
          pricingValue: item.pricingValue || null,
          modifierGroupIds: item.modifierGroupIds || [],
          images: item.images || [],
          ingredients: (item.ingredients || []).map((g) => ({
            inventoryItemId: g.inventoryItemId,
            quantity: g.quantity,
            unitId: g.unitId,
            role: g.role,
          })),
          variants: (item.variants || []).map((v) => ({
            name: v.name,
            price: v.price,
            quantity: v.quantity,
            salePrice: v.salePrice,
            salePeriodStart: v.salePeriodStart ? (v.salePeriodStart instanceof Date ? v.salePeriodStart.toISOString().split("T")[0] : String(v.salePeriodStart).split("T")[0]) : null,
            salePeriodEnd: v.salePeriodEnd ? (v.salePeriodEnd instanceof Date ? v.salePeriodEnd.toISOString().split("T")[0] : String(v.salePeriodEnd).split("T")[0]) : null,
            trackInventory: v.trackInventory,
            sku: isCopy ? "" : v.sku,
            status: v.status,
            linkedInventoryItemId: v.linkedInventoryItemId,
            components: v.components,
          })),
        };
      };

      if (exists) {
        await triggerUpdateItem(buildPayload(primaryOutletId));
        for (const oid of additionalOutlets) {
          await triggerCreateItem(buildPayload(oid, true));
        }
        const total = 1 + additionalOutlets.length;
        toast.success(total > 1 ? `Item updated and copied to ${additionalOutlets.length} more outlets` : "Menu item updated");
      } else {
        for (const [idx, oid] of targetOutletIds.entries()) {
          await triggerCreateItem(buildPayload(oid, idx > 0));
        }
        toast.success(targetOutletIds.length > 1 ? `Item added to ${targetOutletIds.length} outlets` : "Menu item added");
      }

      if (exists) {
        syncCompositeForMenuItem({ ...item, id: item.id }, primaryOutletId);
      } else {
        targetOutletIds.forEach((oid, idx) => {
          if (idx === 0) syncCompositeForMenuItem(item, oid);
        });
      }

      mutateItems();
      setEditingItem(null);
    } catch (err) {
      // Handled
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormMode("edit");
    setFormOpen(true);
  };

  const handleClone = (item: MenuItem) => {
    // Keep the original item as-is, but customize it so the clone endpoint gets the correct source item ID
    const cloned: MenuItem = {
      ...item,
      name: `${item.name} (Copy)`,
      sku: "",
      variants: item.variants.map((v) => ({ ...v, id: crypto.randomUUID(), sku: "" })),
    };
    setEditingItem(cloned);
    setFormMode("clone");
    setFormOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      const target = menuItems.find((m) => m.id === deletingId);
      await triggerDeleteItem(undefined);
      if (target) removeCompositesForMenu(target.id, target.outletId || "");
      toast.success("Menu item deleted");
      mutateItems();
      setDeleteConfirmOpen(false);
      setDeletingId(null);
    } catch (err) {
      // Handled
    }
  };

  const handleCopyToOutlet = async (
    itemIds: string[],
    targetOutletId: string,
    priceOverrides?: Record<string, { basePrice?: number; variantPrices?: Record<string, number> }>
  ) => {
    const targetOutlet = outlets.find((o) => o.id === targetOutletId);
    try {
      await triggerCopyItems({
        targetOutletId,
        itemIds,
        priceOverrides,
      });
      toast.success(`Items copied to ${targetOutlet?.name}`);
      mutateItems();
    } catch (err) {
      // Handled
    }
  };

  const handleBulkImport = async (items: MenuItem[]) => {
    try {
      await triggerImport({
        outletId: selectedOutletId,
        skipDuplicateSkus: true,
        items: items.map(item => ({
          name: item.name,
          description: item.description,
          category: item.category,
          price: item.price,
          quantity: item.quantity,
          sku: item.sku,
          status: item.status,
          itemType: item.itemType || "simple",
          pricingStrategy: item.pricingStrategy || "base",
          costPrice: item.costPrice || null,
          sellingUnit: item.sellingUnit || "pcs",
          variants: (item.variants || []).map(v => ({
            name: v.name,
            price: v.price,
            sku: v.sku,
            status: v.status,
          })),
        })),
      });
      toast.success("Catalog items imported successfully");
      mutateItems();
    } catch (err) {
      // Handled
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Product Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage products, services, categories and pricing</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedOutletId} onValueChange={setSelectedOutletId} disabled={isLoading || isMutating}>
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
                disabled={isLoading || isMutating || outletItems.length === 0}
              >
                <Copy className="h-4 w-4" /> Copy to Outlet
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-fit gap-1.5"
                onClick={() => setImportDialogOpen(true)}
                disabled={isLoading || isMutating}
              >
                <Upload className="h-4 w-4" /> Import Excel
              </Button>
            </>
          )}
          <Button
            size="sm"
            className="w-fit"
            onClick={() => { setEditingItem(null); setFormMode("add"); setFormOpen(true); }}
            disabled={isLoading || isMutating}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/10 border border-dashed rounded-lg">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading catalog items and categories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <CategoryManager
            categories={categories}
            selectedSubcategory={selectedSubcategory}
            onSelectSubcategory={setSelectedSubcategory}
            currentOutletId={selectedOutletId !== "all" ? selectedOutletId : undefined}
            onRefresh={mutateCategories}
            hasMore={!categoriesReachedLastPage}
            onLoadMore={() => setCategoriesSize(categoriesSize + 1)}
            isLoadingMore={isCategoriesValidating}
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
      )}

      <MenuItemForm
        open={formOpen}
        onOpenChange={(open) => { if (!isMutating) { setFormOpen(open); if (!open) { setEditingItem(null); setFormMode("add"); } } }}
        categories={categories}
        item={editingItem}
        onSave={handleSave}
        isSaving={isCreatingItem || isUpdatingItem || isCloningItems}
        mode={formMode}
        businessType={currentOutlet?.businessType}
        outlets={outlets}
        currentOutletId={isAllOutlets ? undefined : selectedOutletId}
        inventoryItems={defaultInventoryItems}
      />

      <Dialog open={deleteConfirmOpen} onOpenChange={(open) => !isMutating && setDeleteConfirmOpen(open)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>Are you sure you want to delete this item? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isMutating}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} isLoading={isDeletingItem}>
              Delete
            </Button>
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
