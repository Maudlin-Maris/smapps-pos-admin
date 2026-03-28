import { useState } from "react";
import { usePOS } from "@/contexts/POSContext";
import type { ItemStatus } from "@/data/posData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle2, CookingPot, UtensilsCrossed, Bell, ArrowRight } from "lucide-react";

const itemStatusFlow: ItemStatus[] = ["open", "in_progress", "ready", "served"];

const itemStatusConfig: Record<ItemStatus, { label: string; color: string; bgColor: string; icon: React.ReactNode; nextLabel?: string }> = {
  open: { label: "New", color: "text-[hsl(var(--info))]", bgColor: "bg-[hsl(var(--info))]/10", icon: <Bell className="w-3 h-3" />, nextLabel: "Start" },
  in_progress: { label: "Preparing", color: "text-[hsl(var(--warning))]", bgColor: "bg-[hsl(var(--warning))]/10", icon: <CookingPot className="w-3 h-3" />, nextLabel: "Ready" },
  ready: { label: "Ready", color: "text-[hsl(var(--success))]", bgColor: "bg-[hsl(var(--success))]/10", icon: <CheckCircle2 className="w-3 h-3" />, nextLabel: "Served" },
  served: { label: "Served", color: "text-primary", bgColor: "bg-primary/10", icon: <UtensilsCrossed className="w-3 h-3" /> },
};

const orderBorderConfig: Record<string, string> = {
  open: "border-[hsl(var(--info))]/30",
  in_progress: "border-[hsl(var(--warning))]/30",
  ready: "border-[hsl(var(--success))]/30",
  served: "border-primary/30",
};

export default function KitchenDisplay() {
  const { orders, updateItemStatus } = usePOS();
  const [viewStatus, setViewStatus] = useState<string>("all");

  const kitchenOrders = orders.filter(o =>
    !["paid", "voided"].includes(o.status) &&
    (viewStatus === "all" || o.status === viewStatus)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleNextItem = (orderId: string, itemId: string, currentStatus: ItemStatus) => {
    const idx = itemStatusFlow.indexOf(currentStatus);
    if (idx >= 0 && idx < itemStatusFlow.length - 1) {
      updateItemStatus(orderId, itemId, itemStatusFlow[idx + 1]);
    }
  };

  const timeSince = (date: Date) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return "Now";
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h${mins % 60}m`;
  };

  // Count items by status across all kitchen orders
  const allKitchenOrders = orders.filter(o => !["paid", "voided"].includes(o.status));
  const allItems = allKitchenOrders.flatMap(o => o.items);
  const itemCounts: Record<string, number> = {
    open: allItems.filter(i => (i.itemStatus || "open") === "open").length,
    in_progress: allItems.filter(i => i.itemStatus === "in_progress").length,
    ready: allItems.filter(i => i.itemStatus === "ready").length,
    served: allItems.filter(i => i.itemStatus === "served").length,
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
            All ({allKitchenOrders.length})
          </button>
          {(["open", "in_progress", "ready", "served"] as const).map(s => {
            const cfg = itemStatusConfig[s];
            return (
              <button
                key={s}
                onClick={() => setViewStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${viewStatus === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {cfg.label}
                <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[10px]">
                  {itemCounts[s]}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
          {kitchenOrders.map(order => (
            <div key={order.id} className={`rounded-xl border-2 p-4 transition-all bg-card ${orderBorderConfig[order.status] || "border-border"}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-foreground">{order.orderNumber}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
                    <Clock className="w-3 h-3" /> {timeSince(order.createdAt)}
                  </p>
                </div>
              </div>

              {/* Customer/Table */}
              <div className="mb-3 text-xs text-muted-foreground">
                {order.tableNumber && <span className="font-medium text-foreground">{order.tableNumber} · </span>}
                <span className="capitalize">{order.type.replace("_", " ")}</span>
                {order.customerName && <span> · {order.customerName}</span>}
              </div>

              {/* Items with individual status */}
              <div className="space-y-2">
                {order.items.map(item => {
                  const status: ItemStatus = item.itemStatus || "open";
                  const cfg = itemStatusConfig[status];
                  return (
                    <div key={item.id} className={`rounded-lg p-2.5 border border-border/50 ${cfg.bgColor}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex gap-2 min-w-0 flex-1">
                          <span className="font-bold text-foreground shrink-0">{item.quantity}×</span>
                          <div className="min-w-0">
                            <span className="font-medium text-foreground text-sm">{item.productName}</span>
                            {item.variantName && <span className="text-muted-foreground text-xs"> ({item.variantName})</span>}
                            {item.extras.length > 0 && (
                              <p className="text-xs text-muted-foreground">+{item.extras.map(e => e.name).join(", ")}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] gap-0.5 shrink-0 ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </Badge>
                      </div>
                      {cfg.nextLabel && (
                        <Button
                          onClick={() => handleNextItem(order.id, item.id, status)}
                          size="sm"
                          variant="outline"
                          className="w-full h-7 text-xs gap-1 mt-2"
                        >
                          {cfg.nextLabel} <ArrowRight className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
