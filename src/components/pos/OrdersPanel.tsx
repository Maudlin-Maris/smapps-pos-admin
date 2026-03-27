import { useState } from "react";
import { usePOS } from "@/contexts/POSContext";
import { formatNaira } from "@/lib/currency";
import type { POSOrder, OrderStatus } from "@/data/posData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Clock, CheckCircle2, CookingPot, UtensilsCrossed, XCircle, CreditCard, Plus, Merge,
  ChevronRight, Receipt
} from "lucide-react";
import PaymentDialog from "./PaymentDialog";
import MergeOrderDialog from "./MergeOrderDialog";

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Open", color: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]", icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: "Preparing", color: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]", icon: <CookingPot className="w-3 h-3" /> },
  ready: { label: "Ready", color: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]", icon: <CheckCircle2 className="w-3 h-3" /> },
  served: { label: "Served", color: "bg-primary/10 text-primary", icon: <UtensilsCrossed className="w-3 h-3" /> },
  paid: { label: "Paid", color: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]", icon: <CreditCard className="w-3 h-3" /> },
  voided: { label: "Voided", color: "bg-destructive/10 text-destructive", icon: <XCircle className="w-3 h-3" /> },
};

export default function OrdersPanel() {
  const { orders, updateOrderStatus, cart, addItemsToOrder, clearCart } = usePOS();
  const [filter, setFilter] = useState<string>("active");
  const [selectedOrder, setSelectedOrder] = useState<POSOrder | null>(null);
  const [payOrderId, setPayOrderId] = useState<string | null>(null);
  const [showMerge, setShowMerge] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);

  const filtered = orders.filter(o => {
    if (filter === "active") return !["paid", "voided"].includes(o.status);
    if (filter === "paid") return o.status === "paid";
    if (filter === "unpaid") return o.status !== "paid" && o.status !== "voided" && o.paidAmount < o.totalAmount;
    return true;
  });

  const handleAddItemsToOrder = (orderId: string) => {
    if (cart.length === 0) return;
    addItemsToOrder(orderId, cart);
    clearCart();
    setSelectedOrder(null);
  };

  const timeSince = (date: Date) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter */}
      <div className="p-3 border-b border-border">
        <div className="flex gap-1.5">
          {[
            { id: "active", label: "Active" },
            { id: "unpaid", label: "Unpaid" },
            { id: "paid", label: "Paid" },
            { id: "all", label: "All" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {filtered.map(order => {
            const sc = statusConfig[order.status];
            return (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="w-full text-left p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{order.orderNumber}</span>
                      <Badge variant="outline" className={`text-[10px] gap-1 ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.customerName || order.type.replace("_", " ")}
                      {order.tableNumber && ` · ${order.tableNumber}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatNaira(order.totalAmount)}</p>
                    <p className="text-[10px] text-muted-foreground">{timeSince(order.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <span>{order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
                  {order.paidAmount > 0 && order.paidAmount < order.totalAmount && (
                    <Badge variant="outline" className="text-[10px] text-[hsl(var(--warning))]">Partial</Badge>
                  )}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No orders</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={o => !o && setSelectedOrder(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selectedOrder && (() => {
            const sc = statusConfig[selectedOrder.status];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedOrder.orderNumber}
                    <Badge variant="outline" className={`text-xs gap-1 ${sc.color}`}>{sc.icon} {sc.label}</Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Info */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Type</p>
                      <p className="font-medium capitalize">{selectedOrder.type.replace("_", " ")}</p>
                    </div>
                    {selectedOrder.tableNumber && (
                      <div>
                        <p className="text-muted-foreground text-xs">Table</p>
                        <p className="font-medium">{selectedOrder.tableNumber}</p>
                      </div>
                    )}
                    {selectedOrder.customerName && (
                      <div>
                        <p className="text-muted-foreground text-xs">Customer</p>
                        <p className="font-medium">{selectedOrder.customerName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground text-xs">Created</p>
                      <p className="font-medium">{timeSince(selectedOrder.createdAt)}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Items</p>
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="flex justify-between py-1.5 text-sm border-b border-border/50 last:border-0">
                        <div>
                          <span>{item.quantity}× {item.productName}</span>
                          {item.variantName && <span className="text-muted-foreground"> ({item.variantName})</span>}
                          {item.extras.length > 0 && (
                            <p className="text-xs text-muted-foreground">+{item.extras.map(e => e.name).join(", ")}</p>
                          )}
                        </div>
                        <span className="font-medium shrink-0">${item.totalPrice.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 text-sm font-bold">
                      <span>Total</span>
                      <span>${selectedOrder.totalAmount.toFixed(2)}</span>
                    </div>
                    {selectedOrder.paidAmount > 0 && (
                      <div className="flex justify-between text-sm text-[hsl(var(--success))]">
                        <span>Paid</span>
                        <span>${selectedOrder.paidAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Payments */}
                  {selectedOrder.payments.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Payments</p>
                      {selectedOrder.payments.map((p, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="capitalize">{p.method}</span>
                          <span>${p.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Status change */}
                  {selectedOrder.status !== "paid" && selectedOrder.status !== "voided" && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Update Status</p>
                      <Select value={selectedOrder.status} onValueChange={v => {
                        updateOrderStatus(selectedOrder.id, v as OrderStatus);
                        setSelectedOrder({ ...selectedOrder, status: v as OrderStatus });
                      }}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">Preparing</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="served">Served</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.status !== "paid" && selectedOrder.status !== "voided" && (
                      <>
                        {selectedOrder.paidAmount < selectedOrder.totalAmount && (
                          <Button size="sm" onClick={() => { setSelectedOrder(null); setPayOrderId(selectedOrder.id); }}>
                            <CreditCard className="w-4 h-4 mr-1" /> Pay
                          </Button>
                        )}
                        {cart.length > 0 && (
                          <Button size="sm" variant="outline" onClick={() => handleAddItemsToOrder(selectedOrder.id)}>
                            <Plus className="w-4 h-4 mr-1" /> Add Cart Items
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => { setMergeSourceId(selectedOrder.id); setShowMerge(true); setSelectedOrder(null); }}>
                          <Merge className="w-4 h-4 mr-1" /> Merge
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => window.print()}>
                      <Receipt className="w-4 h-4 mr-1" /> Print
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Payment dialog for existing order */}
      <PaymentDialog open={!!payOrderId} onClose={() => setPayOrderId(null)} existingOrderId={payOrderId || undefined} />

      {/* Merge dialog */}
      <MergeOrderDialog open={showMerge} onClose={() => { setShowMerge(false); setMergeSourceId(null); }} sourceOrderId={mergeSourceId} />
    </div>
  );
}
