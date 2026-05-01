import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, FolderOpen, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface Subcategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

interface CategoryManagerProps {
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  selectedSubcategory: string | null;
  onSelectSubcategory: (sub: string | null) => void;
}

export default function CategoryManager({
  categories,
  onCategoriesChange,
  selectedSubcategory,
  onSelectSubcategory,
}: CategoryManagerProps) {
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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

  const saveCategory = () => {
    if (!catName.trim()) return;
    if (editingCategory) {
      // If the selected category was this one, update the selection to the new name
      if (selectedSubcategory === editingCategory.name) {
        onSelectSubcategory(catName.trim());
      }
      onCategoriesChange(categories.map((c) => (c.id === editingCategory.id ? { ...c, name: catName.trim() } : c)));
      toast.success("Category updated");
    } else {
      const newCat: Category = { id: crypto.randomUUID(), name: catName.trim(), subcategories: [] };
      onCategoriesChange([...categories, newCat]);
      toast.success("Category created");
    }
    setCatDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const cat = categories.find((c) => c.id === deleteTarget);
    if (cat && selectedSubcategory === cat.name) {
      onSelectSubcategory(null);
    }
    onCategoriesChange(categories.filter((c) => c.id !== deleteTarget));
    toast.success("Category deleted");
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
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
        </div>
      </Card>

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Update the category name." : "Create a new category."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="cat-name">Category Name</Label>
            <Input
              id="cat-name"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g. Food & Beverages"
              onKeyDown={(e) => e.key === "Enter" && saveCategory()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveCategory} disabled={!catName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              This will delete the category. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
