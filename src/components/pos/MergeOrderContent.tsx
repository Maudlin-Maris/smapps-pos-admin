import { useState, useMemo } from "react";
import { usePOS } from "@/contexts/POSContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { formatNaira } from "@/lib/currency";
import { Merge, ChevronLeft, Minus, Plus, AlertTriangle, Check } from "lucide-react";
import type { POSCartItem } from "@/data/posData";

interface SelectedItem {
  itemId: string;
  quantity: number;
  maxQuantity: number;
}

interface Props {
  targetOrderId: string;
  onDone: () => void;
  onBack: () => void;
}

export default function MergeOrderContent({ targetOrderId, onDone, onBack }: Props) {
  const { orders, addItemsToOrder, removeItemFromOrder } = usePOS();
  const [sourceOrderId, setSourceOrderId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const targetOrder = orders.find(o => o.id === targetOrderId);
  const sourceOrder = orders.find(o => o.id === sourceOrderId);

  const eligibleOrders = useMemo(() =>
    orders.filter(o =>
      o.id !== targetOrderId &&
      !["paid", "voided"].includes(o.status) &&
      o.items.length > 0 &&
      o.paidAmount < o.totalAmount
    ), [orders, targetOrderId]);

  const handleSelectSource = (orderId: string) => {
    setSourceOrderId(orderId);
    setSelectedItems([]);
  };

  const handleBack = () => {
    if (showConfirmation) {
      setShowConfirmation(false);
      return;
    }
    if (sourceOrderId) {
      setSourceOrderId(null);
      setSelectedItems([]);
      return;
    }
    onBack();
  };

  const toggleItem = (item: POSCartItem) => {
    setSelectedItems(prev => {
      const exists = prev.find(s => s.itemId === item.id);
      if (exists) return prev.filter(s => s.itemId !== item.id);
      return [...prev, { itemId: item.id, quantity: item.quantity, maxQuantity: item.quantity }];
    });
  };

  const toggleAll = () => {
    if (!sourceOrder) return;
    if (selectedItems.length === sourceOrder.items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(sourceOrder.items.map(i => ({ itemId: i.id, quantity: i.quantity, maxQuantity: i.quantity })));
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setSelectedItems(prev => prev.map(s => {
      if (s.itemId !== itemId) return s;
      const newQty = Math.max(1, Math.min(s.maxQuantity, s.quantity + delta));
      return { ...s, quantity: newQty };
    }));
  };

  const handleMerge = () => {
    if (!targetOrderId || !sourceOrder) return;

    const itemsToMerge: POSCartItem[] = [];
    selectedItems.forEach(sel => {
      const origItem = sourceOrder.items.find(i => i.id === sel.itemId);
      if (!origItem) return;

      const extrasTotal = origItem.extras.reduce((s, e) => s + e.price * e.quantity, 0);
      const unitTotal = origItem.unitPrice + extrasTotal;

      if (sel.quantity === sel.maxQuantity) {
        itemsToMerge.push({ ...origItem });
        removeItemFromOrder(sourceOrder.id, origItem.id);
      } else {
        const newId = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        itemsToMerge.push({
          ...origItem,
          id: newId,
          quantity: sel.quantity,
          totalPrice: unitTotal * sel.quantity,
        });
        const remainingQty = sel.maxQuantity - sel.quantity;
        removeItemFromOrder(sourceOrder.id, origItem.id);
        if (remainingQty > 0) {
          addItemsToOrder(sourceOrder.id, [{
            ...origItem,
            id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            quantity: remainingQty,
            totalPrice: unitTotal * remainingQty,
          }]);
        }
      }
    });

    if (itemsToMerge.length > 0) {
      addItemsToOrder(targetOrderId, itemsToMerge);
      const totalQty = selectedItems.reduce((sum, s) => sum + s.quantity, 0);
      toast({
        title: "Order merged",
        description: `${totalQty} item${totalQty !== 1 ? "s" : ""} merged into ${targetOrder?.orderNumber}`,
      });
    }

    onDone();
  };

  const mergeTotal = selectedItems.reduce((sum, sel) => {
    const item = sourceOrder?.items.find(i => i.id === sel.itemId);
    if (!item) return sum;
    const unitTotal = item.totalPrice / item.quantity;
    return sum + unitTotal * sel.quantity;
  }, 0);

  const totalQtySelected = selectedItems.reduce((sum, s) => sum + s.quantity, 0);
  const allSelected = sourceOrder ? selectedItems.length === sourceOrder.items.length : false;

  if (!sourceOrderId) {
    // Step 1: Pick source order
    return (
      <>
        <div className="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Merge className="w-4 h-4" />
            Merge items into {targetOrder?.orderNumber}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-2">
          Select an order to take items from.
        </p>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {eligibleOrders.map(order => (
              <button
                key={order.id}
                onClick={() => handleSelectSource(order.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 transition-all text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{order.orderNumber}</span>
                    {order.tableNumber && <Badge variant="secondary" className="text-[10px]">{order.tableNumber}</Badge>}
                    <Badge variant={order.paidAmount > 0 ? "outline" : "destructive"} className={`text-[10px] ${order.paidAmount > 0 ? "border-[hsl(var(--warning))] text-[hsl(var(--warning))]" : ""}`}>
                      {order.paidAmount > 0 ? "Partial" : "Unpaid"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.items.length} items · {formatNaira(order.totalAmount)}
                  </p>
                </div>
                <Merge className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
            {eligibleOrders.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No eligible orders to merge from</p>
            )}
          </div>
        </ScrollArea>
      </>
    );
  }

  if (showConfirmation) {
    // Step 3: Confirm merge
    return (
      <>
        <div className="flex items-center gap-2 mb-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-base font-semibold">Confirm merge</h3>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))] shrink-0" />
            <span className="text-muted-foreground">
              {totalQtySelected} item{totalQtySelected !== 1 ? "s" : ""} will be moved from{" "}
              <span className="font-semibold text-foreground">{sourceOrder?.orderNumber}</span> to{" "}
              <span className="font-semibold text-foreground">{targetOrder?.orderNumber}</span>
            </span>
          </div>
        </div>

        <ScrollArea className="max-h-[300px]">
          <div className="space-y-1">
            {selectedItems.map(sel => {
              const item = sourceOrder?.items.find(i => i.id === sel.itemId);
              if (!item) return null;
              const unitPrice = item.totalPrice / item.quantity;
              return (
                <div key={sel.itemId} className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                    {item.variantName && (
                      <p className="text-xs text-muted-foreground">{item.variantName}</p>
                    )}
                    {item.extras.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        +{item.extras.map(e => e.quantity > 1 ? `${e.name} ×${e.quantity}` : e.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold">×{sel.quantity}</p>
                    <p className="text-xs text-muted-foreground">{formatNaira(unitPrice * sel.quantity)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{formatNaira(mergeTotal)}</span>
          </div>
          <Button className="w-full" onClick={handleMerge}>
            <Check className="w-4 h-4 mr-2" />
            Confirm merge into {targetOrder?.orderNumber}
          </Button>
        </div>
      </>
    );
  }

  // Step 2: Pick items from source order
  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-base font-semibold">
          Select items from {sourceOrder?.orderNumber}
        </h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Choose items and quantities to merge into {targetOrder?.orderNumber}.
      </p>

      <div className="flex items-center gap-2 py-1 border-b border-border">
        <Checkbox
          checked={allSelected}
          onCheckedChange={toggleAll}
          id="select-all-merge"
        />
        <label htmlFor="select-all-merge" className="text-sm font-medium cursor-pointer">
          Select all items
        </label>
      </div>

      <ScrollArea className="max-h-[350px]">
        <div className="space-y-1">
          {sourceOrder?.items.map(item => {
            const sel = selectedItems.find(s => s.itemId === item.id);
            const isSelected = !!sel;
            return (
              <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleItem(item)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  {item.variantName && (
                    <p className="text-xs text-muted-foreground">{item.variantName}</p>
                  )}
                  {item.extras.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      +{item.extras.map(e => e.quantity > 1 ? `${e.name} ×${e.quantity}` : e.name).join(", ")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatNaira(item.totalPrice / item.quantity)} each · Qty: {item.quantity}
                  </p>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, -1)}
                      disabled={sel.quantity <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-sm font-semibold w-6 text-center">{sel.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={sel.quantity >= sel.maxQuantity}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="border-t border-border pt-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{selectedItems.length} item(s) selected</span>
          <span className="font-semibold">{formatNaira(mergeTotal)}</span>
        </div>
        <Button
          className="w-full"
          disabled={selectedItems.length === 0}
          onClick={() => setShowConfirmation(true)}
        >
          <Merge className="w-4 h-4 mr-2" />
          Review merge
        </Button>
      </div>
    </>
  );
}
