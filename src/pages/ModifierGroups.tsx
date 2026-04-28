import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Layers, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatNaira } from "@/lib/currency";
import { defaultInventoryItems } from "@/data/inventoryItems";
import type { InventoryItem } from "@/components/inventory/InventoryItemForm";
import {
  loadModifierGroups,
  saveModifierGroups,
  generateModifierGroupId,
  generateModifierId,
  type ModifierGroup,
  type Modifier,
} from "@/data/modifierGroups";

interface DraftGroup {
  id?: string;
  name: string;
  description: string;
  minSelect: number;
  maxSelect: number;
  modifiers: Modifier[];
}

const emptyDraft: DraftGroup = {
  name: "",
  description: "",
  minSelect: 0,
  maxSelect: 0,
  modifiers: [],
};

export default function ModifierGroups() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<ModifierGroup[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<DraftGroup>(emptyDraft);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setGroups(loadModifierGroups());
    setInventory(defaultInventoryItems);
  }, []);

  const persist = (next: ModifierGroup[]) => {
    setGroups(next);
    saveModifierGroups(next);
  };

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.modifiers.some((m) => m.name.toLowerCase().includes(search.toLowerCase()))
  );

  const openCreate = () => {
    setDraft(emptyDraft);
    setEditorOpen(true);
  };

  const openEdit = (group: ModifierGroup) => {
    setDraft({
      id: group.id,
      name: group.name,
      description: group.description ?? "",
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      modifiers: group.modifiers.map((m) => ({ ...m })),
    });
    setEditorOpen(true);
  };

  const addModifier = () => {
    setDraft((d) => ({
      ...d,
      modifiers: [
        ...d.modifiers,
        { id: generateModifierId(), name: "", price: 0 },
      ],
    }));
  };

  const updateModifier = (idx: number, patch: Partial<Modifier>) => {
    setDraft((d) => ({
      ...d,
      modifiers: d.modifiers.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    }));
  };

  const removeModifier = (idx: number) => {
    setDraft((d) => ({
      ...d,
      modifiers: d.modifiers.filter((_, i) => i !== idx),
    }));
  };

  const handleSave = () => {
    if (!draft.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (draft.modifiers.length === 0) {
      toast({ title: "Add at least one modifier", variant: "destructive" });
      return;
    }
    if (draft.modifiers.some((m) => !m.name.trim())) {
      toast({ title: "Every modifier needs a name", variant: "destructive" });
      return;
    }
    if (draft.maxSelect && draft.minSelect > draft.maxSelect) {
      toast({ title: "Min selection can't exceed max selection", variant: "destructive" });
      return;
    }

    const saved: ModifierGroup = {
      id: draft.id ?? generateModifierGroupId(),
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      minSelect: Number(draft.minSelect) || 0,
      maxSelect: Number(draft.maxSelect) || 0,
      modifiers: draft.modifiers.map((m) => ({
        ...m,
        name: m.name.trim(),
        price: Number(m.price) || 0,
      })),
    };

    const next = draft.id
      ? groups.map((g) => (g.id === draft.id ? saved : g))
      : [...groups, saved];
    persist(next);
    setEditorOpen(false);
    toast({ title: draft.id ? "Modifier group updated" : "Modifier group created" });
  };

  const handleDelete = () => {
    if (!deleteId) return;
    persist(groups.filter((g) => g.id !== deleteId));
    setDeleteId(null);
    toast({ title: "Modifier group deleted" });
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Modifier Groups</h1>
          <p className="text-sm text-muted-foreground">
            Reusable add-ons and customisations attachable to catalog items.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Group
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search groups or modifiers"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <Layers className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No modifier groups yet</p>
          <p className="text-sm text-muted-foreground">
            Create reusable add-ons like “Toppings” or “Coffee Options”.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((group) => {
            const isOpen = openId === group.id;
            return (
              <Card key={group.id} className="overflow-hidden">
                <Collapsible open={isOpen} onOpenChange={(o) => setOpenId(o ? group.id : null)}>
                  <div className="flex items-center justify-between gap-3 p-4">
                    <CollapsibleTrigger asChild>
                      <button className="flex flex-1 items-center gap-3 text-left">
                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                        <div>
                          <div className="font-semibold">{group.name}</div>
                          {group.description && (
                            <div className="text-xs text-muted-foreground">{group.description}</div>
                          )}
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{group.modifiers.length} modifiers</Badge>
                      <Badge variant="outline">
                        {group.minSelect}–{group.maxSelect || "∞"}
                      </Badge>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(group)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteId(group.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <Separator />
                    <div className="divide-y">
                      {group.modifiers.map((m) => {
                        const linked = inventory.find((i) => i.id === m.linkedInventoryItemId);
                        return (
                          <div
                            key={m.id}
                            className="flex items-center justify-between px-4 py-2 text-sm"
                          >
                            <div>
                              <div className="font-medium">{m.name}</div>
                              {linked && (
                                <div className="text-xs text-muted-foreground">
                                  Linked: {linked.name}
                                </div>
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              {m.price > 0 ? `+${formatNaira(m.price)}` : "Free"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit Modifier Group" : "New Modifier Group"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Burger Toppings"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="Optional internal note"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min selection</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.minSelect}
                  onChange={(e) => setDraft({ ...draft, minSelect: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">0 = optional</p>
              </div>
              <div className="space-y-2">
                <Label>Max selection</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.maxSelect}
                  onChange={(e) => setDraft({ ...draft, maxSelect: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">0 = unlimited</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label className="text-base">Modifiers</Label>
              <Button size="sm" variant="outline" onClick={addModifier}>
                <Plus className="mr-1 h-3 w-3" /> Add Modifier
              </Button>
            </div>

            <div className="space-y-2">
              {draft.modifiers.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No modifiers yet. Click “Add Modifier” to start.
                </p>
              )}
              {draft.modifiers.map((m, idx) => (
                <Card key={m.id} className="space-y-2 p-3">
                  <div className="grid grid-cols-12 gap-2">
                    <Input
                      className="col-span-5"
                      placeholder="Name (e.g. Extra Cheese)"
                      value={m.name}
                      onChange={(e) => updateModifier(idx, { name: e.target.value })}
                    />
                    <Input
                      className="col-span-3"
                      type="number"
                      placeholder="Price"
                      value={m.price}
                      onChange={(e) => updateModifier(idx, { price: Number(e.target.value) })}
                    />
                    <div className="col-span-3">
                      <Select
                        value={m.linkedInventoryItemId ?? "none"}
                        onValueChange={(v) =>
                          updateModifier(idx, {
                            linkedInventoryItemId: v === "none" ? undefined : v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Link inventory" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No link</SelectItem>
                          {inventory.map((i) => (
                            <SelectItem key={i.id} value={i.id}>
                              {i.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="col-span-1"
                      onClick={() => removeModifier(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {draft.id ? "Save Changes" : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete modifier group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the group from the modifier library. Items already
              configured with these modifiers keep their existing add-ons.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
