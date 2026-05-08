import { useState, useEffect } from "react";
import { type POSCartItem, posProducts } from "@/data/posData";
import { formatNaira } from "@/lib/currency";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Trash2, Minus, Plus, Package, Pill, DollarSign, StickyNote } from "lucide-react";

interface Props {
  item: POSCartItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (itemId: string, variantId: string | undefined, variantName: string | undefined, extras: { id: string; name: string; price: number; quantity: number }[], unitPrice: number, notes?: string) => void;
  onRemove: (itemId: string) => void;
}

export default function CartItemEditDialog({ item, open, onClose, onSave, onRemove }: Props) {
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>();
  const [extraQuantities, setExtraQuantities] = useState<Record<string, number>>({});
  const [openPriceValue, setOpenPriceValue] = useState("");
  const [notes, setNotes] = useState("");

  const product = item ? posProducts.find(p => p.id === item.productId) : null;

  useEffect(() => {
    if (item && open && product) {
      const realVariant = product.variants?.find(v => v.id === item.variantId);
      const matchedUnit = product.sellableUnits?.find(u => u.id === item.variantId);
      setSelectedVariant(realVariant?.id);
      if (matchedUnit) {
        setSelectedUnitId(matchedUnit.id);
      } else if (product.sellableUnits && product.sellableUnits.length > 0) {
        const def = product.sellableUnits.find(u => u.isDefault) || product.sellableUnits[0];
        setSelectedUnitId(def.id);
      } else {
        setSelectedUnitId(undefined);
      }
      const qtyMap: Record<string, number> = {};
      item.extras.forEach(e => { qtyMap[e.id] = e.quantity || 1; });
      setExtraQuantities(qtyMap);
      if (product.openPricing) {
        setOpenPriceValue(item.unitPrice > 0 ? String(item.unitPrice) : "");
      }
    }
  }, [item, open, product]);

  if (!item || !product) return null;

  const isOpenPricing = !!product.openPricing;
  const hasVariants = product.variants && product.variants.length > 0;
  const hasExtras = product.extras && product.extras.length > 0;
  const hasUnits = !!(product.sellableUnits && product.sellableUnits.length > 0);
  const variant = product.variants?.find(v => v.id === selectedVariant);
  const selectedUnit = product.sellableUnits?.find(u => u.id === selectedUnitId);
  const openPriceNumeric = parseFloat(openPriceValue) || 0;
  const basePrice = isOpenPricing ? openPriceNumeric : (selectedUnit?.price ?? variant?.price ?? product.price);
  const selectedExtras = product.extras?.filter(e => (extraQuantities[e.id] || 0) > 0) ?? [];
  const extrasTotal = selectedExtras.reduce((s, e) => s + e.price * (extraQuantities[e.id] || 1), 0);
  const totalPrice = (basePrice + extrasTotal) * item.quantity;
  const quickAmounts = [500, 1000, 2500, 5000, 10000, 25000];

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

  const handleSave = () => {
    const labelParts = [variant?.name, selectedUnit?.name].filter(Boolean) as string[];
    const finalVariantName = labelParts.length > 0 ? labelParts.join(" · ") : undefined;
    const finalVariantId = variant?.id ?? selectedUnit?.id;
    onSave(
      item.id,
      finalVariantId,
      finalVariantName,
      selectedExtras.map(e => ({ id: e.id, name: e.name, price: e.price, quantity: extraQuantities[e.id] || 1 })),
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="!w-full !max-w-none lg:!max-w-md p-0 flex flex-col overflow-hidden [&>button]:z-10">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-lg">Edit: {product.name}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {isOpenPricing && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Selling Price</p>
              </div>
              <div>
                <Label htmlFor="edit-open-price" className="text-xs text-muted-foreground">Price (₦)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">₦</span>
                  <Input id="edit-open-price" type="number" min="0" step="0.01" value={openPriceValue} onChange={e => setOpenPriceValue(e.target.value)} placeholder="0.00" className="pl-8 text-lg font-semibold h-12" inputMode="decimal" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {quickAmounts.map(amt => (
                  <button key={amt} type="button" onClick={() => setOpenPriceValue(String(amt))} className={`py-2 rounded-lg text-xs font-medium transition-colors ${openPriceValue === String(amt) ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted hover:bg-muted/80 text-foreground"}`}>
                    {formatNaira(amt)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasUnits && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-primary" /> Sell as</p>
                <span className="text-[11px] text-muted-foreground">Pick the unit the customer wants</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {product.sellableUnits!.map(u => {
                  const active = selectedUnitId === u.id;
                  return (
                    <button key={u.id} onClick={() => setSelectedUnitId(u.id)} className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/30"}`}>
                      <div className="flex items-center gap-2">
                        <Pill className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        <div>
                          <p className="text-sm font-medium leading-tight">{u.name}</p>
                          {u.shortLabel && <p className="text-[11px] text-muted-foreground leading-tight">Charged per {u.shortLabel.toLowerCase()}</p>}
                        </div>
                      </div>
                      <span className="text-sm font-semibold">{formatNaira(u.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {hasVariants && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Select Size</p>
              <div className="grid grid-cols-2 gap-2">
                {product.variants!.map(v => (
                  <button key={v.id} onClick={() => setSelectedVariant(v.id)} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${selectedVariant === v.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/30"}`}>
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
                    <div key={extra.id} className={`flex items-center w-full gap-3 p-2.5 rounded-lg border transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <button onClick={() => toggleExtra(extra.id)} className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSelected ? "bg-primary border-primary" : "border-input"}`}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                      </button>
                      <span className="flex-1 text-sm text-left">{extra.name}</span>
                      {isSelected && (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => adjustExtraQty(extra.id, -1)} className="w-6 h-6 rounded-md bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors"><Minus className="w-3 h-3" /></button>
                          <span className="text-xs font-semibold w-5 text-center">{qty}</span>
                          <button onClick={() => adjustExtraQty(extra.id, 1)} className="w-6 h-6 rounded-md bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors"><Plus className="w-3 h-3" /></button>
                        </div>
                      )}
                      <span className="text-sm text-muted-foreground shrink-0">+{formatNaira(extra.price * Math.max(qty, 1))}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total ({item.quantity}x)</p>
            <p className="text-xl font-bold text-foreground">{formatNaira(totalPrice)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" size="icon" onClick={handleRemove} className="h-11 w-11"><Trash2 className="w-4 h-4" /></Button>
            <Button onClick={handleSave} disabled={(hasVariants && !selectedVariant) || (isOpenPricing && openPriceNumeric <= 0)} className="h-11 px-6 bg-primary text-primary-foreground">Save Changes</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
