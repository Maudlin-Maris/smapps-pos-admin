import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { ImagePlus, X, Plus, Trash2, CalendarIcon, PackageCheck, Store, Check, Package, ChefHat, Sparkles, Link2, ChevronsUpDown, Search, Info, Tag, Layers, KeyRound, FileText, Image as ImageIcon, DollarSign, ListPlus, MapPin, Barcode, Lock, TrendingUp, Pencil, Check as CheckIcon } from "lucide-react";
import type { PricingMethod } from "@/components/inventory/StockAdjustmentHistory";

function calcMenuSellPrice(costPrice: number, method: PricingMethod, value: number): number {
  if (method === "fixed") return value;
  if (method === "markup") return costPrice * (1 + value / 100);
  if (method === "margin") {
    if (value >= 100) return costPrice * 10;
    return costPrice / (1 - value / 100);
  }
  return costPrice;
}
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
import { defaultUnits as defaultMeasuringUnits } from "@/components/inventory/MeasuringUnitManager";
import { formatNaira } from "@/lib/currency";
import { defaultCategories as defaultInventoryCategories } from "@/components/inventory/InventoryCategoryManager";

const SERVICE_UNITS: { name: string; abbreviation: string }[] = [
  { name: "Hour", abbreviation: "hr" },
  { name: "Minute", abbreviation: "min" },
  { name: "Session", abbreviation: "session" },
  { name: "Visit", abbreviation: "visit" },
  { name: "Day", abbreviation: "day" },
];

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
  /** Unit the quantity is expressed in. Undefined = the item's base unit.
   *  Otherwise must match one of the item's conversion `toUnitId`s. */
  unitId?: string;
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
  /** Unit used when selling this item (e.g. "pcs", "kg", "hour"). Drives
   *  POS display and reporting. Service items typically use time-based units. */
  sellingUnit?: string;
  /** Simple items (Base Price strategy): cost price per selling unit. When
   *  linked to an inventory item this is sourced from the inventory record;
   *  otherwise admin enters it manually alongside Sell Price & Markup. */
  costPrice?: number;
  /** Simple items: how the sell price was derived from cost (markup/margin/fixed). */
  pricingMethod?: PricingMethod;
  /** Simple items: the value paired with `pricingMethod` (% or fixed price). */
  pricingValue?: number;
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
/** Lightweight section group — title + thin underline + content. Replaces
 *  the previous heavy framed FormSection so the form scans as one continuous
 *  surface instead of stacked cards. */
