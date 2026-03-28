import { useState, useEffect } from "react";
import { type POSProduct } from "@/data/posData";
import { formatNaira } from "@/lib/currency";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Minus, Plus } from "lucide-react";

interface Props {
  product: POSProduct | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (variantId: string | undefined, variantName: string | undefined, extras: { id: string; name: string; price: number }[], unitPrice: number) => void;
  initialVariantId?: string;
  initialExtras?: { id: string; quantity: number }[];
}

export default function VariantExtrasDialog({ product, open, onClose, onConfirm, initialVariantId, initialExtras }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open && product) {
      setSelectedVariant(initialVariantId || null);
      if (initialExtras && initialExtras.length > 0) {
        const map: Record<string, number> = {};
        initialExtras.forEach(e => { map[e.id] = e.quantity; });
        setExtraQuantities(map);
      } else {
        setExtraQuantities({});
      }
    }
  }, [open, product, initialVariantId, initialExtras]);

  if (!product) return null;

  const hasVariants = product.variants && product.variants.length > 0;
  const hasExtras = product.extras && product.extras.length > 0;
  const variant = product.variants?.find(v => v.id === selectedVariant);
  const basePrice = variant?.price ?? product.price;
  const selectedExtras = product.extras?.filter(e => (extraQuantities[e.id] || 0) > 0) ?? [];
  const extrasTotal = selectedExtras.reduce((s, e) => s + e.price * (extraQuantities[e.id] || 1), 0);
  const totalPrice = basePrice + extrasTotal;

  const toggleExtra = (id: string) => {
    setExtraQuantities(prev => {
      const current = prev[id] || 0;
      if (current > 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: 1 };
    });
  };

  const adjustExtraQty = (id: string, delta: number) => {
    setExtraQuantities(prev => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  const handleConfirm = () => {
    onConfirm(
      variant?.id,
      variant?.name,
      selectedExtras.map(e => ({ id: e.id, name: e.name, price: e.price })),
      basePrice
    );
    setSelectedVariant(null);
    setExtraQuantities({});
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setSelectedVariant(null);
      setExtraQuantities({});
      onClose();
    }
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
          <DialogTitle className="text-lg">{product.name}</DialogTitle>
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
                  <span className="text-sm text-muted-foreground">{formatNaira(v.price)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {hasExtras && Object.entries(extrasByCategory).map(([category, catExtras]) => (
          <div key={category} className="space-y-2">
            <p className="text-sm font-semibold text-foreground">{category}</p>
            <div className="space-y-1">
              {catExtras!.map(extra => {
                const qty = extraQuantities[extra.id] || 0;
                const isSelected = qty > 0;
                return (
                  <div
                    key={extra.id}
                    className={`flex items-center w-full gap-3 p-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <button
                      onClick={() => toggleExtra(extra.id)}
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-primary border-primary" : "border-input"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </button>
                    <span className="flex-1 text-sm text-left">{extra.name}</span>
                    {isSelected && (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => adjustExtraQty(extra.id, -1)}
                          className="w-6 h-6 rounded-md bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-semibold w-5 text-center">{qty}</span>
                        <button
                          onClick={() => adjustExtraQty(extra.id, 1)}
                          className="w-6 h-6 rounded-md bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <span className="text-sm text-muted-foreground shrink-0">
                      +{formatNaira(extra.price * Math.max(qty, 1))}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-foreground">{formatNaira(totalPrice)}</p>
          </div>
          <Button
            onClick={handleConfirm}
            disabled={hasVariants && !selectedVariant}
            className="h-11 px-6 bg-primary text-primary-foreground"
          >
            Add to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
