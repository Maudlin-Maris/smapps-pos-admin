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

import {
  useCreateMeasuringUnit,
  useUpdateMeasuringUnit,
  useDeleteMeasuringUnit,
} from "@/services/api/inventory/unit";

interface Props {
  units: MeasuringUnit[];
  onMutate: () => void;
}

export default function MeasuringUnitManager({ units, onMutate }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MeasuringUnit | null>(null);
  const [form, setForm] = useState({ name: "", abbreviation: "" });
  const [search, setSearch] = useState("");

  const createUnitMutation = useCreateMeasuringUnit();
  const updateUnitMutation = useUpdateMeasuringUnit();
  const deleteUnitMutation = useDeleteMeasuringUnit();

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

  const handleSave = async () => {
    if (!form.name.trim() || !form.abbreviation.trim()) {
      toast.error("Name and abbreviation are required");
      return;
    }
    try {
      if (editing) {
        await updateUnitMutation.trigger({
          id: editing.id,
          payload: {
            name: form.name,
            abbreviation: form.abbreviation,
          },
        });
        toast.success("Unit updated");
      } else {
        await createUnitMutation.trigger({
          name: form.name,
          abbreviation: form.abbreviation,
        });
        toast.success("Unit added");
      }
      onMutate();
      setOpen(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to save unit");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUnitMutation.trigger(id);
      toast.success("Unit deleted");
      onMutate();
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to delete unit");
    }
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
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(unit)} disabled={deleteUnitMutation.isMutating}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(unit.id)} disabled={deleteUnitMutation.isMutating}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">No units found</p>
        )}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="!w-full !max-w-none lg:!max-w-md p-0 flex flex-col overflow-hidden [&>button]:z-10">
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle>{editing ? "Edit Unit" : "Add Unit"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
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
          </div>
          <SheetFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createUnitMutation.isMutating || updateUnitMutation.isMutating}>
              {createUnitMutation.isMutating || updateUnitMutation.isMutating ? "Saving..." : editing ? "Update" : "Add"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export { defaultUnits };
