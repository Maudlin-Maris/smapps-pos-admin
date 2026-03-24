import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Copy, ScanBarcode, Package, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { outlets } from "@/data/outlets";
import { getFeatures } from "@/data/businessTypes";
import BarcodeScanner from "@/components/inventory/BarcodeScanner";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "@/components/inventory/PaginationControls";

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  status: "active" | "inactive";
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  barcode: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  status: "active" | "inactive";
  outletId: string;
  variants: ProductVariant[];
  expiryDate?: string;
  batchNumber?: string;
  images: string[];
}

const initialProducts: Product[] = [
  { id: "p1", name: "Paracetamol 500mg", description: "Pain relief tablets", category: "OTC Medicines", sku: "PM-500", barcode: "8901234567890", price: 350, costPrice: 200, stock: 150, minStock: 50, status: "active", outletId: "outlet-4", variants: [], expiryDate: "2027-06-15", batchNumber: "BT-2026-001", images: [] },
  { id: "p2", name: "Cotton T-Shirt", description: "Premium cotton crew neck", category: "Tops", sku: "TS-001", barcode: "7612345678901", price: 4500, costPrice: 2000, stock: 80, minStock: 20, status: "active", outletId: "outlet-2", variants: [
    { id: "pv1", name: "Small", sku: "TS-001-S", price: 4500, stock: 30, status: "active" },
    { id: "pv2", name: "Medium", sku: "TS-001-M", price: 4500, stock: 30, status: "active" },
    { id: "pv3", name: "Large", sku: "TS-001-L", price: 4800, stock: 20, status: "active" },
  ], images: [] },
  { id: "p3", name: "Cabernet Sauvignon 2020", description: "Chilean red wine, full-bodied", category: "Red Wine", sku: "WN-CS20", barcode: "3456789012345", price: 12000, costPrice: 7500, stock: 24, minStock: 10, status: "active", outletId: "outlet-2", variants: [], batchNumber: "VIN-2020-CS", images: [] },
  { id: "p4", name: "Wireless Earbuds", description: "Bluetooth 5.3 with ANC", category: "Audio", sku: "WE-001", barcode: "4567890123456", price: 25000, costPrice: 15000, stock: 35, minStock: 15, status: "active", outletId: "outlet-2", variants: [
    { id: "pv4", name: "Black", sku: "WE-001-BK", price: 25000, stock: 20, status: "active" },
    { id: "pv5", name: "White", sku: "WE-001-WH", price: 25000, stock: 15, status: "active" },
  ], images: [] },
  { id: "p5", name: "Vitamin C 1000mg", description: "Immune support supplement", category: "Supplements", sku: "VC-1000", barcode: "5678901234567", price: 2800, costPrice: 1500, stock: 5, minStock: 20, status: "active", outletId: "outlet-4", variants: [], expiryDate: "2026-12-31", batchNumber: "BT-2026-045", images: [] },
  { id: "p6", name: "Brazilian Hair 18\"", description: "100% human hair bundle", category: "Hair Bundles", sku: "BH-018", barcode: "6789012345678", price: 45000, costPrice: 25000, stock: 12, minStock: 5, status: "active", outletId: "outlet-2", variants: [
    { id: "pv6", name: "Natural Black", sku: "BH-018-NB", price: 45000, stock: 8, status: "active" },
    { id: "pv7", name: "Burgundy", sku: "BH-018-BG", price: 48000, stock: 4, status: "active" },
  ], images: [] },
];

