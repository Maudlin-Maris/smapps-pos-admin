import { useState, useEffect } from "react";
import { type POSCartItem, posProducts } from "@/data/posData";
import { formatNaira } from "@/lib/currency";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Trash2 } from "lucide-react";

interface Props {
  item: POSCartItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (itemId: string, variantId: string | undefined, variantName: string | undefined, extras: { id: string; name: string; price: number }[], unitPrice: number) => void;
  onRemove: (itemId: string) => void;
}

export default function CartItemEditDialog({ item, open, onClose, onSave, onRemove }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());

  const product = item ? posProducts.find(p => p.id === item.productId) : null;

  useEffect(() => {
    if (item && open) {
      setSelectedVariant(item.variantId);
      setSelectedExtras(new Set(item.extras.map(e => e.id)));
    }
  }, [item, open]);

  if (!item || !product) return null;

  const hasVariants = product.variants && product.variants.length > 0;
  const hasExtras = product.extras && product.extras.length > 0;
  const variant = product.variants?.find(v => v.id === selectedVariant);
  const basePrice = variant?.price ?? product.price;
  const extras = product.extras?.filter(e => selectedExtras.has(e.id)) ?? [];
  const extrasTotal = extras.reduce((s, e) => s + e.price, 0);
  const totalPrice = (basePrice + extrasTotal) * item.quantity;

  const toggleExtra = (id: string) => {
    setSelectedExtras(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    onSave(
      item.id,
      variant?.id,
      variant?.name,
      extras.map(e => ({ id: e.id, name: e.name, price: e.price })),
      basePrice
    );
    onClose();
  };

  const handleRemove = () => {
    onRemove(item.id);
    onClose();
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) onClose();
  };

  const extrasByCategory = product.extras?.reduce<Record<string, typeof product.extras>>((acc, e) => {
    const cat = e.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(e);
    return acc;
  }, {}) ?? {};

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Edit: {product.name}</DialogTitle>
        </DialogHeader>

        {hasVariants && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">Select Size</p>
            <div className="grid grid-cols-2 gap-2">
              {product.variants!.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    selectedVariant === v.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-sm font-medium">{v.name}</span>
                  <span className="text-sm text-muted-foreground">${v.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {hasExtras && Object.entries(extrasByCategory).map(([category, catExtras]) => (
          <div key={category} className="space-y-2">
            <p className="text-sm font-semibold text-foreground">{category}</p>
            <div className="space-y-1">
              {catExtras!.map(extra => (
                <button
                  key={extra.id}
                  onClick={() => toggleExtra(extra.id)}
                  className={`flex items-center w-full gap-3 p-2.5 rounded-lg border transition-all ${
                    selectedExtras.has(extra.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                    selectedExtras.has(extra.id) ? "bg-primary border-primary" : "border-input"
                  }`}>
                    {selectedExtras.has(extra.id) && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <span className="flex-1 text-sm text-left">{extra.name}</span>
                  <span className="text-sm text-muted-foreground">+${extra.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Total ({item.quantity}x)</p>
            <p className="text-xl font-bold text-foreground">${totalPrice.toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" size="icon" onClick={handleRemove} className="h-11 w-11">
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSave}
              disabled={hasVariants && !selectedVariant}
              className="h-11 px-6 bg-primary text-primary-foreground"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
