import { useState } from "react";
import { usePOS } from "@/contexts/POSContext";
import { formatNaira } from "@/lib/currency";
import { posProducts, posCategories } from "@/data/posData";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Minus, Plus, Trash2, ShoppingCart, Pencil, Gift, MoreVertical, Unlink, ArrowRightLeft, Package } from "lucide-react";
import { type POSCartItem } from "@/data/posData";
import CartItemEditDialog from "./CartItemEditDialog";
import { toast } from "sonner";

interface Props {
  onCheckout: () => void;
}

export default function POSCart({ onCheckout }: Props) {
  const {
    cart, cartTotal, removeFromCart, updateCartItemQuantity, updateCartItem, clearCart, outletOpen,
    removeBundleFromCart, breakBundle, swapBundleItem, currentOutlet
  } = usePOS();
  const [editingItem, setEditingItem] = useState<POSCartItem | null>(null);
  const [swapState, setSwapState] = useState<{ bundleId: string; itemId: string; categoryId?: string } | null>(null);

  // Group items: bundles grouped together, standalone items separate
  const groupedItems: Array<{ type: "bundle"; bundleId: string; bundleName: string; items: POSCartItem[]; total: number } | { type: "item"; item: POSCartItem }> = [];
  const bundleMap = new Map<string, POSCartItem[]>();

  cart.forEach(item => {
    if (item.bundleId) {
      const existing = bundleMap.get(item.bundleId);
      if (existing) existing.push(item);
      else bundleMap.set(item.bundleId, [item]);
    } else {
      groupedItems.push({ type: "item", item });
    }
  });

  bundleMap.forEach((items, bundleId) => {
    groupedItems.push({
      type: "bundle",
      bundleId,
      bundleName: items[0]?.bundleName || "Combo",
      items,
      total: items.reduce((s, i) => s + i.totalPrice, 0),
    });
  });

  // Sort to maintain insertion order (first item's index in cart)
  groupedItems.sort((a, b) => {
    const aIdx = cart.indexOf(a.type === "bundle" ? a.items[0] : a.item);
    const bIdx = cart.indexOf(b.type === "bundle" ? b.items[0] : b.item);
    return aIdx - bIdx;
  });

  // Swap dialog: show products from same category
  const swapCandidates = swapState
    ? posProducts.filter(p =>
        p.outletId === currentOutlet?.id &&
        p.inStock &&
        p.categoryId === swapState.categoryId
      )
    : [];

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
        <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">Cart is empty</p>
        <p className="text-xs mt-1">Tap a product to add it</p>
      </div>
    );
  }

  const handleSwapSelect = (productId: string, variantId?: string, variantName?: string) => {
    if (!swapState) return;
    swapBundleItem(swapState.bundleId, swapState.itemId, productId, variantId, variantName);
    setSwapState(null);
    toast.success("Item swapped in combo");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-foreground">Cart</h3>
          <Badge variant="secondary" className="text-[10px]">{cart.reduce((s, i) => s + i.quantity, 0)}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive text-xs h-7">
          Clear
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {groupedItems.map(group => {
            if (group.type === "item") {
              const item = group.item;
              return (
                <div
                  key={item.id}
                  className="flex gap-2 p-2 rounded-lg bg-muted/30 group cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setEditingItem(item)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.productName}
                      {item.variantName && <span className="text-muted-foreground font-normal"> · {item.variantName}</span>}
                    </p>
                    {item.extras.length > 0 && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        +{item.extras.map(e => e.quantity > 1 ? `${e.quantity}x ${e.name}` : e.name).join(", ")}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-0.5">
                      <p className="text-xs text-muted-foreground">{formatNaira(item.unitPrice)} each</p>
                      <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="text-sm font-semibold text-foreground">{formatNaira(item.totalPrice)}</p>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-md bg-muted flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors">
                        {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      </button>
                      <span className="text-xs font-semibold w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-md bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Bundle group rendering
            return (
              <div key={group.bundleId} className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
                {/* Bundle header */}
                <div className="flex items-center justify-between px-3 py-2 bg-primary/10">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs font-semibold text-primary truncate">{group.bundleName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-sm font-bold text-primary">{formatNaira(group.total)}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="w-6 h-6 rounded-md hover:bg-primary/20 flex items-center justify-center transition-colors">
                          <MoreVertical className="w-3.5 h-3.5 text-primary" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => {
                            removeBundleFromCart(group.bundleId);
                            toast.success("Combo removed");
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove Combo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            breakBundle(group.bundleId);
                            toast.success("Combo broken into individual items at original prices");
                          }}
                        >
                          <Unlink className="w-4 h-4 mr-2" />
                          Break Combo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Bundle items — locked, no individual +/- */}
                <div className="px-2 py-1 space-y-0.5">
                  {group.items.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-1.5 rounded-md hover:bg-primary/5 transition-colors group/bitem"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          <span className="text-muted-foreground text-xs mr-1">{item.quantity}×</span>
                          {item.productName}
                          {item.variantName && <span className="text-muted-foreground font-normal text-xs"> · {item.variantName}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground">{formatNaira(item.totalPrice)}</span>
                        <button
                          onClick={() => setSwapState({ bundleId: group.bundleId, itemId: item.id, categoryId: item.categoryId })}
                          className="w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover/bitem:opacity-100 hover:bg-primary/10 transition-all"
                          title="Swap item"
                        >
                          <ArrowRightLeft className="w-3 h-3 text-primary" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">{formatNaira(cartTotal)}</span>
        </div>
        <Button
          onClick={onCheckout}
          disabled={!outletOpen}
          className="w-full h-12 bg-primary text-primary-foreground text-base font-semibold"
        >
          {outletOpen ? `Checkout · ${formatNaira(cartTotal)}` : "Business is Closed"}
        </Button>
      </div>

      <CartItemEditDialog
        item={editingItem}
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={(id, variantId, variantName, extras, unitPrice) => updateCartItem(id, variantId, variantName, extras, unitPrice)}
        onRemove={(id) => removeFromCart(id)}
      />

      {/* Swap Item Dialog */}
      <Dialog open={!!swapState} onOpenChange={o => { if (!o) setSwapState(null); }}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Swap Item
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Select a replacement from the same category:</p>
          <div className="space-y-1 mt-2">
            {swapCandidates.map(prod => {
              const currentItem = swapState ? cart.find(i => i.id === swapState.itemId) : null;
              const isCurrentProduct = prod.id === currentItem?.productId && !prod.variants?.length;
              
              if (prod.variants && prod.variants.length > 0) {
                return prod.variants.map(v => {
                  const isCurrent = prod.id === currentItem?.productId && v.id === currentItem?.variantId;
                  return (
                    <button
                      key={`${prod.id}-${v.id}`}
                      onClick={() => handleSwapSelect(prod.id, v.id, v.name)}
                      disabled={isCurrent}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                        isCurrent
                          ? "border-primary bg-primary/5 opacity-60"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{prod.name}</p>
                        <p className="text-xs text-muted-foreground">{v.name}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{formatNaira(v.price)}</span>
                    </button>
                  );
                });
              }

              return (
                <button
                  key={prod.id}
                  onClick={() => handleSwapSelect(prod.id)}
                  disabled={isCurrentProduct}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                    isCurrentProduct
                      ? "border-primary bg-primary/5 opacity-60"
                      : "border-border hover:border-primary/40 hover:bg-muted/30"
                  }`}
                >
                  <p className="text-sm font-medium">{prod.name}</p>
                  <span className="text-sm text-muted-foreground">{formatNaira(prod.price)}</span>
                </button>
              );
            })}
            {swapCandidates.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No other items available in this category</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
