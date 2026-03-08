import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "./PaginationControls";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Copy, Trash2, Package, ArrowLeftRight, X, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { InventoryCategory } from "./InventoryCategoryManager";
import type { MeasuringUnit } from "./MeasuringUnitManager";

export interface ItemConversion {
  id: string;
  fromQuantity: number;
  toQuantity: number;
  toUnitId: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  unitId: string;
  stock: number;
  minStock: number;
  costPrice: number;
  status: "good" | "low" | "critical";
  conversions: ItemConversion[];
  outletId: string;
}

interface Props {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  categories: InventoryCategory[];
  units: MeasuringUnit[];
  onAdjustStock?: (item: InventoryItem) => void;
  readOnly?: boolean;
  selectedOutletId?: string;
}

type FormState = Omit<InventoryItem, "id" | "status">;

const emptyForm = (outletId: string = ""): FormState => ({
  name: "",
  sku: "",
  categoryId: "",
  unitId: "",
  stock: 0,
  minStock: 0,
  costPrice: 0,
  conversions: [],
  outletId,
});

function computeStatus(stock: number, min: number): InventoryItem["status"] {
  if (stock <= min * 0.3) return "critical";
  if (stock <= min) return "low";
  return "good";
}

// No longer need MenuItemCombobox - conversions are now unit-to-unit

