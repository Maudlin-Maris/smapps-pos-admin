import { useState } from "react";
import { usePOS } from "@/contexts/POSContext";
import type { OrderStatus } from "@/data/posData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, CookingPot, UtensilsCrossed, Bell, ArrowRight } from "lucide-react";

const kdsStatusFlow: OrderStatus[] = ["open", "in_progress", "ready", "served"];

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode; nextLabel?: string }> = {
  open: { label: "New", color: "text-[hsl(var(--info))]", bgColor: "bg-[hsl(var(--info))]/10 border-[hsl(var(--info))]/20", icon: <Bell className="w-4 h-4" />, nextLabel: "Start Preparing" },
  in_progress: { label: "Preparing", color: "text-[hsl(var(--warning))]", bgColor: "bg-[hsl(var(--warning))]/10 border-[hsl(var(--warning))]/20", icon: <CookingPot className="w-4 h-4" />, nextLabel: "Mark Ready" },
  ready: { label: "Ready", color: "text-[hsl(var(--success))]", bgColor: "bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/20", icon: <CheckCircle2 className="w-4 h-4" />, nextLabel: "Mark Served" },
  served: { label: "Served", color: "text-primary", bgColor: "bg-primary/10 border-primary/20", icon: <UtensilsCrossed className="w-4 h-4" /> },
};

export default function KitchenDisplay() {
  const { orders, updateOrderStatus } = usePOS();
  const [viewStatus, setViewStatus] = useState<string>("all");

  const kitchenOrders = orders.filter(o =>
    !["paid", "voided"].includes(o.status) &&
    (viewStatus === "all" || o.status === viewStatus)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleNext = (orderId: string, currentStatus: OrderStatus) => {
    const idx = kdsStatusFlow.indexOf(currentStatus);
    if (idx >= 0 && idx < kdsStatusFlow.length - 1) {
      updateOrderStatus(orderId, kdsStatusFlow[idx + 1]);
    }
  };

  const timeSince = (date: Date) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return "Now";
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h${mins % 60}m`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Status filter */}
      <div className="p-3 border-b border-border">
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setViewStatus("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewStatus === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            All ({orders.filter(o => !["paid", "voided"].includes(o.status)).length})
          </button>
          {["open", "in_progress", "ready", "served"].map(s => {
            const count = orders.filter(o => o.status === s).length;
            const cfg = statusConfig[s];
            return (
              <button
                key={s}
                onClick={() => setViewStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
          {kitchenOrders.map(order => {
            const cfg = statusConfig[order.status] || statusConfig.open;
            return (
              <div key={order.id} className={`rounded-xl border-2 p-4 transition-all ${cfg.bgColor}`}>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`${cfg.color}`}>{cfg.icon}</span>
                    <span className="font-bold text-lg text-foreground">{order.orderNumber}</span>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-0.5 justify-end">
                      <Clock className="w-3 h-3" /> {timeSince(order.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Customer/Table */}
                <div className="mb-2 text-xs text-muted-foreground">
                  {order.tableNumber && <span className="font-medium text-foreground">{order.tableNumber} · </span>}
                  <span className="capitalize">{order.type.replace("_", " ")}</span>
                  {order.customerName && <span> · {order.customerName}</span>}
                </div>

                {/* Items */}
                <div className="space-y-1 mb-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex gap-2 text-sm">
                      <span className="font-bold text-foreground shrink-0">{item.quantity}×</span>
                      <div className="min-w-0">
                        <span className="font-medium text-foreground">{item.productName}</span>
                        {item.variantName && <span className="text-muted-foreground"> ({item.variantName})</span>}
                        {item.extras.length > 0 && (
                          <p className="text-xs text-muted-foreground">+{item.extras.map(e => e.name).join(", ")}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Next action */}
                {cfg.nextLabel && (
                  <Button
                    onClick={() => handleNext(order.id, order.status as OrderStatus)}
                    size="sm"
                    className="w-full h-9 gap-1"
                  >
                    {cfg.nextLabel} <ArrowRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        {kitchenOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CheckCircle2 className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs">No pending orders</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
