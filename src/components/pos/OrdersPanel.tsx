import { useState, useMemo } from "react";
import { usePOS } from "@/contexts/POSContext";
import AddItemsToOrderDialog from "./AddItemsToOrderDialog";
import { formatNaira } from "@/lib/currency";
import { getFeatures } from "@/data/businessTypes";
import type { POSOrder, OrderStatus, ItemStatus } from "@/data/posData";
import { posLocations, posCashiers } from "@/data/posData";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Clock, CheckCircle2, CookingPot, UtensilsCrossed, XCircle, CreditCard, Plus, Merge,
  Receipt, Printer, ChefHat, Search, MapPin, User, ArrowDownLeft, ListOrdered, LayoutList,
  ChevronLeft, Users, ArrowRightLeft, Package, Scissors, ShoppingBag, Pill, Bell, ArrowRight, Trash2
} from "lucide-react";
import RemoveItemAuthDialog from "./RemoveItemAuthDialog";
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
type PaymentFilter = "all" | "paid" | "unpaid" | "incomplete";

type LocationPaymentStatus = "paid" | "unpaid" | "partial";

interface LocationSummary {
  locationName: string;
  orderCount: number;
  totalValue: number;
  staffNames: string[];
  paymentStatus: LocationPaymentStatus;
}

export default function OrdersPanel() {
  const { orders, updateOrderStatus, updateItemStatus, removeItemFromOrder, cart, addItemsToOrder, clearCart, currentCashier, currentOutlet, transferOrder } = usePOS();
  const [group, setGroup] = useState<OrderGroup>("my_orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [selectedLocationName, setSelectedLocationName] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<POSOrder | null>(null);
  const [payOrderId, setPayOrderId] = useState<string | null>(null);
  const [showMerge, setShowMerge] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);
  const [printOrder, setPrintOrder] = useState<POSOrder | null>(null);
  const [transferTarget, setTransferTarget] = useState<string>("");
  const [addItemsOrderId, setAddItemsOrderId] = useState<string | null>(null);
  const [removeAuth, setRemoveAuth] = useState<{ orderId: string; itemId: string; itemName: string } | null>(null);
  const cashierId = currentCashier?.id || "";
  const features = currentOutlet ? getFeatures(currentOutlet.businessType) : null;
  const hasLocations = features?.hasDineIn || features?.hasAppointments;
  const hasKitchenStatuses = features?.hasMenu || features?.hasDineIn;

  // Compute groups
  const myOrders = useMemo(() => orders.filter(o => o.cashierId === cashierId), [orders, cashierId]);
  const transferredOrders = useMemo(() => orders.filter(o => o.transferredToCashierId === cashierId && o.cashierId !== cashierId), [orders, cashierId]);
  const queuedOrders = useMemo(() => orders.filter(o => o.status === "open" && o.cashierId !== cashierId && o.transferredToCashierId !== cashierId), [orders, cashierId]);

  // Location summaries — only locations with orders
  const locationSummaries = useMemo<LocationSummary[]>(() => {
    const map = new Map<string, { orderCount: number; totalValue: number; totalPaid: number; cashierIds: Set<string> }>();
    orders.forEach(o => {
      const loc = o.locationName || "No Location";
      if (!map.has(loc)) map.set(loc, { orderCount: 0, totalValue: 0, totalPaid: 0, cashierIds: new Set() });
      const entry = map.get(loc)!;
      entry.orderCount++;
      entry.totalValue += o.totalAmount;
      entry.totalPaid += o.paidAmount;
      entry.cashierIds.add(o.cashierId);
    });
    return Array.from(map.entries()).map(([locationName, data]) => {
      const paymentStatus: LocationPaymentStatus =
        data.totalPaid >= data.totalValue ? "paid"
        : data.totalPaid > 0 ? "partial"
        : "unpaid";
      return {
        locationName,
        orderCount: data.orderCount,
        totalValue: data.totalValue,
        staffNames: Array.from(data.cashierIds).map(id => {
          const c = posCashiers.find(c => c.id === id);
          return c ? c.name : "Unknown";
        }),
        paymentStatus,
      };
    }).sort((a, b) => b.totalValue - a.totalValue);
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

  // Apply search + payment filter
  const filtered = useMemo(() => {
    let list = baseList;
    // Payment filter
    if (paymentFilter === "paid") {
      list = list.filter(o => o.status === "paid");
    } else if (paymentFilter === "unpaid") {
      list = list.filter(o => o.paidAmount === 0 && o.status !== "paid" && o.status !== "voided");
    } else if (paymentFilter === "incomplete") {
      list = list.filter(o => o.paidAmount > 0 && o.paidAmount < o.totalAmount && o.status !== "paid");
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [baseList, searchQuery, paymentFilter]);

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
    ...(hasLocations ? [{ id: "by_location" as OrderGroup, label: "By Location", icon: <MapPin className="w-3.5 h-3.5" /> }] : []),
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
              onClick={() => { setGroup(g.id); setSelectedLocationName(null); setPaymentFilter("all"); }}
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

        {/* Search & payment filter (hidden on location cards view) */}
        {!showLocationCards && (
          <>
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
            <div className="flex gap-1">
              {([
                { id: "all", label: "All" },
                { id: "paid", label: "Paid" },
                { id: "unpaid", label: "Unpaid" },
                { id: "incomplete", label: "Incomplete" },
              ] as { id: PaymentFilter; label: string }[]).map(f => (
                <button
                  key={f.id}
                  onClick={() => setPaymentFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    paymentFilter === f.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <ScrollArea className="flex-1">
        {showLocationCards ? (
          /* Location summary cards - responsive grid */
          <div className="p-3 space-y-3">
            {/* Color legend */}
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground px-1">
              <span className="font-medium text-foreground text-xs">Legend:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--success))]" />
                Paid
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--warning))]" />
                Incomplete
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                Unpaid
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {locationSummaries.map(loc => {
                const borderColor = loc.paymentStatus === "paid"
                  ? "border-l-[hsl(var(--success))] hover:border-[hsl(var(--success))]/40"
                  : loc.paymentStatus === "partial"
                  ? "border-l-[hsl(var(--warning))] hover:border-[hsl(var(--warning))]/40"
                  : "border-l-destructive hover:border-destructive/40";
                const iconBg = loc.paymentStatus === "paid"
                  ? "bg-[hsl(var(--success))]/10"
                  : loc.paymentStatus === "partial"
                  ? "bg-[hsl(var(--warning))]/10"
                  : "bg-destructive/10";
                const iconColor = loc.paymentStatus === "paid"
                  ? "text-[hsl(var(--success))]"
                  : loc.paymentStatus === "partial"
                  ? "text-[hsl(var(--warning))]"
                  : "text-destructive";
                return (
                  <button
                    key={loc.locationName}
                    onClick={() => setSelectedLocationName(loc.locationName)}
                    className={`text-left p-4 rounded-xl border border-border border-l-4 bg-card hover:shadow-md transition-all ${borderColor}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                          <MapPin className={`w-4 h-4 ${iconColor}`} />
                        </div>
                        <span className="font-semibold text-xs text-foreground truncate">{loc.locationName}</span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-foreground mb-1">{formatNaira(loc.totalValue)}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {loc.orderCount} order{loc.orderCount !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Users className="w-3 h-3 shrink-0" />
                      <span className="truncate">{loc.staffNames.join(", ")}</span>
                    </div>
                  </button>
                );
              })}
              {locationSummaries.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No orders at any location</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Order list */
          <div className="p-2 space-y-1.5">
            {filtered.map(order => {
              const paymentStatus = order.status === "voided"
                ? { label: "Voided", className: "bg-destructive/10 text-destructive" }
                : order.paidAmount >= order.totalAmount || order.status === "paid"
                ? { label: "Paid", className: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" }
                : order.paidAmount > 0
                ? { label: "Partial", className: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]" }
                : { label: "Unpaid", className: "bg-muted text-muted-foreground" };
              const cashierName = posCashiers.find(c => c.id === order.cashierId)?.name || "Unknown";
              const orderTypeLabel = order.type.replace("_", " ");
              // Business-type-aware location label
              const locationLabel = features?.hasAppointments ? "Station" : features?.hasDineIn ? "Table" : null;
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left p-3 rounded-xl border border-border bg-card hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{order.orderNumber}</span>
                        <Badge variant="outline" className={`text-[10px] gap-1 ${paymentStatus.className}`}>
                          <CreditCard className="w-2.5 h-2.5" /> {paymentStatus.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {orderTypeLabel}
                        </Badge>
                        {hasKitchenStatuses && order.status !== "paid" && order.status !== "voided" && (() => {
                          const items = order.items;
                          const counts = {
                            open: items.filter(i => (i.itemStatus || "open") === "open").length,
                            in_progress: items.filter(i => i.itemStatus === "in_progress").length,
                            ready: items.filter(i => i.itemStatus === "ready").length,
                            served: items.filter(i => i.itemStatus === "served").length,
                          };
                          return (
                            <span className="flex items-center gap-1">
                              {counts.open > 0 && <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-[hsl(var(--info))]/10 text-[hsl(var(--info))]"><Bell className="w-2.5 h-2.5" />{counts.open}</span>}
                              {counts.in_progress > 0 && <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]"><CookingPot className="w-2.5 h-2.5" />{counts.in_progress}</span>}
                              {counts.ready > 0 && <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"><CheckCircle2 className="w-2.5 h-2.5" />{counts.ready}</span>}
                              {counts.served > 0 && <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary"><UtensilsCrossed className="w-2.5 h-2.5" />{counts.served}</span>}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {order.customerName || orderTypeLabel}
                        {order.tableNumber && ` · ${order.tableNumber}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{formatNaira(order.totalAmount)}</p>
                      <p className="text-[10px] text-muted-foreground">{timeSince(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-0.5">
                      <User className="w-3 h-3" /> {cashierName}
                    </span>
                    <span>·</span>
                    <span>{order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
                    {order.locationName && locationLabel && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> {order.locationName}
                        </span>
                      </>
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
                    {selectedOrder.tableNumber && features?.hasDineIn && (
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
                    {selectedOrder.locationName && hasLocations && (
                      <div>
                        <p className="text-muted-foreground text-xs">{features?.hasAppointments ? "Station" : "Location"}</p>
                        <p className="font-medium">{selectedOrder.locationName}</p>
                      </div>
                    )}
                  </div>

                  {/* Items */}
                  <div className="space-y-1">
                    {hasKitchenStatuses && selectedOrder.status !== "paid" && selectedOrder.status !== "voided" && (
                      <div className="flex gap-1 mb-1">
                        <Select
                          onValueChange={(val: ItemStatus) => {
                            selectedOrder.items.forEach(item => {
                              updateItemStatus(selectedOrder.id, item.id, val);
                            });
                            setSelectedOrder(prev => prev ? {
                              ...prev,
                              items: prev.items.map(i => ({ ...i, itemStatus: val }))
                            } : null);
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs flex-1">
                            <SelectValue placeholder="Set all items to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(["open", "in_progress", "ready", "served"] as ItemStatus[]).map(s => {
                              const cfg = { open: "New", in_progress: "Preparing", ready: "Ready", served: "Served" };
                              return <SelectItem key={s} value={s} className="text-xs">{cfg[s]}</SelectItem>;
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <p className="text-sm font-semibold">Items</p>
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="flex justify-between py-1.5 text-sm border-b border-border/50 last:border-0">
                        <div className="flex-1">
                          <span>{item.quantity}× {item.productName}</span>
                          {item.variantName && <span className="text-muted-foreground"> ({item.variantName})</span>}
                          {item.extras.length > 0 && (
                            <p className="text-xs text-muted-foreground">+{item.extras.map(e => e.name).join(", ")}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {hasKitchenStatuses && selectedOrder.status !== "paid" && selectedOrder.status !== "voided" && (() => {
                            const status: ItemStatus = item.itemStatus || "open";
                            return (
                              <Select
                                value={status}
                                onValueChange={(val: ItemStatus) => {
                                  updateItemStatus(selectedOrder.id, item.id, val);
                                  setSelectedOrder(prev => prev ? {
                                    ...prev,
                                    items: prev.items.map(i => i.id === item.id ? { ...i, itemStatus: val } : i)
                                  } : null);
                                }}
                              >
                                <SelectTrigger className="h-6 w-[100px] text-[10px] px-2 gap-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(["open", "in_progress", "ready", "served"] as ItemStatus[]).map(s => {
                                    const cfg = statusConfig[s as OrderStatus];
                                    return (
                                      <SelectItem key={s} value={s} className="text-xs">
                                        <span className={`flex items-center gap-1.5 ${cfg?.color || ""}`}>
                                          {cfg?.icon} {cfg?.label}
                                        </span>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            );
                          })()}
                          <span className="font-medium">{formatNaira(item.totalPrice)}</span>
                        </div>
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

                  {/* Status change — only for non-kitchen business types (status is auto-derived for restaurants) */}
                  {selectedOrder.status !== "paid" && selectedOrder.status !== "voided" && !hasKitchenStatuses && (
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
                          {features?.hasAppointments && (
                            <SelectItem value="in_progress">In Progress</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Transfer to another cashier */}
                  {selectedOrder.status !== "paid" && selectedOrder.status !== "voided" && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold flex items-center gap-1.5">
                        <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer Order
                      </p>
                      <div className="flex gap-2">
                        <Select value={transferTarget} onValueChange={setTransferTarget}>
                          <SelectTrigger className="h-9 flex-1">
                            <SelectValue placeholder="Select cashier..." />
                          </SelectTrigger>
                          <SelectContent>
                            {posCashiers
                              .filter(c => c.id !== selectedOrder.cashierId)
                              .map(c => {
                                const activeCount = orders.filter(o => 
                                  !["paid", "voided"].includes(o.status) && 
                                  (o.cashierId === c.id || o.transferredToCashierId === c.id)
                                ).length;
                                return (
                                  <SelectItem key={c.id} value={c.id}>
                                    <span className="flex items-center justify-between gap-2 w-full">
                                      {c.name}
                                      <Badge variant="secondary" className="h-4 min-w-[16px] px-1 text-[10px]">{activeCount}</Badge>
                                    </span>
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!transferTarget}
                          onClick={() => {
                            if (transferTarget) {
                              transferOrder(selectedOrder.id, transferTarget);
                              setSelectedOrder({ ...selectedOrder, transferredToCashierId: transferTarget });
                              setTransferTarget("");
                            }
                          }}
                        >
                          Transfer
                        </Button>
                      </div>
                      {selectedOrder.transferredToCashierId && (
                        <p className="text-xs text-muted-foreground">
                          Currently transferred to: <span className="font-medium text-foreground">
                            {posCashiers.find(c => c.id === selectedOrder.transferredToCashierId)?.name || "Unknown"}
                          </span>
                        </p>
                      )}
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
                        <Button size="sm" variant="outline" onClick={() => { setAddItemsOrderId(selectedOrder.id); setSelectedOrder(null); }}>
                          <Plus className="w-4 h-4 mr-1" /> Add / Remove Items
                        </Button>
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

      {/* Add items to order dialog */}
      <AddItemsToOrderDialog
        open={!!addItemsOrderId}
        onClose={() => setAddItemsOrderId(null)}
        onBackToOrder={() => {
          const order = orders.find(o => o.id === addItemsOrderId);
          if (order) setSelectedOrder(order);
        }}
        orderId={addItemsOrderId || ""}
      />

      {/* Auth dialog for removing items from order detail */}
      <RemoveItemAuthDialog
        open={!!removeAuth}
        onClose={() => setRemoveAuth(null)}
        onAuthorized={() => {
          if (!removeAuth) return;
          removeItemFromOrder(removeAuth.orderId, removeAuth.itemId);
          // Update selectedOrder state
          setSelectedOrder(prev => {
            if (!prev) return null;
            const newItems = prev.items.filter(i => i.id !== removeAuth.itemId);
            if (newItems.length === 0) return null;
            const newTotal = newItems.reduce((s, i) => s + i.totalPrice, 0) - (prev.discountAmount || 0) + (prev.feesTotal || 0);
            return { ...prev, items: newItems, totalAmount: newTotal };
          });
          setRemoveAuth(null);
        }}
        itemName={removeAuth?.itemName || ""}
      />
    </div>
  );
}