export default function InventoryItemForm({ items, setItems, categories, units, onAdjustStock, readOnly, selectedOutletId }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm(selectedOutletId));
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm(selectedOutletId));
    setOpen(true);
  };

  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      sku: item.sku,
      categoryId: item.categoryId,
      unitId: item.unitId,
      stock: item.stock,
      minStock: item.minStock,
      costPrice: item.costPrice,
      conversions: item.conversions || [],
      outletId: item.outletId,
    });
    setOpen(true);
  };

  const handleClone = (item: InventoryItem) => {
    const cloned: InventoryItem = {
      ...item,
      id: crypto.randomUUID(),
      name: `${item.name} (Copy)`,
      sku: `${item.sku}-COPY`,
      conversions: item.conversions.map((c) => ({ ...c, id: crypto.randomUUID() })),
    };
    setItems((prev) => [...prev, cloned]);
    toast.success("Item cloned");
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Item name is required");
      return;
    }
    if (!form.categoryId || !form.unitId) {
      toast.error("Category and unit are required");
      return;
    }
    if (form.conversions.length === 0) {
      toast.error("At least one unit conversion is required");
      return;
    }
    const hasIncompleteConversion = form.conversions.some(c => !c.toUnitId || c.fromQuantity <= 0 || c.toQuantity <= 0);
    if (hasIncompleteConversion) {
      toast.error("Please complete all conversion fields");
      return;
    }
    const status = computeStatus(form.stock, form.minStock);
    if (editing) {
      setItems((prev) =>
        prev.map((i) => (i.id === editing.id ? { ...i, ...form, status } : i))
      );
      toast.success("Item updated");
    } else {
      setItems((prev) => [...prev, { id: crypto.randomUUID(), ...form, status }]);
      toast.success("Item registered");
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Item deleted");
  };

  // Conversion helpers
  const addConversion = () => {
    setForm((prev) => ({
      ...prev,
      conversions: [...prev.conversions, { id: crypto.randomUUID(), fromQuantity: 1, toQuantity: 1, toUnitId: "" }],
    }));
  };

  const updateConversion = (index: number, updates: Partial<ItemConversion>) => {
    setForm((prev) => ({
      ...prev,
      conversions: prev.conversions.map((c, i) => (i === index ? { ...c, ...updates } : c)),
    }));
  };

  const removeConversion = (index: number) => {
    setForm((prev) => ({
      ...prev,
      conversions: prev.conversions.filter((_, i) => i !== index),
    }));
  };

  const getUnit = (id: string) => units.find((u) => u.id === id);
  const getCategory = (id: string) => categories.find((c) => c.id === id);

  const filtered = items
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .filter((i) => filterCategory === "all" || i.categoryId === filterCategory);

  const { page, setPage, perPage, setPerPage, totalPages, paginatedItems, totalItems, pageSizeOptions } = usePagination(filtered);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!readOnly && (
          <Button size="sm" onClick={openNew} className="w-fit">
            <Plus className="h-4 w-4 mr-1" /> Register Item
          </Button>
        )}
        </Button>
      </div>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        perPage={perPage}
        totalItems={totalItems}
        pageSizeOptions={pageSizeOptions}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />

      <div className="grid gap-3">
        {paginatedItems.map((item) => {
          const unit = getUnit(item.unitId);
          const category = getCategory(item.categoryId);
          return (
            <Card key={item.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                    item.status === "critical" ? "bg-destructive/10" : item.status === "low" ? "bg-warning/10" : "bg-success/10"
                  )}>
                    <Package className={cn(
                      "h-5 w-5",
                      item.status === "critical" ? "text-destructive" : item.status === "low" ? "text-warning" : "text-success"
                    )} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {category && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{category.name}</Badge>}
                    </div>
                    {item.conversions?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.conversions.map((conv) => {
                          const fromUnit = getUnit(item.unitId);
                          const toUnit = getUnit(conv.toUnitId);
                          return (
                            <span key={conv.id} className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                              {conv.fromQuantity} {fromUnit?.abbreviation || "?"} = {conv.toQuantity} {toUnit?.abbreviation || "?"}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <p className="text-sm font-heading font-bold">
                      {item.stock} <span className="text-muted-foreground font-normal text-xs">{unit?.abbreviation || ""}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Min: {item.minStock}</p>
                  </div>
                  <Badge
                    variant={item.status === "good" ? "default" : "secondary"}
                    className={cn(
                      "text-xs capitalize",
                      item.status === "critical" && "bg-destructive/10 text-destructive border-destructive/20",
                      item.status === "low" && "bg-warning/10 text-warning border-warning/20"
                    )}
                  >
                    {item.status}
                  </Badge>
                  {!readOnly && (
                    <div className="flex gap-1 shrink-0">
                      {onAdjustStock && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-accent" onClick={() => onAdjustStock(item)} title="Adjust Stock">
                          <ArrowLeftRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleClone(item)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No inventory items found</p>
        )}
      </div>

      {/* Registration / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Inventory Item" : "Register Inventory Item"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Item Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Coffee Beans" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit *</label>
                <Select value={form.unitId} onValueChange={(v) => setForm({ ...form, unitId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                  <SelectContent>
                    {units.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name} ({u.abbreviation})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Stock</label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Stock</label>
                <Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cost Price</label>
              <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} placeholder="0.00" />
            </div>

            {/* Conversions Section */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Unit Conversions</label>
                  <p className="text-xs text-muted-foreground">How this item's unit converts to other measuring units</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addConversion} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>

              {form.conversions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-md">
                  No conversions added yet
                </p>
              )}

              {form.conversions.map((conv, idx) => {
                const itemUnit = getUnit(form.unitId);
                const toUnit = getUnit(conv.toUnitId);
                return (
                  <Card key={conv.id} className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Conversion {idx + 1}</p>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeConversion(idx)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Quantity</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={conv.fromQuantity}
                          onChange={(e) => updateConversion(idx, { fromQuantity: Number(e.target.value) })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Unit</label>
                        <div className="h-8 flex items-center px-3 rounded-md border bg-muted text-sm font-medium">
                          {itemUnit ? itemUnit.abbreviation : "—"}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground pt-4">=</span>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Quantity</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={conv.toQuantity}
                          onChange={(e) => updateConversion(idx, { toQuantity: Number(e.target.value) })}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Unit</label>
                        <Select value={conv.toUnitId} onValueChange={(v) => updateConversion(idx, { toUnitId: v })}>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.filter(u => u.id !== form.unitId).map((u) => (
                              <SelectItem key={u.id} value={u.id}>{u.name} ({u.abbreviation})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {itemUnit && toUnit && (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                        {conv.fromQuantity} {itemUnit.abbreviation} = {conv.toQuantity} {toUnit.abbreviation}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Register"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
