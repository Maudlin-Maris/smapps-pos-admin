import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Search, Package, Trash2, Pencil, Gift, Tag, ArrowRightLeft, ChevronDown, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { outlets } from "@/data/outlets";
import { posProducts, type POSProduct } from "@/data/posData";
import { formatNaira } from "@/lib/currency";
import { promoBundles as initialBundles, type PromoBundle, type BundleItem, type BundlePricingType, type SwapOption } from "@/data/promoBundles";

export default function PromoBundleManagement() {
  const [bundles, setBundles] = useState<PromoBundle[]>(initialBundles);
  const [selectedOutlet, setSelectedOutlet] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editingBundle, setEditingBundle] = useState<PromoBundle | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filtered = useMemo(() => {
    return bundles.filter(b => {
      if (selectedOutlet !== "all" && b.outletId !== selectedOutlet) return false;
      if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [bundles, selectedOutlet, search]);

  const handleSave = (bundle: PromoBundle) => {
    setBundles(prev => {
      const idx = prev.findIndex(b => b.id === bundle.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = bundle;
        return updated;
      }
      return [...prev, bundle];
    });
    setEditingBundle(null);
    setIsCreating(false);
    toast.success(`Bundle "${bundle.name}" saved`);
  };

  const handleDelete = (id: string) => {
    setBundles(prev => prev.filter(b => b.id !== id));
    toast.success("Bundle deleted");
  };

  const handleToggleStatus = (id: string) => {
    setBundles(prev => prev.map(b => b.id === id ? { ...b, status: b.status === "active" ? "inactive" : "active" } : b));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            Promo Bundles & Combos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create product bundles and sell them at a discounted package price
          </p>
        </div>
        <Button onClick={() => { setIsCreating(true); setEditingBundle(null); }}>
          <Plus className="w-4 h-4 mr-1" /> Create Bundle
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bundles..." className="pl-10" />
        </div>
        <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All Outlets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outlets</SelectItem>
            {outlets.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">No bundles found</p>
          <p className="text-sm mt-1">Create your first promo bundle to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(bundle => {
            const outlet = outlets.find(o => o.id === bundle.outletId);
            const savings = bundle.originalPrice - bundle.bundlePrice;
            const savingsPercent = bundle.originalPrice > 0 ? Math.round((savings / bundle.originalPrice) * 100) : 0;
            const swappableCount = bundle.items.filter(i => i.swappable && i.swapOptions && i.swapOptions.length > 0).length;
            return (
              <Card key={bundle.id} className="relative overflow-hidden">
                {bundle.status === "inactive" && (
                  <div className="absolute inset-0 bg-background/60 z-10 flex items-center justify-center">
                    <Badge variant="secondary" className="text-sm">Inactive</Badge>
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{bundle.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{outlet?.name}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingBundle(bundle)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(bundle.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">{bundle.description}</p>

                  <div className="space-y-1.5 mb-3">
                    {bundle.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">{item.quantity}</span>
                        <span className="text-foreground">{item.productName}</span>
                        {item.variantName && <span className="text-muted-foreground text-xs">({item.variantName})</span>}
                        {item.swappable && item.swapOptions && item.swapOptions.length > 0 && (
                          <ArrowRightLeft className="w-3 h-3 text-primary/60" />
                        )}
                      </div>
                    ))}
                  </div>

                  {swappableCount > 0 && (
                    <p className="text-[11px] text-primary/70 mb-3">
                      <ArrowRightLeft className="w-3 h-3 inline mr-1" />
                      {swappableCount} swappable slot{swappableCount > 1 ? "s" : ""}
                    </p>
                  )}

                  <div className="flex items-end justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground line-through">{formatNaira(bundle.originalPrice)}</p>
                      <p className="text-lg font-bold text-foreground">{formatNaira(bundle.bundlePrice)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">
                        <Tag className="w-3 h-3 mr-1" />
                        Save {savingsPercent}%
                      </Badge>
                      <Switch checked={bundle.status === "active"} onCheckedChange={() => handleToggleStatus(bundle.id)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BundleFormDialog
        open={isCreating || !!editingBundle}
        bundle={editingBundle}
        onClose={() => { setIsCreating(false); setEditingBundle(null); }}
        onSave={handleSave}
      />
    </div>
  );
}

// ─── Bundle Form Dialog ────────────────────────────────────
interface BundleFormDialogProps {
  open: boolean;
  bundle: PromoBundle | null;
  onClose: () => void;
  onSave: (bundle: PromoBundle) => void;
}

function BundleFormDialog({ open, bundle, onClose, onSave }: BundleFormDialogProps) {
  const isEdit = !!bundle;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [outletId, setOutletId] = useState("");
  const [items, setItems] = useState<BundleItem[]>([]);
  const [pricingType, setPricingType] = useState<BundlePricingType>("fixed");
  const [pricingValue, setPricingValue] = useState<number>(0);
  const [productSearch, setProductSearch] = useState("");
  const [expandedSwapIdx, setExpandedSwapIdx] = useState<number | null>(null);
  const [swapSearch, setSwapSearch] = useState("");

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (bundle) {
        setName(bundle.name);
        setDescription(bundle.description);
        setOutletId(bundle.outletId);
        setItems(bundle.items.map(i => ({ ...i, swapOptions: i.swapOptions ? [...i.swapOptions] : [] })));
        setPricingType(bundle.pricingType);
        setPricingValue(bundle.pricingValue);
      } else {
        setName("");
        setDescription("");
        setOutletId(outlets[0]?.id || "");
        setItems([]);
        setPricingType("fixed");
        setPricingValue(0);
      }
      setExpandedSwapIdx(null);
      setSwapSearch("");
    }
    if (!isOpen) onClose();
  };

  // Available products for selected outlet
  const availableProducts = useMemo(() => {
    const prods = posProducts.filter(p => p.outletId === outletId && p.inStock);
    if (productSearch) return prods.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
    return prods;
  }, [outletId, productSearch]);

  // Swap candidate products for the expanded item
  const swapCandidateProducts = useMemo(() => {
    if (expandedSwapIdx === null) return [];
    const item = items[expandedSwapIdx];
    if (!item) return [];
    const prods = posProducts.filter(p =>
      p.outletId === outletId &&
      p.inStock &&
      p.id !== item.productId // exclude the default item itself
    );
    if (swapSearch) return prods.filter(p => p.name.toLowerCase().includes(swapSearch.toLowerCase()));
    return prods;
  }, [outletId, expandedSwapIdx, items, swapSearch]);

  const originalPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      const prod = posProducts.find(p => p.id === item.productId);
      if (!prod) return sum;
      const variant = item.variantId ? prod.variants?.find(v => v.id === item.variantId) : undefined;
      const price = variant?.price ?? prod.price;
      return sum + price * item.quantity;
    }, 0);
  }, [items]);

  const bundlePrice = useMemo(() => {
    if (pricingType === "fixed") return pricingValue;
    return Math.round(originalPrice * (1 - pricingValue / 100));
  }, [pricingType, pricingValue, originalPrice]);

  const addProduct = (product: POSProduct) => {
    const existing = items.find(i => i.productId === product.id && !i.variantId);
    if (existing) {
      setItems(prev => prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems(prev => [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        swappable: false,
        swapOptions: [],
      }]);
    }
    setProductSearch("");
  };

  const addVariant = (product: POSProduct, variantId: string, variantName: string) => {
    const existing = items.find(i => i.productId === product.id && i.variantId === variantId);
    if (existing) {
      setItems(prev => prev.map(i => i === existing ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems(prev => [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        variantId,
        variantName,
        swappable: false,
        swapOptions: [],
      }]);
    }
    setProductSearch("");
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
    if (expandedSwapIdx === idx) setExpandedSwapIdx(null);
  };

  const updateItemQuantity = (idx: number, qty: number) => {
    if (qty < 1) return removeItem(idx);
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item));
  };

  const toggleSwappable = (idx: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const newSwappable = !item.swappable;
      return { ...item, swappable: newSwappable, swapOptions: newSwappable ? (item.swapOptions || []) : [] };
    }));
  };

  const addSwapOption = (idx: number, product: POSProduct, variantId?: string, variantName?: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const options = item.swapOptions || [];
      const exists = options.some(o => o.productId === product.id && o.variantId === variantId);
      if (exists) return item;
      return {
        ...item,
        swapOptions: [...options, {
          productId: product.id,
          productName: product.name,
          variantId,
          variantName,
        }],
      };
    }));
    setSwapSearch("");
  };

  const removeSwapOption = (itemIdx: number, optIdx: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== itemIdx) return item;
      return { ...item, swapOptions: (item.swapOptions || []).filter((_, j) => j !== optIdx) };
    }));
  };

  const handleSave = () => {
    if (!name.trim()) return toast.error("Bundle name is required");
    if (items.length < 2) return toast.error("Add at least 2 items to create a bundle");
    if (pricingType === "fixed" && pricingValue <= 0) return toast.error("Set a bundle price");
    if (pricingType === "percentage_discount" && (pricingValue <= 0 || pricingValue > 100)) return toast.error("Discount must be between 1-100%");

    onSave({
      id: bundle?.id || `bundle-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      outletId,
      items,
      pricingType,
      pricingValue,
      originalPrice,
      bundlePrice,
      status: bundle?.status || "active",
      startDate: bundle?.startDate,
      endDate: bundle?.endDate,
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col overflow-hidden [&>button]:z-10">
        <SheetHeader className="flex-shrink-0 p-4 sm:p-6 pb-0">
          <SheetTitle>{isEdit ? "Edit Bundle" : "Create Promo Bundle"}</SheetTitle>
          <SheetDescription>Group products together and sell at a package price</SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-5 px-4 sm:px-6 py-4 pb-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bundle Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Burger Combo Meal" />
              </div>
              <div className="space-y-2">
                <Label>Outlet *</Label>
                <Select value={outletId} onValueChange={v => { setOutletId(v); setItems([]); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {outlets.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what's in this bundle..." rows={2} />
            </div>

            {/* Bundle Items with Modifier Groups */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-semibold">Combo Slots</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add items and configure which alternatives cashiers can swap in at the POS
                </p>
              </div>

              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const prod = posProducts.find(p => p.id === item.productId);
                    const variant = item.variantId ? prod?.variants?.find(v => v.id === item.variantId) : undefined;
                    const price = variant?.price ?? prod?.price ?? 0;
                    const isExpanded = expandedSwapIdx === idx;
                    const swapCount = item.swapOptions?.length || 0;

                    return (
                      <div key={idx} className="rounded-lg border border-border overflow-hidden">
                        {/* Item row */}
                        <div className="flex items-center gap-3 p-3 bg-muted/40">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.productName}
                              {item.variantName && <span className="text-muted-foreground font-normal"> · {item.variantName}</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatNaira(price)} each</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(idx, item.quantity - 1)}>
                              <span className="text-sm">−</span>
                            </Button>
                            <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateItemQuantity(idx, item.quantity + 1)}>
                              <span className="text-sm">+</span>
                            </Button>
                          </div>
                          <p className="text-sm font-semibold w-20 text-right">{formatNaira(price * item.quantity)}</p>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(idx)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {/* Swap toggle & modifier group */}
                        <div className="border-t border-border bg-background">
                          <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={!!item.swappable}
                                onCheckedChange={() => toggleSwappable(idx)}
                                className="scale-[0.85]"
                              />
                              <span className="text-xs font-medium text-foreground">Allow swap</span>
                              {item.swappable && swapCount > 0 && (
                                <Badge variant="secondary" className="text-[10px] h-5">
                                  {swapCount} option{swapCount !== 1 ? "s" : ""}
                                </Badge>
                              )}
                            </div>
                            {item.swappable && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => {
                                  setExpandedSwapIdx(isExpanded ? null : idx);
                                  setSwapSearch("");
                                }}
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                {isExpanded ? "Close" : "Configure"}
                                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              </Button>
                            )}
                          </div>

                          {/* Expanded swap options editor */}
                          {item.swappable && isExpanded && (
                            <div className="px-3 pb-3 space-y-2">
                              {/* Current swap options */}
                              {(item.swapOptions || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {(item.swapOptions || []).map((opt, optIdx) => (
                                    <div
                                      key={optIdx}
                                      className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 pl-2.5 pr-1 py-1"
                                    >
                                      <span className="text-xs text-foreground">
                                        {opt.productName}
                                        {opt.variantName && <span className="text-muted-foreground"> · {opt.variantName}</span>}
                                      </span>
                                      <button
                                        onClick={() => removeSwapOption(idx, optIdx)}
                                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-destructive/20 transition-colors"
                                      >
                                        <X className="w-2.5 h-2.5 text-muted-foreground" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Search to add swap options */}
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <Input
                                  value={swapSearch}
                                  onChange={e => setSwapSearch(e.target.value)}
                                  placeholder="Search products to add as swap option..."
                                  className="pl-8 h-8 text-sm"
                                />
                              </div>
                              {swapSearch && swapCandidateProducts.length > 0 && (
                                <div className="border border-border rounded-lg max-h-36 overflow-y-auto bg-popover">
                                  {swapCandidateProducts.slice(0, 12).map(product => (
                                    <div key={product.id}>
                                      {product.variants && product.variants.length > 0 ? (
                                        product.variants.map(v => {
                                          const alreadyAdded = (item.swapOptions || []).some(o => o.productId === product.id && o.variantId === v.id);
                                          return (
                                            <button
                                              key={v.id}
                                              disabled={alreadyAdded}
                                              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-accent text-left text-xs transition-colors disabled:opacity-40"
                                              onClick={() => addSwapOption(idx, product, v.id, v.name)}
                                            >
                                              <span className="text-foreground">
                                                {product.name} · <span className="text-muted-foreground">{v.name}</span>
                                              </span>
                                              <span className="text-muted-foreground">{formatNaira(v.price)}</span>
                                            </button>
                                          );
                                        })
                                      ) : (
                                        (() => {
                                          const alreadyAdded = (item.swapOptions || []).some(o => o.productId === product.id && !o.variantId);
                                          return (
                                            <button
                                              disabled={alreadyAdded}
                                              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-accent text-left text-xs transition-colors disabled:opacity-40"
                                              onClick={() => addSwapOption(idx, product)}
                                            >
                                              <span className="text-foreground">{product.name}</span>
                                              <span className="text-muted-foreground">{formatNaira(product.price)}</span>
                                            </button>
                                          );
                                        })()
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {swapSearch && swapCandidateProducts.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-2">No matching products found</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Product Picker */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder={outletId ? "Search products to add..." : "Select an outlet first"}
                    className="pl-10"
                    disabled={!outletId}
                  />
                </div>
                {productSearch && availableProducts.length > 0 && (
                  <div className="border border-border rounded-lg max-h-48 overflow-y-auto bg-popover">
                    {availableProducts.slice(0, 15).map(product => (
                      <div key={product.id}>
                        {product.variants && product.variants.length > 0 ? (
                          product.variants.map(v => (
                            <button
                              key={v.id}
                              className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent text-left text-sm transition-colors"
                              onClick={() => addVariant(product, v.id, v.name)}
                            >
                              <span className="text-foreground">{product.name} · <span className="text-muted-foreground">{v.name}</span></span>
                              <span className="text-muted-foreground">{formatNaira(v.price)}</span>
                            </button>
                          ))
                        ) : (
                          <button
                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-accent text-left text-sm transition-colors"
                            onClick={() => addProduct(product)}
                          >
                            <span className="text-foreground">{product.name}</span>
                            <span className="text-muted-foreground">{formatNaira(product.price)}</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Pricing</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pricing Method</Label>
                  <Select value={pricingType} onValueChange={v => setPricingType(v as BundlePricingType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                      <SelectItem value="percentage_discount">Percentage Discount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{pricingType === "fixed" ? "Bundle Price (₦)" : "Discount (%)"}</Label>
                  <Input
                    type="number"
                    value={pricingValue || ""}
                    onChange={e => setPricingValue(Number(e.target.value))}
                    placeholder={pricingType === "fixed" ? "e.g. 7500" : "e.g. 15"}
                    min={0}
                    max={pricingType === "percentage_discount" ? 100 : undefined}
                  />
                </div>
              </div>

              {/* Price Preview */}
              {items.length >= 2 && (
                <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items Total</span>
                    <span className="text-foreground">{formatNaira(originalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {pricingType === "fixed" ? "Bundle Price" : `${pricingValue}% Discount`}
                    </span>
                    <span className="text-foreground font-semibold">{formatNaira(bundlePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="text-green-600 font-medium">Customer Saves</span>
                    <span className="text-green-600 font-semibold">
                      {formatNaira(originalPrice - bundlePrice)} ({originalPrice > 0 ? Math.round(((originalPrice - bundlePrice) / originalPrice) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 p-4 sm:p-6 pt-3 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
          <Button onClick={handleSave} className="w-full sm:w-auto">{isEdit ? "Update Bundle" : "Create Bundle"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