const emptyProduct = (outletId: string = ""): Omit<Product, "id"> => ({
  name: "", description: "", category: "", sku: "", barcode: "", price: 0, costPrice: 0,
  stock: 0, minStock: 0, status: "active", outletId, variants: [], images: [],
});

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedOutletId, setSelectedOutletId] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyProduct());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const isAllOutlets = selectedOutletId === "all";
  const currentOutlet = outlets.find(o => o.id === selectedOutletId);
  const features = currentOutlet ? getFeatures(currentOutlet.businessType) : null;

  const filtered = useMemo(() =>
    products
      .filter(p => isAllOutlets || p.outletId === selectedOutletId)
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search) || p.sku.toLowerCase().includes(search.toLowerCase())),
    [products, selectedOutletId, isAllOutlets, search]
  );

  const { page, setPage, perPage, setPerPage, totalPages, paginatedItems, totalItems, pageSizeOptions } = usePagination(filtered);

  const openNew = () => {
    setEditing(null);
    setForm(emptyProduct(isAllOutlets ? "" : selectedOutletId));
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({ ...product });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (editing) {
      setProducts(prev => prev.map(p => p.id === editing.id ? { ...p, ...form } : p));
      toast.success("Product updated");
    } else {
      setProducts(prev => [...prev, { ...form, id: crypto.randomUUID() }]);
      toast.success("Product added");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    setProducts(prev => prev.filter(p => p.id !== deleteConfirm));
    setDeleteConfirm(null);
    toast.success("Product deleted");
  };

  const handleClone = (product: Product) => {
    setProducts(prev => [...prev, {
      ...product,
      id: crypto.randomUUID(),
      name: `${product.name} (Copy)`,
      sku: "",
      barcode: "",
      variants: product.variants.map(v => ({ ...v, id: crypto.randomUUID(), sku: "" })),
    }]);
    toast.success("Product cloned");
  };

  // Variant management
  const addVariant = () => {
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { id: crypto.randomUUID(), name: "", sku: "", price: prev.price, stock: 0, status: "active" }],
    }));
  };

  const updateVariant = (idx: number, updates: Partial<ProductVariant>) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.map((v, i) => i === idx ? { ...v, ...updates } : v),
    }));
  };

  const removeVariant = (idx: number) => {
    setForm(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }));
  };

  const showExpiry = features?.hasExpiry ?? false;
  const showBatch = features?.hasBatchTracking ?? false;
  const showVariants = features?.hasVariants ?? true;
  const showBarcode = features?.hasBarcode ?? true;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage product catalog, pricing, and stock</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
            <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outlets</SelectItem>
              {outlets.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {!isAllOutlets && (
            <Button size="sm" onClick={openNew} className="w-fit">
              <Plus className="h-4 w-4 mr-1" /> Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, SKU, or barcode..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <PaginationControls
        page={page} totalPages={totalPages} perPage={perPage} totalItems={totalItems}
        pageSizeOptions={pageSizeOptions} onPageChange={setPage} onPerPageChange={setPerPage}
      />

      {/* Product Grid */}
      <div className="grid gap-3">
        {paginatedItems.map(product => (
          <Card key={product.id} className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                  product.stock <= product.minStock * 0.3 ? "bg-destructive/10" :
                  product.stock <= product.minStock ? "bg-warning/10" : "bg-success/10"
                )}>
                  <Package className={cn("h-5 w-5",
                    product.stock <= product.minStock * 0.3 ? "text-destructive" :
                    product.stock <= product.minStock ? "text-warning" : "text-success"
                  )} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <Badge variant={product.status === "active" ? "default" : "secondary"} className="text-[10px] capitalize">
                      {product.status}
                    </Badge>
                  </div>
                  {product.description && <p className="text-xs text-muted-foreground truncate">{product.description}</p>}
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    {product.category && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{product.category}</Badge>}
                    {product.barcode && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <ScanBarcode className="h-3 w-3" />{product.barcode}
                      </span>
                    )}
                    {product.expiryDate && (
                      <span className={cn("text-[10px] px-1.5 py-0 rounded", 
                        new Date(product.expiryDate) < new Date() ? "bg-destructive/10 text-destructive" : "text-muted-foreground"
                      )}>
                        Exp: {product.expiryDate}
                      </span>
                    )}
                    {product.batchNumber && (
                      <span className="text-[10px] text-muted-foreground">Batch: {product.batchNumber}</span>
                    )}
                  </div>
                  {product.variants.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.variants.map(v => (
                        <Badge key={v.id} variant="outline" className="text-[10px] px-1.5 py-0">
                          {v.name} — ₦{v.price.toLocaleString()} ({v.stock})
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-right">
                  <p className="text-sm font-heading font-bold">₦{product.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                </div>
                {!isAllOutlets && (
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(product)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleClone(product)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm(product.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No products found</p>
        )}
      </div>

      {/* Product Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Product Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wireless Earbuds" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Electronics" />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="Product SKU" />
              </div>
            </div>
            {showBarcode && (
              <div className="space-y-2">
                <Label>Barcode</Label>
                <BarcodeScanner value={form.barcode} onChange={barcode => setForm({ ...form, barcode })} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Selling Price</Label>
                <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Cost Price</Label>
                <Input type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Stock</Label>
                <Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Min Stock Level</Label>
                <Input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: Number(e.target.value) })} />
              </div>
            </div>
            {showExpiry && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input type="date" value={form.expiryDate || ""} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
                </div>
                {showBatch && (
                  <div className="space-y-2">
                    <Label>Batch Number</Label>
                    <Input value={form.batchNumber || ""} onChange={e => setForm({ ...form, batchNumber: e.target.value })} placeholder="e.g. BT-2026-001" />
                  </div>
                )}
              </div>
            )}
            {!showExpiry && showBatch && (
              <div className="space-y-2">
                <Label>Batch Number</Label>
                <Input value={form.batchNumber || ""} onChange={e => setForm({ ...form, batchNumber: e.target.value })} placeholder="e.g. BT-2026-001" />
              </div>
            )}

            {/* Variants */}
            {showVariants && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Variants</Label>
                    <p className="text-xs text-muted-foreground">Size, color, or other options</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Add Variant
                  </Button>
                </div>
                {form.variants.map((v, idx) => (
                  <Card key={v.id} className="p-3">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Name</label>
                        <Input value={v.name} onChange={e => updateVariant(idx, { name: e.target.value })} className="h-8 text-sm" placeholder="e.g. Large" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase">SKU</label>
                        <Input value={v.sku} onChange={e => updateVariant(idx, { sku: e.target.value })} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase">Price</label>
                        <Input type="number" value={v.price} onChange={e => updateVariant(idx, { price: Number(e.target.value) })} className="h-8 text-sm" />
                      </div>
                      <div className="flex items-end gap-1">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-medium text-muted-foreground uppercase">Stock</label>
                          <Input type="number" value={v.stock} onChange={e => updateVariant(idx, { stock: Number(e.target.value) })} className="h-8 text-sm" />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeVariant(idx)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as "active" | "inactive" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Add Product"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
