import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Copy, ArrowRight, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { MenuItem } from "./MenuItemForm";
import type { Outlet } from "@/data/outlets";

interface PriceOverride {
  basePrice?: number;
  variantPrices?: Record<string, number>; // variantId -> price
}

interface CopyMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MenuItem[];
  currentOutletId: string;
  currentOutletName: string;
  outlets: Outlet[];
  onCopy: (itemIds: string[], targetOutletId: string, priceOverrides?: Record<string, PriceOverride>) => void;
}

const ITEMS_PER_PAGE = 5;

export default function CopyMenuDialog({
  open,
  onOpenChange,
  items,
  currentOutletId,
  currentOutletName,
  outlets,
  onCopy,
}: CopyMenuDialogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetOutletId, setTargetOutletId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, PriceOverride>>({});
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const availableOutlets = useMemo(
    () => outlets.filter((o) => o.id !== currentOutletId),
    [outlets, currentOutletId]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.subcategory.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q)
    );
  }, [items, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const allFilteredSelected = filtered.length > 0 && filtered.every((i) => selectedIds.has(i.id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((i) => next.add(i.id));
        return next;
      });
    }
  };

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const setBasePrice = (itemId: string, price: number) => {
    setPriceOverrides((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], basePrice: price },
    }));
  };

  const setVariantPrice = (itemId: string, variantId: string, price: number) => {
    setPriceOverrides((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        variantPrices: { ...prev[itemId]?.variantPrices, [variantId]: price },
      },
    }));
  };

  const getDisplayPrice = (item: MenuItem) => {
    return priceOverrides[item.id]?.basePrice ?? item.price;
  };

  const getVariantDisplayPrice = (itemId: string, variantId: string, originalPrice: number) => {
    return priceOverrides[itemId]?.variantPrices?.[variantId] ?? originalPrice;
  };

  const handleCopy = () => {
    if (selectedIds.size === 0 || !targetOutletId) return;
    onCopy(Array.from(selectedIds), targetOutletId, priceOverrides);
    setSelectedIds(new Set());
    setTargetOutletId("");
    setSearch("");
    setPage(1);
    setPriceOverrides({});
    setExpandedItems(new Set());
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedIds(new Set());
      setTargetOutletId("");
      setSearch("");
      setPage(1);
      setPriceOverrides({});
      setExpandedItems(new Set());
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            Copy Menu Items
          </DialogTitle>
          <DialogDescription>
            Select items from <span className="font-medium text-foreground">{currentOutletName}</span> to copy. You can adjust prices before copying.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          {/* Target outlet */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Copy to</label>
            <Select value={targetOutletId} onValueChange={setTargetOutletId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target outlet" />
              </SelectTrigger>
              <SelectContent>
                {availableOutlets.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search + pagination controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 h-9"
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="min-w-[4ch] text-center">{currentPage}/{totalPages}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Items list */}
          <div className="border border-border rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Select items ({selectedIds.size}/{items.length})
                </span>
              </div>
              {selectedIds.size < items.length && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => setSelectedIds(new Set(items.map((i) => i.id)))}
                >
                  Select all {items.length} items
                </Button>
              )}
            </div>
            <div className="overflow-y-auto divide-y divide-border flex-1">
              {paged.map((item) => {
                const hasVariants = item.variants.length > 0;
                const isExpanded = expandedItems.has(item.id);
                const isSelected = selectedIds.has(item.id);

                return (
                  <div key={item.id}>
                    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleItem(item.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          {hasVariants && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.id)}
                              className="shrink-0"
                            >
                              <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted">
                                {item.variants.length} variant{item.variants.length > 1 ? "s" : ""}
                              </Badge>
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.category} › {item.subcategory}
                        </p>
                      </div>
                      {!hasVariants && (
                        <div className="shrink-0 w-24">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={getDisplayPrice(item)}
                            onChange={(e) => setBasePrice(item.id, parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm text-right"
                          />
                        </div>
                      )}
                    </div>

                    {/* Variant rows */}
                    {hasVariants && isExpanded && (
                      <div className="bg-muted/20 border-t border-border">
                        {item.variants.map((v) => (
                          <div
                            key={v.id}
                            className="flex items-center gap-3 px-3 py-2 pl-10 border-b border-border/50 last:border-b-0"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">{v.name}</p>
                              <p className="text-[10px] text-muted-foreground">SKU: {v.sku || "—"}</p>
                            </div>
                            <div className="shrink-0 w-24">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={getVariantDisplayPrice(item.id, v.id, v.price)}
                                onChange={(e) =>
                                  setVariantPrice(item.id, v.id, parseFloat(e.target.value) || 0)
                                }
                                className="h-7 text-xs text-right"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">
                  {search ? "No items match your search" : "No menu items in this outlet"}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCopy}
            disabled={selectedIds.size === 0 || !targetOutletId}
            className="gap-2"
          >
            Copy {selectedIds.size > 0 ? `${selectedIds.size} item${selectedIds.size > 1 ? "s" : ""}` : ""}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
