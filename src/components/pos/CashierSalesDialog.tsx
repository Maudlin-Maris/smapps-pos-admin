import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePOS } from "@/contexts/POSContext";
import { formatNaira } from "@/lib/currency";
import type { PaymentMethod } from "@/data/posData";
import { Banknote, CreditCard, Smartphone, ArrowRightLeft, ShoppingBag, TrendingUp, Receipt } from "lucide-react";

const methodMeta: Record<PaymentMethod, { label: string; icon: React.ReactNode; color: string }> = {
  cash: { label: "Cash", icon: <Banknote className="w-4 h-4" />, color: "text-emerald-600" },
  card: { label: "Card", icon: <CreditCard className="w-4 h-4" />, color: "text-blue-600" },
  mobile: { label: "Mobile", icon: <Smartphone className="w-4 h-4" />, color: "text-violet-600" },
  transfer: { label: "Transfer", icon: <ArrowRightLeft className="w-4 h-4" />, color: "text-amber-600" },
};

export default function CashierSalesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { orders, currentCashier, currentOutlet } = usePOS();

  const stats = useMemo(() => {
    if (!currentCashier) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const myOrders = orders.filter(o => {
      const created = new Date(o.createdAt);
      created.setHours(0, 0, 0, 0);
      return o.cashierId === currentCashier.id && created.getTime() === today.getTime() && o.status !== "voided";
    });

    const paidOrders = myOrders.filter(o => o.status === "paid");
    const totalRevenue = paidOrders.reduce((s, o) => s + o.paidAmount, 0);
    const totalItems = paidOrders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0);
    const totalTips = paidOrders.reduce((s, o) => s + (o.tipAmount || 0), 0);
    const totalDiscount = paidOrders.reduce((s, o) => s + (o.discountAmount || 0), 0);

    const byMethod: Record<PaymentMethod, number> = { cash: 0, card: 0, mobile: 0, transfer: 0 };
    paidOrders.forEach(o => o.payments.forEach(p => {
      byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
    }));

    const openOrders = myOrders.filter(o => o.status !== "paid").length;

    return { totalRevenue, paidCount: paidOrders.length, totalItems, totalTips, totalDiscount, byMethod, openOrders, totalOrders: myOrders.length };
  }, [orders, currentCashier]);

  if (!stats) return null;

  const methodEntries = (Object.entries(stats.byMethod) as [PaymentMethod, number][]).filter(([, v]) => v > 0);
  const maxMethod = methodEntries.length > 0 ? Math.max(...methodEntries.map(([, v]) => v)) : 1;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-semibold">Today's Sales</DialogTitle>
          <p className="text-xs text-muted-foreground">{currentCashier?.name} · {currentOutlet?.name}</p>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* Summary cards */}
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
              {stats.totalTips > 0 && (
                <span className="text-muted-foreground">Tips: <span className="font-medium text-foreground">{formatNaira(stats.totalTips)}</span></span>
              )}
              {stats.totalDiscount > 0 && (
                <span className="text-muted-foreground">Discounts: <span className="font-medium text-foreground">-{formatNaira(stats.totalDiscount)}</span></span>
              )}
            </div>
          )}

          {/* By payment method */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">By Payment Method</h4>
            {methodEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No payments recorded yet</p>
            ) : (
              <div className="space-y-2.5">
                {methodEntries.sort((a, b) => b[1] - a[1]).map(([method, amount]) => {
                  const meta = methodMeta[method];
                  const pct = maxMethod > 0 ? (amount / maxMethod) * 100 : 0;
                  return (
                    <div key={method} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className={`flex items-center gap-1.5 font-medium ${meta.color}`}>
                          {meta.icon} {meta.label}
                        </span>
                        <span className="font-semibold">{formatNaira(amount)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
