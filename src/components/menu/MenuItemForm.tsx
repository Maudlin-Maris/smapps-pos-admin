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
import { ImagePlus, X, Plus, Trash2, CalendarIcon, PackageCheck, Store, Check, Package, ChefHat, Sparkles, Link2, ChevronsUpDown, Search, Info, Tag, Layers, KeyRound, FileText, Image as ImageIcon, DollarSign, ListPlus, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Category } from "./CategoryManager";
import BarcodeScanner from "@/components/inventory/BarcodeScanner";
import { getFeatures, type BusinessTypeId } from "@/data/businessTypes";
import { Popover as OutletPopover, PopoverContent as OutletPopoverContent, PopoverTrigger as OutletPopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { Outlet } from "@/data/outlets";
import type { InventoryItem } from "@/components/inventory/InventoryItemForm";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { loadModifierGroups, type ModifierGroup } from "@/data/modifierGroups";

/** A single component (inventory item + qty) consumed when a variant of a
 *  composite item is sold. Lets a "Large" pizza burn more cheese than a
 *  "Small" without duplicating the whole recipe. Optional — when omitted
 *  the item-level `ingredients` are used. */
export interface MenuVariantComponent {
  inventoryItemId: string;
  quantity: number;
}

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
  /** Simple items: link this SKU to a stocked inventory product so stock
   *  deducts from the correct row when sold. */
  linkedInventoryItemId?: string;
  /** Composite items: per-variant recipe. Overrides item-level ingredients
   *  when present (e.g. Large pizza uses 1.5× cheese). */
  components?: MenuVariantComponent[];
}

export interface MenuExtra {
  id: string;
  name: string;
  price: number;
  category?: string;
}

export type MenuItemType = "simple" | "composite" | "service";

export interface MenuIngredient {
  inventoryItemId: string;
  quantity: number;
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
  extras: MenuExtra[];
  trackInventory: boolean;
  outletId?: string;
  /** Catalog item type — drives form behaviour and POS treatment.
   *  Defaults to "simple" for legacy items that don't carry the field. */
  itemType?: MenuItemType;
  /** For Simple items: optional link to a stocked inventory item. */
  linkedInventoryItemId?: string;
  /** For Composite items: recipe components consumed when sold. */
  ingredients?: MenuIngredient[];
  /** IDs of reusable modifier groups attached to this item. At save-time
   *  the form flattens these into `extras` so the existing POS UI continues
   *  to work — the IDs are kept here so admin edits stay in sync. */
  modifierGroupIds?: string[];
  /** Pricing strategy: "base" single price (default), "variant" priced per
   *  variant, "open" entered by cashier at checkout. */
  pricingStrategy?: "base" | "variant" | "open";
}

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  item?: MenuItem | null;
  onSave: (item: MenuItem, targetOutletIds: string[]) => void;
  mode?: "add" | "edit" | "clone";
  businessType?: BusinessTypeId;
  outlets: Outlet[];
  currentOutletId?: string;
  /** Inventory items used by Simple ("Link to inventory") and Composite
   *  ("Ingredients") item types. Optional — when omitted those sections
   *  show an empty-state. */
  inventoryItems?: InventoryItem[];
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
        <div className="col-span-2 sm:col-span-3">
          <Label className="text-xs">SKU / Barcode</Label>
          <div className="mt-1">
            <BarcodeScanner value={variant.sku} onChange={(val) => onChange({ ...variant, sku: val })} placeholder="Scan or enter barcode/SKU" />
          </div>
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

/** Visual section wrapper — numbered, iconed header + framed content area.
 *  Used to break the catalog form into clearly scannable groups so admins
 *  can quickly find Basics, Pricing, Variants, Modifiers, etc. */
function FormSection({
  icon: Icon,
  title,
  description,
  required,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <header className="flex items-start gap-3 px-4 py-3 border-b border-border bg-muted/30">
        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-none">
            {title}
            {required && <span className="text-destructive ml-1">*</span>}
          </h3>
          {description && (
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{description}</p>
          )}
        </div>
      </header>
      <div className="p-4 space-y-4">{children}</div>
    </section>
  );
}

