import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ChevronsUpDown, Check, ArrowUp, ArrowDown, X, Plus, Layers, Replace, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/currency";
import type { InventoryItem } from "@/components/inventory/InventoryItemForm";
import type { SubstituteGroup } from "@/data/substituteGroups";
import type { ComponentSubstitute, ComponentSubstituteConfig, SubstituteMode } from "@/lib/composite-substitution";

interface Props {
  /** Original inventory item id (the component's primary). */
  originalItemId: string;
  config: ComponentSubstituteConfig;
  onChange: (next: ComponentSubstituteConfig) => void;
  inventoryItems: InventoryItem[];
  groups: SubstituteGroup[];
}

/**
 * Editor block embedded inside a composite component card.
 *
 * Surfaces:
 *  - Allow Substitute toggle
 *  - Substitute Mode select (STRICT / AUTO / MANUAL_APPROVAL)
 *  - Direct Substitute Items list with priority up/down + conversion ratio
 *  - Substitute Group references
 *  - Live cost-variance hint per substitute candidate
 *  - Stock-availability preview for each candidate
 */
export default function ComponentSubstituteEditor({ originalItemId, config, onChange, inventoryItems, groups }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);

  const allowSubstitute = !!config.allowSubstitute;
  const mode: SubstituteMode = config.substituteMode ?? "auto";
  const subs = config.substitutes ?? [];
  const groupIds = config.substituteGroupIds ?? [];

  const original = inventoryItems.find((i) => i.id === originalItemId);
  const originalCost = original?.costPrice ?? 0;

  const setConfig = (patch: Partial<ComponentSubstituteConfig>) => onChange({ ...config, ...patch });

  const sortedSubs = useMemo(
    () => [...subs].sort((a, b) => a.priority - b.priority),
    [subs]
  );

  const movePriority = (idx: number, dir: -1 | 1) => {
    const arr = [...sortedSubs];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setConfig({ substitutes: arr.map((s, i) => ({ ...s, priority: i })) });
  };

  const addSub = (itemId: string) => {
    if (subs.some((s) => s.inventoryItemId === itemId)) return;
    if (itemId === originalItemId) return;
    const next: ComponentSubstitute = {
      inventoryItemId: itemId,
      priority: subs.length,
      conversionRatio: 1,
    };
    setConfig({ substitutes: [...subs, next] });
  };

  const removeSub = (itemId: string) => {
    setConfig({
      substitutes: subs
        .filter((s) => s.inventoryItemId !== itemId)
        .map((s, i) => ({ ...s, priority: i })),
    });
  };

  const updateSub = (itemId: string, patch: Partial<ComponentSubstitute>) => {
    setConfig({
      substitutes: subs.map((s) => (s.inventoryItemId === itemId ? { ...s, ...patch } : s)),
    });
  };

  const toggleGroup = (id: string) => {
    setConfig({
      substituteGroupIds: groupIds.includes(id)
        ? groupIds.filter((g) => g !== id)
        : [...groupIds, id],
    });
  };

  const candidatePool = inventoryItems.filter(
    (i) => i.id !== originalItemId && !subs.some((s) => s.inventoryItemId === i.id)
  );

  return (
    <div className="border-t pt-2.5 mt-2 space-y-2.5">
      {/* Allow toggle + mode */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Replace className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium">Allow substitute</span>
        </div>
        <Switch
          checked={allowSubstitute}
          onCheckedChange={(v) => setConfig({ allowSubstitute: v, substituteMode: config.substituteMode ?? "auto" })}
        />
      </div>

      {allowSubstitute && (
        <>
          <div className="grid grid-cols-[auto_1fr] items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Mode</span>
            <Select value={mode} onValueChange={(v) => setConfig({ substituteMode: v as SubstituteMode })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strict">Strict — never substitute</SelectItem>
                <SelectItem value="auto">Auto — use next available</SelectItem>
                <SelectItem value="manual_approval">Manual — cashier approves</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Direct substitute items */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Substitute Items
              </span>
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-[11px] px-1.5">
                    <Plus className="h-3 w-3 mr-0.5" /> Add
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
                              addSub(it.id);
                              setPickerOpen(false);
                            }}
                          >
                            <Check className="mr-2 h-3.5 w-3.5 opacity-0" />
                            <span className="truncate">{it.name}</span>
                            <span className="ml-auto text-[10px] text-muted-foreground">
                              {it.stock ?? 0}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {sortedSubs.length === 0 && (
              <p className="text-[11px] text-muted-foreground italic">No direct substitutes</p>
            )}

            {sortedSubs.map((s, idx) => {
              const item = inventoryItems.find((i) => i.id === s.inventoryItemId);
              if (!item) return null;
              const subCost = item.costPrice ?? 0;
              const variance = subCost * s.conversionRatio - originalCost;
              const cheaper = variance < 0;
              const stock = item.stock ?? 0;
              return (
                <div key={s.inventoryItemId} className="flex flex-wrap items-center gap-1.5 p-1.5 rounded border bg-muted/30">
                  <Badge variant="outline" className="h-5 px-1.5 text-[10px] tabular-nums">
                    #{idx + 1}
                  </Badge>
                  <span className="text-xs font-medium truncate flex-1 min-w-[100px]">{item.name}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-5 px-1.5 text-[10px] tabular-nums",
                      stock <= 0
                        ? "border-destructive/40 text-destructive"
                        : "border-success/40 text-success"
                    )}
                  >
                    {stock} stk
                  </Badge>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">ratio</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={s.conversionRatio}
                      onChange={(e) =>
                        updateSub(s.inventoryItemId, {
                          conversionRatio: Math.max(0.01, Number(e.target.value) || 1),
                        })
                      }
                      className="h-6 w-14 text-[11px] px-1.5"
                    />
                  </div>
                  {originalCost > 0 && (
                    <span
                      className={cn(
                        "text-[10px] tabular-nums flex items-center gap-0.5",
                        cheaper ? "text-success" : variance > 0 ? "text-warning" : "text-muted-foreground"
                      )}
                      title="Cost variance vs original (per 1 base unit replaced)"
                    >
                      {cheaper ? <TrendingDown className="h-2.5 w-2.5" /> : <TrendingUp className="h-2.5 w-2.5" />}
                      {variance >= 0 ? "+" : ""}
                      {formatNaira(variance)}
                    </span>
                  )}
                  <div className="flex items-center gap-0.5 ml-auto">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={idx === 0}
                      onClick={() => movePriority(idx, -1)}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      disabled={idx === sortedSubs.length - 1}
                      onClick={() => movePriority(idx, 1)}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-destructive"
                      onClick={() => removeSub(s.inventoryItemId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Substitute groups */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Substitute Groups
              </span>
              <Popover open={groupPickerOpen} onOpenChange={setGroupPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[11px] px-1.5"
                    disabled={groups.length === 0}
                  >
                    <Layers className="h-3 w-3 mr-0.5" />
                    {groups.length === 0 ? "No groups defined" : "Link group"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Search groups..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No groups.</CommandEmpty>
                      <CommandGroup>
                        {groups.map((g) => (
                          <CommandItem key={g.id} value={g.name} onSelect={() => toggleGroup(g.id)}>
                            <Check
                              className={cn(
                                "mr-2 h-3.5 w-3.5",
                                groupIds.includes(g.id) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="truncate">{g.name}</span>
                            <span className="ml-auto text-[10px] text-muted-foreground">
                              {g.items.length} items
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {groupIds.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic">No groups linked</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {groupIds.map((gid) => {
                  const g = groups.find((x) => x.id === gid);
                  if (!g) return null;
                  return (
                    <Badge key={gid} variant="secondary" className="text-[10px] gap-1">
                      <Layers className="h-2.5 w-2.5" />
                      {g.name}
                      <button
                        type="button"
                        onClick={() => toggleGroup(gid)}
                        className="ml-0.5 hover:text-destructive"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {mode === "manual_approval" && (
            <div className="flex items-start gap-1.5 p-1.5 rounded bg-warning/10 border border-warning/30">
              <AlertTriangle className="h-3 w-3 text-warning mt-0.5 shrink-0" />
              <p className="text-[10px] text-warning-foreground/80 leading-snug">
                Cashier will be prompted to approve substitution at point of sale.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
