import { useState } from "react";
import { usePOS } from "@/contexts/POSContext";
import { posProducts, posCategories, type POSProduct, type POSExtra } from "@/data/posData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, ScanLine, X } from "lucide-react";
import VariantExtrasDialog from "./VariantExtrasDialog";

export default function ProductGrid() {
  const { currentOutlet, addToCart } = usePOS();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogProduct, setDialogProduct] = useState<POSProduct | null>(null);

  const products = posProducts.filter(p => {
    if (currentOutlet && p.outletId !== currentOutlet.id) {
      // For demo, show all products
    }
    if (search) return p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
    if (!selectedCategory) return true;
    if (selectedSubcategory) return p.categoryId === selectedCategory && p.subcategoryId === selectedSubcategory;
    return p.categoryId === selectedCategory;
  });

  const currentCategory = posCategories.find(c => c.id === selectedCategory);

  const handleProductClick = (product: POSProduct) => {
    if ((product.variants && product.variants.length > 0) || (product.extras && product.extras.length > 0)) {
      setDialogProduct(product);
    } else {
      addToCart({
        productId: product.id,
        productName: product.name,
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
    const extrasTotal = selectedExtras.reduce((s, e) => s + e.price, 0);
    const total = unitPrice + extrasTotal;
    addToCart({
      productId: dialogProduct.id,
      productName: dialogProduct.name,
      variantId,
      variantName,
      extras: selectedExtras,
      quantity: 1,
      unitPrice: total,
      totalPrice: total,
    });
    setDialogProduct(null);
  };

  // Handle barcode scanner input
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && search) {
      const found = posProducts.find(p => p.barcode === search);
      if (found) {
        handleProductClick(found);
        setSearch("");
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
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

      {/* Categories */}
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
            {posCategories.map(cat => (
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
        </ScrollArea>

        {/* Subcategories */}
        {currentCategory?.subcategories && (
          <ScrollArea className="w-full" orientation="horizontal">
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
          </ScrollArea>
        )}
      </div>

      {/* Product grid */}
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
                {product.variants?.length ? `From $${Math.min(...product.variants.map(v => v.price)).toFixed(2)}` : `$${product.price.toFixed(2)}`}
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

      {/* Variant/Extras dialog */}
      <VariantExtrasDialog
        product={dialogProduct}
        open={!!dialogProduct}
        onClose={() => setDialogProduct(null)}
        onConfirm={handleConfirmVariantExtras}
      />
    </div>
  );
}