export default function MenuItemForm({ open, onOpenChange, categories, item, onSave, mode = "add", businessType, outlets, currentOutletId, inventoryItems = [] }: MenuItemFormProps) {
  const [itemType, setItemType] = useState<MenuItemType>("simple");
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
  const [extras, setExtras] = useState<MenuExtra[]>([]);
  const [trackInventory, setTrackInventory] = useState(false);
  const [selectedOutletIds, setSelectedOutletIds] = useState<string[]>([]);
  const [linkedInventoryItemId, setLinkedInventoryItemId] = useState<string>("");
  const [ingredients, setIngredients] = useState<MenuIngredient[]>([]);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [ingredientPickerOpenIdx, setIngredientPickerOpenIdx] = useState<number | null>(null);
  /** Pricing strategy — Toast-inspired:
   *  - "base":    single price, optional per-variant overrides
   *  - "variant": price comes from each variant (no base price)
   *  - "open":    price entered at checkout (POS prompt) */
  type PricingStrategy = "base" | "variant" | "open";
  const [pricingStrategy, setPricingStrategy] = useState<PricingStrategy>("base");

  const features = businessType ? getFeatures(businessType) : null;

  const selectedCat = categories.find((c) => c.id === selectedCatId);
  const subcategories = selectedCat?.subcategories ?? [];

  // Filter inventory items to the outlets currently selected on the form so
  // users only link to/recipe from inventory that actually exists at those
  // outlets. Falls back to all items when no outlet has been selected yet.
  const availableInventory = selectedOutletIds.length
    ? inventoryItems.filter((i) => selectedOutletIds.includes(i.outletId))
    : inventoryItems;

  useEffect(() => {
    if (open) {
      if (item) {
        setItemType(item.itemType ?? "simple");
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
        setExtras(item.extras ?? []);
        setTrackInventory(item.trackInventory ?? false);
        setLinkedInventoryItemId(item.linkedInventoryItemId ?? "");
        setIngredients(item.ingredients ?? []);
        const cat = categories.find((c) => c.name === item.category || c.subcategories.some((s) => s.name === item.subcategory));
        setSelectedCatId(cat?.id ?? "");
        setSubcategory(item.subcategory);
        setSelectedOutletIds(item.outletId ? [item.outletId] : (currentOutletId ? [currentOutletId] : []));
        // Infer pricing strategy from saved data
        if (item.pricingStrategy) {
          setPricingStrategy(item.pricingStrategy);
        } else if ((item.variants?.length ?? 0) > 0 && (!item.price || item.price === 0)) {
          setPricingStrategy("variant");
        } else {
          setPricingStrategy("base");
        }
      } else {
        setItemType("simple");
        setName(""); setDescription(""); setSelectedCatId(""); setSubcategory("");
        setPrice(""); setQuantity(""); setSalePrice(""); setSalePeriodStart(null);
        setSalePeriodEnd(null); setShowSale(false); setSku(""); setIsActive(true);
        setImages([]); setVariants([]); setExtras([]); setTrackInventory(false);
        setLinkedInventoryItemId(""); setIngredients([]);
        setSelectedOutletIds(currentOutletId ? [currentOutletId] : []);
        setPricingStrategy("base");
      }
    }
  }, [open, item, categories, currentOutletId]);

  // When switching item type, clear fields that no longer apply so saved data
  // stays consistent with the chosen type.
  const handleTypeChange = (next: MenuItemType) => {
    if (next === itemType) return;
    setItemType(next);
    if (next === "service") {
      setVariants([]);
      setExtras([]);
      setImages([]);
      setShowSale(false);
      setSalePrice("");
      setSalePeriodStart(null);
      setSalePeriodEnd(null);
      setTrackInventory(false);
      setLinkedInventoryItemId("");
      setIngredients([]);
    } else if (next === "simple") {
      // Composite ingredients & track-inventory don't apply
      setIngredients([]);
      setTrackInventory(false);
    } else if (next === "composite") {
      // Linked inventory item is a Simple-only concept
      setLinkedInventoryItemId("");
      setTrackInventory(false);
    }
  };

  // Auto-fill from linked inventory item (Simple type). Suggests a category
  // by name match against the catalog categories — admin can override.
  const handleLinkInventory = (invId: string) => {
    setLinkedInventoryItemId(invId);
    const inv = inventoryItems.find((i) => i.id === invId);
    if (!inv) return;
    if (!name.trim()) setName(inv.name);
    if (!sku.trim()) setSku(inv.sku);
    // Best-effort category suggestion: find a catalog category whose name
    // matches the inventory item's name keywords. If none, leave existing.
    if (!selectedCatId) {
      const lower = inv.name.toLowerCase();
      const guess = categories.find((c) =>
        lower.includes(c.name.toLowerCase().split(" ")[0])
      );
      if (guess) setSelectedCatId(guess.id);
    }
  };


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
    const isService = itemType === "service";
    const isComposite = itemType === "composite";
    const isOpenPrice = !isService && pricingStrategy === "open";
    const isVariantPriced = !isService && pricingStrategy === "variant";
    const hasVariants = !isService && variants.length > 0;
    if (!name.trim() || !subcategory) return;
    // Price requirements depend on strategy.
    if (!isService && !isOpenPrice) {
      if (isVariantPriced) {
        if (variants.length === 0) return;
        if (variants.some((v) => !v.name.trim() || !v.price)) return;
      } else if (!hasVariants && !price) {
        return;
      }
    }
    if (hasVariants && variants.some((v) => !v.name.trim())) return;
    if (selectedOutletIds.length === 0) return;
    if (isComposite) {
      const valid = ingredients.filter((g) => g.inventoryItemId && g.quantity > 0);
      if (valid.length === 0) return;
    }
    const cat = categories.find((c) => c.id === selectedCatId);
    const basePrice = isOpenPrice
      ? 0
      : isVariantPriced
        ? Math.min(...variants.map((v) => v.price))
        : parseFloat(price) || 0;
    const baseQty = isService
      ? 0
      : hasVariants
        ? variants.reduce((sum, v) => sum + v.quantity, 0)
        : parseInt(quantity) || 0;
    const autoSku = generateSku();
    const finalVariants = hasVariants
      ? variants.map((v, i) => ({
          ...v,
          sku: v.sku || `${autoSku}-V${i + 1}`,
        }))
      : variants;
    const suppressSale = isService || isOpenPrice || isVariantPriced || hasVariants;
    onSave({
      id: item?.id ?? crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      category: cat?.name ?? "",
      subcategory,
      price: basePrice,
      quantity: baseQty,
      salePrice: suppressSale ? null : (showSale && salePrice ? parseFloat(salePrice) : null),
      salePeriodStart: suppressSale ? null : (showSale ? salePeriodStart : null),
      salePeriodEnd: suppressSale ? null : (showSale ? salePeriodEnd : null),
      sku: item?.sku || autoSku,
      status: isActive ? "active" : "inactive",
      images: isService ? [] : images,
      variants: isService ? [] : finalVariants,
      extras: isService ? [] : extras,
      trackInventory: isService ? false : (hasVariants ? false : trackInventory),
      itemType,
      pricingStrategy: isService ? undefined : pricingStrategy,
      linkedInventoryItemId: itemType === "simple" && linkedInventoryItemId ? linkedInventoryItemId : undefined,
      ingredients: itemType === "composite"
        ? ingredients.filter((g) => g.inventoryItemId && g.quantity > 0)
        : undefined,
    }, selectedOutletIds);
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

        <div className="space-y-4">
          {/* Item Type selector */}
          <FormSection
            icon={Package}
            title="Item Type"
            description="Choose how this item behaves at the POS and in inventory."
            required
          >
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "simple", label: "Simple", hint: "Retail / barcode", Icon: Package },
                { key: "composite", label: "Composite", hint: "Made from ingredients", Icon: ChefHat },
                { key: "service", label: "Service", hint: "No inventory", Icon: Sparkles },
              ] as const).map(({ key, label, hint, Icon }) => {
                const active = itemType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTypeChange(key)}
                    className={cn(
                      "flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-colors",
                      active
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/40 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground leading-tight">{hint}</span>
                  </button>
                );
              })}
            </div>
          </FormSection>

          {/* Link to Inventory — Simple items only */}
          {itemType === "simple" && (
            <FormSection
              icon={Link2}
              title="Link to Inventory"
              description="Optionally connect this catalog item to a stocked product. Auto-fills name, SKU and suggests a category."
            >
              <Popover open={linkPickerOpen} onOpenChange={setLinkPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal h-9 text-sm"
                  >
                    {linkedInventoryItemId
                      ? (() => {
                          const inv = inventoryItems.find((i) => i.id === linkedInventoryItemId);
                          return inv ? `${inv.name} · ${inv.sku}` : "Select inventory item...";
                        })()
                      : <span className="text-muted-foreground">Search inventory...</span>}
                    <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search by name or SKU..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>No inventory items found.</CommandEmpty>
                      <CommandGroup>
                        {linkedInventoryItemId && (
                          <CommandItem
                            value="__clear__"
                            onSelect={() => { setLinkedInventoryItemId(""); setLinkPickerOpen(false); }}
                          >
                            <X className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground">Clear link</span>
                          </CommandItem>
                        )}
                        {availableInventory.map((inv) => (
                          <CommandItem
                            key={inv.id}
                            value={`${inv.name} ${inv.sku}`}
                            onSelect={() => { handleLinkInventory(inv.id); setLinkPickerOpen(false); }}
                          >
                            <Check className={cn("h-3.5 w-3.5 mr-2", linkedInventoryItemId === inv.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">{inv.name}</div>
                              <div className="text-[11px] text-muted-foreground truncate">{inv.sku} · stock {inv.stock}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {linkedInventoryItemId && (() => {
                const inv = inventoryItems.find((i) => i.id === linkedInventoryItemId);
                if (!inv) return null;
                return (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">Linked</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      Stock: <span className="font-medium text-foreground tabular-nums">{inv.stock}</span> · Cost: <span className="font-medium text-foreground tabular-nums">{inv.costPrice}</span>
                    </span>
                  </div>
                );
              })()}
            </FormSection>
          )}

          {/* Basic Info */}
          <FormSection
            icon={FileText}
            title="Basic Info"
            description="Name, category and description shown across the catalog."
            required
          >
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

              <div className="sm:col-span-2">
                <Label htmlFor="item-desc">Description</Label>
                <Textarea id="item-desc" className="mt-1" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." />
              </div>
            </div>
          </FormSection>

          {/* Availability — outlets + status */}
          <FormSection
            icon={MapPin}
            title="Availability"
            description="Outlets that sell this item and whether it's currently active."
            required
          >
            <div>
              <Label className="flex items-center gap-1.5"><Store className="h-3.5 w-3.5" /> Outlets *</Label>
              <OutletPopover>
                <OutletPopoverTrigger asChild>
                  <Button variant="outline" className="w-full mt-1 justify-between font-normal h-auto min-h-10 py-1.5">
                    <div className="flex flex-wrap gap-1 items-center">
                      {selectedOutletIds.length === 0 ? (
                        <span className="text-muted-foreground text-sm">Select outlets...</span>
                      ) : (
                        selectedOutletIds.map((id) => {
                          const o = outlets.find((x) => x.id === id);
                          if (!o) return null;
                          return (
                            <Badge key={id} variant="secondary" className="text-xs gap-1">
                              {o.name}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOutletIds((prev) => prev.filter((p) => p !== id));
                                }}
                                className="hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          );
                        })
                      )}
                    </div>
                  </Button>
                </OutletPopoverTrigger>
                <OutletPopoverContent className="w-[--radix-popover-trigger-width] p-1 max-h-72 overflow-y-auto" align="start">
                  <div className="flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground">
                    <span>{selectedOutletIds.length} selected</span>
                    <button
                      type="button"
                      className="hover:text-foreground underline"
                      onClick={() =>
                        setSelectedOutletIds(
                          selectedOutletIds.length === outlets.length ? [] : outlets.map((o) => o.id)
                        )
                      }
                    >
                      {selectedOutletIds.length === outlets.length ? "Clear all" : "Select all"}
                    </button>
                  </div>
                  {outlets.map((o) => {
                    const checked = selectedOutletIds.includes(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() =>
                          setSelectedOutletIds((prev) =>
                            checked ? prev.filter((p) => p !== o.id) : [...prev, o.id]
                          )
                        }
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground text-left"
                      >
                        <div className={cn("h-4 w-4 rounded border flex items-center justify-center", checked ? "bg-primary border-primary text-primary-foreground" : "border-input")}>
                          {checked && <Check className="h-3 w-3" />}
                        </div>
                        <span className="flex-1">{o.name}</span>
                      </button>
                    );
                  })}
                </OutletPopoverContent>
              </OutletPopover>
              {mode === "edit" && selectedOutletIds.length > 1 && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Selecting additional outlets will create copies of this item in those outlets.
                </p>
              )}
            </div>

            {variants.length === 0 && (
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <div>
                  <Label className="text-sm">Status</Label>
                  <p className="text-xs text-muted-foreground">{isActive ? "Active — visible at POS" : "Inactive — hidden from POS"}</p>
                </div>
              </div>
            )}
          </FormSection>

          {/* Images — hidden for Service items */}
          {itemType !== "service" && (
            <FormSection
              icon={ImageIcon}
              title="Images"
              description="Up to 4 photos. The first image is used as the POS thumbnail."
            >
              <div className="flex gap-2 flex-wrap">
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
            </FormSection>
          )}


          {/* Pricing */}
          <FormSection
            icon={DollarSign}
            title="Pricing"
            description={itemType === "service" ? "Set the price charged for this service." : "Pick how this item is priced. You can switch strategies any time."}
            required
          >
            {/* Service items keep a simple price field — no strategy selector. */}
            {itemType === "service" && (
              <div>
                <Label htmlFor="item-price-svc">Price *</Label>
                <Input id="item-price-svc" className="mt-1" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
              </div>
            )}

            {itemType !== "service" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {([
                    { id: "base", label: "Base Price", desc: "Single price for all", icon: Tag },
                    { id: "variant", label: "Variant Pricing", desc: "Price per variant", icon: Layers },
                    { id: "open", label: "Open Price", desc: "Entered at checkout", icon: KeyRound },
                  ] as const).map((opt) => {
                    const Icon = opt.icon;
                    const active = pricingStrategy === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setPricingStrategy(opt.id);
                          if (opt.id === "open") {
                            setPrice("");
                            setShowSale(false);
                            setSalePrice("");
                            setSalePeriodStart(null);
                            setSalePeriodEnd(null);
                          }
                          if (opt.id === "variant" && variants.length === 0) {
                            addVariant();
                          }
                        }}
                        className={cn(
                          "text-left rounded-lg border p-3 transition-colors",
                          active
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:bg-muted/50",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-sm font-medium">{opt.label}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* BASE PRICE MODE */}
                {pricingStrategy === "base" && (
                  <div className="space-y-4 pt-3 border-t border-border">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="item-price-nv">Base Price *</Label>
                        <Input id="item-price-nv" className="mt-1" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                      </div>
                      {variants.length === 0 && (
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
                            disabled={trackInventory || !!linkedInventoryItemId}
                          />
                          {(trackInventory || linkedInventoryItemId) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {linkedInventoryItemId ? "Sourced from linked inventory" : "Managed by inventory"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {variants.length > 0 && (
                      <div className="rounded-md bg-muted/40 border border-dashed border-border p-3 flex gap-2">
                        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground">
                          Variants below can override the base price. Leave a variant price empty to inherit the base.
                        </p>
                      </div>
                    )}

                    {itemType === "simple" && !linkedInventoryItemId && variants.length === 0 && (
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
                    )}

                    <div className="border border-border rounded-lg p-3 space-y-3">
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
                  </div>
                )}

                {/* VARIANT PRICING MODE — pricing handled in Variants section below */}
                {pricingStrategy === "variant" && (
                  <div className="rounded-md bg-muted/40 border border-dashed border-border p-3 flex gap-2">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Each variant carries its own price. Add variants below — the first one is used as the default in the POS.
                    </p>
                  </div>
                )}

                {/* OPEN PRICE MODE */}
                {pricingStrategy === "open" && (
                  <div className="rounded-md bg-amber-500/5 border border-amber-500/30 p-3 flex gap-2">
                    <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Price entered at checkout</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        The cashier will be prompted to enter the price each time this item is added to a sale.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </FormSection>

          {/* Composition — Composite items only */}
          {itemType === "composite" && (
            <FormSection
              icon={ChefHat}
              title="Composition"
              description="Inventory items consumed each time this menu item is sold."
              required
            >
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIngredients((prev) => [...prev, { inventoryItemId: "", quantity: 1 }])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Ingredient
                </Button>
              </div>

              {ingredients.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-md">
                  No ingredients yet. Add inventory items that make up this dish.
                </p>
              )}

              <div className="space-y-2">
                {ingredients.map((g, idx) => {
                  const inv = inventoryItems.find((i) => i.id === g.inventoryItemId);
                  return (
                    <div key={idx} className="grid grid-cols-[1fr,90px,32px] gap-2 items-center">
                      <Popover open={ingredientPickerOpenIdx === idx} onOpenChange={(o) => setIngredientPickerOpenIdx(o ? idx : null)}>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline" role="combobox" className="justify-between font-normal h-9 text-sm w-full">
                            {inv ? (
                              <span className="truncate">{inv.name}</span>
                            ) : (
                              <span className="text-muted-foreground">Select inventory item...</span>
                            )}
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search inventory..." className="h-9" />
                            <CommandList>
                              <CommandEmpty>No items found.</CommandEmpty>
                              <CommandGroup>
                                {availableInventory.map((it) => (
                                  <CommandItem
                                    key={it.id}
                                    value={`${it.name} ${it.sku}`}
                                    onSelect={() => {
                                      setIngredients((prev) => prev.map((p, i) => i === idx ? { ...p, inventoryItemId: it.id } : p));
                                      setIngredientPickerOpenIdx(null);
                                    }}
                                  >
                                    <Check className={cn("h-3.5 w-3.5 mr-2", g.inventoryItemId === it.id ? "opacity-100" : "opacity-0")} />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm truncate">{it.name}</div>
                                      <div className="text-[11px] text-muted-foreground truncate">{it.sku}</div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={g.quantity || ""}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value) || 0;
                          setIngredients((prev) => prev.map((p, i) => i === idx ? { ...p, quantity: v } : p));
                        }}
                        placeholder="Qty"
                        className="h-9 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        aria-label="Remove ingredient"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </FormSection>
          )}

          {/* Variants */}
          {itemType !== "service" && pricingStrategy !== "open" && (
            <FormSection
              icon={Layers}
              title="Variants"
              description={
                pricingStrategy === "variant"
                  ? "Each variant must have a price. The first variant is the POS default."
                  : variants.length > 0
                    ? "Variants override the base price and inventory."
                    : "Optional — add variants for different sizes, flavors, etc."
              }
              required={pricingStrategy === "variant"}
            >
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
                </Button>
              </div>
              {variants.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-md">
                  No variants yet.
                </p>
              )}
              {variants.map((v, idx) => (
                <div key={v.id} className="relative">
                  {idx === 0 && variants.length > 1 && (
                    <Badge variant="secondary" className="absolute -top-2 left-3 text-[10px] z-10">
                      Default
                    </Badge>
                  )}
                  <VariantRow variant={v} onChange={(upd) => updateVariant(v.id, upd)} onRemove={() => removeVariant(v.id)} />
                </div>
              ))}
            </FormSection>
          )}

          {/* Add-ons / Modifiers */}
          {itemType !== "service" && features?.hasExtras && (
            <FormSection
              icon={ListPlus}
              title={features.extrasLabel}
              description={
                extras.length > 0
                  ? `${extras.length} ${extras.length === 1 ? "item" : "items"} added`
                  : "Optional add-ons customers can select at checkout."
              }
            >
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setExtras((prev) => [
                      ...prev,
                      { id: crypto.randomUUID(), name: "", price: 0, category: "" },
                    ])
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              {extras.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-md">
                  No add-ons yet.
                </p>
              )}
              {extras.map((extra, idx) => (
                <div
                  key={extra.id}
                  className="border border-border rounded-lg p-3 space-y-3 bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      {features.extrasLabel.split("/")[0].trim()} #{idx + 1}
                    </Label>
                    <button
                      onClick={() =>
                        setExtras((prev) => prev.filter((e) => e.id !== extra.id))
                      }
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Name *</Label>
                      <Input
                        className="mt-1 h-9 text-sm"
                        value={extra.name}
                        onChange={(e) =>
                          setExtras((prev) =>
                            prev.map((ex) =>
                              ex.id === extra.id
                                ? { ...ex, name: e.target.value }
                                : ex
                            )
                          )
                        }
                        placeholder="e.g. Extra cheese"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Price *</Label>
                      <Input
                        className="mt-1 h-9 text-sm"
                        type="number"
                        min="0"
                        step="0.01"
                        value={extra.price || ""}
                        onChange={(e) =>
                          setExtras((prev) =>
                            prev.map((ex) =>
                              ex.id === extra.id
                                ? { ...ex, price: parseFloat(e.target.value) || 0 }
                                : ex
                            )
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Group (optional)</Label>
                      <Input
                        className="mt-1 h-9 text-sm"
                        value={extra.category || ""}
                        onChange={(e) =>
                          setExtras((prev) =>
                            prev.map((ex) =>
                              ex.id === extra.id
                                ? { ...ex, category: e.target.value }
                                : ex
                            )
                          )
                        }
                        placeholder="e.g. Toppings"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </FormSection>
          )}
        </div>


        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={(() => {
            if (!name.trim() || !subcategory || selectedOutletIds.length === 0) return true;
            if (itemType === "composite" && ingredients.filter((g) => g.inventoryItemId && g.quantity > 0).length === 0) return true;
            if (itemType === "service") return !price;
            if (pricingStrategy === "open") return false;
            if (pricingStrategy === "variant") {
              if (variants.length === 0) return true;
              return variants.some((v) => !v.name.trim() || !v.price);
            }
            // base
            if (!price) return true;
            if (variants.length > 0 && variants.some((v) => !v.name.trim())) return true;
            return false;
          })()}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
