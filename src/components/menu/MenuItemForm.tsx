import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { ImagePlus, X, Plus, Trash2, CalendarIcon, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Category } from "./CategoryManager";

export interface MenuVariant {
  id: string;
  name: string;
  price: number;
  quantity: number;
  salePrice: number | null;
  salePeriodStart: Date | null;
  salePeriodEnd: Date | null;
  trackInventory: boolean;
  sku: string;
  status: "active" | "inactive";
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  quantity: number;
  salePrice: number | null;
  salePeriodStart: Date | null;
  salePeriodEnd: Date | null;
  sku: string;
  status: "active" | "inactive";
  images: string[];
  variants: MenuVariant[];
  trackInventory: boolean;
}

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  item?: MenuItem | null;
  onSave: (item: MenuItem) => void;
  mode?: "add" | "edit" | "clone";
}

function DatePickerField({ label, value, onChange }: { label: string; value: Date | null; onChange: (d: Date | null) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal h-9 text-xs", !value && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {value ? format(value, "PPP") : "Pick date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value ?? undefined} onSelect={(d) => onChange(d ?? null)} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function VariantRow({ variant, onChange, onRemove }: { variant: MenuVariant; onChange: (v: MenuVariant) => void; onRemove: () => void }) {
  const [showSale, setShowSale] = useState(!!(variant.salePrice !== null));

  return (
    <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Variant</Label>
        <button onClick={onRemove} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Name *</Label>
          <Input className="mt-1 h-9 text-sm" value={variant.name} onChange={(e) => onChange({ ...variant, name: e.target.value })} placeholder="e.g. Large" />
        </div>
        <div className="flex items-center gap-2 self-end pb-1">
          <Switch checked={variant.status === "active"} onCheckedChange={(v) => onChange({ ...variant, status: v ? "active" : "inactive" })} />
          <Label className="text-xs text-muted-foreground">{variant.status === "active" ? "Active" : "Inactive"}</Label>
        </div>
        <div>
          <Label className="text-xs">Price *</Label>
          <Input className="mt-1 h-9 text-sm" type="number" min="0" step="0.01" value={variant.price || ""} onChange={(e) => onChange({ ...variant, price: parseFloat(e.target.value) || 0 })} placeholder="0.00" />
        </div>
        <div>
          <Label className="text-xs">Quantity</Label>
          <Input
            className="mt-1 h-9 text-sm"
            type="number"
            min="0"
            value={variant.quantity || ""}
            onChange={(e) => onChange({ ...variant, quantity: parseInt(e.target.value) || 0 })}
            placeholder="0"
            disabled={variant.trackInventory}
          />
          {variant.trackInventory && (
            <p className="text-[10px] text-muted-foreground mt-0.5">Managed by inventory</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Switch
            checked={variant.trackInventory}
            onCheckedChange={(v) => onChange({ ...variant, trackInventory: v })}
          />
          <div className="flex items-center gap-1">
            <PackageCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <Label className="text-xs text-muted-foreground">Track from Inventory</Label>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={showSale} onCheckedChange={(v) => { setShowSale(v); if (!v) onChange({ ...variant, salePrice: null, salePeriodStart: null, salePeriodEnd: null }); }} />
          <Label className="text-xs text-muted-foreground">On Sale</Label>
        </div>
      </div>
      {showSale && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Sale Price</Label>
            <Input className="mt-1 h-9 text-sm" type="number" min="0" step="0.01" value={variant.salePrice ?? ""} onChange={(e) => onChange({ ...variant, salePrice: parseFloat(e.target.value) || null })} placeholder="0.00" />
          </div>
          <DatePickerField label="Sale Start" value={variant.salePeriodStart} onChange={(d) => onChange({ ...variant, salePeriodStart: d })} />
          <DatePickerField label="Sale End" value={variant.salePeriodEnd} onChange={(d) => onChange({ ...variant, salePeriodEnd: d })} />
        </div>
      )}
    </div>
  );
}

export default function MenuItemForm({ open, onOpenChange, categories, item, onSave, mode = "add" }: MenuItemFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [salePeriodStart, setSalePeriodStart] = useState<Date | null>(null);
  const [salePeriodEnd, setSalePeriodEnd] = useState<Date | null>(null);
  const [showSale, setShowSale] = useState(false);
  const [sku, setSku] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<MenuVariant[]>([]);
  const [trackInventory, setTrackInventory] = useState(false);

  const selectedCat = categories.find((c) => c.id === selectedCatId);
  const subcategories = selectedCat?.subcategories ?? [];

  useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name);
        setDescription(item.description);
        setPrice(item.price.toString());
        setQuantity(item.quantity?.toString() ?? "");
        setSalePrice(item.salePrice?.toString() ?? "");
        setSalePeriodStart(item.salePeriodStart ?? null);
        setSalePeriodEnd(item.salePeriodEnd ?? null);
        setShowSale(item.salePrice !== null);
        setSku(item.sku);
        setIsActive(item.status === "active");
        setImages(item.images ?? []);
        setVariants(item.variants ?? []);
        setTrackInventory(item.trackInventory ?? false);
        const cat = categories.find((c) => c.name === item.category || c.subcategories.some((s) => s.name === item.subcategory));
        setSelectedCatId(cat?.id ?? "");
        setSubcategory(item.subcategory);
      } else {
        setName(""); setDescription(""); setSelectedCatId(""); setSubcategory("");
        setPrice(""); setQuantity(""); setSalePrice(""); setSalePeriodStart(null);
        setSalePeriodEnd(null); setShowSale(false); setSku(""); setIsActive(true);
        setImages([]); setVariants([]); setTrackInventory(false);
      }
    }
  }, [open, item, categories]);

  const handleImageUpload = () => {
    if (images.length >= 4) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      const remaining = 4 - images.length;
      Array.from(files).slice(0, remaining).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImages((prev) => prev.length < 4 ? [...prev, ev.target?.result as string] : prev);
        };
        reader.readAsDataURL(file);
      });
    };
    input.click();
  };

  const removeImage = (idx: number) => setImages((prev) => prev.filter((_, i) => i !== idx));

  const generateSku = () => {
    const prefix = name.trim().substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "X") || "ITM";
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${rand}`;
  };

  const addVariant = () => {
    setVariants((prev) => {
      if (prev.length === 0 && (price || quantity)) {
        const baseVariant: MenuVariant = {
          id: crypto.randomUUID(),
          name: "",
          price: parseFloat(price) || 0,
          quantity: parseInt(quantity) || 0,
          salePrice: showSale && salePrice ? parseFloat(salePrice) : null,
          salePeriodStart: showSale ? salePeriodStart : null,
          salePeriodEnd: showSale ? salePeriodEnd : null,
          trackInventory: trackInventory,
          sku: "",
          status: isActive ? "active" : "inactive",
        };
        return [baseVariant, { id: crypto.randomUUID(), name: "", price: 0, quantity: 0, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: false, sku: "", status: "active" as const }];
      }
      return [...prev, { id: crypto.randomUUID(), name: "", price: 0, quantity: 0, salePrice: null, salePeriodStart: null, salePeriodEnd: null, trackInventory: false, sku: "", status: "active" as const }];
    });
  };

  const updateVariant = (id: string, updated: MenuVariant) => {
    setVariants((prev) => prev.map((v) => v.id === id ? updated : v));
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const handleSave = () => {
    const hasVariants = variants.length > 0;
    if (!name.trim() || (!hasVariants && !price) || !subcategory) return;
    if (hasVariants && variants.some((v) => !v.name.trim())) return;
    const cat = categories.find((c) => c.id === selectedCatId);
    const basePrice = hasVariants ? Math.min(...variants.map((v) => v.price)) : parseFloat(price);
    const baseQty = hasVariants ? variants.reduce((sum, v) => sum + v.quantity, 0) : parseInt(quantity) || 0;
    const autoSku = generateSku();
    const finalVariants = hasVariants
      ? variants.map((v, i) => ({
          ...v,
          sku: v.sku || `${autoSku}-V${i + 1}`,
        }))
      : variants;
    onSave({
      id: item?.id ?? crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      category: cat?.name ?? "",
      subcategory,
      price: basePrice,
      quantity: baseQty,
      salePrice: hasVariants ? null : (showSale && salePrice ? parseFloat(salePrice) : null),
      salePeriodStart: hasVariants ? null : (showSale ? salePeriodStart : null),
      salePeriodEnd: hasVariants ? null : (showSale ? salePeriodEnd : null),
      sku: item?.sku || autoSku,
      status: isActive ? "active" : "inactive",
      images,
      variants: finalVariants,
      trackInventory: hasVariants ? false : trackInventory,
    });
    onOpenChange(false);
  };

  const formTitle = mode === "clone" ? "Clone Menu Item" : mode === "edit" ? "Edit Menu Item" : "Add Menu Item";
  const formDescription = mode === "clone"
    ? "You're creating a new item based on an existing one. Review and adjust the details before saving."
    : mode === "edit"
    ? "Update the details of this menu item."
    : "Fill in the details to create a new menu item.";
  const submitLabel = mode === "clone" ? "Create Clone" : mode === "edit" ? "Update Item" : "Add Item";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formTitle}</DialogTitle>
          <DialogDescription>{formDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Images */}
          <div>
            <Label className="text-sm font-medium">Images (max 4)</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {images.map((img, idx) => (
                <div key={idx} className="relative h-20 w-20 rounded-lg border border-border overflow-hidden group">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => removeImage(idx)} className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <button onClick={handleImageUpload} className="h-20 w-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px]">Add</span>
                </button>
              )}
            </div>
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="item-name">Item Name *</Label>
              <Input id="item-name" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cappuccino" />
            </div>

            <div>
              <Label>Category *</Label>
              <Select value={selectedCatId} onValueChange={(v) => { setSelectedCatId(v); setSubcategory(""); }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subcategory *</Label>
              <Select value={subcategory} onValueChange={setSubcategory} disabled={!selectedCatId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                <SelectContent>
                  {subcategories.map((s) => (<SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>


            {variants.length === 0 && (
              <div className="flex items-center gap-3 self-end pb-1">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <div>
                  <Label className="text-sm">Status</Label>
                  <p className="text-xs text-muted-foreground">{isActive ? "Active" : "Inactive"}</p>
                </div>
              </div>
            )}

            <div className="sm:col-span-2">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea id="item-desc" className="mt-1" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." />
            </div>
          </div>

          {/* Price/Qty/Sale - only when no variants */}
          {variants.length === 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item-price-nv">Price *</Label>
                  <Input id="item-price-nv" className="mt-1" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <Label htmlFor="item-quantity-nv">Quantity</Label>
                  <Input
                    id="item-quantity-nv"
                    className="mt-1"
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    disabled={trackInventory}
                  />
                  {trackInventory && (
                    <p className="text-xs text-muted-foreground mt-1">Managed by inventory</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 border border-border rounded-lg p-3">
                <Switch checked={trackInventory} onCheckedChange={setTrackInventory} />
                <div className="flex items-center gap-1.5">
                  <PackageCheck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Track from Inventory</Label>
                    <p className="text-xs text-muted-foreground">Quantity will be managed from Inventory Management</p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Switch checked={showSale} onCheckedChange={(v) => { setShowSale(v); if (!v) { setSalePrice(""); setSalePeriodStart(null); setSalePeriodEnd(null); } }} />
                  <Label className="text-sm font-medium">On Sale</Label>
                </div>
                {showSale && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Sale Price</Label>
                      <Input className="mt-1 h-9 text-sm" type="number" min="0" step="0.01" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0.00" />
                    </div>
                    <DatePickerField label="Sale Start" value={salePeriodStart} onChange={setSalePeriodStart} />
                    <DatePickerField label="Sale End" value={salePeriodEnd} onChange={setSalePeriodEnd} />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Variants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Variants</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {variants.length > 0 ? "All pricing and stock is managed per variant." : "Add variants for different sizes, flavors, etc."}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
              </Button>
            </div>
            {variants.map((v) => (
              <VariantRow key={v.id} variant={v} onChange={(upd) => updateVariant(v.id, upd)} onRemove={() => removeVariant(v.id)} />
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || (variants.length === 0 && !price) || !subcategory || (variants.length > 0 && variants.some((v) => !v.name.trim()))}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