function FormGroup({
  title,
  hint,
  children,
}: {
  title?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      {title && (
        <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h3>
          {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
        </div>
      )}
      <div className="space-y-3">{children}</div>
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
  const [isLinkedSellPriceEditable, setIsLinkedSellPriceEditable] = useState(false);
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
  /** Simple items only: when not linked to inventory, lets the admin opt in
   *  to also create a matching inventory record using the barcode + qty
   *  entered here. Purely a UI flag — parent decides what to do with it. */
  const [addToInventory, setAddToInventory] = useState(false);
  /** Unit used when selling — restaurant/retail items: pcs/kg/L etc.,
   *  service items: hour/session/visit. */
  const [sellingUnit, setSellingUnit] = useState<string>("pcs");
  /** Simple-item cost & markup state (used when not linked to inventory). */
  const [costPrice, setCostPrice] = useState<string>("");
  const [menuPricingMethod, setMenuPricingMethod] = useState<PricingMethod>("markup");
  const [menuPricingValue, setMenuPricingValue] = useState<string>("30");
  /** Reusable modifier groups attached to this item. */
  const [modifierGroupIds, setModifierGroupIds] = useState<string[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [modifierPickerOpen, setModifierPickerOpen] = useState(false);

  useEffect(() => {
    if (open) setModifierGroups(loadModifierGroups());
  }, [open]);

  // Derive business type from the outlet selected inside the form so the
  // add-ons / modifiers section appears even when the page-level outlet
  // filter is "All Outlets" (which passes no businessType prop).
  const effectiveBusinessType: BusinessTypeId | undefined =
    businessType ??
    (selectedOutletIds.length
      ? (outlets.find((o) => o.id === selectedOutletIds[0])?.businessType as BusinessTypeId | undefined)
      : undefined);
  const features = effectiveBusinessType ? getFeatures(effectiveBusinessType) : null;

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
        setModifierGroupIds(item.modifierGroupIds ?? []);
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
        setSellingUnit(item.sellingUnit ?? ((item.itemType ?? "simple") === "service" ? "hr" : "pcs"));
        setCostPrice(item.costPrice != null ? String(item.costPrice) : "");
        setMenuPricingMethod(item.pricingMethod ?? "markup");
        setMenuPricingValue(item.pricingValue != null ? String(item.pricingValue) : "30");
      } else {
        setItemType("simple");
        setName(""); setDescription(""); setSelectedCatId(""); setSubcategory("");
        setPrice(""); setQuantity(""); setSalePrice(""); setSalePeriodStart(null);
        setSalePeriodEnd(null); setShowSale(false); setSku(""); setIsActive(true);
        setImages([]); setVariants([]); setExtras([]); setTrackInventory(false);
        setLinkedInventoryItemId(""); setIngredients([]); setModifierGroupIds([]);
        setSelectedOutletIds(currentOutletId ? [currentOutletId] : []);
        setPricingStrategy("base");
        setAddToInventory(false);
        setSellingUnit("pcs");
        setCostPrice("");
        setMenuPricingMethod("markup");
        setMenuPricingValue("30");
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
      if (pricingStrategy === "variant") setPricingStrategy("base");
      setSellingUnit("hr");
    } else if (next === "simple") {
      // Composite ingredients & track-inventory don't apply
      setIngredients([]);
      setTrackInventory(false);
      setSellingUnit((prev) => (SERVICE_UNITS.some((u) => u.abbreviation === prev) ? "pcs" : prev));
    } else if (next === "composite") {
      // Linked inventory item is a Simple-only concept
      setLinkedInventoryItemId("");
      setTrackInventory(false);
      setSellingUnit((prev) => (SERVICE_UNITS.some((u) => u.abbreviation === prev) ? "pcs" : prev));
    }
  };

  // Auto-fill from linked inventory item (Simple type). Suggests a category
  // by name match against the catalog categories — admin can override.
  const handleLinkInventory = (invId: string) => {
    setLinkedInventoryItemId(invId);
    const inv = inventoryItems.find((i) => i.id === invId);
    if (!inv) return;
    if (!name.trim()) setName(inv.name);
    // Always sync barcode/qty from the linked item — these become read-only.
    setSku(inv.sku);
    setQuantity(String(inv.stock));
    setAddToInventory(false);
    // Sync selling unit from the linked inventory item if available.
    const linkedUnit = defaultMeasuringUnits.find((u) => u.id === (inv as { unitId?: string }).unitId);
    if (linkedUnit) setSellingUnit(linkedUnit.abbreviation);
    // Sync category from the linked inventory item's category. Match the
    // inventory category name against the catalog categories (case-insensitive,
    // partial) so admins keep a single source of truth.
    const invCat = defaultInventoryCategories.find((c) => c.id === (inv as { categoryId?: string }).categoryId);
    if (invCat) {
      const lowerCat = invCat.name.toLowerCase();
      const match =
        categories.find((c) => c.name.toLowerCase() === lowerCat) ??
        categories.find((c) => lowerCat.includes(c.name.toLowerCase().split(" ")[0])) ??
        categories.find((c) => c.name.toLowerCase().includes(lowerCat.split(" ")[0]));
      if (match) setSelectedCatId(match.id);
    }
    // Sync cost / sell price / markup from inventory record. Sell price
    // becomes the catalog Price, and the cost+markup pair drives the
    // read-only profit summary shown in the Pricing section.
    setCostPrice(inv.costPrice != null ? String(inv.costPrice) : "");
    if (inv.sellPrice != null && inv.sellPrice > 0) setPrice(String(inv.sellPrice));
    if (inv.pricingMethod) setMenuPricingMethod(inv.pricingMethod);
    if (inv.pricingValue != null) setMenuPricingValue(String(inv.pricingValue));
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
    const isOpenPrice = pricingStrategy === "open";
    const isVariantPriced = !isService && pricingStrategy === "variant";
    const hasVariants = !isService && variants.length > 0;
    if (!name.trim() || !selectedCatId) return;
    // Price requirements depend on strategy.
    if (!isOpenPrice) {
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
      extras: (() => {
        // Flatten attached modifier groups into per-item extras so the POS
        // (which renders extras grouped by category) keeps working without
        // changes. Manual extras keep their own category. Available for both
        // simple items and services (e.g. add-on services for salons).
        const fromGroups: MenuExtra[] = modifierGroups
          .filter((g) => modifierGroupIds.includes(g.id))
          .flatMap((g) =>
            g.modifiers.map((m) => ({
              id: `${g.id}:${m.id}`,
              name: m.name,
              price: m.price,
              category: g.name,
            })),
          );
        const manual = extras.filter((e) => !fromGroups.some((f) => f.id === e.id));
        return [...fromGroups, ...manual];
      })(),
      modifierGroupIds: modifierGroupIds.length ? modifierGroupIds : undefined,
      trackInventory: isService ? false : (hasVariants ? false : trackInventory),
      itemType,
      pricingStrategy: pricingStrategy,
      linkedInventoryItemId: itemType === "simple" && linkedInventoryItemId ? linkedInventoryItemId : undefined,
      ingredients: itemType === "composite"
        ? ingredients.filter((g) => g.inventoryItemId && g.quantity > 0)
        : undefined,
      sellingUnit: sellingUnit || undefined,
      costPrice: itemType === "simple" && pricingStrategy === "base" && costPrice
        ? parseFloat(costPrice) || undefined
        : undefined,
      pricingMethod: itemType === "simple" && pricingStrategy === "base" && costPrice
        ? menuPricingMethod
        : undefined,
      pricingValue: itemType === "simple" && pricingStrategy === "base" && costPrice
        ? parseFloat(menuPricingValue) || 0
        : undefined,
    }, selectedOutletIds);
    onOpenChange(false);
  };

  const formTitle = mode === "clone" ? "Clone Catalog Item" : mode === "edit" ? "Edit Catalog Item" : "Add Catalog Item";
  const formDescription = mode === "clone"
    ? "You're creating a new item based on an existing one. Review and adjust the details before saving."
    : mode === "edit"
    ? "Update the details of this catalog item."
    : "Fill in the details to create a new catalog item.";
  const submitLabel = mode === "clone" ? "Create Clone" : mode === "edit" ? "Update Item" : "Add Item";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle>{formTitle}</DialogTitle>
          <DialogDescription className="text-xs">{formDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* DETAILS — outlet, item type, name, category, unit, description.
              Merged into one block to reduce vertical noise. */}
          <FormGroup title="Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs flex items-center gap-1.5"><Store className="h-3.5 w-3.5" /> Outlet *</Label>
                <Select
                  value={selectedOutletIds[0] ?? ""}
                  onValueChange={(val) => setSelectedOutletIds(val ? [val] : [])}
                >
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select outlet" /></SelectTrigger>
                  <SelectContent>
                    {outlets.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Item Type *</Label>
                 <div className="mt-1 grid grid-cols-3 gap-1.5">
                  {([
                    { key: "simple", label: "Simple", desc: "Single stocked product", Icon: Package },
                    { key: "composite", label: "Composite", desc: "Made from ingredients", Icon: ChefHat },
                    { key: "service", label: "Service", desc: "Time-based, no stock", Icon: Sparkles },
                  ] as const).map(({ key, label, desc, Icon }) => {
                    const active = itemType === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleTypeChange(key)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 min-h-[3.25rem] rounded-md border text-xs transition-colors text-center",
                          active
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "border-border text-muted-foreground hover:bg-muted/40"
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5" />
                          <span>{label}</span>
                        </div>
                        <span className={cn("text-[10px] leading-tight", active ? "text-primary/80" : "text-muted-foreground/80")}>{desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="item-name" className="text-xs">Item Name *</Label>
              <Input id="item-name" className="mt-1 h-9" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cappuccino" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs flex items-center gap-1.5">
                  Category *
                  {itemType === "simple" && linkedInventoryItemId && (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  )}
                </Label>
                <Select
                  value={selectedCatId}
                  onValueChange={(v) => setSelectedCatId(v)}
                  disabled={itemType === "simple" && !!linkedInventoryItemId}
                >
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1.5">
                  Selling Unit
                  {itemType === "simple" && linkedInventoryItemId && (
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  )}
                </Label>
                <Select
                  value={sellingUnit}
                  onValueChange={setSellingUnit}
                  disabled={itemType === "simple" && !!linkedInventoryItemId}
                >
                  <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Select unit" /></SelectTrigger>
                  <SelectContent>
                    {(itemType === "service" ? SERVICE_UNITS : defaultMeasuringUnits).map((u) => (
                      <SelectItem key={u.abbreviation} value={u.abbreviation}>
                        {u.name} ({u.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="item-desc" className="text-xs">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea id="item-desc" className="mt-1" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." />
            </div>

            {variants.length === 0 && (
              <div className="flex items-center gap-3 pt-1">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label className="text-xs text-muted-foreground">{isActive ? "Active — visible at POS" : "Inactive — hidden from POS"}</Label>
              </div>
            )}
          </FormGroup>

          {/* INVENTORY — Simple items only. Combines link, stock/barcode, and
              the "Also add to Inventory" toggle into one compact group. */}
          {itemType === "simple" && (() => {
            const linked = linkedInventoryItemId
              ? inventoryItems.find((i) => i.id === linkedInventoryItemId)
              : null;
            const isLinked = !!linked;
            return (
              <FormGroup
                title="Inventory"
                hint={isLinked ? "Linked — synced from inventory" : undefined}
              >
                <div>
                  <Label className="text-xs">Link to existing inventory item <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Popover open={linkPickerOpen} onOpenChange={setLinkPickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between font-normal h-9 text-sm mt-1"
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs flex items-center gap-1.5">
                      Barcode / SKU
                      {isLinked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </Label>
                    {isLinked ? (
                      <Input className="mt-1 h-9 text-sm bg-muted/50" value={sku} readOnly disabled />
                    ) : (
                      <div className="mt-1">
                        <BarcodeScanner value={sku} onChange={setSku} placeholder="Scan or enter barcode" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1.5">
                      Quantity in stock
                      {isLinked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </Label>
                    <Input
                      className={cn("mt-1 h-9 text-sm", isLinked && "bg-muted/50")}
                      type="number"
                      min="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                      readOnly={isLinked}
                      disabled={isLinked}
                    />
                  </div>
                </div>

                {!isLinked && (
                  <div className="flex items-start gap-3 rounded-md bg-muted/40 px-3 py-2">
                    <Switch
                      id="add-to-inventory"
                      checked={addToInventory}
                      onCheckedChange={setAddToInventory}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="add-to-inventory" className="text-xs cursor-pointer">
                        Also add this item to Inventory
                      </Label>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Creates a matching inventory record so stock deducts automatically when sold.
                      </p>
                    </div>
                  </div>
                )}
              </FormGroup>
            );
          })()}

          {/* COMPOSITION — Composite items only (shown before Pricing) */}
          {itemType === "composite" && (() => {
            // Per-component unit options: base unit + every conversion target.
            const getCompUnitOptions = (itemId: string) => {
              const item = inventoryItems.find((i) => i.id === itemId);
              if (!item) return [] as { id: string; label: string; baseUnitsPer: number }[];
              const baseUnit = defaultMeasuringUnits.find((u) => u.id === item.unitId);
              const opts: { id: string; label: string; baseUnitsPer: number }[] = [
                {
                  id: item.unitId,
                  label: baseUnit ? `${baseUnit.name} (${baseUnit.abbreviation})` : "Base unit",
                  baseUnitsPer: 1,
                },
              ];
              (item.conversions || []).forEach((c) => {
                if (!c.toUnitId || c.toQuantity <= 0 || c.fromQuantity <= 0) return;
                const u = defaultMeasuringUnits.find((x) => x.id === c.toUnitId);
                opts.push({
                  id: c.toUnitId,
                  label: u ? `${u.name} (${u.abbreviation})` : c.toUnitId,
                  baseUnitsPer: c.fromQuantity / c.toQuantity,
                });
              });
              return opts;
            };
            const getCompUnitCost = (g: MenuIngredient) => {
              const item = inventoryItems.find((i) => i.id === g.inventoryItemId);
              if (!item) return 0;
              const baseCost = item.costPrice ?? 0;
              if (!g.unitId || g.unitId === item.unitId) return baseCost;
              const opt = getCompUnitOptions(g.inventoryItemId).find((o) => o.id === g.unitId);
              return baseCost * (opt?.baseUnitsPer ?? 1);
            };
            const getCompBaseConsumed = (g: MenuIngredient) => {
              const item = inventoryItems.find((i) => i.id === g.inventoryItemId);
              if (!item) return 0;
              let baseUnitsPer = 1;
              if (g.unitId && g.unitId !== item.unitId) {
                const opt = getCompUnitOptions(g.inventoryItemId).find((o) => o.id === g.unitId);
                baseUnitsPer = opt?.baseUnitsPer ?? 1;
              }
              return (g.quantity || 0) * baseUnitsPer;
            };
            const validIngredients = ingredients.filter((g) => g.inventoryItemId && g.quantity > 0);
            const totalMaterialCost = validIngredients.reduce(
              (s, g) => s + getCompUnitCost(g) * (g.quantity || 0),
              0
            );
            let sellableQty = Infinity;
            let limitingId: string | undefined;
            for (const g of validIngredients) {
              const consumed = getCompBaseConsumed(g);
              if (consumed <= 0) continue;
              const item = inventoryItems.find((i) => i.id === g.inventoryItemId);
              const stock = item?.stock ?? 0;
              const possible = Math.floor(stock / consumed);
              if (possible < sellableQty) { sellableQty = possible; limitingId = g.inventoryItemId; }
            }
            const hasComponents = sellableQty !== Infinity;
            const producible = hasComponents ? sellableQty : 0;
            const limitingName = limitingId ? inventoryItems.find((i) => i.id === limitingId)?.name : "";

            return (
              <FormGroup title="Composition" hint="Inventory consumed per sale">
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
                    const unitOptions = g.inventoryItemId ? getCompUnitOptions(g.inventoryItemId) : [];
                    const activeUnitId = g.unitId || inv?.unitId || "";
                    const unitCost = getCompUnitCost(g);
                    const lineCost = unitCost * (g.quantity || 0);
                    return (
                      <div key={idx} className="space-y-2 p-2.5 border rounded-md">
                        <div className="flex items-center gap-2">
                          <Popover open={ingredientPickerOpenIdx === idx} onOpenChange={(o) => setIngredientPickerOpenIdx(o ? idx : null)}>
                            <PopoverTrigger asChild>
                              <Button type="button" variant="outline" role="combobox" className="justify-between font-normal h-9 text-sm flex-1">
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
                                          // Reset unit when item changes so we don't carry stale unitId
                                          setIngredients((prev) => prev.map((p, i) => i === idx ? { ...p, inventoryItemId: it.id, unitId: undefined } : p));
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
                          <button
                            type="button"
                            onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
                            aria-label="Remove ingredient"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
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
                            className="h-9 text-sm w-20"
                          />
                          {g.inventoryItemId && unitOptions.length > 0 && (
                            <Select
                              value={activeUnitId}
                              onValueChange={(v) => setIngredients((prev) => prev.map((p, i) => i === idx ? { ...p, unitId: v } : p))}
                            >
                              <SelectTrigger className="h-9 w-36">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                {unitOptions.map((opt) => (
                                  <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {g.inventoryItemId && (
                            <span className="text-[11px] text-muted-foreground tabular-nums ml-auto">
                              @ {formatNaira(unitCost)} = <span className="font-medium text-foreground">{formatNaira(lineCost)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {validIngredients.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="rounded-md border bg-muted/30 p-2.5">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Material Cost</div>
                      <div className="text-sm font-semibold tabular-nums mt-0.5">{formatNaira(totalMaterialCost)}</div>
                    </div>
                    <div className={cn(
                      "rounded-md border p-2.5",
                      !hasComponents ? "bg-muted/30" :
                        producible === 0 ? "border-destructive/40 bg-destructive/5" :
                        producible < 5 ? "border-warning/40 bg-warning/5" :
                        "border-success/40 bg-success/5"
                    )}>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Sellable Qty</div>
                      <div className={cn(
                        "text-sm font-semibold tabular-nums mt-0.5",
                        hasComponents && producible === 0 && "text-destructive"
                      )}>
                        {hasComponents ? `${producible} units` : "—"}
                      </div>
                      {limitingName && hasComponents && (
                        <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                          Limited by <span className="font-medium text-foreground">{limitingName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </FormGroup>
            );
          })()}

          {/* PRICING */}
          <FormGroup title="Pricing">
            {(() => {
              const strategyOptions = itemType === "service"
                ? ([
                    { id: "base", label: "Base Price", desc: "One fixed price", icon: Tag },
                    { id: "open", label: "Open Price", desc: "Set at checkout", icon: KeyRound },
                  ] as const)
                : ([
                    { id: "base", label: "Base Price", desc: "One fixed price", icon: Tag },
                    { id: "variant", label: "Variants", desc: "Sizes or options", icon: Layers },
                    { id: "open", label: "Open Price", desc: "Set at checkout", icon: KeyRound },
                  ] as const);
              return (
                <>
                <div className={cn("grid gap-2", itemType === "service" ? "grid-cols-2" : "grid-cols-3")}>
                  {strategyOptions.map((opt) => {
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
                          if (opt.id !== "variant") {
                            setVariants([]);
                          }
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center gap-0.5 rounded-md border px-2 py-1.5 min-h-[3.25rem] text-xs transition-colors text-center",
                          active
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "border-border text-muted-foreground hover:bg-muted/50",
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5" />
                          <span>{opt.label}</span>
                        </div>
                        <span className={cn("text-[10px] leading-tight", active ? "text-primary/80" : "text-muted-foreground/80")}>{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>

                {pricingStrategy === "base" && (() => {
                  const isSimple = itemType === "simple";
                  const linkedInv = isSimple && linkedInventoryItemId
                    ? inventoryItems.find((i) => i.id === linkedInventoryItemId)
                    : null;

                  // LINKED → read-only summary sourced from inventory record
                  if (linkedInv) {
                    const cost = linkedInv.costPrice ?? 0;
                    const sell = linkedInv.sellPrice ?? (parseFloat(price) || 0);
                    const profit = sell - cost;
                    const markupPct = cost > 0 ? (profit / cost) * 100 : 0;
                    const methodLabel =
                      linkedInv.pricingMethod === "margin" ? "Margin"
                      : linkedInv.pricingMethod === "fixed" ? "Fixed"
                      : "Markup";
                    return (
                      <div className="space-y-2">
                        <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                            <Lock className="h-3 w-3" /> Synced from inventory
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Cost / unit</p>
                              <p className="font-medium tabular-nums">₦{cost.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{methodLabel}{linkedInv.pricingMethod !== "fixed" ? " %" : ""}</p>
                              <p className="font-medium tabular-nums">
                                {linkedInv.pricingValue != null
                                  ? (linkedInv.pricingMethod === "fixed"
                                      ? `₦${Number(linkedInv.pricingValue).toFixed(2)}`
                                      : `${Number(linkedInv.pricingValue).toFixed(1)}%`)
                                  : `${markupPct.toFixed(1)}%`}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Sell Price</p>
                              <div className="flex items-center gap-1">
                                {isLinkedSellPriceEditable ? (
                                  <>
                                    <span className="font-medium tabular-nums text-primary">₦</span>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      autoFocus
                                      value={price}
                                      onChange={(e) => setPrice(e.target.value)}
                                      onBlur={() => setIsLinkedSellPriceEditable(false)}
                                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setIsLinkedSellPriceEditable(false); }}
                                      className="h-auto border-0 bg-transparent p-0 font-medium tabular-nums text-primary text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                      aria-label="Sell price"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setIsLinkedSellPriceEditable(false)}
                                      className="text-primary hover:text-primary/80 transition-colors"
                                      aria-label="Done editing sell price"
                                    >
                                      <CheckIcon className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <p className="font-medium tabular-nums text-primary">₦{sell.toFixed(2)}</p>
                                    <button
                                      type="button"
                                      onClick={() => setIsLinkedSellPriceEditable(true)}
                                      className="text-muted-foreground hover:text-primary transition-colors"
                                      aria-label="Edit sell price"
                                      title="Edit sell price"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {cost > 0 && sell > 0 && (
                            <div className="flex items-center gap-1.5 text-xs pt-1 border-t border-border/60">
                              <TrendingUp className={cn("h-3.5 w-3.5", profit >= 0 ? "text-success" : "text-destructive")} />
                              <span className={cn("font-medium", profit >= 0 ? "text-success" : "text-destructive")}>
                                ₦{profit.toFixed(2)}/unit profit
                              </span>
                              <span className="text-muted-foreground">({markupPct.toFixed(1)}% markup)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // SIMPLE (not linked) → editable cost + sell price & markup
                  if (isSimple) {
                    const cost = parseFloat(costPrice) || 0;
                    const sell = parseFloat(price) || 0;
                    const profit = sell - cost;
                    return (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="item-cost-nv" className="text-xs">Cost Price / unit</Label>
                          <Input
                            id="item-cost-nv"
                            className="mt-1 h-9"
                            type="number"
                            min="0"
                            step="0.01"
                            value={costPrice}
                            onChange={(e) => {
                              const cp = e.target.value;
                              setCostPrice(cp);
                              const cpNum = parseFloat(cp) || 0;
                              const valNum = parseFloat(menuPricingValue) || 0;
                              if (cpNum > 0) {
                                const newSell = Math.round(calcMenuSellPrice(cpNum, menuPricingMethod, valNum) * 100) / 100;
                                setPrice(String(newSell));
                              }
                            }}
                            placeholder="0.00"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">Optional — enables markup-based sell pricing.</p>
                        </div>

                        <div className="grid grid-cols-[1fr_1fr_1fr] gap-2">
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Pricing</label>
                            <Select
                              value={menuPricingMethod}
                              onValueChange={(v) => {
                                const method = v as PricingMethod;
                                setMenuPricingMethod(method);
                                const cpNum = parseFloat(costPrice) || 0;
                                const valNum = parseFloat(menuPricingValue) || 0;
                                if (cpNum > 0) {
                                  const newSell = Math.round(calcMenuSellPrice(cpNum, method, valNum) * 100) / 100;
                                  setPrice(String(newSell));
                                }
                              }}
                            >
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="markup">Markup %</SelectItem>
                                <SelectItem value="margin">Margin %</SelectItem>
                                <SelectItem value="fixed">Fixed Price</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                              {menuPricingMethod === "fixed" ? "Price" : "%"}
                            </label>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              className="h-9"
                              value={menuPricingValue}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMenuPricingValue(val);
                                const cpNum = parseFloat(costPrice) || 0;
                                const valNum = parseFloat(val) || 0;
                                if (cpNum > 0) {
                                  const newSell = Math.round(calcMenuSellPrice(cpNum, menuPricingMethod, valNum) * 100) / 100;
                                  setPrice(String(newSell));
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Sell Price (₦) *</label>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              className="h-9"
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                        </div>

                        {cost > 0 && sell > 0 && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <TrendingUp className={cn("h-3.5 w-3.5", profit >= 0 ? "text-success" : "text-destructive")} />
                            <span className={cn("font-medium", profit >= 0 ? "text-success" : "text-destructive")}>
                              ₦{profit.toFixed(2)}/unit profit
                            </span>
                            <span className="text-muted-foreground">
                              ({((profit / cost) * 100).toFixed(1)}% markup)
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // COMPOSITE / SERVICE → original simple Price field
                  return (
                    <div>
                      <Label htmlFor="item-price-nv" className="text-xs">Price *</Label>
                      <Input id="item-price-nv" className="mt-1 h-9" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                    </div>
                  );
                })()}

                {pricingStrategy === "variant" && itemType !== "service" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-[1fr,140px,32px] gap-2 px-1 text-[11px] text-muted-foreground">
                      <span>Variant name</span>
                      <span>Price</span>
                      <span />
                    </div>
                    {variants.map((v, idx) => (
                      <div key={v.id} className="grid grid-cols-[1fr,140px,32px] gap-2 items-center">
                        <Input
                          className="h-9 text-sm"
                          value={v.name}
                          onChange={(e) => updateVariant(v.id, { ...v, name: e.target.value })}
                          placeholder={idx === 0 ? "e.g. Small" : "Variant name"}
                        />
                        <Input
                          className="h-9 text-sm"
                          type="number"
                          min="0"
                          step="0.01"
                          value={v.price || ""}
                          onChange={(e) => updateVariant(v.id, { ...v, price: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariant(v.id)}
                          disabled={variants.length === 1}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                          aria-label="Remove variant"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addVariant} className="w-full">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
                    </Button>
                  </div>
                )}

                {pricingStrategy === "open" && (
                  <p className="text-xs text-muted-foreground">
                    Price will be entered at checkout.
                  </p>
                )}

                {pricingStrategy === "base" && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-2">
                      <Switch checked={showSale} onCheckedChange={(v) => { setShowSale(v); if (!v) { setSalePrice(""); setSalePeriodStart(null); setSalePeriodEnd(null); } }} />
                      <Label className="text-xs">On Sale</Label>
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
                )}
                </>
              );
            })()}
          </FormGroup>

          {/* IMAGES — hidden for Service items. Compact thumbnail row, no
              wrapping section card. */}
          {itemType !== "service" && (
            <FormGroup title="Images" hint="Up to 4 — first is the POS thumbnail">
              <div className="flex gap-2 flex-wrap">
                {images.map((img, idx) => (
                  <div key={idx} className="relative h-16 w-16 rounded-md border border-border overflow-hidden group">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => removeImage(idx)} className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))}
                {images.length < 4 && (
                  <button onClick={handleImageUpload} className="h-16 w-16 rounded-md border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-primary transition-colors">
                    <ImagePlus className="h-4 w-4" />
                    <span className="text-[10px]">Add</span>
                  </button>
                )}
              </div>
            </FormGroup>
          )}

          {/* ADD-ONS — optional for all outlets, collapsed by default. */}
          <FormGroup>
            <Accordion type="single" collapsible defaultValue={extras.length > 0 || modifierGroupIds.length > 0 ? "extras" : undefined}>
              <AccordionItem value="extras" className="border-b-0">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <ListPlus className="h-3.5 w-3.5" />
                    <span>Add-ons</span>
                    <span className="font-normal normal-case tracking-normal text-[11px] text-muted-foreground/70">(optional)</span>
                    {extras.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 normal-case font-normal tracking-normal">
                        {extras.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    {/* Reusable modifier groups (managed in Admin → Modifier Groups) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Modifier Groups
                        </Label>
                        <Popover open={modifierPickerOpen} onOpenChange={setModifierPickerOpen}>
                          <PopoverTrigger asChild>
                            <Button type="button" variant="outline" size="sm" className="h-7 text-xs">
                              <Plus className="h-3.5 w-3.5 mr-1" /> Attach group
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 p-0" align="end">
                            <Command>
                              <CommandInput placeholder="Search modifier groups..." className="h-9" />
                              <CommandList>
                                <CommandEmpty>No modifier groups. Create one in Admin.</CommandEmpty>
                                <CommandGroup>
                                  {modifierGroups.map((g) => {
                                    const checked = modifierGroupIds.includes(g.id);
                                    return (
                                      <CommandItem
                                        key={g.id}
                                        onSelect={() => {
                                          setModifierGroupIds((prev) =>
                                            checked ? prev.filter((id) => id !== g.id) : [...prev, g.id],
                                          );
                                        }}
                                        className="flex items-center justify-between gap-2"
                                      >
                                        <div className="min-w-0">
                                          <div className="text-sm truncate">{g.name}</div>
                                          <div className="text-[10px] text-muted-foreground truncate">
                                            {g.modifiers.length} options
                                          </div>
                                        </div>
                                        {checked && <Check className="h-4 w-4 text-primary shrink-0" />}
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      {modifierGroupIds.length === 0 ? (
                        <p className="text-[11px] text-muted-foreground">
                          Attach reusable groups (e.g. Toppings, Coffee Options) so you don't recreate them per item.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {modifierGroupIds.map((id) => {
                            const g = modifierGroups.find((x) => x.id === id);
                            if (!g) return null;
                            return (
                              <Badge key={id} variant="secondary" className="gap-1 pr-1 text-[11px]">
                                <span>{g.name}</span>
                                <span className="text-muted-foreground">· {g.modifiers.length}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setModifierGroupIds((prev) => prev.filter((x) => x !== id))
                                  }
                                  className="ml-0.5 rounded hover:bg-destructive/15 p-0.5 text-muted-foreground hover:text-destructive"
                                  aria-label={`Remove ${g.name}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border pt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            One-off Add-ons
                          </Label>
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label="What are one-off add-ons?"
                                >
                                  <Info className="h-3.5 w-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[260px] text-xs leading-relaxed">
                                One-off add-ons are extras unique to this item only (e.g. extra cheese, gift wrap). Use Modifier Groups instead if you want to reuse the same add-ons across multiple items.
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
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
                      <div key={extra.id} className="border border-border rounded-md p-3 space-y-2 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">
                            Add-on #{idx + 1}
                          </Label>
                          <button
                            onClick={() => setExtras((prev) => prev.filter((e) => e.id !== extra.id))}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          <div>
                            <Label className="text-[11px]">Name *</Label>
                            <Input
                              className="mt-1 h-8 text-sm"
                              value={extra.name}
                              onChange={(e) =>
                                setExtras((prev) => prev.map((ex) => ex.id === extra.id ? { ...ex, name: e.target.value } : ex))
                              }
                              placeholder="e.g. Extra cheese"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px]">Price *</Label>
                            <Input
                              className="mt-1 h-8 text-sm"
                              type="number"
                              min="0"
                              step="0.01"
                              value={extra.price || ""}
                              onChange={(e) =>
                                setExtras((prev) => prev.map((ex) => ex.id === extra.id ? { ...ex, price: parseFloat(e.target.value) || 0 } : ex))
                              }
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px]">Group</Label>
                            <Input
                              className="mt-1 h-8 text-sm"
                              value={extra.category || ""}
                              onChange={(e) =>
                                setExtras((prev) => prev.map((ex) => ex.id === extra.id ? { ...ex, category: e.target.value } : ex))
                              }
                              placeholder="e.g. Toppings"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </FormGroup>
        </div>


        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={(() => {
            if (!name.trim() || !selectedCatId || selectedOutletIds.length === 0) return true;
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
