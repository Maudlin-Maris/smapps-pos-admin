import { useState, useEffect, useMemo } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResuablePagination } from "@/components/ui/reusable-pagination";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import {
  useCreateInventoryCategory,
  useUpdateInventoryCategory,
  useDeleteInventoryCategory,
  useGetInventoryCategories,
} from "@/services/api/inventory/category";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

export interface InventoryCategory {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
}

interface Props {
  onMutate: () => void;
}

export default function InventoryCategoryManager({ onMutate }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryCategory | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data: categoriesRes } = useGetInventoryCategories({
    search: debouncedSearch.trim() || undefined,
    page: page,
    per_page: DEFAULT_PAGE_SIZE,
  });

  const apiCategories = categoriesRes?.data || [];

  const createCategoryMutation = useCreateInventoryCategory();
  const updateCategoryMutation = useUpdateInventoryCategory();
  const deleteCategoryMutation = useDeleteInventoryCategory();

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setOpen(true);
  };

  const openEdit = (cat: InventoryCategory) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    try {
      if (editing) {
        await updateCategoryMutation.trigger({
          id: editing.id,
          payload: {
            name: form.name,
            description: form.description,
          },
        });
        toast.success("Category updated");
      } else {
        await createCategoryMutation.trigger({
          name: form.name,
          description: form.description,
          sortOrder: 0,
        });
        toast.success("Category added");
      }
      onMutate();
      setOpen(false);
    } catch (e: any) {
      toast.error(
        e.response?.data?.message || e.message || "Failed to save category",
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategoryMutation.trigger(id);
      toast.success("Category deleted");
      onMutate();
    } catch (e: any) {
      toast.error(
        e.response?.data?.message || e.message || "Failed to delete category",
      );
    }
  };

  const filtered = apiCategories;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-3"
          />
        </div>
        <Button size="sm" onClick={openNew} className="w-fit">
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((cat) => (
          <Card key={cat.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Tag className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{cat.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {cat.description}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">
                {cat.itemCount} items
              </Badge>
            </div>
            <div className="flex gap-1 mt-3 justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => openEdit(cat)}
                disabled={deleteCategoryMutation.isMutating}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => handleDelete(cat.id)}
                disabled={deleteCategoryMutation.isMutating}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">
            No categories found
          </p>
        )}
      </div>

      {categoriesRes?.meta && categoriesRes.meta.last_page > 1 && (
        <div className="flex justify-end pt-2">
          <ResuablePagination
            currentPage={page}
            totalPages={categoriesRes.meta.last_page}
            onPageChange={setPage}
            totalItems={categoriesRes.meta.total}
            rowsPerPage={DEFAULT_PAGE_SIZE}
          />
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="!w-full !max-w-none lg:!max-w-md p-0 flex flex-col overflow-hidden [&>button]:z-10"
        >
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle>
              {editing ? "Edit Category" : "Add Category"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Beverages"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Brief description"
                />
              </div>
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                createCategoryMutation.isMutating ||
                updateCategoryMutation.isMutating
              }
            >
              {createCategoryMutation.isMutating ||
              updateCategoryMutation.isMutating
                ? "Saving..."
                : editing
                  ? "Update"
                  : "Add"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
