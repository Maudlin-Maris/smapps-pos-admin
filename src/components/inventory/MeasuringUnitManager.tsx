import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Plus, Pencil, Trash2, Ruler } from "lucide-react";
import { toast } from "sonner";

export interface MeasuringUnit {
  id: string;
  name: string;
  abbreviation: string;
}

const defaultUnits: MeasuringUnit[] = [
  { id: "1", name: "Kilogram", abbreviation: "kg" },
  { id: "2", name: "Gram", abbreviation: "g" },
  { id: "3", name: "Liter", abbreviation: "L" },
  { id: "4", name: "Milliliter", abbreviation: "ml" },
  { id: "5", name: "Piece", abbreviation: "pcs" },
  { id: "6", name: "Box", abbreviation: "box" },
  { id: "7", name: "Bottle", abbreviation: "btl" },
  { id: "8", name: "Tube", abbreviation: "tube" },
  { id: "9", name: "Loaf", abbreviation: "loaf" },
  { id: "10", name: "Pack", abbreviation: "pk" },
  { id: "11", name: "Carton", abbreviation: "ctn" },
  { id: "12", name: "Pair", abbreviation: "pr" },
  { id: "13", name: "Roll", abbreviation: "roll" },
  { id: "14", name: "Sachet", abbreviation: "sct" },
  { id: "15", name: "Tablet", abbreviation: "tab" },
  { id: "16", name: "Strip", abbreviation: "strip" },
];

interface Props {
  units: MeasuringUnit[];
  setUnits: React.Dispatch<React.SetStateAction<MeasuringUnit[]>>;
}

export default function MeasuringUnitManager({ units, setUnits }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MeasuringUnit | null>(null);
  const [form, setForm] = useState({ name: "", abbreviation: "" });
  const [search, setSearch] = useState("");

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", abbreviation: "" });
    setOpen(true);
  };

  const openEdit = (unit: MeasuringUnit) => {
    setEditing(unit);
    setForm({ name: unit.name, abbreviation: unit.abbreviation });
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.abbreviation.trim()) {
      toast.error("Name and abbreviation are required");
      return;
    }
    if (editing) {
      setUnits((prev) => prev.map((u) => (u.id === editing.id ? { ...u, ...form } : u)));
      toast.success("Unit updated");
    } else {
      setUnits((prev) => [...prev, { id: crypto.randomUUID(), ...form }]);
      toast.success("Unit added");
    }
    setOpen(false);
  };

  const handleDelete = (id: string) => {
    setUnits((prev) => prev.filter((u) => u.id !== id));
    toast.success("Unit deleted");
  };

  const filtered = units.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Input placeholder="Search units..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button size="sm" onClick={openNew} className="w-fit">
          <Plus className="h-4 w-4 mr-1" /> Add Unit
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((unit) => (
          <Card key={unit.id} className="p-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                <Ruler className="h-4 w-4 text-info" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{unit.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{unit.abbreviation}</p>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(unit)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(unit.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">No units found</p>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Unit" : "Add Unit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kilogram" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Abbreviation</label>
              <Input value={form.abbreviation} onChange={(e) => setForm({ ...form, abbreviation: e.target.value })} placeholder="e.g. kg" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { defaultUnits };
