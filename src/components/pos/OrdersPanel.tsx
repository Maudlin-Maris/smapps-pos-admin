import { useState, useMemo } from "react";
import { usePOS } from "@/contexts/POSContext";
import { formatNaira } from "@/lib/currency";
import type { POSOrder, OrderStatus } from "@/data/posData";
import { posLocations, posCashiers } from "@/data/posData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// Select removed — location is now a tab with drill-down
import {
  Clock, CheckCircle2, CookingPot, UtensilsCrossed, XCircle, CreditCard, Plus, Merge,
  Receipt, Printer, ChefHat, Search, MapPin, User, ArrowDownLeft, ListOrdered, LayoutList,
  ChevronLeft, Users
} from "lucide-react";
import PaymentDialog from "./PaymentDialog";
import MergeOrderDialog from "./MergeOrderDialog";
import PrintReceiptDialog from "./PrintReceiptDialog";

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Open", color: "bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]", icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: "Preparing", color: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]", icon: <CookingPot className="w-3 h-3" /> },
  ready: { label: "Ready", color: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]", icon: <CheckCircle2 className="w-3 h-3" /> },
  served: { label: "Served", color: "bg-primary/10 text-primary", icon: <UtensilsCrossed className="w-3 h-3" /> },
  paid: { label: "Paid", color: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]", icon: <CreditCard className="w-3 h-3" /> },
  voided: { label: "Voided", color: "bg-destructive/10 text-destructive", icon: <XCircle className="w-3 h-3" /> },
};

type OrderGroup = "my_orders" | "transferred" | "queued" | "all" | "by_location";

interface LocationSummary {
  locationName: string;
  orderCount: number;
  totalValue: number;
  staffNames: string[];
}

