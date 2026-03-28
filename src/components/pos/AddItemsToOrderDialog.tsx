import { useState, useMemo } from "react";
import { usePOS } from "@/contexts/POSContext";
import { posProducts, posCategories, type POSProduct, type POSCartItem } from "@/data/posData";
import { formatNaira } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, X, Plus, Minus, Trash2 } from "lucide-react";
import VariantExtrasDialog from "./VariantExtrasDialog";

interface Props {
  open: boolean;
  onClose: () => void;
  orderId: string;
}

export default function AddItemsToOrderDialog({ open, onClose, orderId }: Props) {
  const { currentOutlet, addItemsToOrder } = usePOS();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogProduct, setDialogProduct] = useState<POSProduct | null>(null);
  const [pendingItems, setPendingItems] = useState<POSCartItem[]>([]);

  const outletCategories = posCategories.filter(c => !c.outletId || c.outletId === currentOutlet?.id);

  const products = useMemo(() => {
    return posProducts.filter(p => {
      if (currentOutlet && p.outletId !== currentOutlet.id) return false;
      if (search) return p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
      if (!selectedCategory) return true;
      return p.categoryId === selectedCategory;
    });
  }, [currentOutlet, search, selectedCategory]);

  const handleProductClick = (product: POSProduct) => {
    if ((product.variants && product.variants.length > 0) || (product.extras && product.extras.length > 0)) {
      setDialogProduct(product);
    } else {
      addPendingItem({
        productId: product.id,
        productName: product.name,
        categoryId: product.categoryId,
        extras: [],
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price,
      });
    }
  };

  const addPendingItem = (item: Omit<POSCartItem, "id">) => {
    setPendingItems(prev => {
      const extrasKey = [...item.extras].sort((a, b) => a.id.localeCompare(b.id)).map(e => `${e.id}:${e.quantity}`).join(",");
      const existing = prev.find(c => {
        const cKey = [...c.extras].sort((a, b) => a.id.localeCompare(b.id)).map(e => `${e.id}:${e.quantity}`).join(",");
        return c.productId === item.productId && c.variantId === item.variantId && cKey === extrasKey;
      });
      if (existing) {
        return prev.map(c => c.id === existing.id
          ? { ...c, quantity: c.quantity + item.quantity, totalPrice: (c.quantity + item.quantity) * (c.unitPrice + c.extras.reduce((s, e) => s + e.price * e.quantity, 0)) }
          : c
        );
      }
      const id = `add-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      return [...prev, { ...item, id }];
    });
  };

  const handleConfirmVariantExtras = (
    variantId: string | undefined,
    variantName: string | undefined,
    selectedExtras: { id: string; name: string; price: number }[],
    unitPrice: number
  ) => {
    if (!dialogProduct) return;
    const extrasWithQty = selectedExtras.map(e => ({ ...e, quantity: 1 }));
    const extrasTotal = extrasWithQty.reduce((s, e) => s + e.price * e.quantity, 0);
    const total = unitPrice + extrasTotal;
    addPendingItem({
      productId: dialogProduct.id,
      productName: dialogProduct.name,
      categoryId: dialogProduct.categoryId,
      variantId,
      variantName,
      extras: extrasWithQty,
      quantity: 1,
      unitPrice: total,
      totalPrice: total,
    });
    setDialogProduct(null);
  };

  const updatePendingQty = (itemId: string, delta: number) => {
    setPendingItems(prev => {
      return prev.map(i => {
        if (i.id !== itemId) return i;
        const newQty = i.quantity + delta;
        if (newQty <= 0) return null as any;
        return { ...i, quantity: newQty, totalPrice: (i.unitPrice + i.extras.reduce((s, e) => s + e.price * e.quantity, 0)) * newQty };
      }).filter(Boolean);
    });
  };

  const pendingTotal = pendingItems.reduce((s, i) => s + i.totalPrice, 0);

  const handleConfirmAll = () => {
    if (pendingItems.length === 0) return;
    addItemsToOrder(orderId, pendingItems);
    setPendingItems([]);
    setSearch("");
    setSelectedCategory(null);
    onClose();
  };

  const handleClose = () => {
    setPendingItems([]);
    setSearch("");
    setSelectedCategory(null);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={o => !o && handleClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Items to Order
            </DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="px-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-10 pr-10 h-9"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="overflow-x-auto">
            <div className="flex gap-1.5 px-4 py-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  !selectedCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                All
              </button>
              {outletCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <ScrollArea className="flex-1 min-h-0 max-h-[35vh]">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 pt-1">
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => product.inStock && handleProductClick(product)}
                  disabled={!product.inStock}
                  className={`relative flex flex-col items-start p-2.5 rounded-xl border text-left transition-all active:scale-[0.97] ${
                    product.inStock
                      ? "bg-card border-border hover:border-primary/30 hover:shadow-sm"
                      : "bg-muted/50 border-border/50 opacity-60 cursor-not-allowed"
                  }`}
                >
                  {!product.inStock && (
                    <Badge variant="destructive" className="absolute top-1.5 right-1.5 text-[9px]">Out</Badge>
                  )}
                  <span className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{product.name}</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    {product.variants?.length ? `From ${formatNaira(Math.min(...product.variants.map(v => v.price)))}` : formatNaira(product.price)}
                  </span>
                </button>
              ))}
              {products.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <Search className="w-6 h-6 mx-auto mb-1 opacity-30" />
                  <p className="text-xs">No products found</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Pending items summary */}
          {pendingItems.length > 0 && (
            <div className="border-t border-border p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">Items to add ({pendingItems.length})</p>
              <div className="space-y-1 max-h-[120px] overflow-y-auto">
                {pendingItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{item.productName}</span>
                      {item.variantName && <span className="text-muted-foreground"> ({item.variantName})</span>}
                      {item.extras.length > 0 && (
                        <span className="text-muted-foreground"> +{item.extras.map(e => e.name).join(", ")}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => updatePendingQty(item.id, -1)} className="w-5 h-5 rounded bg-muted flex items-center justify-center hover:bg-destructive/10">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center font-semibold">{item.quantity}</span>
                      <button onClick={() => updatePendingQty(item.id, 1)} className="w-5 h-5 rounded bg-muted flex items-center justify-center hover:bg-primary/10">
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="font-medium ml-1 w-16 text-right">{formatNaira(item.totalPrice)}</span>
                      <button onClick={() => setPendingItems(prev => prev.filter(i => i.id !== item.id))} className="ml-1 text-destructive hover:text-destructive/80">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-bold">{formatNaira(pendingTotal)}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setPendingItems([])}>Clear</Button>
                  <Button size="sm" onClick={handleConfirmAll}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add {pendingItems.length} Item{pendingItems.length > 1 ? "s" : ""} to Order
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <VariantExtrasDialog
        product={dialogProduct}
        open={!!dialogProduct}
        onClose={() => setDialogProduct(null)}
        onConfirm={handleConfirmVariantExtras}
      />
    </>
  );
}
