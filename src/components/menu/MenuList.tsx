import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Edit, Trash2, Copy, ChevronLeft, ChevronRight, Tag, PackageCheck, Camera, Printer, Package, ChefHat, Sparkles, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { formatNaira } from "@/lib/currency";
import type { MenuItem } from "./MenuItemForm";
import type { Outlet } from "@/data/outlets";

interface MenuListProps {
  items: MenuItem[];
  selectedSubcategory: string | null;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onClone: (item: MenuItem) => void;
  showOutlet?: boolean;
  readOnly?: boolean;
  outlets?: Outlet[];
}

export default function MenuList({ items, selectedSubcategory, onEdit, onDelete, onClone, showOutlet = false, readOnly = false, outlets = [] }: MenuListProps) {
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedForPrint, setSelectedForPrint] = useState<Set<string>>(new Set());
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);

  // External barcode scanner listener
  const bufferRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (document.activeElement && document.activeElement !== inputRef.current &&
        (document.activeElement as HTMLElement).tagName === "INPUT") return;
    if (e.key === "Enter" && bufferRef.current.length >= 4) {
      setSearch(bufferRef.current);
      bufferRef.current = "";
      toast.success("Barcode scanned!");
      e.preventDefault();
      return;
    }
    if (e.key.length === 1) {
      bufferRef.current += e.key;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => { bufferRef.current = ""; }, 100);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Camera scanner
  useEffect(() => {
    if (!cameraOpen || !scannerRef.current) return;
    let scanner: any = null;
    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        scanner = new Html5Qrcode("menu-barcode-reader");
        html5QrCodeRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText: string) => {
            setSearch(decodedText);
            toast.success("Barcode scanned!");
            scanner.stop().catch(() => {});
            setCameraOpen(false);
          },
          () => {}
        );
      } catch {
        toast.error("Camera access denied or not available");
        setCameraOpen(false);
      }
    };
    const timer = setTimeout(initScanner, 300);
    return () => {
      clearTimeout(timer);
      if (scanner) scanner.stop().catch(() => {});
    };
  }, [cameraOpen]);

  const stopCamera = () => {
    if (html5QrCodeRef.current) html5QrCodeRef.current.stop().catch(() => {});
    setCameraOpen(false);
  };

  const getOutletName = (outletId?: string) => {
    if (!outletId) return "—";
    return outlets.find((o) => o.id === outletId)?.name ?? "—";
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        (!selectedSubcategory || item.category === selectedSubcategory) &&
        (item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.subcategory.toLowerCase().includes(q) ||
          item.variants.some((v) => v.sku.toLowerCase().includes(q)))
    );
  }, [items, selectedSubcategory, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * rowsPerPage;
  const pageItems = filtered.slice(startIdx, startIdx + rowsPerPage);

  useMemo(() => setCurrentPage(1), [search, selectedSubcategory, rowsPerPage]);

  const colCount = 10 + (showOutlet ? 1 : 0) + (readOnly ? 0 : 1);

  // Print helpers
  const togglePrintSelect = (id: string) => {
    setSelectedForPrint((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedForPrint.size === items.length) {
      setSelectedForPrint(new Set());
    } else {
      setSelectedForPrint(new Set(items.map((i) => i.id)));
    }
  };

  const printableItems = items.filter((i) => selectedForPrint.has(i.id));

  const handlePrint = () => {
    const labels: { name: string; variant: string; sku: string; price: string }[] = [];
    printableItems.forEach((item) => {
      if (item.variants.length > 0) {
        item.variants.forEach((v) => {
          if (v.sku) labels.push({ name: item.name, variant: v.name, sku: v.sku, price: formatNaira(v.price) });
        });
      } else if (item.sku) {
        labels.push({ name: item.name, variant: "", sku: item.sku, price: formatNaira(item.price) });
      }
    });

    if (labels.length === 0) {
      toast.error("No items with SKU/barcode to print");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Pop-up blocked"); return; }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Barcode Labels</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; padding: 8mm; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
        .label {
          border: 1px solid #ccc; border-radius: 4px; padding: 3mm;
          text-align: center; page-break-inside: avoid; min-height: 25mm;
          display: flex; flex-direction: column; justify-content: center; gap: 1mm;
        }
        .label .name { font-size: 9pt; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .label .variant { font-size: 7pt; color: #666; }
        .label .barcode { font-size: 14pt; letter-spacing: 2px; font-family: 'Libre Barcode 39', 'Courier New', monospace; }
        .label .sku-text { font-size: 7pt; color: #333; }
        .label .price { font-size: 10pt; font-weight: bold; }
        @media print { body { padding: 0; } .no-print { display: none; } }
      </style>
      <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
      </head><body>
      <div class="no-print" style="margin-bottom:8mm;text-align:center">
        <button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer">Print Labels</button>
        <span style="margin-left:12px;font-size:13px;color:#666">${labels.length} label(s)</span>
      </div>
      <div class="grid">
        ${labels.map((l) => `
          <div class="label">
            <div class="name">${l.name}</div>
            ${l.variant ? `<div class="variant">${l.variant}</div>` : ""}
            <div class="barcode">*${l.sku}*</div>
            <div class="sku-text">${l.sku}</div>
            <div class="price">${l.price}</div>
          </div>
        `).join("")}
      </div>
      </body></html>
    `);
    printWindow.document.close();
    setPrintOpen(false);
    toast.success(`${labels.length} barcode label(s) ready to print`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search by name, SKU, category, or scan barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setCameraOpen(true)}
            title="Scan with camera"
          >
            <Camera className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setSelectedForPrint(new Set(items.map((i) => i.id))); setPrintOpen(true); }}>
            <Printer className="h-4 w-4" /> Print Barcodes
          </Button>
          <span className="text-xs text-muted-foreground whitespace-nowrap">Rows</span>
          <Select value={String(rowsPerPage)} onValueChange={(v) => setRowsPerPage(Number(v))}>
            <SelectTrigger className="w-[70px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((n) => (<SelectItem key={n} value={String(n)}>{n}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {showOutlet && <TableHead>Outlet</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Sale Price</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Status</TableHead>
                {!readOnly && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((item) => {
                const hasVariants = item.variants?.length > 0;

                if (hasVariants) {
                  const itemType = item.itemType || "simple";
                  const pricingStrategy = item.pricingStrategy || "base";
                  const typeIcon = itemType === "composite" ? <ChefHat className="h-3 w-3" /> : itemType === "service" ? <Sparkles className="h-3 w-3" /> : <Package className="h-3 w-3" />;
                  const typeLabel = itemType === "composite" ? "Composite" : itemType === "service" ? "Service" : "Simple";
                  const pricingLabel = pricingStrategy === "open" ? "Open" : pricingStrategy === "variant" ? "Variant" : "Base";

                  return item.variants.map((v, vIdx) => (
                    <TableRow key={`${item.id}-${v.id}`} className={vIdx > 0 ? "border-t-0" : ""}>
                      {vIdx === 0 ? (
                        <TableCell rowSpan={item.variants.length} className="align-top border-r border-border/50">
                          <div className="flex items-center gap-2.5">
                            {item.images?.length > 0 ? (
                              <img src={item.images[0]} alt="" className="h-8 w-8 rounded-md object-cover shrink-0" />
                            ) : (
                              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-muted-foreground">{item.name.charAt(0)}</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                              {item.sellingUnit && <p className="text-[10px] text-muted-foreground">Unit: {item.sellingUnit}</p>}
                            </div>
                          </div>
                        </TableCell>
                      ) : null}
                      {showOutlet && vIdx === 0 ? (
                        <TableCell rowSpan={item.variants.length} className="align-top">
                          <Badge variant="outline" className="text-xs whitespace-nowrap">{getOutletName(item.outletId)}</Badge>
                        </TableCell>
                      ) : showOutlet && vIdx > 0 ? null : null}
                      {vIdx === 0 ? (
                        <TableCell rowSpan={item.variants.length} className="align-top">
                          <Badge variant="outline" className="text-[10px] gap-1 whitespace-nowrap">
                            {typeIcon} {typeLabel}
                          </Badge>
                        </TableCell>
                      ) : null}
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{v.sku || "—"}</TableCell>
                      <TableCell className="text-sm font-medium">{v.name}</TableCell>
                      {vIdx === 0 ? (
                        <TableCell rowSpan={item.variants.length} className="align-top">
                          <Badge variant={pricingStrategy === "open" ? "secondary" : "outline"} className="text-[10px] gap-1 whitespace-nowrap">
                            {pricingStrategy === "open" && <DollarSign className="h-3 w-3" />}
                            {pricingLabel}
                          </Badge>
                        </TableCell>
                      ) : null}
                      <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                        {item.costPrice != null ? formatNaira(item.costPrice) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-heading font-semibold text-sm whitespace-nowrap">
                        {formatNaira(v.price ?? 0)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {v.salePrice != null ? (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Tag className="h-3 w-3" />{formatNaira(v.salePrice)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">{v.quantity ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={v.status === "active" ? "default" : "secondary"} className="text-xs">{v.status}</Badge>
                      </TableCell>
                      {!readOnly && vIdx === 0 ? (
                        <TableCell rowSpan={item.variants.length} className="align-top border-l border-border/50">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => onClone(item)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Clone"><Copy className="h-3.5 w-3.5" /></button>
                            <button onClick={() => onEdit(item)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Edit"><Edit className="h-3.5 w-3.5" /></button>
                            <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </TableCell>
                      ) : !readOnly && vIdx > 0 ? null : null}
                    </TableRow>
                  ));
                }

                const itemType = item.itemType || "simple";
                const pricingStrategy = item.pricingStrategy || "base";
                const typeIcon = itemType === "composite" ? <ChefHat className="h-3 w-3" /> : itemType === "service" ? <Sparkles className="h-3 w-3" /> : <Package className="h-3 w-3" />;
                const typeLabel = itemType === "composite" ? "Composite" : itemType === "service" ? "Service" : "Simple";
                const pricingLabel = pricingStrategy === "open" ? "Open" : pricingStrategy === "variant" ? "Variant" : "Base";

                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {item.images?.length > 0 ? (
                          <img src={item.images[0]} alt="" className="h-8 w-8 rounded-md object-cover shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-muted-foreground">{item.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                          {item.sellingUnit && <p className="text-[10px] text-muted-foreground">Unit: {item.sellingUnit}</p>}
                        </div>
                      </div>
                    </TableCell>
                    {showOutlet && (
                      <TableCell>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">{getOutletName(item.outletId)}</Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] gap-1 whitespace-nowrap">
                        {typeIcon} {typeLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{item.sku || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">—</TableCell>
                    <TableCell>
                      <Badge variant={pricingStrategy === "open" ? "secondary" : "outline"} className="text-[10px] gap-1 whitespace-nowrap">
                        {pricingStrategy === "open" && <DollarSign className="h-3 w-3" />}
                        {pricingLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                      {item.costPrice != null ? formatNaira(item.costPrice) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-heading font-semibold text-sm whitespace-nowrap">
                      {pricingStrategy === "open" ? <span className="text-muted-foreground italic text-xs">Open</span> : formatNaira(item.price ?? 0)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.salePrice != null ? (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Tag className="h-3 w-3" />{formatNaira(item.salePrice)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">{item.quantity ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-xs">{item.status}</Badge>
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => onClone(item)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Clone"><Copy className="h-3.5 w-3.5" /></button>
                          <button onClick={() => onEdit(item)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Edit"><Edit className="h-3.5 w-3.5" /></button>
                          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={colCount} className="text-center py-8 text-muted-foreground text-sm">No menu items found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
          <span className="text-muted-foreground text-xs">
            {filtered.length > 0 ? `${startIdx + 1}–${Math.min(startIdx + rowsPerPage, filtered.length)} of ${filtered.length}` : "0 items"}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage <= 1} onClick={() => setCurrentPage(safePage - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) page = i + 1;
              else if (safePage <= 3) page = i + 1;
              else if (safePage >= totalPages - 2) page = totalPages - 4 + i;
              else page = safePage - 2 + i;
              return (
                <Button key={page} variant={safePage === page ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setCurrentPage(page)}>
                  {page}
                </Button>
              );
            })}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Camera Scanner Dialog */}
      <Dialog open={cameraOpen} onOpenChange={(open) => { if (!open) stopCamera(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-accent" />
              Scan Barcode
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div id="menu-barcode-reader" ref={scannerRef} className="w-full min-h-[250px] rounded-lg overflow-hidden bg-muted" />
            <p className="text-sm text-muted-foreground text-center">Point your camera at the barcode</p>
            <Button variant="outline" className="w-full" onClick={stopCamera}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Print Dialog */}
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              Print Barcode Labels
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedForPrint.size === items.length ? "Deselect All" : "Select All"}
              </Button>
              <span className="text-sm text-muted-foreground">{selectedForPrint.size} item(s) selected</span>
            </div>
            <div className="space-y-1 max-h-[40vh] overflow-y-auto border border-border rounded-lg p-2">
              {items.map((item) => {
                const skuCount = item.variants.length > 0
                  ? item.variants.filter((v) => v.sku).length
                  : item.sku ? 1 : 0;
                return (
                  <label key={item.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedForPrint.has(item.id)}
                      onChange={() => togglePrintSelect(item.id)}
                      className="rounded border-input"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.variants.length > 0 ? `${item.variants.length} variant(s)` : "No variants"} · {skuCount} barcode(s)
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
            <Button className="w-full" onClick={handlePrint} disabled={selectedForPrint.size === 0}>
              <Printer className="h-4 w-4 mr-2" />
              Print {selectedForPrint.size > 0 ? `${selectedForPrint.size} Item(s)` : "Labels"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
