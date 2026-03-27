import { usePOS } from "@/contexts/POSContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";

interface Props {
  onCheckout: () => void;
}

export default function POSCart({ onCheckout }: Props) {
  const { cart, cartTotal, removeFromCart, updateCartItemQuantity, clearCart } = usePOS();

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
        <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">Cart is empty</p>
        <p className="text-xs mt-1">Tap a product to add it</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-foreground">Cart</h3>
          <Badge variant="secondary" className="text-[10px]">{cart.reduce((s, i) => s + i.quantity, 0)}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={clearCart} className="text-destructive hover:text-destructive text-xs h-7">
          Clear
        </Button>
      </div>

      {/* Items */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {cart.map(item => (
            <div key={item.id} className="flex gap-2 p-2 rounded-lg bg-muted/30 group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.productName}
                  {item.variantName && <span className="text-muted-foreground font-normal"> · {item.variantName}</span>}
                </p>
                {item.extras.length > 0 && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    +{item.extras.map(e => e.name).join(", ")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">${item.unitPrice.toFixed(2)} each</p>
              </div>

              <div className="flex flex-col items-end gap-1 shrink-0">
                <p className="text-sm font-semibold text-foreground">${item.totalPrice.toFixed(2)}</p>
                <div className="flex items-center gap-1">
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
          ))}
        </div>
      </ScrollArea>

      {/* Total & checkout */}
      <div className="border-t border-border p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-xl font-bold text-foreground">${cartTotal.toFixed(2)}</span>
        </div>
        <Button onClick={onCheckout} className="w-full h-12 bg-primary text-primary-foreground text-base font-semibold">
          Checkout · ${cartTotal.toFixed(2)}
        </Button>
      </div>
    </div>
  );
}
