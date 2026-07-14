import { useState, useMemo, useEffect } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Plus,
  Search,
  Package,
  Trash2,
  Pencil,
  Gift,
  Tag,
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatNaira } from "@/lib/currency";
import {
  type PromoBundle,
  type BundleItem,
  type BundlePricingType,
  type POSProduct,
} from "@/lib/types/promo-bundle";
import { useGetItems } from "@/services/api/catalog/item";

import { useGetOutlets } from "@/services/api/outlets";
import {
  useGetPromoBundles,
  useCreatePromoBundle,
  useDeletePromoBundle,
  useUpdateBundleStatus,
  useUpdatePromoBundle,
} from "@/services/api/catalog/promo-bundle";
import type { APIPromoBundle, POSVariant, CreatePromoBundlePayload } from "@/lib/types/promo-bundle";
import type { Outlet } from "@/lib/types/outlet";
import { Spinner } from "@/components/ui/spinner";

interface ProductSearchRowProps {
  productName: string;
  variantName?: string;
  price: number;
  disabled?: boolean;
  onClick: () => void;
  size?: "xs" | "sm";
}

function ProductSearchRow({
  productName,
  variantName,
  price,
  disabled,
  onClick,
  size = "sm",
}: ProductSearchRowProps) {
  const sizeClasses = size === "xs" ? "py-1.5 text-xs" : "py-2 text-sm";

  return (
    <button
      disabled={disabled}
      className={`group w-full flex items-center justify-between px-3 ${sizeClasses} hover:bg-accent text-left transition-colors disabled:opacity-40`}
      onClick={onClick}
    >
      <span className="text-foreground group-hover:text-accent-foreground font-normal">
        {productName}
        {variantName && (
          <>
            {" · "}
            <span className="text-muted-foreground group-hover:text-accent-foreground/80">
              {variantName}
            </span>
          </>
        )}
      </span>
      <span className="text-muted-foreground group-hover:text-accent-foreground/80">
        {formatNaira(price)}
      </span>
    </button>
  );
}

