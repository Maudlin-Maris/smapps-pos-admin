import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, FolderOpen, Tag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/services/api/catalog/category";

import type { Category, Subcategory } from "@/lib/types/category";
export type { Category, Subcategory };

interface CategoryManagerProps {
  categories: Category[];
  onCategoriesChange?: (categories: Category[]) => void;
  selectedSubcategory: string | null;
  onSelectSubcategory: (sub: string | null) => void;
  currentOutletId?: string;
  onRefresh?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export default function CategoryManager({
  categories,
  onCategoriesChange,
  selectedSubcategory,
  onSelectSubcategory,
  currentOutletId,
  onRefresh,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}: CategoryManagerProps) {
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { trigger: triggerCreate, isMutating: isCreating } = useCreateCategory();
  const { trigger: triggerUpdate, isMutating: isUpdating } = useUpdateCategory(editingCategory?.id);
  const { trigger: triggerDelete, isMutating: isDeleting } = useDeleteCategory(deleteTarget ?? undefined);

  // Category CRUD
  const openAddCategory = () => {
    setEditingCategory(null);
    setCatName("");
    setCatDialogOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDialogOpen(true);
  };

  const saveCategory = async () => {
    if (!catName.trim()) return;
    try {
      if (editingCategory) {
        if (selectedSubcategory === editingCategory.name) {
          onSelectSubcategory(catName.trim());
        }
        await triggerUpdate({ name: catName.trim() });
        toast.success("Category updated");
        if (onCategoriesChange) {
          onCategoriesChange(categories.map((c) => (c.id === editingCategory.id ? { ...c, name: catName.trim() } : c)));
        }
      } else {
        await triggerCreate({
          name: catName.trim(),
          outletId: currentOutletId || "",
          icon: "coffee",
          sortOrder: categories.length + 1,
        });
        toast.success("Category created");
      }
      onRefresh?.();
      setCatDialogOpen(false);
    } catch (e) {
      // toast shown by onError in the hook
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const cat = categories.find((c) => c.id === deleteTarget);
      if (cat && selectedSubcategory === cat.name) {
        onSelectSubcategory(null);
      }
      await triggerDelete(undefined);
      toast.success("Category deleted");
      if (onCategoriesChange) {
        onCategoriesChange(categories.filter((c) => c.id !== deleteTarget));
      }
      onRefresh?.();
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      // toast shown by onError in the hook
    }
  };

  return (
    <>
      <Card className="p-4 lg:col-span-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-sm">Categories</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={openAddCategory}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="space-y-0.5">
          <button
            onClick={() => onSelectSubcategory(null)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2",
              !selectedSubcategory ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
            )}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            All Items
          </button>

          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center group">
              <button
                onClick={() => onSelectSubcategory(cat.name)}
                className={cn(
                  "flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 truncate",
                  selectedSubcategory === cat.name
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Tag className="h-3.5 w-3.5 shrink-0" />
                {cat.name}
              </button>
              <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
                <button onClick={() => openEditCategory(cat)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                  <Edit className="h-3 w-3" />
                </button>
                <button
                  onClick={() => { setDeleteTarget(cat.id); setDeleteConfirmOpen(true); }}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}

          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground mt-2"
              onClick={onLoadMore}
              isLoading={isLoadingMore}
            >
              Load More Categories
            </Button>
          )}
        </div>
      </Card>

      {/* Category Sheet */}
      <Sheet open={catDialogOpen} onOpenChange={(open) => !isCreating && !isUpdating && setCatDialogOpen(open)}>
        <SheetContent side="right" className="!w-full !max-w-none lg:!max-w-md p-0 flex flex-col overflow-hidden [&>button]:z-10">
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle>{editingCategory ? "Edit Category" : "Add Category"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-3">
              <Label htmlFor="cat-name">Category Name</Label>
              <Input
                id="cat-name"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Food & Beverages"
                onKeyDown={(e) => e.key === "Enter" && saveCategory()}
                disabled={isCreating || isUpdating}
              />
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setCatDialogOpen(false)} disabled={isCreating || isUpdating}>Cancel</Button>
            <Button onClick={saveCategory} disabled={!catName.trim()} isLoading={isCreating || isUpdating}>
              Save
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={(open) => !isDeleting && setDeleteConfirmOpen(open)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              This will delete the category. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
