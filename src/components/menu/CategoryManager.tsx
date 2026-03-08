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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
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
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(categories.map((c) => c.id)));
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<{ catId: string; sub: Subcategory } | null>(null);
  const [catName, setCatName] = useState("");
  const [subName, setSubName] = useState("");
  const [parentCatId, setParentCatId] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "subcategory"; catId: string; subId?: string } | null>(null);

  const toggleExpand = (catId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  };

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
      onCategoriesChange(categories.map((c) => (c.id === editingCategory.id ? { ...c, name: catName.trim() } : c)));
      toast.success("Category updated");
    } else {
      const newCat: Category = { id: crypto.randomUUID(), name: catName.trim(), subcategories: [] };
      onCategoriesChange([...categories, newCat]);
      setExpandedCats((prev) => new Set([...prev, newCat.id]));
      toast.success("Category created");
    }
    setCatDialogOpen(false);
  };

  // Subcategory CRUD
  const openAddSubcategory = (catId: string) => {
    setEditingSubcategory(null);
    setSubName("");
    setParentCatId(catId);
    setSubDialogOpen(true);
  };

  const openEditSubcategory = (catId: string, sub: Subcategory) => {
    setEditingSubcategory({ catId, sub });
    setSubName(sub.name);
    setParentCatId(catId);
    setSubDialogOpen(true);
  };

  const saveSubcategory = () => {
    if (!subName.trim() || !parentCatId) return;
    if (editingSubcategory) {
      onCategoriesChange(
        categories.map((c) =>
          c.id === parentCatId
            ? { ...c, subcategories: c.subcategories.map((s) => (s.id === editingSubcategory.sub.id ? { ...s, name: subName.trim() } : s)) }
            : c
        )
      );
      toast.success("Subcategory updated");
    } else {
      const newSub: Subcategory = { id: crypto.randomUUID(), name: subName.trim() };
      onCategoriesChange(categories.map((c) => (c.id === parentCatId ? { ...c, subcategories: [...c.subcategories, newSub] } : c)));
      toast.success("Subcategory created");
    }
    setSubDialogOpen(false);
  };

  // Delete
  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "category") {
      onCategoriesChange(categories.filter((c) => c.id !== deleteTarget.catId));
      if (selectedSubcategory) {
        const cat = categories.find((c) => c.id === deleteTarget.catId);
        if (cat?.subcategories.some((s) => s.name === selectedSubcategory)) {
          onSelectSubcategory(null);
        }
      }
      toast.success("Category deleted");
    } else {
      onCategoriesChange(
        categories.map((c) =>
          c.id === deleteTarget.catId ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== deleteTarget.subId) } : c
        )
      );
      const sub = categories.find((c) => c.id === deleteTarget.catId)?.subcategories.find((s) => s.id === deleteTarget.subId);
      if (sub && selectedSubcategory === sub.name) onSelectSubcategory(null);
      toast.success("Subcategory deleted");
    }
    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const totalItems = categories.reduce((sum, c) => sum + c.subcategories.length, 0);

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
            <div key={cat.id}>
              <div className="flex items-center group mt-1">
                <button
                  onClick={() => toggleExpand(cat.id)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  {expandedCats.has(cat.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                <span className="flex-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                  {cat.name}
                </span>
                <div className="hidden group-hover:flex items-center gap-0.5">
                  <button onClick={() => openAddSubcategory(cat.id)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                    <Plus className="h-3 w-3" />
                  </button>
                  <button onClick={() => openEditCategory(cat)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => { setDeleteTarget({ type: "category", catId: cat.id }); setDeleteConfirmOpen(true); }}
                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {expandedCats.has(cat.id) &&
                cat.subcategories.map((sub) => (
                  <div key={sub.id} className="flex items-center group">
                    <button
                      onClick={() => onSelectSubcategory(sub.name)}
                      className={cn(
                        "flex-1 text-left pl-7 pr-2 py-1.5 rounded-md text-sm transition-colors truncate",
                        selectedSubcategory === sub.name
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {sub.name}
                    </button>
                    <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
                      <button onClick={() => openEditSubcategory(cat.id, sub)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => { setDeleteTarget({ type: "subcategory", catId: cat.id, subId: sub.id }); setDeleteConfirmOpen(true); }}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
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
              {editingCategory ? "Update the category name." : "Create a new top-level category."}
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

      {/* Subcategory Dialog */}
      <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSubcategory ? "Edit Subcategory" : "Add Subcategory"}</DialogTitle>
            <DialogDescription>
              {editingSubcategory ? "Update the subcategory name." : "Create a new subcategory under a category."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Parent Category</Label>
              <Select value={parentCatId} onValueChange={setParentCatId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sub-name">Subcategory Name</Label>
              <Input
                id="sub-name"
                className="mt-1"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder="e.g. Hot Drinks"
                onKeyDown={(e) => e.key === "Enter" && saveSubcategory()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveSubcategory} disabled={!subName.trim() || !parentCatId}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              {deleteTarget?.type === "category"
                ? "This will delete the category and all its subcategories. This action cannot be undone."
                : "This will delete the subcategory. This action cannot be undone."}
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
