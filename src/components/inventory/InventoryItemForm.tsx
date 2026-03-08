import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { Plus, Search, Pencil, Copy, Trash2, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { InventoryCategory } from "./InventoryCategoryManager";
import type { MeasuringUnit } from "./MeasuringUnitManager";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  unitId: string;
  stock: number;
  minStock: number;
  maxStock: number;
  costPrice: number;
  status: "good" | "low" | "critical";
}

interface Props {
  items: InventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  categories: InventoryCategory[];
  units: MeasuringUnit[];
}

const emptyForm = (): Omit<InventoryItem, "id" | "status"> => ({
  name: "",
  sku: "",
  categoryId: "",
  unitId: "",
  stock: 0,
  minStock: 0,
  maxStock: 100,
  costPrice: 0,
});

function computeStatus(stock: number, min: number): InventoryItem["status"] {
  if (stock <= min * 0.3) return "critical";
  if (stock <= min) return "low";
  return "good";
}

export default function InventoryItemForm({ items, setItems, categories, units }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
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
      maxStock: item.maxStock,
      costPrice: item.costPrice,
    });
    setOpen(true);
  };

  const handleClone = (item: InventoryItem) => {
    const cloned: InventoryItem = {
      ...item,
      id: crypto.randomUUID(),
      name: `${item.name} (Copy)`,
      sku: `${item.sku}-COPY`,
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

  const getUnit = (id: string) => units.find((u) => u.id === id);
  const getCategory = (id: string) => categories.find((c) => c.id === id);

  const filtered = items
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    .filter((i) => filterCategory === "all" || i.categoryId === filterCategory);

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
        <Button size="sm" onClick={openNew} className="w-fit">
          <Plus className="h-4 w-4 mr-1" /> Register Item
        </Button>
      </div>

      <div className="grid gap-3">
        {filtered.map((item) => {
          const percentage = item.maxStock > 0 ? Math.round((item.stock / item.maxStock) * 100) : 0;
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
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                      {category && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{category.name}</Badge>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <p className="text-sm font-heading font-bold">
                      {item.stock} <span className="text-muted-foreground font-normal text-xs">{unit?.abbreviation || ""}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Min: {item.minStock}</p>
                  </div>
                  <div className="w-24 hidden md:block">
                    <Progress
                      value={percentage}
                      className={cn(
                        "h-2",
                        item.status === "critical" && "[&>div]:bg-destructive",
                        item.status === "low" && "[&>div]:bg-warning",
                        item.status === "good" && "[&>div]:bg-success"
                      )}
                    />
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
                  <div className="flex gap-1 shrink-0">
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Inventory Item" : "Register Inventory Item"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Item Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Coffee Beans" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SKU</label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. CB-001" />
              </div>
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Stock</label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Stock</label>
                <Input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Stock</label>
                <Input type="number" value={form.maxStock} onChange={(e) => setForm({ ...form, maxStock: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cost Price</label>
              <Input type="number" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} placeholder="0.00" />
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
