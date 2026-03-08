import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Plus, Pencil, Trash2, Layers, X, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { InventoryItem } from "./InventoryItemForm";
import type { MeasuringUnit } from "./MeasuringUnitManager";

export type ComponentRole = "primary" | "secondary";

export interface CompositeComponent {
  inventoryItemId: string;
  quantity: number;
  role: ComponentRole;
}

export interface CompositeItem {
  id: string;
  name: string;
  menuItemId?: string;
  menuVariantId?: string;
  description: string;
  components: CompositeComponent[];
}

interface Props {
  composites: CompositeItem[];
  setComposites: React.Dispatch<React.SetStateAction<CompositeItem[]>>;
  inventoryItems: InventoryItem[];
  units: MeasuringUnit[];
  menuItems: { id: string; name: string; variants: { id: string; name: string }[] }[];
}

const emptyForm = () => ({
  name: "",
  menuItemId: "" as string,
  menuVariantId: "" as string,
  description: "",
  components: [] as CompositeComponent[],
});

export default function CompositeItemForm({ composites, setComposites, inventoryItems, units }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CompositeItem | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState("");

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (item: CompositeItem) => {
    setEditing(item);
    setForm({ name: item.name, description: item.description, components: [...item.components] });
    setOpen(true);
  };

  const addComponent = () => {
    setForm((f) => ({
      ...f,
      components: [...f.components, { inventoryItemId: "", quantity: 1, role: "primary" as ComponentRole }],
    }));
  };

  const updateComponent = (index: number, field: keyof CompositeComponent, value: string | number) => {
    setForm((f) => {
      const updated = [...f.components];
      updated[index] = { ...updated[index], [field]: value };
      return { ...f, components: updated };
    });
  };

  const removeComponent = (index: number) => {
    setForm((f) => ({
      ...f,
      components: f.components.filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Composite item name is required");
      return;
    }
    if (form.components.length === 0) {
      toast.error("Add at least one component");
      return;
    }
    const validComponents = form.components.filter((c) => c.inventoryItemId && c.quantity > 0);
    if (validComponents.length === 0) {
      toast.error("All components need a valid item and quantity");
      return;
    }

    if (editing) {
      setComposites((prev) =>
        prev.map((c) => (c.id === editing.id ? { ...c, name: form.name, description: form.description, components: validComponents } : c))
      );
      toast.success("Composite item updated");
    } else {
      setComposites((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name: form.name, description: form.description, components: validComponents },
      ]);
      toast.success("Composite item created");
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setComposites((prev) => prev.filter((c) => c.id !== id));
    toast.success("Composite item deleted");
  };

  const getItemName = (id: string) => inventoryItems.find((i) => i.id === id)?.name || "Unknown";
  const getItemUnit = (id: string) => {
    const item = inventoryItems.find((i) => i.id === id);
    if (!item) return "";
    return units.find((u) => u.id === item.unitId)?.abbreviation || "";
  };

  const filtered = composites.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const { page, setPage, perPage, setPerPage, totalPages, paginatedItems, totalItems, pageSizeOptions } = usePagination(filtered);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Input placeholder="Search composites..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button size="sm" onClick={openNew} className="w-fit">
          <Plus className="h-4 w-4 mr-1" /> Add Composite Item
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paginatedItems.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Layers className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-semibold text-sm truncate">{item.name}</p>
                  {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <ul className="space-y-1.5">
              {item.components.map((comp, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className={cn("h-1.5 w-1.5 rounded-full", comp.role === "primary" ? "bg-primary" : "bg-muted-foreground/40")} />
                  {getItemName(comp.inventoryItemId)} — {comp.quantity} {getItemUnit(comp.inventoryItemId)}
                  <Badge variant={comp.role === "primary" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0 h-4 ml-auto">
                    {comp.role}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">No composite items found</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Composite Item" : "Create Composite Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Cappuccino" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Components</label>
                <Button type="button" variant="outline" size="sm" onClick={addComponent}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              {form.components.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">No components added yet</p>
              )}
              {form.components.map((comp, i) => (
                <div key={i} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <ItemCombobox
                      inventoryItems={inventoryItems}
                      value={comp.inventoryItemId}
                      onSelect={(v) => updateComponent(i, "inventoryItemId", v)}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeComponent(i)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-24"
                      value={comp.quantity}
                      onChange={(e) => updateComponent(i, "quantity", Number(e.target.value))}
                      min={0}
                      step={0.1}
                      placeholder="Qty"
                    />
                    <span className="text-xs text-muted-foreground w-10 shrink-0">
                      {getItemUnit(comp.inventoryItemId)}
                    </span>
                    <div className="flex gap-1 ml-auto">
                      <Button
                        type="button"
                        variant={comp.role === "primary" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs px-2.5"
                        onClick={() => updateComponent(i, "role", "primary")}
                      >
                        Primary
                      </Button>
                      <Button
                        type="button"
                        variant={comp.role === "secondary" ? "secondary" : "outline"}
                        size="sm"
                        className="h-7 text-xs px-2.5"
                        onClick={() => updateComponent(i, "role", "secondary")}
                      >
                        Secondary
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemCombobox({
  inventoryItems,
  value,
  onSelect,
}: {
  inventoryItems: InventoryItem[];
  value: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedName = inventoryItems.find((i) => i.id === value)?.name;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="flex-1 justify-between font-normal h-9 text-sm">
          <span className="truncate">{selectedName || "Select item..."}</span>
          <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search items..." />
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            <CommandGroup>
              {inventoryItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-3.5 w-3.5", value === item.id ? "opacity-100" : "opacity-0")} />
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
