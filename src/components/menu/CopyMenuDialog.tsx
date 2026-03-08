import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Copy, ArrowRight } from "lucide-react";
import type { MenuItem } from "./MenuItemForm";
import type { Outlet } from "@/data/outlets";

interface CopyMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MenuItem[];
  currentOutletId: string;
  currentOutletName: string;
  outlets: Outlet[];
  onCopy: (itemIds: string[], targetOutletId: string) => void;
}

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

  const availableOutlets = useMemo(
    () => outlets.filter((o) => o.id !== currentOutletId),
    [outlets, currentOutletId]
  );

  const allSelected = selectedIds.size === items.length && items.length > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCopy = () => {
    if (selectedIds.size === 0 || !targetOutletId) return;
    onCopy(Array.from(selectedIds), targetOutletId);
    setSelectedIds(new Set());
    setTargetOutletId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5 text-primary" />
            Copy Menu Items
          </DialogTitle>
          <DialogDescription>
            Select items from <span className="font-medium text-foreground">{currentOutletName}</span> to copy to another outlet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Target outlet */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Copy to</label>
            <Select value={targetOutletId} onValueChange={setTargetOutletId}>
              <SelectTrigger>
                <SelectValue placeholder="Select target outlet" />
              </SelectTrigger>
              <SelectContent>
                {availableOutlets.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Items list */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 border-b border-border">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all"
              />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Select items ({selectedIds.size}/{items.length})
              </span>
            </div>
            <div className="max-h-[280px] overflow-y-auto divide-y divide-border">
              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.category} › {item.subcategory}
                    </p>
                  </div>
                  <span className="text-sm font-heading font-semibold shrink-0">
                    ${item.price.toFixed(2)}
                  </span>
                  {item.variants.length > 0 && (
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {item.variants.length} var
                    </Badge>
                  )}
                </label>
              ))}
              {items.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">
                  No menu items in this outlet
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
