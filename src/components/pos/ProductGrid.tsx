import { useState, useEffect, useRef, useCallback } from "react";
import { usePOS } from "@/contexts/POSContext";
import { posProducts, posCategories, type POSProduct } from "@/data/posData";
import { formatNaira } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ScanLine, X } from "lucide-react";
import { toast } from "sonner";
import VariantExtrasDialog from "./VariantExtrasDialog";

export default function ProductGrid() {
  const { currentOutlet, addToCart } = usePOS();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogProduct, setDialogProduct] = useState<POSProduct | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Barcode scan handler: finds product/variant by barcode/SKU and adds to cart directly
  const handleBarcodeScan = useCallback((barcode: string) => {
    const outletProducts = posProducts.filter(p => !currentOutlet || p.outletId === currentOutlet.id);

    // First check variant SKUs
    for (const product of outletProducts) {
      if (!product.inStock) continue;
      if (product.variants) {
        const matchedVariant = product.variants.find(v => v.sku === barcode);
        if (matchedVariant) {
          addToCart({
            productId: product.id,
            productName: product.name,
            categoryId: product.categoryId,
            variantId: matchedVariant.id,
            variantName: matchedVariant.name,
            extras: [],
            quantity: 1,
            unitPrice: matchedVariant.price,
            totalPrice: matchedVariant.price,
          });
          toast.success(`Added ${product.name} - ${matchedVariant.name}`);
          return true;
        }
      }
    }

    // Then check product barcode
    const found = outletProducts.find(p => p.barcode === barcode && p.inStock);
    if (found) {
      if ((found.variants && found.variants.length > 0) || (found.extras && found.extras.length > 0)) {
        setDialogProduct(found);
      } else {
        addToCart({
          productId: found.id,
          productName: found.name,
          categoryId: found.categoryId,
          extras: [],
          quantity: 1,
          unitPrice: found.price,
          totalPrice: found.price,
        });
        toast.success(`Added ${found.name}`);
      }
      return true;
    }

    return false;
  }, [currentOutlet, addToCart]);

  // Hardware barcode scanner listener (rapid keystrokes ending with Enter)
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement;
      if (active && active !== searchInputRef.current && active.tagName === "INPUT") return;

      if (e.key === "Enter" && bufferRef.current.length >= 4) {
        const scanned = bufferRef.current;
        bufferRef.current = "";
        if (handleBarcodeScan(scanned)) {
          setSearch("");
          e.preventDefault();
        }
        return;
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { bufferRef.current = ""; }, 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBarcodeScan]);

  // Filter categories for current outlet
  const outletCategories = posCategories.filter(c => !c.outletId || c.outletId === currentOutlet?.id);

  // Filter products for current outlet
  const products = posProducts.filter(p => {
    if (currentOutlet && p.outletId !== currentOutlet.id) return false;
    if (search) return p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
    if (!selectedCategory) return true;
    if (selectedSubcategory) return p.categoryId === selectedCategory && p.subcategoryId === selectedSubcategory;
    return p.categoryId === selectedCategory;
  });

  const currentCategory = outletCategories.find(c => c.id === selectedCategory);

  const handleProductClick = (product: POSProduct) => {
    if ((product.variants && product.variants.length > 0) || (product.extras && product.extras.length > 0)) {
      setDialogProduct(product);
    } else {
      addToCart({
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
    addToCart({
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

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search) {
      if (handleBarcodeScan(search)) {
        setSearch("");
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search or scan barcode..."
            className="pl-10 pr-10 h-10"
          />
          {search ? (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <ScanLine className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="border-b border-border">
        <div className="w-full overflow-x-auto">
          <div className="flex gap-1.5 p-2 pb-2">
            <button
              onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}
              className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                !selectedCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              All
            </button>
            {outletCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(null); }}
                className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {currentCategory?.subcategories && (
          <div className="w-full overflow-x-auto">
            <div className="flex gap-1.5 px-2 pb-2">
              <button
                onClick={() => setSelectedSubcategory(null)}
                className={`shrink-0 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  !selectedSubcategory ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All {currentCategory.name}
              </button>
              {currentCategory.subcategories.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className={`shrink-0 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    selectedSubcategory === sub.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-3">
          {products.map(product => (
            <button
              key={product.id}
              onClick={() => product.inStock && handleProductClick(product)}
              disabled={!product.inStock}
              className={`relative flex flex-col items-start p-3 rounded-xl border text-left transition-all active:scale-[0.97] ${
                product.inStock
                  ? "bg-card border-border hover:border-primary/30 hover:shadow-md"
                  : "bg-muted/50 border-border/50 opacity-60 cursor-not-allowed"
              }`}
            >
              {!product.inStock && (
                <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">Out</Badge>
              )}
              <span className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{product.name}</span>
              <span className="text-xs text-muted-foreground mt-1">
                {product.variants?.length ? `From ${formatNaira(Math.min(...product.variants.map(v => v.price)))}` : formatNaira(product.price)}
              </span>
              {product.variants && product.variants.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {product.variants.map(v => (
                    <span key={v.id} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{v.name}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Search className="w-8 h-8 mb-2" />
            <p className="text-sm">No products found</p>
          </div>
        )}
      </ScrollArea>

      <VariantExtrasDialog
        product={dialogProduct}
        open={!!dialogProduct}
        onClose={() => setDialogProduct(null)}
        onConfirm={handleConfirmVariantExtras}
      />
    </div>
  );
}
