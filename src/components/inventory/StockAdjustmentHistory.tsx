import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
import { Search, ArrowUpRight, ArrowDownRight, History, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import type { InventoryItem } from "./InventoryItemForm";
import type { MeasuringUnit } from "./MeasuringUnitManager";

export type AdjustmentType = "add" | "remove" | "set" | "damaged" | "returned" | "correction";

export interface StockAdjustment {
  id: string;
  inventoryItemId: string;
  type: AdjustmentType;
  quantityChange: number;
  previousStock: number;
  newStock: number;
  reason: string;
  timestamp: Date;
}

const adjustmentTypeLabels: Record<AdjustmentType, string> = {
  add: "Stock Added",
  remove: "Stock Removed",
  set: "Stock Set",
  damaged: "Damaged",
  returned: "Returned",
  correction: "Correction",
};

interface AdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onAdjust: (itemId: string, type: AdjustmentType, quantity: number, reason: string) => void;
}

export function StockAdjustDialog({ open, onOpenChange, item, onAdjust }: AdjustDialogProps) {
  const [type, setType] = useState<AdjustmentType>("add");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");

  const handleSave = () => {
    if (quantity <= 0 && type !== "set") {
      toast.error("Quantity must be greater than 0");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for the adjustment");
      return;
    }
    if (!item) return;
    onAdjust(item.id, type, quantity, reason);
    setType("add");
    setQuantity(0);
    setReason("");
    onOpenChange(false);
  };

  const previewStock = item
    ? type === "set"
      ? quantity
      : type === "add" || type === "returned"
        ? item.stock + quantity
        : item.stock - quantity
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock — {item?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <span className="text-sm text-muted-foreground">Current Stock</span>
            <span className="font-heading font-bold">{item?.stock ?? 0}</span>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Adjustment Type</label>
            <Select value={type} onValueChange={(v) => setType(v as AdjustmentType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add Stock</SelectItem>
                <SelectItem value="remove">Remove Stock</SelectItem>
                <SelectItem value="set">Set Stock</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="correction">Correction</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason *</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Received new shipment, Monthly recount..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/20">
            <span className="text-sm font-medium">New Stock</span>
            <span className="font-heading font-bold text-accent">{previewStock}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Confirm Adjustment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface HistoryProps {
  adjustments: StockAdjustment[];
  inventoryItems: InventoryItem[];
  units: MeasuringUnit[];
}

export default function StockAdjustmentHistory({ adjustments, inventoryItems, units }: HistoryProps) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterItem, setFilterItem] = useState<string>("all");

  const getItemName = (id: string) => inventoryItems.find((i) => i.id === id)?.name || "Deleted Item";
  const getItemUnit = (id: string) => {
    const item = inventoryItems.find((i) => i.id === id);
    if (!item) return "";
    return units.find((u) => u.id === item.unitId)?.abbreviation || "";
  };

  const filtered = adjustments
    .filter((a) => {
      const name = getItemName(a.inventoryItemId);
      return name.toLowerCase().includes(search.toLowerCase()) || a.reason.toLowerCase().includes(search.toLowerCase());
    })
    .filter((a) => filterType === "all" || a.type === filterType)
    .filter((a) => filterItem === "all" || a.inventoryItemId === filterItem)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const isPositive = (type: AdjustmentType) => type === "add" || type === "returned";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search adjustments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterItem} onValueChange={setFilterItem}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Items" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            {inventoryItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="add">Stock Added</SelectItem>
            <SelectItem value="remove">Stock Removed</SelectItem>
            <SelectItem value="set">Stock Set</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
            <SelectItem value="correction">Correction</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <History className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No adjustment history yet</p>
          <p className="text-xs text-muted-foreground mt-1">Stock changes will appear here</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((adj) => (
            <Card key={adj.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                    isPositive(adj.type) ? "bg-success/10" : "bg-destructive/10"
                  )}>
                    {isPositive(adj.type) ? (
                      <ArrowUpRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{getItemName(adj.inventoryItemId)}</p>
                    <p className="text-xs text-muted-foreground truncate">{adj.reason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-heading font-bold",
                      isPositive(adj.type) ? "text-success" : "text-destructive"
                    )}>
                      {isPositive(adj.type) ? "+" : "-"}{Math.abs(adj.quantityChange)} {getItemUnit(adj.inventoryItemId)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {adj.previousStock} → {adj.newStock}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] capitalize whitespace-nowrap">
                    {adjustmentTypeLabels[adj.type]}
                  </Badge>
                  <p className="text-xs text-muted-foreground whitespace-nowrap hidden md:block">
                    {format(new Date(adj.timestamp), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
