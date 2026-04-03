import { useState, useMemo } from "react";
import { usePOS } from "@/contexts/POSContext";
import { posProducts, posCategories, type POSProduct, type POSCartItem } from "@/data/posData";
import { formatNaira } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X, Plus, Minus, Trash2, ShoppingBag, ArrowLeft, Check, Pencil, ChevronLeft } from "lucide-react";
import VariantExtrasDialog from "./VariantExtrasDialog";
import RemoveItemAuthDialog from "./RemoveItemAuthDialog";

interface Props {
  orderId: string;
  onDone: () => void;
  onBack: () => void;
}

type View = "order" | "browse";

export default function AddItemsToOrderContent({ orderId, onDone, onBack }: Props) {
  const { currentOutlet, addItemsToOrder, removeItemFromOrder, orders } = usePOS();
  const [view, setView] = useState<View>("order");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogProduct, setDialogProduct] = useState<POSProduct | null>(null);
  const [pendingItems, setPendingItems] = useState<POSCartItem[]>([]);
  const [editingItem, setEditingItem] = useState<{ item: POSCartItem; product: POSProduct } | null>(null);
  const [removeAuth, setRemoveAuth] = useState<{ orderId: string; itemId: string; itemName: string } | null>(null);

  const order = orders.find(o => o.id === orderId);

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

  const editInitialExtras = editingItem
    ? editingItem.item.extras.map(e => ({ id: e.id, quantity: e.quantity }))
    : undefined;

  const handleConfirmVariantExtras = (
    variantId: string | undefined,
    variantName: string | undefined,
    selectedExtras: { id: string; name: string; price: number; quantity: number }[],
    unitPrice: number
  ) => {
    const product = editingItem ? editingItem.product : dialogProduct;
    if (!product) return;
    const extrasTotal = selectedExtras.reduce((s, e) => s + e.price * e.quantity, 0);
    const total = unitPrice + extrasTotal;

    if (editingItem) {
      setPendingItems(prev => prev.map(i => i.id === editingItem.item.id ? {
        ...i,
        variantId,
        variantName,
        extras: selectedExtras,
        unitPrice: total,
        totalPrice: total * i.quantity,
      } : i));
      setEditingItem(null);
    } else {
      addPendingItem({
        productId: product.id,
        productName: product.name,
        categoryId: product.categoryId,
        variantId,
        variantName,
        extras: selectedExtras,
        quantity: 1,
        unitPrice: total,
        totalPrice: total,
      });
    }
    setDialogProduct(null);
  };

  const handleEditPendingItem = (item: POSCartItem) => {
    const product = posProducts.find(p => p.id === item.productId);
    if (!product) return;
    if ((product.variants && product.variants.length > 0) || (product.extras && product.extras.length > 0)) {
      setEditingItem({ item, product });
      setDialogProduct(product);
    }
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
  const existingTotal = order ? order.items.reduce((s, i) => s + i.totalPrice, 0) : 0;
  const projectedTotal = existingTotal + pendingTotal - (order?.discountAmount || 0) + (order?.feesTotal || 0);

  const handleConfirmAll = () => {
    if (pendingItems.length === 0) return;
    addItemsToOrder(orderId, pendingItems);
    setPendingItems([]);
    setSearch("");
    setSelectedCategory(null);
    setView("order");
    onDone();
  };

  const handleBack = () => {
    if (view === "browse") {
      setView("order");
      return;
    }
    setPendingItems([]);
    setSearch("");
    setSelectedCategory(null);
    setView("order");
    onBack();
  };

  const handleRemoveExistingItem = (itemId: string, itemName: string) => {
    setRemoveAuth({ orderId, itemId, itemName });
  };

  const handleRemoveAuthorized = () => {
    if (!removeAuth) return;
    removeItemFromOrder(removeAuth.orderId, removeAuth.itemId);
    setRemoveAuth(null);
  };

  if (!order) return null;

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ShoppingBag className="w-4 h-4 shrink-0" />
          <h3 className="text-base font-semibold">{order.orderNumber}</h3>
          <Badge variant="outline" className="text-[10px]">{order.items.length + pendingItems.length} items</Badge>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold">{formatNaira(projectedTotal)}</p>
          {pendingItems.length > 0 && (
            <p className="text-[10px] text-muted-foreground">
              was {formatNaira(order.totalAmount)}
            </p>
          )}
        </div>
      </div>

      {view === "order" ? (
        <div className="flex flex-col flex-1 min-h-0">
          <ScrollArea className="flex-1 max-h-[50vh]">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Current Items</p>
                <div className="space-y-1">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 text-sm gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{item.quantity}× {item.productName}</span>
                        {item.variantName && <span className="text-muted-foreground"> ({item.variantName})</span>}
                        {item.extras.length > 0 && (
                          <p className="text-xs text-muted-foreground">+{item.extras.map(e => e.quantity > 1 ? `${e.name} ×${e.quantity}` : e.name).join(", ")}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-medium text-sm">{formatNaira(item.totalPrice)}</span>
                        {order.status !== "paid" && order.status !== "voided" && (
                          <button
                            onClick={() => handleRemoveExistingItem(item.id, item.productName)}
                            className="p-1 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                            title="Remove item (requires authorization)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {pendingItems.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Plus className="w-3 h-3" /> New Items
                  </p>
                  <div className="space-y-1">
                    {pendingItems.map(item => {
                      const product = posProducts.find(p => p.id === item.productId);
                      const canEdit = product && ((product.variants && product.variants.length > 0) || (product.extras && product.extras.length > 0));
                      return (
                        <div key={item.id} className="flex items-start justify-between py-2 px-3 rounded-lg border border-primary/20 bg-primary/5 text-sm gap-2">
                          <button
                            className={`flex-1 min-w-0 text-left ${canEdit ? 'hover:text-primary transition-colors' : ''}`}
                            onClick={() => canEdit && handleEditPendingItem(item)}
                            disabled={!canEdit}
                          >
                            <span className="font-medium">{item.productName}</span>
                            {item.variantName && <span className="text-muted-foreground"> ({item.variantName})</span>}
                            {item.extras.length > 0 && (
                              <p className="text-xs text-muted-foreground">+{item.extras.map(e => e.quantity > 1 ? `${e.name} ×${e.quantity}` : e.name).join(", ")}</p>
                            )}
                            {canEdit && (
                              <p className="text-[10px] text-primary/60 flex items-center gap-0.5 mt-0.5">
                                <Pencil className="w-2.5 h-2.5" /> Tap to edit
                              </p>
                            )}
                          </button>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => updatePendingQty(item.id, -1)} className="w-6 h-6 rounded-md bg-muted flex items-center justify-center hover:bg-destructive/10 transition-colors">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center font-semibold text-xs">{item.quantity}</span>
                              <button onClick={() => updatePendingQty(item.id, 1)} className="w-6 h-6 rounded-md bg-muted flex items-center justify-center hover:bg-primary/10 transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                              <button onClick={() => setPendingItems(prev => prev.filter(i => i.id !== item.id))} className="w-6 h-6 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="font-medium text-xs">{formatNaira(item.totalPrice)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Existing items subtotal</span>
                  <span>{formatNaira(existingTotal)}</span>
                </div>
                {pendingItems.length > 0 && (
                  <div className="flex justify-between text-xs text-primary font-medium">
                    <span>New items subtotal</span>
                    <span>+{formatNaira(pendingTotal)}</span>
                  </div>
                )}
                {(order.discountAmount || 0) > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Discount{order.discountName ? ` (${order.discountName})` : ""}</span>
                    <span>-{formatNaira(order.discountAmount || 0)}</span>
                  </div>
                )}
                {(order.feesTotal || 0) > 0 && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Fees</span>
                    <span>+{formatNaira(order.feesTotal || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-border">
                  <span>Updated Total</span>
                  <span>{formatNaira(projectedTotal)}</span>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="pt-3 border-t border-border flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setView("browse")}>
                <Plus className="w-4 h-4 mr-1.5" /> Add More Items
              </Button>
              {pendingItems.length > 0 && (
                <Button className="flex-1" onClick={handleConfirmAll}>
                  <Check className="w-4 h-4 mr-1.5" /> Confirm {pendingItems.length} New Item{pendingItems.length > 1 ? "s" : ""}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
          <div className="pt-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="pl-10 pr-10 h-9"
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto scrollbar-none" style={{ touchAction: "pan-x" }}>
            <div className="flex gap-1.5 py-2 w-max">
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

          <ScrollArea className="flex-1 min-h-0 max-h-[40vh]">
            <div className="grid grid-cols-2 gap-2 pt-1 pr-1">
              {products.map(product => (
                <button
                  key={product.id}
                  onClick={() => product.inStock && handleProductClick(product)}
                  disabled={!product.inStock}
                  className={`relative flex flex-col items-start p-2.5 rounded-xl border text-left transition-all active:scale-[0.97] min-w-0 overflow-hidden ${
                    product.inStock
                      ? "bg-card border-border hover:border-primary/30 hover:shadow-sm"
                      : "bg-muted/50 border-border/50 opacity-60 cursor-not-allowed"
                  }`}
                >
                  {!product.inStock && (
                    <Badge variant="destructive" className="absolute top-1.5 right-1.5 text-[9px]">Out</Badge>
                  )}
                  <span className="text-xs font-semibold text-foreground line-clamp-2 leading-tight break-words w-full overflow-hidden">{product.name}</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 truncate w-full">
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

          <div className="border-t border-border pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              {pendingItems.length > 0 ? (
                <>
                  <Badge className="bg-primary text-primary-foreground">{pendingItems.length}</Badge>
                  <span className="font-medium text-xs sm:text-sm">{formatNaira(pendingTotal)} in new items</span>
                </>
              ) : (
                <span className="text-muted-foreground text-xs">Select products to add</span>
              )}
            </div>
            <Button
              size="sm"
              onClick={() => setView("order")}
              variant={pendingItems.length > 0 ? "default" : "outline"}
              className="w-full sm:w-auto"
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1.5" /> View Order Details
            </Button>
          </div>
        </div>
      )}

      <VariantExtrasDialog
        product={dialogProduct}
        open={!!dialogProduct}
        onClose={() => { setDialogProduct(null); setEditingItem(null); }}
        onConfirm={handleConfirmVariantExtras}
        initialVariantId={editingItem?.item.variantId}
        initialExtras={editInitialExtras}
      />

      <RemoveItemAuthDialog
        open={!!removeAuth}
        onClose={() => setRemoveAuth(null)}
        onAuthorized={handleRemoveAuthorized}
        itemName={removeAuth?.itemName || ""}
      />
    </>
  );
}