export default function OrdersPanel() {
  const { orders, updateOrderStatus, cart, addItemsToOrder, clearCart, currentCashier, currentOutlet } = usePOS();
  const [group, setGroup] = useState<OrderGroup>("my_orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocationName, setSelectedLocationName] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<POSOrder | null>(null);
  const [payOrderId, setPayOrderId] = useState<string | null>(null);
  const [showMerge, setShowMerge] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);
  const [printOrder, setPrintOrder] = useState<POSOrder | null>(null);

  const cashierId = currentCashier?.id || "";

  // Compute groups
  const myOrders = useMemo(() => orders.filter(o => o.cashierId === cashierId), [orders, cashierId]);
  const transferredOrders = useMemo(() => orders.filter(o => o.transferredToCashierId === cashierId && o.cashierId !== cashierId), [orders, cashierId]);
  const queuedOrders = useMemo(() => orders.filter(o => o.status === "open" && o.cashierId !== cashierId && o.transferredToCashierId !== cashierId), [orders, cashierId]);

  // Location summaries — only locations with orders
  const locationSummaries = useMemo<LocationSummary[]>(() => {
    const map = new Map<string, { orderCount: number; totalValue: number; cashierIds: Set<string> }>();
    orders.forEach(o => {
      const loc = o.locationName || "No Location";
      if (!map.has(loc)) map.set(loc, { orderCount: 0, totalValue: 0, cashierIds: new Set() });
      const entry = map.get(loc)!;
      entry.orderCount++;
      entry.totalValue += o.totalAmount;
      entry.cashierIds.add(o.cashierId);
    });
    return Array.from(map.entries()).map(([locationName, data]) => ({
      locationName,
      orderCount: data.orderCount,
      totalValue: data.totalValue,
      staffNames: Array.from(data.cashierIds).map(id => {
        const c = posCashiers.find(c => c.id === id);
        return c ? c.name : "Unknown";
      }),
    })).sort((a, b) => b.totalValue - a.totalValue);
  }, [orders]);

  const groupCounts: Record<OrderGroup, number> = {
    my_orders: myOrders.length,
    transferred: transferredOrders.length,
    queued: queuedOrders.length,
    all: orders.length,
    by_location: locationSummaries.length,
  };

  // Get base list for selected group
  const baseList = useMemo(() => {
    switch (group) {
      case "my_orders": return myOrders;
      case "transferred": return transferredOrders;
      case "queued": return queuedOrders;
      case "by_location":
        if (selectedLocationName) {
          return orders.filter(o => (o.locationName || "No Location") === selectedLocationName);
        }
        return [];
      case "all": return orders;
    }
  }, [group, myOrders, transferredOrders, queuedOrders, orders, selectedLocationName]);

  // Apply search filter
  const filtered = useMemo(() => {
    let list = baseList;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [baseList, searchQuery]);

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

  const groups: { id: OrderGroup; label: string; icon: React.ReactNode }[] = [
    { id: "my_orders", label: "My Orders", icon: <User className="w-3.5 h-3.5" /> },
    { id: "transferred", label: "Transferred", icon: <ArrowDownLeft className="w-3.5 h-3.5" /> },
    { id: "queued", label: "Queued", icon: <ListOrdered className="w-3.5 h-3.5" /> },
    { id: "by_location", label: "By Location", icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: "all", label: "All Orders", icon: <LayoutList className="w-3.5 h-3.5" /> },
  ];

  const showLocationCards = group === "by_location" && !selectedLocationName;

  return (
    <div className="flex flex-col h-full">
      {/* Group tabs */}
      <div className="p-3 border-b border-border space-y-2.5">
        <div className="flex gap-1 overflow-x-auto">
          {groups.map(g => (
            <button
              key={g.id}
              onClick={() => { setGroup(g.id); setSelectedLocationName(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                group === g.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {g.icon}
              {g.label}
              <Badge variant="secondary" className={`ml-0.5 h-4 min-w-[16px] px-1 text-[10px] font-bold ${
                group === g.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background"
              }`}>
                {groupCounts[g.id]}
              </Badge>
            </button>
          ))}
        </div>

        {/* Back button when drilling into a location */}
        {group === "by_location" && selectedLocationName && (
          <button
            onClick={() => setSelectedLocationName(null)}
            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Back to locations · <MapPin className="w-3 h-3" /> {selectedLocationName}
          </button>
        )}

        {/* Search (hidden on location cards view) */}
        {!showLocationCards && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search order #..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {showLocationCards ? (
          /* Location summary cards */
          <div className="p-2 space-y-1.5">
            {locationSummaries.map(loc => (
              <button
                key={loc.locationName}
                onClick={() => setSelectedLocationName(loc.locationName)}
                className="w-full text-left p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-semibold text-sm text-foreground">{loc.locationName}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{loc.staffNames.join(", ")}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{formatNaira(loc.totalValue)}</p>
                    <Badge variant="secondary" className="text-[10px] mt-1">
                      {loc.orderCount} order{loc.orderCount !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
            {locationSummaries.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No orders at any location</p>
              </div>
            )}
          </div>
        ) : (
          /* Order list */
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
                    {order.locationName && (
                      <span className="flex items-center gap-0.5 ml-1">
                        <MapPin className="w-3 h-3" /> {order.locationName}
                      </span>
                    )}
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
        )}
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
                    {selectedOrder.locationName && (
                      <div>
                        <p className="text-muted-foreground text-xs">Location</p>
                        <p className="font-medium">{selectedOrder.locationName}</p>
                      </div>
                    )}
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
                        <span className="font-medium shrink-0">{formatNaira(item.totalPrice)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 text-sm font-bold">
                      <span>Total</span>
                      <span>{formatNaira(selectedOrder.totalAmount)}</span>
                    </div>
                    {selectedOrder.paidAmount > 0 && (
                      <div className="flex justify-between text-sm text-[hsl(var(--success))]">
                        <span>Paid</span>
                        <span>{formatNaira(selectedOrder.paidAmount)}</span>
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
                          <span>{formatNaira(p.amount)}</span>
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
                    <Button size="sm" variant="outline" onClick={() => { setPrintOrder(selectedOrder); setSelectedOrder(null); }}>
                      <Printer className="w-4 h-4 mr-1" /> Receipt
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setPrintOrder(selectedOrder); setSelectedOrder(null); }}>
                      <ChefHat className="w-4 h-4 mr-1" /> Docket
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

      {/* Print Receipt/Docket dialog */}
      <PrintReceiptDialog open={!!printOrder} onClose={() => setPrintOrder(null)} order={printOrder} />
    </div>
  );
}
