import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePOS } from "@/contexts/POSContext";
import { formatNaira } from "@/lib/currency";
import type { PaymentMethod } from "@/data/posData";
import {
  PlayCircle, StopCircle, Clock, Banknote, CreditCard, Smartphone,
  ArrowRightLeft, TrendingUp, Receipt, ShoppingBag,
} from "lucide-react";

const methodMeta: Record<PaymentMethod, { label: string; icon: React.ReactNode }> = {
  cash: { label: "Cash", icon: <Banknote className="w-4 h-4" /> },
  card: { label: "Card", icon: <CreditCard className="w-4 h-4" /> },
  mobile: { label: "Mobile", icon: <Smartphone className="w-4 h-4" /> },
  transfer: { label: "Transfer", icon: <ArrowRightLeft className="w-4 h-4" /> },
};

/* ──── Start Shift Dialog ──── */
export function StartShiftDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { startShift, currentCashier, currentOutlet } = usePOS();
  const [openingCash, setOpeningCash] = useState("");

  const handleStart = () => {
    startShift(parseFloat(openingCash) || 0);
    setOpeningCash("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 text-primary">
            <PlayCircle className="w-5 h-5" />
            <DialogTitle className="text-base font-semibold">Start Shift</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {currentCashier?.name} · {currentOutlet?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-2 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="opening-cash" className="text-xs font-medium">Opening Cash in Drawer</Label>
            <Input
              id="opening-cash"
              type="number"
              min="0"
              placeholder="0.00"
              value={openingCash}
              onChange={e => setOpeningCash(e.target.value)}
              className="h-9"
            />
            <p className="text-[11px] text-muted-foreground">Enter the amount of cash you're starting with</p>
          </div>
        </div>
        <DialogFooter className="px-5 pb-5 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleStart} className="gap-1.5">
            <PlayCircle className="w-4 h-4" /> Start Shift
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──── Close Shift Dialog ──── */
export function CloseShiftDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentShift, closeShift, orders, currentCashier, currentOutlet } = usePOS();
  const [closingCash, setClosingCash] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const stats = useMemo(() => {
    if (!currentShift || !currentCashier) return null;

    const shiftStart = new Date(currentShift.startedAt);
    const shiftOrders = orders.filter(o =>
      o.cashierId === currentCashier.id &&
      new Date(o.createdAt) >= shiftStart &&
      o.status !== "voided"
    );

    const paidOrders = shiftOrders.filter(o => o.status === "paid");
    const totalRevenue = paidOrders.reduce((s, o) => s + o.paidAmount, 0);
    const totalItems = paidOrders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0);
    const totalTips = paidOrders.reduce((s, o) => s + (o.tipAmount || 0), 0);
    const totalDiscount = paidOrders.reduce((s, o) => s + (o.discountAmount || 0), 0);

    const byMethod: Record<PaymentMethod, number> = { cash: 0, card: 0, mobile: 0, transfer: 0 };
    paidOrders.forEach(o => o.payments.forEach(p => {
      byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
    }));

    const expectedCash = (currentShift.openingCash || 0) + byMethod.cash;
    const openOrders = shiftOrders.filter(o => o.status !== "paid").length;

    return { totalRevenue, paidCount: paidOrders.length, totalItems, totalTips, totalDiscount, byMethod, openOrders, expectedCash };
  }, [currentShift, orders, currentCashier]);

  const handleClose = () => {
    closeShift(parseFloat(closingCash) || 0);
    setClosingCash("");
    setConfirmed(false);
    onClose();
  };

  if (!stats || !currentShift) return null;

  const duration = Math.round((Date.now() - new Date(currentShift.startedAt).getTime()) / 60000);
  const hrs = Math.floor(duration / 60);
  const mins = duration % 60;
  const methodEntries = (Object.entries(stats.byMethod) as [PaymentMethod, number][]).filter(([, v]) => v > 0);
  const maxMethod = methodEntries.length > 0 ? Math.max(...methodEntries.map(([, v]) => v)) : 1;
  const cashVariance = (parseFloat(closingCash) || 0) - stats.expectedCash;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setConfirmed(false); onClose(); } }}>
      <DialogContent className="max-w-sm sm:max-w-md p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 text-destructive">
            <StopCircle className="w-5 h-5" />
            <DialogTitle className="text-base font-semibold">Close Shift</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {currentCashier?.name} · {currentOutlet?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* Duration */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Shift duration: <span className="font-medium text-foreground">{hrs > 0 ? `${hrs}h ` : ""}{mins}m</span></span>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl bg-primary/10 p-3 space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingUp className="w-3.5 h-3.5" /> Revenue</div>
              <p className="text-lg font-bold text-primary">{formatNaira(stats.totalRevenue)}</p>
            </div>
            <div className="rounded-xl bg-muted p-3 space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Receipt className="w-3.5 h-3.5" /> Orders</div>
              <p className="text-lg font-bold">{stats.paidCount} <span className="text-xs font-normal text-muted-foreground">paid</span></p>
            </div>
            <div className="rounded-xl bg-muted p-3 space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><ShoppingBag className="w-3.5 h-3.5" /> Items Sold</div>
              <p className="text-lg font-bold">{stats.totalItems}</p>
            </div>
            <div className="rounded-xl bg-muted p-3 space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">Open Orders</div>
              <p className="text-lg font-bold">{stats.openOrders}</p>
            </div>
          </div>

          {/* Tips & discounts */}
          {(stats.totalTips > 0 || stats.totalDiscount > 0) && (
            <div className="flex gap-3 text-xs">
              {stats.totalTips > 0 && <span className="text-muted-foreground">Tips: <span className="font-medium text-foreground">{formatNaira(stats.totalTips)}</span></span>}
              {stats.totalDiscount > 0 && <span className="text-muted-foreground">Discounts: <span className="font-medium text-foreground">-{formatNaira(stats.totalDiscount)}</span></span>}
            </div>
          )}

          {/* By payment method */}
          {methodEntries.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">By Payment Method</h4>
              <div className="space-y-2">
                {methodEntries.sort((a, b) => b[1] - a[1]).map(([method, amount]) => {
                  const meta = methodMeta[method];
                  const pct = maxMethod > 0 ? (amount / maxMethod) * 100 : 0;
                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 font-medium text-foreground">{meta.icon} {meta.label}</span>
                        <span className="font-semibold">{formatNaira(amount)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cash drawer */}
          <div className="space-y-2 border-t border-border pt-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cash Drawer</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Opening cash</span>
              <span className="font-medium">{formatNaira(currentShift.openingCash || 0)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expected cash</span>
              <span className="font-medium">{formatNaira(stats.expectedCash)}</span>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closing-cash" className="text-xs font-medium">Actual Closing Cash</Label>
              <Input
                id="closing-cash"
                type="number"
                min="0"
                placeholder="0.00"
                value={closingCash}
                onChange={e => setClosingCash(e.target.value)}
                className="h-9"
              />
            </div>
            {closingCash && (
              <div className={`flex justify-between text-sm font-medium ${cashVariance === 0 ? "text-primary" : cashVariance > 0 ? "text-primary" : "text-destructive"}`}>
                <span>Variance</span>
                <span>{cashVariance >= 0 ? "+" : ""}{formatNaira(cashVariance)}</span>
              </div>
            )}
          </div>

          {/* Warning for open orders */}
          {stats.openOrders > 0 && !confirmed && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              You have <strong>{stats.openOrders}</strong> open order{stats.openOrders > 1 ? "s" : ""}. Closing your shift will not void them.
            </div>
          )}
        </div>

        <DialogFooter className="px-5 pb-5 pt-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => { setConfirmed(false); onClose(); }}>Cancel</Button>
          {stats.openOrders > 0 && !confirmed ? (
            <Button size="sm" variant="destructive" onClick={() => setConfirmed(true)} className="gap-1.5">
              Continue Anyway
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={handleClose} className="gap-1.5">
              <StopCircle className="w-4 h-4" /> Close Shift
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
