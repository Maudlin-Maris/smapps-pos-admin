import { useState, useEffect } from "react";
import { type POSProduct } from "@/data/posData";
import { formatNaira } from "@/lib/currency";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Minus, Plus, Package, Pill } from "lucide-react";

interface Props {
  product: POSProduct | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (variantId: string | undefined, variantName: string | undefined, extras: { id: string; name: string; price: number; quantity: number }[], unitPrice: number) => void;
  initialVariantId?: string;
  initialExtras?: { id: string; quantity: number }[];
  /** Preselect a sellable unit (e.g. when scanning a sachet barcode) */
  initialSellableUnitId?: string;
}

export default function VariantExtrasDialog({ product, open, onClose, onConfirm, initialVariantId, initialExtras, initialSellableUnitId }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [unitQty, setUnitQty] = useState<number>(1);
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (open && product) {
      setSelectedVariant(initialVariantId || null);
      // Preselect sellable unit: explicit prop > default flag > first
      if (product.sellableUnits && product.sellableUnits.length > 0) {
        const preferred =
          (initialSellableUnitId && product.sellableUnits.find(u => u.id === initialSellableUnitId)) ||
          product.sellableUnits.find(u => u.isDefault) ||
          product.sellableUnits[0];
        setSelectedUnitId(preferred.id);
      } else {
        setSelectedUnitId(null);
      }
      setUnitQty(1);
      if (initialExtras && initialExtras.length > 0) {
        const map: Record<string, number> = {};
        initialExtras.forEach(e => { map[e.id] = e.quantity; });
        setExtraQuantities(map);
      } else {
        setExtraQuantities({});
      }
    }
  }, [open, product, initialVariantId, initialExtras, initialSellableUnitId]);

  if (!product) return null;

  const hasVariants = product.variants && product.variants.length > 0;
  const hasExtras = product.extras && product.extras.length > 0;
  const hasUnits = !!(product.sellableUnits && product.sellableUnits.length > 0);
  const variant = product.variants?.find(v => v.id === selectedVariant);
  const selectedUnit = product.sellableUnits?.find(u => u.id === selectedUnitId);
  // Sellable unit price takes precedence over variant/base when present
  const basePrice = selectedUnit?.price ?? variant?.price ?? product.price;
  const selectedExtras = product.extras?.filter(e => (extraQuantities[e.id] || 0) > 0) ?? [];
  const extrasTotal = selectedExtras.reduce((s, e) => s + e.price * (extraQuantities[e.id] || 1), 0);
  const lineUnitPrice = basePrice + extrasTotal;
  const totalPrice = lineUnitPrice * (hasUnits ? unitQty : 1);

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
    // Compose final variant label so the cart line shows "Pack of 6 sachets" or
    // "Large (20pcs) · Sachet" when both variant and unit are picked.
    const labelParts = [variant?.name, selectedUnit?.name].filter(Boolean) as string[];
    const finalVariantName = labelParts.length > 0 ? labelParts.join(" · ") : undefined;
    // We use variantId if a real variant is picked; otherwise fall back to the unit id
    // so cart de-dupes Pack vs Sachet correctly.
    const finalVariantId = variant?.id ?? selectedUnit?.id;

    const extrasPayload = selectedExtras.map(e => ({ id: e.id, name: e.name, price: e.price, quantity: extraQuantities[e.id] || 1 }));
    const qty = hasUnits ? unitQty : 1;
    for (let i = 0; i < qty; i += 1) {
      onConfirm(finalVariantId, finalVariantName, extrasPayload, basePrice);
    }
    setSelectedVariant(null);
    setSelectedUnitId(null);
    setUnitQty(1);
    setExtraQuantities({});
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) {
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

        {hasUnits && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-primary" />
                Sell as
              </p>
              <span className="text-[11px] text-muted-foreground">Pick the unit the customer wants</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {product.sellableUnits!.map(u => {
                const active = selectedUnitId === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUnitId(u.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      active
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Pill className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium leading-tight">{u.name}</p>
                        {u.shortLabel && (
                          <p className="text-[11px] text-muted-foreground leading-tight">Charged per {u.shortLabel.toLowerCase()}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{formatNaira(u.price)}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick qty for the chosen unit, e.g. 4 sachets */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2.5">
              <span className="text-xs text-muted-foreground">
                Quantity {selectedUnit?.shortLabel ? `(${selectedUnit.shortLabel.toLowerCase()}${unitQty > 1 ? "s" : ""})` : ""}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUnitQty(q => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-md bg-background border border-border flex items-center justify-center hover:bg-destructive/10"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-semibold w-6 text-center">{unitQty}</span>
                <button
                  type="button"
                  onClick={() => setUnitQty(q => q + 1)}
                  className="w-7 h-7 rounded-md bg-background border border-border flex items-center justify-center hover:bg-primary/10"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

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
            {hasUnits && unitQty > 1 && (
              <p className="text-[11px] text-muted-foreground">{formatNaira(lineUnitPrice)} × {unitQty}</p>
            )}
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
