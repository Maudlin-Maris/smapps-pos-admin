import { useState, useEffect, useRef, useCallback } from "react";
import { usePOS } from "@/contexts/POSContext";
import { posProducts, posCategories, type POSProduct } from "@/data/posData";
import { promoBundles, type PromoBundle } from "@/data/promoBundles";
import { formatNaira } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ScanLine, Camera, X, Gift, Tag } from "lucide-react";
import { toast } from "sonner";
import VariantExtrasDialog from "./VariantExtrasDialog";

const MOBILE_REAR_CAMERA_REGEX = /back|rear|environment|world|traseira/i;

export default function ProductGrid() {
  const { currentOutlet, addToCart } = usePOS();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogProduct, setDialogProduct] = useState<POSProduct | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const permissionPrimedRef = useRef(false);

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

  // Active bundles for this outlet
  const outletBundles = promoBundles.filter(b => b.status === "active" && (!currentOutlet || b.outletId === currentOutlet.id));
  const showBundlesTab = outletBundles.length > 0;
  const isBundlesTab = selectedCategory === "__bundles__";

  // Filter products for current outlet
  const products = isBundlesTab ? [] : posProducts.filter(p => {
    if (currentOutlet && p.outletId !== currentOutlet.id) return false;
    if (search) return p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search);
    if (!selectedCategory) return true;
    if (selectedSubcategory) return p.categoryId === selectedCategory && p.subcategoryId === selectedSubcategory;
    return p.categoryId === selectedCategory;
  });

  const currentCategory = outletCategories.find(c => c.id === selectedCategory);

  const handleBundleClick = (bundle: PromoBundle) => {
    const bundleInstanceId = `bundle-${Date.now()}`;
    // Add each bundle item as a cart item, distributing price proportionally
    const itemPrices = bundle.items.map(item => {
      const prod = posProducts.find(p => p.id === item.productId);
      const variant = item.variantId ? prod?.variants?.find(v => v.id === item.variantId) : undefined;
      return (variant?.price ?? prod?.price ?? 0) * item.quantity;
    });
    const totalOriginal = itemPrices.reduce((s, p) => s + p, 0);

    bundle.items.forEach((item, idx) => {
      const prod = posProducts.find(p => p.id === item.productId);
      if (!prod) return;
      const variant = item.variantId ? prod.variants?.find(v => v.id === item.variantId) : undefined;
      // Proportional price distribution
      const proportion = totalOriginal > 0 ? itemPrices[idx] / totalOriginal : 1 / bundle.items.length;
      const itemBundlePrice = Math.round(bundle.bundlePrice * proportion);

      addToCart({
        productId: prod.id,
        productName: prod.name,
        categoryId: prod.categoryId,
        variantId: variant?.id,
        variantName: variant?.name,
        extras: [],
        quantity: item.quantity,
        unitPrice: Math.round(itemBundlePrice / item.quantity),
        totalPrice: itemBundlePrice,
        bundleId: bundleInstanceId,
        bundleName: bundle.name,
      });
    });
    toast.success(`Added "${bundle.name}" bundle`);
  };

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
    selectedExtras: { id: string; name: string; price: number; quantity: number }[],
    unitPrice: number
  ) => {
    if (!dialogProduct) return;
    const extrasTotal = selectedExtras.reduce((s, e) => s + e.price * e.quantity, 0);
    const total = unitPrice + extrasTotal;
    addToCart({
      productId: dialogProduct.id,
      productName: dialogProduct.name,
      categoryId: dialogProduct.categoryId,
      variantId,
      variantName,
      extras: selectedExtras,
      quantity: 1,
      unitPrice: total,
      totalPrice: total,
    });
    setDialogProduct(null);
  };

  // Detect mobile device for camera facing mode
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const primeCameraPermission = useCallback(async () => {
    if (permissionPrimedRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera not supported in this browser. Try opening the app directly in a browser tab.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: isMobile
        ? { facingMode: { ideal: "environment" } }
        : true,
      audio: false,
    });

    stream.getTracks().forEach((track) => track.stop());
    permissionPrimedRef.current = true;
  }, [isMobile]);

  const startCamera = useCallback(async () => {
    try {
      await primeCameraPermission();
      setCameraOpen(true);
    } catch (err: any) {
      const msg = String(err?.message || err || "");
      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        toast.error("Camera permission denied. Please allow camera access in Chrome settings.");
      } else {
        toast.error(msg || "Unable to access the camera.");
      }
    }
  }, [primeCameraPermission]);

  const stopCamera = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {});
      html5QrCodeRef.current = null;
    }
    setCameraOpen(false);
  };

  useEffect(() => {
    if (!cameraOpen || !scannerRef.current) return;
    let scanner: any = null;
    const initScanner = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast.error("Camera not supported in this browser. Try opening the app directly in a browser tab.");
          setCameraOpen(false);
          return;
        }

        const { Html5Qrcode } = await import("html5-qrcode");
        
        // Ensure the DOM element exists
        const readerEl = document.getElementById("pos-barcode-reader");
        if (!readerEl) {
          toast.error("Scanner element not ready. Please try again.");
          setCameraOpen(false);
          return;
        }

        scanner = new Html5Qrcode("pos-barcode-reader");
        html5QrCodeRef.current = scanner;
        
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: isMobile
            ? { facingMode: { ideal: "environment" } }
            : { facingMode: { ideal: "user" } },
        };

        const onScanSuccess = (decodedText: string) => {
          setSearch(decodedText);
          const found = handleBarcodeScan(decodedText);
          if (!found) {
            toast.info(`Scanned: ${decodedText} — no matching product found`);
          }
          setTimeout(() => setSearch(""), 300);
          scanner?.stop().catch(() => {});
          setCameraOpen(false);
        };

        const cameras = await Html5Qrcode.getCameras().catch(() => []);
        const preferredCamera = isMobile
          ? cameras.find((camera: { label?: string }) => MOBILE_REAR_CAMERA_REGEX.test(camera.label ?? "")) ?? cameras[cameras.length - 1]
          : cameras[0];

        if (preferredCamera?.id) {
          await scanner.start(preferredCamera.id, config, onScanSuccess, () => {});
        } else {
          await scanner.start(
            isMobile ? { facingMode: { ideal: "environment" } } : { facingMode: { ideal: "user" } },
            config,
            onScanSuccess,
            () => {}
          );
        }
      } catch (err: any) {
        console.error("Camera scanner error:", err);
        const msg = String(err?.message || err || "");
        if (msg.includes("Permission") || msg.includes("NotAllowed")) {
          toast.error("Camera permission denied. Please allow camera access in your browser settings.");
        } else if (msg.includes("NotFound") || msg.includes("DevicesNotFound") || msg.includes("Requested device not found")) {
          toast.error("No camera found on this device.");
        } else if (msg.includes("NotReadableError") || msg.includes("Could not start video source")) {
          toast.error("Camera is in use by another app. Close other camera apps and try again.");
        } else {
          toast.error(`Camera error: ${msg.slice(0, 100)}`);
        }
        setCameraOpen(false);
      }
    };
    const timer = setTimeout(initScanner, 150);
    return () => {
      clearTimeout(timer);
      if (scanner) scanner.stop().catch(() => {});
    };
  }, [cameraOpen, handleBarcodeScan, isMobile]);

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
        <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
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
        <Button type="button" variant="outline" size="icon" onClick={startCamera} title="Scan with camera" className="shrink-0 h-10 w-10">
          <Camera className="h-4 w-4" />
        </Button>
            {showBundlesTab && (
              <button
                onClick={() => { setSelectedCategory("__bundles__"); setSelectedSubcategory(null); }}
                className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isBundlesTab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                Combos
              </button>
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
        {isBundlesTab ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 p-3">
            {outletBundles.map(bundle => {
              const savings = bundle.originalPrice - bundle.bundlePrice;
              const savingsPercent = bundle.originalPrice > 0 ? Math.round((savings / bundle.originalPrice) * 100) : 0;
              return (
                <button
                  key={bundle.id}
                  onClick={() => handleBundleClick(bundle)}
                  className="relative flex flex-col items-start p-3 rounded-xl border text-left transition-all active:scale-[0.97] bg-card border-border hover:border-primary/30 hover:shadow-md"
                >
                  <Badge className="absolute top-2 right-2 text-[10px] bg-primary/10 text-primary border-primary/20" variant="outline">
                    <Tag className="w-2.5 h-2.5 mr-0.5" />
                    {savingsPercent}% off
                  </Badge>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Gift className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-semibold text-foreground line-clamp-1">{bundle.name}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{bundle.description}</p>
                  <div className="flex items-center gap-2 mt-auto">
                    <span className="text-xs text-muted-foreground line-through">{formatNaira(bundle.originalPrice)}</span>
                    <span className="text-sm font-bold text-foreground">{formatNaira(bundle.bundlePrice)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-3">
              {/* Show bundle cards at top when on "All" tab */}
              {!selectedCategory && outletBundles.slice(0, 2).map(bundle => {
                const savings = bundle.originalPrice - bundle.bundlePrice;
                const savingsPercent = bundle.originalPrice > 0 ? Math.round((savings / bundle.originalPrice) * 100) : 0;
                return (
                  <button
                    key={bundle.id}
                    onClick={() => handleBundleClick(bundle)}
                    className="relative flex flex-col items-start p-3 rounded-xl border text-left transition-all active:scale-[0.97] bg-primary/5 border-primary/20 hover:border-primary/40 hover:shadow-md col-span-1"
                  >
                    <Badge className="absolute top-2 right-2 text-[10px] bg-primary/10 text-primary border-primary/20" variant="outline">
                      <Tag className="w-2.5 h-2.5 mr-0.5" />
                      {savingsPercent}% off
                    </Badge>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Gift className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-semibold text-foreground line-clamp-1">{bundle.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground line-through">{formatNaira(bundle.originalPrice)}</span>
                      <span className="text-sm font-bold text-foreground">{formatNaira(bundle.bundlePrice)}</span>
                    </div>
                  </button>
                );
              })}
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
            {products.length === 0 && !selectedCategory && outletBundles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Search className="w-8 h-8 mb-2" />
                <p className="text-sm">No products found</p>
              </div>
            )}
          </>
        )}
      </ScrollArea>

      <VariantExtrasDialog
        product={dialogProduct}
        open={!!dialogProduct}
        onClose={() => setDialogProduct(null)}
        onConfirm={handleConfirmVariantExtras}
      />

      <Dialog open={cameraOpen} onOpenChange={(open) => { if (!open) stopCamera(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-accent" />
              Scan Barcode
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <div
                id="pos-barcode-reader"
                ref={scannerRef}
                className="w-full min-h-[300px] rounded-lg overflow-hidden bg-black [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[280px] h-[160px] border-2 border-primary/60 rounded-lg" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {isMobile ? "Point your back camera at the barcode" : "Hold the barcode up to your camera"}
            </p>
            <Button variant="outline" className="w-full" onClick={stopCamera}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
