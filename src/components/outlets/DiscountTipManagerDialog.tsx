import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Tag, Percent } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  getOutletDiscountTipConfig,
  setOutletDiscountTipConfig,
  type OutletTipPreset,
} from "@/data/outletDiscountTips";
import type { POSDiscount } from "@/data/posData";
import { formatNaira } from "@/lib/currency";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: string | number;
  outletName: string;
}

export default function DiscountTipManagerDialog({ open, onOpenChange, outletId, outletName }: Props) {
  const [discounts, setDiscounts] = useState<POSDiscount[]>([]);
  const [tips, setTips] = useState<OutletTipPreset[]>([]);

  const [discName, setDiscName] = useState("");
  const [discType, setDiscType] = useState<"percentage" | "fixed">("percentage");
  const [discValue, setDiscValue] = useState("");

  const [tipValue, setTipValue] = useState("");

  useEffect(() => {
    if (open) {
      const cfg = getOutletDiscountTipConfig(outletId);
      setDiscounts(cfg.discounts);
      setTips(cfg.tips);
    }
  }, [open, outletId]);

  const persist = (next: { discounts?: POSDiscount[]; tips?: OutletTipPreset[] }) => {
    const updated = {
      discounts: next.discounts ?? discounts,
      tips: next.tips ?? tips,
    };
    setOutletDiscountTipConfig(outletId, updated);
  };

  const addDiscount = () => {
    const val = parseFloat(discValue);
    if (!discName.trim() || isNaN(val) || val <= 0) {
      toast.error("Enter a valid name and value");
      return;
    }
    if (discType === "percentage" && val > 100) {
      toast.error("Percentage cannot exceed 100");
      return;
    }
    const next = [
      ...discounts,
      { id: `disc-${Date.now()}`, name: discName.trim(), type: discType, value: val },
    ];
    setDiscounts(next);
    persist({ discounts: next });
    setDiscName(""); setDiscValue("");
    toast.success("Discount added");
  };

  const removeDiscount = (id: string) => {
    const next = discounts.filter((d) => d.id !== id);
    setDiscounts(next);
    persist({ discounts: next });
  };

  const addTip = () => {
    const val = parseFloat(tipValue);
    if (isNaN(val) || val <= 0 || val > 100) {
      toast.error("Tip must be between 1 and 100%");
      return;
    }
    if (tips.some((t) => t.value === val)) {
      toast.error("Tip preset already exists");
      return;
    }
    const next = [...tips, { id: `tip-${Date.now()}`, value: val }].sort((a, b) => a.value - b.value);
    setTips(next);
    persist({ tips: next });
    setTipValue("");
    toast.success("Tip preset added");
  };

  const removeTip = (id: string) => {
    const next = tips.filter((t) => t.id !== id);
    setTips(next);
    persist({ tips: next });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Discounts & Tips — {outletName}</DialogTitle>
          <DialogDescription>
            Set the default discount and tip presets shown in the cashier POS for this outlet.
          </DialogDescription>
        </DialogHeader>

        {/* --- Discounts --- */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Discount Presets</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px_auto] gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={discName} onChange={(e) => setDiscName(e.target.value)} placeholder="e.g. Manager's Discount" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <select
                value={discType}
                onChange={(e) => setDiscType(e.target.value as "percentage" | "fixed")}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed (₦)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Value</Label>
              <Input type="number" min="0" value={discValue} onChange={(e) => setDiscValue(e.target.value)} placeholder={discType === "percentage" ? "10" : "500"} />
            </div>
            <Button onClick={addDiscount} size="sm" className="h-10">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>

          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">No discounts configured</TableCell></TableRow>
                ) : discounts.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-sm">{d.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs capitalize">{d.type}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {d.type === "percentage" ? `${d.value}%` : formatNaira(d.value)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeDiscount(d.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* --- Tips --- */}
        <section className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Tip Presets (% of subtotal)</h3>
          </div>

          <div className="flex items-end gap-2">
            <div className="space-y-1 flex-1 max-w-[160px]">
              <Label className="text-xs">Percentage</Label>
              <Input type="number" min="1" max="100" value={tipValue} onChange={(e) => setTipValue(e.target.value)} placeholder="e.g. 10" />
            </div>
            <Button onClick={addTip} size="sm" className="h-10">
              <Plus className="h-4 w-4 mr-1" /> Add Tip
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {tips.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No tip presets configured</p>
            ) : tips.map((t) => (
              <div key={t.id} className="flex items-center gap-1.5 rounded-md border bg-muted/30 px-3 py-1.5 text-sm">
                <span className="font-medium">{t.value}%</span>
                <button onClick={() => removeTip(t.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