export default function PromoBundleManagement() {
  const [selectedOutlet, setSelectedOutlet] = useState<string>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [editingBundle, setEditingBundle] = useState<PromoBundle | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: outletsData, isLoading: isOutletsLoading } = useGetOutlets();
  const outlets = outletsData || [];

  const queryParams = useMemo(() => {
    const params: { outletId?: string; search?: string } = {};
    if (selectedOutlet !== "all") {
      params.outletId = selectedOutlet;
    }
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }
    return params;
  }, [selectedOutlet, debouncedSearch]);

  const {
    data: listData,
    isLoading: isBundlesLoading,
    mutate,
  } = useGetPromoBundles(queryParams);

  const { trigger: triggerCreate, isMutating: isCreatingBundle } =
    useCreatePromoBundle();
  const { trigger: triggerUpdate, isMutating: isUpdatingBundle } =
    useUpdatePromoBundle(editingBundle?.id);

  const mapApiBundleToLocal = (apiBundle: APIPromoBundle): PromoBundle => {
    return {
      id: apiBundle.id,
      name: apiBundle.name,
      description: apiBundle.description || "",
      outletId: apiBundle.outletId,
      items: apiBundle.items.map((i) => ({
        productId: i.productId,
        productName: i.productName || "Item",
        quantity: i.quantity,
        price: i.slotPrice || 0,
        variantId: i.variantId || undefined,
        variantName: i.variantName || undefined,
        swappable: i.swappable || false,
        swapOptions: i.swapOptions
          ? i.swapOptions.map((opt) => ({
              productId: opt.productId,
              productName: opt.productName,
              variantId: opt.variantId || undefined,
              variantName: opt.variantName || undefined,
            }))
          : [],
      })),
      pricingType: (apiBundle.pricingType as BundlePricingType) || "fixed",
      pricingValue: apiBundle.pricingValue || 0,
      originalPrice: apiBundle.originalPrice || 0,
      bundlePrice: apiBundle.bundlePrice || 0,
      status: apiBundle.status === "inactive" ? "inactive" : "active",
    };
  };

  const bundles = useMemo(() => {
    return (listData?.data || []).map(mapApiBundleToLocal);
  }, [listData]);

  const filtered = bundles;

  const handleSave = async (bundle: PromoBundle) => {
    const isEdit = editingBundle && !editingBundle.id.startsWith("bundle-");
    const payload: CreatePromoBundlePayload = {
      outletId: bundle.outletId,
      name: bundle.name,
      description: bundle.description,
      price: bundle.bundlePrice,
      status: bundle.status,
      pricingType: bundle.pricingType,
      pricingValue: bundle.pricingValue,
      items: bundle.items.map((item) => ({
        catalogItemId: item.productId,
        quantity: item.quantity,
        variantId: item.variantId || null,
        swappable: item.swappable || false,
        swapOptions: item.swapOptions
          ? item.swapOptions.map((opt) => ({
              catalogItemId: opt.productId,
              variantId: opt.variantId || null,
            }))
          : [],
      })),
    };

    try {
      if (isEdit && editingBundle) {
        await triggerUpdate(payload);
        toast.success(`Bundle "${bundle.name}" updated`);
      } else {
        await triggerCreate(payload);
        toast.success(`Bundle "${bundle.name}" created`);
      }
      mutate();
      setEditingBundle(null);
      setIsCreating(false);
    } catch (e) {
      // toast shown by onError in the hook
    }
  };

  const isInitialLoading = isOutletsLoading || (isBundlesLoading && !listData);
  const isLoading = isInitialLoading;

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
        <Button
          onClick={() => {
            setIsCreating(true);
            setEditingBundle(null);
          }}
          disabled={isLoading}
        >
          <Plus className="w-4 h-4 mr-1" /> Create Bundle
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bundles..."
            className="pl-10 pr-10"
            disabled={isLoading}
          />
          {isBundlesLoading && debouncedSearch.length > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </span>
          )}
        </div>
        <Select
          value={selectedOutlet}
          onValueChange={setSelectedOutlet}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All Outlets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outlets</SelectItem>
            {outlets.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isInitialLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/10 border border-dashed rounded-lg">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">
            Loading promo bundles...
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">No bundles found</p>
          <p className="text-sm mt-1">
            Create your first promo bundle to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((bundle) => (
            <PromoBundleCard
              key={bundle.id}
              bundle={bundle}
              outlets={outlets}
              onEdit={setEditingBundle}
              onRefresh={mutate}
            />
          ))}
        </div>
      )}

      <BundleFormDialog
        open={isCreating || !!editingBundle}
        bundle={editingBundle}
        isSaving={isCreatingBundle || isUpdatingBundle}
        onClose={() => {
          setIsCreating(false);
          setEditingBundle(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}

// ─── Promo Bundle Card Subcomponent ──────────────────────────
interface PromoBundleCardProps {
  bundle: PromoBundle;
  outlets: Outlet[];
  onEdit: (bundle: PromoBundle) => void;
  onRefresh: () => void;
}

function PromoBundleCard({
  bundle,
  outlets,
  onEdit,
  onRefresh,
}: PromoBundleCardProps) {
  const { trigger: triggerDelete, isMutating: isDeleting } =
    useDeletePromoBundle(bundle.id);
  const { trigger: triggerUpdateStatus, isMutating: isUpdatingStatus } =
    useUpdateBundleStatus(bundle.id);

  const outlet = outlets.find((o) => o.id === bundle.outletId);
  const savings = bundle.originalPrice - bundle.bundlePrice;
  const savingsPercent =
    bundle.originalPrice > 0
      ? Math.round((savings / bundle.originalPrice) * 100)
      : 0;
  const swappableCount = bundle.items.filter(
    (i) => i.swappable && i.swapOptions && i.swapOptions.length > 0,
  ).length;

  const handleDelete = async () => {
    try {
      await triggerDelete(undefined);
      toast.success("Bundle deleted");
      onRefresh();
    } catch (e) {
      // Handled
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = bundle.status === "active" ? "inactive" : "active";
    try {
      await triggerUpdateStatus({ status: nextStatus });
      toast.success(`Bundle status updated to ${nextStatus}`);
      onRefresh();
    } catch (e) {
      // Handled
    }
  };

  const isCardMutating = isDeleting || isUpdatingStatus;

  return (
    <Card className={`relative overflow-hidden transition-all ${bundle.status === "inactive" ? "opacity-75 bg-muted/20 border-dashed" : ""}`}>
      {isCardMutating && (
        <div className="absolute inset-0 bg-background/60 z-20 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{bundle.name}</h3>
              {bundle.status === "inactive" && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                  Inactive
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {outlet?.name}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(bundle)}
              disabled={isCardMutating}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={handleDelete}
              disabled={isCardMutating}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          {bundle.description}
        </p>

        <div className="space-y-1.5 mb-3">
          {bundle.items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                {item.quantity}
              </span>
              <span className="text-foreground">{item.productName}</span>
              {item.variantName && (
                <span className="text-muted-foreground text-xs">
                  ({item.variantName})
                </span>
              )}
              {item.swappable &&
                item.swapOptions &&
                item.swapOptions.length > 0 && (
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
            <p className="text-xs text-muted-foreground line-through">
              {formatNaira(bundle.originalPrice)}
            </p>
            <p className="text-lg font-bold text-foreground">
              {formatNaira(bundle.bundlePrice)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs bg-green-500/10 text-green-600 border-green-500/20"
            >
              <Tag className="w-3 h-3 mr-1" />
              Save {savingsPercent}%
            </Badge>
            <Switch
              checked={bundle.status === "active"}
              onCheckedChange={handleToggleStatus}
              disabled={isCardMutating}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Bundle Form Dialog ────────────────────────────────────
interface BundleFormDialogProps {
  open: boolean;
  bundle: PromoBundle | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (bundle: PromoBundle) => void;
}

function BundleFormDialog({
  open,
  bundle,
  isSaving,
  onClose,
  onSave,
}: BundleFormDialogProps) {
  const isEdit = !!bundle;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [outletId, setOutletId] = useState("");
  const [items, setItems] = useState<BundleItem[]>([]);
  const [pricingType, setPricingType] = useState<BundlePricingType>("fixed");
  const [pricingValue, setPricingValue] = useState<number>(0);
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebouncedValue(productSearch, 300);
  const [expandedSwapIdx, setExpandedSwapIdx] = useState<number | null>(null);
  const [swapSearch, setSwapSearch] = useState("");
  const debouncedSwapSearch = useDebouncedValue(swapSearch, 300);

  const { data: outletsData } = useGetOutlets();
  const outlets = outletsData || [];
  const { data: searchItemsResponse, isLoading: searchItemsLoading } =
    useGetItems(
      {
        outletId: outletId || undefined,
        search: debouncedProductSearch.trim() || undefined,
      },
      {
        keepPreviousData: true,
      },
    );

  const { data: swapItemsResponse, isLoading: swapItemsLoading } = useGetItems(
    {
      outletId: outletId || undefined,
      search: debouncedSwapSearch.trim() || undefined,
    },
    {
      keepPreviousData: true,
    },
  );
  // Populate or reset form when open or bundle changes
  useEffect(() => {
    if (open) {
      if (bundle) {
        setName(bundle.name);
        setDescription(bundle.description);
        setOutletId(bundle.outletId);
        setItems(
          bundle.items.map((i) => ({
            ...i,
            swapOptions: i.swapOptions ? [...i.swapOptions] : [],
          })),
        );
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
  }, [open, bundle, outlets]);

  // Available products for selected outlet
  const availableProducts = useMemo<POSProduct[]>(() => {
    if (!searchItemsResponse?.data) return [];
    return searchItemsResponse.data
      .filter((item) => {
        const inStock =
          item.status === "active" ||
          item.status === "good" ||
          item.status === "available" ||
          true;
        return item.outletId === outletId && inStock;
      })
      .map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        categoryId: item.category,
        subcategoryId: item.subcategory,
        image: item.images?.[0],
        barcode: item.sku,
        variants: [],
        inStock: true,
        outletId: item.outletId,
      }));
  }, [searchItemsResponse, outletId]);

  // Swap candidate products for the expanded item
  const swapCandidateProducts = useMemo<POSProduct[]>(() => {
    if (expandedSwapIdx === null || !swapItemsResponse?.data) return [];
    const item = items[expandedSwapIdx];
    if (!item) return [];
    return swapItemsResponse.data
      .filter((p) => {
        const inStock =
          p.status === "active" ||
          p.status === "good" ||
          p.status === "available" ||
          true;
        return p.outletId === outletId && inStock && p.id !== item.productId;
      })
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        categoryId: p.category,
        subcategoryId: p.subcategory,
        image: p.images?.[0],
        barcode: p.sku,
        variants: [],
        inStock: true,
        outletId: p.outletId,
      }));
  }, [swapItemsResponse, outletId, expandedSwapIdx, items]);

  const originalPrice = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = item.price ?? 0;
      return sum + price * item.quantity;
    }, 0);
  }, [items]);

  const bundlePrice = useMemo(() => {
    if (pricingType === "fixed") return pricingValue;
    return Math.round(originalPrice * (1 - pricingValue / 100));
  }, [pricingType, pricingValue, originalPrice]);

  const addProduct = (product: POSProduct) => {
    const existing = items.find(
      (i) => i.productId === product.id && !i.variantId,
    );
    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          swappable: false,
          swapOptions: [],
        },
      ]);
    }
    setProductSearch("");
  };

  const addVariant = (product: POSProduct, variant: POSVariant) => {
    const existing = items.find(
      (i) => i.productId === product.id && i.variantId === variant.id,
    );
    if (existing) {
      setItems((prev) =>
        prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          price: variant.price,
          quantity: 1,
          variantId: variant.id,
          variantName: variant.name,
          swappable: false,
          swapOptions: [],
        },
      ]);
    }
    setProductSearch("");
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    if (expandedSwapIdx === idx) setExpandedSwapIdx(null);
  };

  const updateItemQuantity = (idx: number, qty: number) => {
    if (qty < 1) return removeItem(idx);
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, quantity: qty } : item)),
    );
  };

  const toggleSwappable = (idx: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const newSwappable = !item.swappable;
        return {
          ...item,
          swappable: newSwappable,
          swapOptions: newSwappable ? item.swapOptions || [] : [],
        };
      }),
    );
  };

  const addSwapOption = (
    idx: number,
    product: POSProduct,
    variantId?: string,
    variantName?: string,
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const options = item.swapOptions || [];
        const exists = options.some(
          (o) => o.productId === product.id && o.variantId === variantId,
        );
        if (exists) return item;
        return {
          ...item,
          swapOptions: [
            ...options,
            {
              productId: product.id,
              productName: product.name,
              variantId,
              variantName,
            },
          ],
        };
      }),
    );
    setSwapSearch("");
  };

  const removeSwapOption = (itemIdx: number, optIdx: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== itemIdx) return item;
        return {
          ...item,
          swapOptions: (item.swapOptions || []).filter((_, j) => j !== optIdx),
        };
      }),
    );
  };

  const handleSave = () => {
    if (!name.trim()) return toast.error("Bundle name is required");
    if (items.length < 2)
      return toast.error("Add at least 2 items to create a bundle");
    if (pricingType === "fixed" && pricingValue <= 0)
      return toast.error("Set a bundle price");
    if (
      pricingType === "percentage_discount" &&
      (pricingValue <= 0 || pricingValue > 100)
    )
      return toast.error("Discount must be between 1-100%");

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
    <Sheet open={open} onOpenChange={(o) => { if (!isSaving && !o) onClose(); }}>
      <SheetContent
        side="right"
        className="!w-full !max-w-none lg:!max-w-2xl p-0 flex flex-col overflow-hidden [&>button]:z-10"
      >
        <SheetHeader className="flex-shrink-0 p-4 sm:p-6 pb-0">
          <SheetTitle>
            {isEdit ? "Edit Bundle" : "Create Promo Bundle"}
          </SheetTitle>
          <SheetDescription>
            Group products together and sell at a package price
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-5 px-4 sm:px-6 py-4 pb-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bundle Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Burger Combo Meal"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label>Outlet *</Label>
                <Select
                  value={outletId}
                  onValueChange={(v) => {
                    setOutletId(v);
                    setItems([]);
                  }}
                  disabled={isSaving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {outlets.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what's in this bundle..."
                rows={2}
                disabled={isSaving}
              />
            </div>

            {/* Bundle Items with Modifier Groups */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  Combo Slots
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add items and configure which alternatives cashiers can swap
                  in at the POS
                </p>
              </div>

              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const price = item.price ?? 0;
                    const isExpanded = expandedSwapIdx === idx;
                    const swapCount = item.swapOptions?.length || 0;

                    return (
                      <div
                        key={idx}
                        className="rounded-lg border border-border overflow-hidden"
                      >
                        {/* Item row */}
                        <div className="flex items-center gap-3 p-3 bg-muted/40">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {item.productName}
                              {item.variantName && (
                                <span className="text-muted-foreground font-normal">
                                  {" "}
                                  · {item.variantName}
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatNaira(price)} each
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                updateItemQuantity(idx, item.quantity - 1)
                              }
                              disabled={isSaving}
                            >
                              <span className="text-sm">−</span>
                            </Button>
                            <span className="text-sm font-semibold w-6 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                updateItemQuantity(idx, item.quantity + 1)
                              }
                              disabled={isSaving}
                            >
                              <span className="text-sm">+</span>
                            </Button>
                          </div>
                          <p className="text-sm font-semibold w-20 text-right">
                            {formatNaira(price * item.quantity)}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeItem(idx)}
                            disabled={isSaving}
                          >
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
                                disabled={isSaving}
                              />
                              <span className="text-xs font-medium text-foreground">
                                Allow swap
                              </span>
                              {item.swappable && swapCount > 0 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] h-5"
                                >
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
                                disabled={isSaving}
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                {isExpanded ? "Close" : "Configure"}
                                {isExpanded ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                              </Button>
                            )}
                          </div>

                          {/* Expanded swap options editor */}
                          {item.swappable && isExpanded && (
                            <div className="px-3 pb-3 space-y-2">
                              {/* Current swap options */}
                              {(item.swapOptions || []).length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {(item.swapOptions || []).map(
                                    (opt, optIdx) => (
                                      <div
                                        key={optIdx}
                                        className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 pl-2.5 pr-1 py-1"
                                      >
                                        <span className="text-xs text-foreground">
                                          {opt.productName}
                                          {opt.variantName && (
                                            <span className="text-muted-foreground">
                                              {" "}
                                              · {opt.variantName}
                                            </span>
                                          )}
                                        </span>
                                        <button
                                          disabled={isSaving}
                                          onClick={() =>
                                            removeSwapOption(idx, optIdx)
                                          }
                                          className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-destructive/20 transition-colors"
                                        >
                                          <X className="w-2.5 h-2.5 text-muted-foreground" />
                                        </button>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}

                              {/* Search to add swap options */}
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                <Input
                                  value={swapSearch}
                                  onChange={(e) =>
                                    setSwapSearch(e.target.value)
                                  }
                                  placeholder="Search products to add as swap option..."
                                  className="pl-8 pr-8 h-8 text-sm"
                                  disabled={isSaving}
                                />
                                {swapItemsLoading && (
                                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
                                )}
                              </div>
                              {swapSearch && (
                                <>
                                  {swapCandidateProducts.length > 0 ? (
                                    <div className="border border-border rounded-lg max-h-36 overflow-y-auto bg-popover">
                                      {swapCandidateProducts
                                        .slice(0, 12)
                                        .map((product) => (
                                          <div key={product.id}>
                                            {product.variants &&
                                            product.variants.length > 0
                                              ? product.variants.map((v) => {
                                                  const alreadyAdded = (
                                                    item.swapOptions || []
                                                  ).some(
                                                    (o) =>
                                                      o.productId ===
                                                        product.id &&
                                                      o.variantId === v.id,
                                                  );
                                                  return (
                                                    <ProductSearchRow
                                                      key={v.id}
                                                      productName={product.name}
                                                      variantName={v.name}
                                                      price={v.price}
                                                      disabled={
                                                        alreadyAdded || isSaving
                                                      }
                                                      onClick={() =>
                                                        addSwapOption(
                                                          idx,
                                                          product,
                                                          v.id,
                                                          v.name,
                                                        )
                                                      }
                                                      size="xs"
                                                    />
                                                  );
                                                })
                                              : (() => {
                                                  const alreadyAdded = (
                                                    item.swapOptions || []
                                                  ).some(
                                                    (o) =>
                                                      o.productId ===
                                                        product.id &&
                                                      !o.variantId,
                                                  );
                                                  return (
                                                    <ProductSearchRow
                                                      productName={product.name}
                                                      price={product.price}
                                                      disabled={
                                                        alreadyAdded || isSaving
                                                      }
                                                      onClick={() =>
                                                        addSwapOption(
                                                          idx,
                                                          product,
                                                        )
                                                      }
                                                      size="xs"
                                                    />
                                                  );
                                                })()}
                                          </div>
                                        ))}
                                    </div>
                                  ) : (
                                    !swapItemsLoading && (
                                      <p className="text-xs text-muted-foreground text-center py-2">
                                        No matching products found
                                      </p>
                                    )
                                  )}
                                </>
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
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={
                      outletId
                        ? "Search products to add..."
                        : "Select an outlet first"
                    }
                    className="pl-10 pr-10"
                    disabled={!outletId || isSaving}
                  />
                  {searchItemsLoading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground">
                      <Spinner className="w-4 h-4 text-muted-foreground" />
                    </span>
                  )}
                </div>
                {productSearch && (
                  <>
                    {availableProducts.length > 0 ? (
                      <div className="border border-border rounded-lg max-h-48 overflow-y-auto bg-popover">
                        {availableProducts.slice(0, 15).map((product) => (
                          <div key={product.id}>
                            {product.variants && product.variants.length > 0 ? (
                              product.variants.map((v) => (
                                <ProductSearchRow
                                  key={v.id}
                                  productName={product.name}
                                  variantName={v.name}
                                  price={v.price}
                                  disabled={isSaving}
                                  onClick={() => addVariant(product, v)}
                                  size="sm"
                                />
                              ))
                            ) : (
                              <ProductSearchRow
                                productName={product.name}
                                price={product.price}
                                disabled={isSaving}
                                onClick={() => addProduct(product)}
                                size="sm"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      !searchItemsLoading && (
                        <div className="border border-border rounded-lg bg-popover p-3 text-center text-sm text-muted-foreground">
                          No products found.
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Pricing</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pricing Method</Label>
                  <Select
                    value={pricingType}
                    onValueChange={(v) =>
                      setPricingType(v as BundlePricingType)
                    }
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Price</SelectItem>
                      <SelectItem value="percentage_discount">
                        Percentage Discount
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    {pricingType === "fixed"
                      ? "Bundle Price (₦)"
                      : "Discount (%)"}
                  </Label>
                  <NumericInput
                    value={pricingValue || 0}
                    onChange={(val) => setPricingValue(val || 0)}
                    placeholder={
                      pricingType === "fixed" ? "e.g. 7500" : "e.g. 15"
                    }
                    min={0}
                    max={
                      pricingType === "percentage_discount" ? 100 : undefined
                    }
                    precision={pricingType === "fixed" ? 2 : 0}
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Price Preview */}
              {items.length >= 2 && (
                <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-2 relative overflow-hidden">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items Total</span>
                    <span className="text-foreground">
                      {formatNaira(originalPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {pricingType === "fixed"
                        ? "Bundle Price"
                        : `${pricingValue}% Discount`}
                    </span>
                    <span className="text-foreground font-semibold">
                      {formatNaira(bundlePrice)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border">
                    <span className="text-green-600 font-medium">
                      Customer Saves
                    </span>
                    <span className="text-green-600 font-semibold">
                      {formatNaira(originalPrice - bundlePrice)} (
                      {originalPrice > 0
                        ? Math.round(
                            ((originalPrice - bundlePrice) / originalPrice) *
                              100,
                          )
                        : 0}
                      %)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 p-4 sm:p-6 pt-3 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="w-full sm:w-auto"
            isLoading={isSaving}
          >
            {isEdit ? "Update Bundle" : "Create Bundle"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
