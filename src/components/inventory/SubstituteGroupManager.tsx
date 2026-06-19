import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { Plus, Pencil, Trash2, Layers, ArrowUp, ArrowDown, X, Check, Info, Loader2, Calendar } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { InventoryItem } from "./InventoryItemForm";
import {
  useCreateSubstituteGroup,
  useUpdateSubstituteGroup,
  useDeleteSubstituteGroup,
  useGetSubstituteGroups,
} from "@/services/api/inventory/substitute-group";
import { useGetSubstitutionLogs } from "@/services/api/inventory/live-inventory";
import { ResuablePagination } from "@/components/ui/reusable-pagination";
import type { SubstituteGroupResponse as SubstituteGroup, SubstituteGroupResponseItem as SubstituteGroupItem } from "@/lib/types/substitute-group-response";

interface Props {
  inventoryItems: InventoryItem[];
  selectedOutletId?: string;
  readOnly?: boolean;
}

/**
 * Manages reusable Substitute Groups for an outlet (e.g. "Burger Patties").
 * Each group has an ordered list of inventory items + per-item conversion ratio.
 * Composite components reference these groups by id; resolver handles fallback.
 */
export default function SubstituteGroupManager({ inventoryItems, selectedOutletId, readOnly }: Props) {
  const { data: groupsRes, mutate: mutateGroups } = useGetSubstituteGroups({
    outletId: selectedOutletId || undefined,
  });
  const groups = groupsRes?.data ?? [];

  const [activeSubTab, setActiveSubTab] = useState<"groups" | "logs">("groups");
  const [logsPage, setLogsPage] = useState(1);
  const { data: logsResponse, isLoading: isLogsLoading } = useGetSubstitutionLogs({
    page: logsPage,
    per_page: 10,
    outletId: selectedOutletId || undefined,
  });

  const createGroupMutation = useCreateSubstituteGroup();
  const updateGroupMutation = useUpdateSubstituteGroup();
  const deleteGroupMutation = useDeleteSubstituteGroup();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SubstituteGroup | null>(null);
  const [name, setName] = useState("");
  const [items, setItems] = useState<SubstituteGroupItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubstituteGroup | null>(null);

  const visible = groups.filter((g) => !selectedOutletId || g.outletId === selectedOutletId);

  const openNew = () => {
    setEditing(null);
    setName("");
    setItems([]);
    setOpen(true);
  };

  const openEdit = (g: SubstituteGroup) => {
    setEditing(g);
    setName(g.name);
    setItems([...g.items].sort((a, b) => a.priority - b.priority));
    setOpen(true);
  };

  const addItem = (id: string) => {
    if (items.some((i) => i.inventoryItemId === id)) return;
    setItems([...items, { inventoryItemId: id, priority: items.length, conversionRatio: 1 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.inventoryItemId !== id).map((i, idx) => ({ ...i, priority: idx })));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const arr = [...items];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setItems(arr.map((s, i) => ({ ...s, priority: i })));
  };

  const updateRatio = (id: string, value: number) => {
    setItems(items.map((i) => (i.inventoryItemId === id ? { ...i, conversionRatio: value } : i)));
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }
    if (items.length < 2) {
      toast.error("Add at least 2 items to a substitute group");
      return;
    }
    try {
      const itemsPayload = items.map((it) => ({
        inventoryItemId: it.inventoryItemId,
        priority: it.priority,
        conversionRatio: it.conversionRatio,
      }));

      if (editing) {
        await updateGroupMutation.trigger({
          id: editing.id,
          payload: {
            name: name.trim(),
            outletId: selectedOutletId || editing.outletId || "",
            items: itemsPayload,
          },
        });
        toast.success("Substitute group updated");
      } else {
        await createGroupMutation.trigger({
          name: name.trim(),
          outletId: selectedOutletId || "",
          items: itemsPayload,
        });
        toast.success("Substitute group created");
      }
      mutateGroups();
      setOpen(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to save substitute group");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteGroupMutation.trigger(deleteTarget.id);
      toast.success("Group deleted");
      mutateGroups();
      setDeleteTarget(null);
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message || "Failed to delete substitute group");
    }
  };

  const candidatePool = inventoryItems.filter(
    (i) => !items.some((it) => it.inventoryItemId === i.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveSubTab("groups")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-[2px] transition-colors",
            activeSubTab === "groups"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Substitute Groups
        </button>
        <button
          onClick={() => setActiveSubTab("logs")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-[2px] transition-colors",
            activeSubTab === "logs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Substitution Logs
        </button>
      </div>

      {activeSubTab === "groups" ? (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <p className="text-sm text-muted-foreground">
                Reusable substitute groups (e.g. "Burger Patties") for composite components.
              </p>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[280px]">
                  <p className="text-xs">Create ordered lists of interchangeable inventory items. Composite components can link to these groups so substitutions happen automatically based on stock availability and priority.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            {!readOnly && (
              <Button size="sm" onClick={openNew}>
                <Plus className="h-4 w-4 mr-1" /> Add Group
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((g) => (
              <Card key={g.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Layers className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-semibold text-sm truncate">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{g.items.length} items</p>
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(g)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => setDeleteTarget(g)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                <ul className="space-y-1">
                  {[...g.items]
                    .sort((a, b) => a.priority - b.priority)
                    .map((it, idx) => {
                      const inv = inventoryItems.find((i) => i.id === it.inventoryItemId);
                      return (
                        <li key={it.inventoryItemId} className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="h-4 px-1 text-[10px]">
                            #{idx + 1}
                          </Badge>
                          <span className="truncate flex-1">{inv?.name ?? "Unknown item"}</span>
                          <span className="text-muted-foreground tabular-nums">×{it.conversionRatio}</span>
                        </li>
                      );
                    })}
                </ul>
              </Card>
            ))}
            {visible.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                No substitute groups yet
              </p>
            )}
          </div>
        </>
      ) : (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm">Substitution Audit Trail</h3>
            <p className="text-xs text-muted-foreground">Log of all dynamic recipe item swaps</p>
          </div>
          {isLogsLoading ? (
            <div className="py-8 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading substitution logs...
            </div>
          ) : !logsResponse?.data || logsResponse.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground space-y-2">
              <Calendar className="h-8 w-8 text-muted-foreground/35 mx-auto" />
              <p className="text-sm">No substitution logs recorded</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-3">Order ID</th>
                      <th className="text-left p-3">Original Item</th>
                      <th className="text-left p-3">Substitute Item</th>
                      <th className="text-right p-3">Qty Swapped</th>
                      <th className="text-left p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logsResponse.data.map((log) => {
                      const orig = inventoryItems.find((i) => i.id === log.originalItemId);
                      const sub = inventoryItems.find((i) => i.id === log.substituteItemId);
                      return (
                        <tr key={log.id} className="border-b hover:bg-muted/30">
                          <td className="p-3 font-mono text-xs">{log.orderId || "—"}</td>
                          <td className="p-3 font-medium">{orig?.name || log.originalItemId}</td>
                          <td className="p-3 font-medium text-accent">{sub?.name || log.substituteItemId}</td>
                          <td className="p-3 text-right font-semibold">{log.quantity}</td>
                          <td className="p-3 text-muted-foreground text-xs">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ResuablePagination
                currentPage={logsPage}
                totalPages={logsResponse.meta?.last_page || 1}
                totalItems={logsResponse.meta?.total || 0}
                onPageChange={setLogsPage}
                rowsPerPage={10}
              />
            </div>
          )}
        </Card>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="!w-full !max-w-none lg:!max-w-md p-0 flex flex-col overflow-hidden">
          <SheetHeader className="px-6 pt-6 pb-4">
            <SheetTitle>{editing ? "Edit Substitute Group" : "Create Substitute Group"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Group Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Burger Patties"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Items (priority ordered)</label>
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[260px] p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search items..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>No items.</CommandEmpty>
                        <CommandGroup>
                          {candidatePool.map((it) => (
                            <CommandItem
                              key={it.id}
                              value={it.name}
                              onSelect={() => {
                                addItem(it.id);
                                setPickerOpen(false);
                              }}
                            >
                              <Check className="mr-2 h-3.5 w-3.5 opacity-0" />
                              <span className="truncate">{it.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {items.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">
                  Add at least 2 items
                </p>
              )}

              {items.map((it, idx) => {
                const inv = inventoryItems.find((i) => i.id === it.inventoryItemId);
                return (
                  <div
                    key={it.inventoryItemId}
                    className="flex items-center gap-2 p-2 border rounded-lg"
                  >
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] tabular-nums">
                      #{idx + 1}
                    </Badge>
                    <span className="text-sm font-medium truncate flex-1">{inv?.name ?? "Unknown"}</span>
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-0.5 cursor-help">
                            <span className="text-[10px] text-muted-foreground">ratio</span>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[240px]">
                          <p className="text-xs">
                            How many units of this item replace 1 unit of the original ingredient.
                            Example: if 2 slices of cheddar replace 1 slice of American cheese, set ratio to 2.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={it.conversionRatio}
                        onChange={(e) =>
                          updateRatio(it.inventoryItemId, Math.max(0.01, Number(e.target.value) || 1))
                        }
                        className="h-7 w-16 text-xs px-2"
                      />
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === 0}
                        onClick={() => move(idx, -1)}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={idx === items.length - 1}
                        onClick={() => move(idx, 1)}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => removeItem(it.inventoryItemId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={createGroupMutation.isMutating || updateGroupMutation.isMutating}>
              {createGroupMutation.isMutating || updateGroupMutation.isMutating ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete substitute group?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" will be removed. Composite components referencing it
              will skip the group at availability time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
