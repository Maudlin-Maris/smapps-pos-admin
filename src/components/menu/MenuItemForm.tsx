import { useState, useEffect, useMemo } from "react";
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
import { ImagePlus, X, Plus, Trash2, CalendarIcon, PackageCheck, Store, Check, Package, ChefHat, Sparkles, Link2, ChevronsUpDown, Search, Tag, TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Category } from "./CategoryManager";
import BarcodeScanner from "@/components/inventory/BarcodeScanner";
import { getFeatures, type BusinessTypeId } from "@/data/businessTypes";
import { Popover as OutletPopover, PopoverContent as OutletPopoverContent, PopoverTrigger as OutletPopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { Outlet } from "@/data/outlets";
import type { InventoryItem } from "@/components/inventory/InventoryItemForm";
import type { MeasuringUnit } from "@/components/inventory/MeasuringUnitManager";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { loadModifierGroups, type ModifierGroup } from "@/data/modifierGroups";
import { formatNaira } from "@/lib/currency";


export type CompositePricingMethod = "markup" | "margin" | "fixed";
export type ComponentRole = "primary" | "secondary";

function calcCompositeSellPrice(totalCost: number, method: CompositePricingMethod, value: number): number {
  if (method === "fixed") return value;
  if (method === "markup") return totalCost * (1 + value / 100);
  if (method === "margin") {
    if (value >= 100) return totalCost * 10;
    return totalCost / (1 - value / 100);
  }
  return totalCost;
}

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
  /** Unit the quantity is expressed in. Undefined = the item's base unit;
   *  otherwise must match one of the item's conversion `toUnitId`s. */
  unitId?: string;
  /** Whether this ingredient is the primary component or a secondary one
   *  (used for reporting / UI grouping). Defaults to "primary". */
  role?: ComponentRole;
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
  /** Composite: per-unit overhead override (packaging/staff/power). */
  overheadPerUnit?: number;
  /** Composite: pricing strategy used to derive sellPrice from total cost. */
  pricingMethod?: CompositePricingMethod;
  /** Composite: value paired with pricingMethod (% for markup/margin, ₦ for fixed). */
  pricingValue?: number;
  /** IDs of reusable modifier groups attached to this item. At save-time
   *  the form flattens these into `extras` so the existing POS UI continues
   *  to work — the IDs are kept here so admin edits stay in sync. */
  modifierGroupIds?: string[];
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
  currentOutletId: string;
  /** Inventory items used by Simple ("Link to inventory") and Composite
   *  ("Ingredients") item types. Optional — when omitted those sections
   *  show an empty-state. */
  inventoryItems?: InventoryItem[];
  /** Measuring units — used by composite ingredient unit selectors and to
   *  resolve per-unit costs from inventory conversions. */
  units?: MeasuringUnit[];
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

export default function MenuItemForm({ open, onOpenChange, categories, item, onSave, mode = "add", businessType, outlets, currentOutletId, inventoryItems = [], units = [] }: MenuItemFormProps) {
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
  const [overheadPerUnit, setOverheadPerUnit] = useState<string>("");
  const [pricingMethod, setPricingMethod] = useState<CompositePricingMethod>("markup");
  const [pricingValue, setPricingValue] = useState<number>(30);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [ingredientPickerOpenIdx, setIngredientPickerOpenIdx] = useState<number | null>(null);

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
        setOverheadPerUnit(item.overheadPerUnit !== undefined ? String(item.overheadPerUnit) : "");
        setPricingMethod(item.pricingMethod ?? "markup");
        setPricingValue(item.pricingValue ?? 30);
        const cat = categories.find((c) => c.name === item.category || c.subcategories.some((s) => s.name === item.subcategory));
        setSelectedCatId(cat?.id ?? "");
        setSubcategory(item.subcategory);
        setSelectedOutletIds(item.outletId ? [item.outletId] : (currentOutletId ? [currentOutletId] : []));
      } else {
        setItemType("simple");
        setName(""); setDescription(""); setSelectedCatId(""); setSubcategory("");
        setPrice(""); setQuantity(""); setSalePrice(""); setSalePeriodStart(null);
        setSalePeriodEnd(null); setShowSale(false); setSku(""); setIsActive(true);
        setImages([]); setVariants([]); setExtras([]); setTrackInventory(false);
        setLinkedInventoryItemId(""); setIngredients([]);
        setOverheadPerUnit(""); setPricingMethod("markup"); setPricingValue(30);
        setSelectedOutletIds(currentOutletId ? [currentOutletId] : []);
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

  // ============================================================
  // Composite — ingredient unit / cost / producibility helpers.
  // Mirrors the original CompositeItemForm logic 1:1.
  // ============================================================
  const getInvItem = (id: string) => inventoryItems.find((i) => i.id === id);
  const getUnitAbbr = (unitId?: string) =>
    unitId ? units.find((u) => u.id === unitId)?.abbreviation || "" : "";
  const getIngredientUnitOptions = (itemId: string) => {
    const inv = getInvItem(itemId);
    if (!inv) return [] as { id: string; label: string; baseUnitsPer: number }[];
    const baseUnit = units.find((u) => u.id === inv.unitId);
    const opts: { id: string; label: string; baseUnitsPer: number }[] = [
      {
        id: inv.unitId,
        label: baseUnit ? `${baseUnit.name} (${baseUnit.abbreviation})` : "Base unit",
        baseUnitsPer: 1,
      },
    ];
    (inv.conversions || []).forEach((c) => {
      if (!c.toUnitId || c.toQuantity <= 0 || c.fromQuantity <= 0) return;
      const u = units.find((x) => x.id === c.toUnitId);
      if (!u) return;
      opts.push({
        id: c.toUnitId,
        label: `${u.name} (${u.abbreviation})`,
        baseUnitsPer: c.fromQuantity / c.toQuantity,
      });
    });
    return opts;
  };
  const getIngredientUnitCost = (g: MenuIngredient) => {
    const inv = getInvItem(g.inventoryItemId);
    if (!inv) return 0;
    const baseCost = inv.costPrice ?? 0;
    if (!g.unitId || g.unitId === inv.unitId) return baseCost;
    const opt = getIngredientUnitOptions(g.inventoryItemId).find((o) => o.id === g.unitId);
    return baseCost * (opt?.baseUnitsPer ?? 1);
  };
  const getIngredientLineCost = (g: MenuIngredient) =>
    getIngredientUnitCost(g) * (g.quantity || 0);
  const getIngredientBaseUnitsConsumed = (g: MenuIngredient) => {
    const inv = getInvItem(g.inventoryItemId);
    if (!inv) return 0;
    let baseUnitsPer = 1;
    if (g.unitId && g.unitId !== inv.unitId) {
      const opt = getIngredientUnitOptions(g.inventoryItemId).find((o) => o.id === g.unitId);
      baseUnitsPer = opt?.baseUnitsPer ?? 1;
    }
    return (g.quantity || 0) * baseUnitsPer;
  };
  const producibleInfo = useMemo(() => {
    let min = Infinity;
    let limitingId: string | undefined;
    for (const g of ingredients) {
      if (!g.inventoryItemId) continue;
      const consumed = getIngredientBaseUnitsConsumed(g);
      if (consumed <= 0) continue;
      const inv = getInvItem(g.inventoryItemId);
      const stock = inv?.stock ?? 0;
      const possible = Math.floor(stock / consumed);
      if (possible < min) {
        min = possible;
        limitingId = g.inventoryItemId;
      }
    }
    return {
      producible: min === Infinity ? 0 : Math.max(0, min),
      limitingId,
      hasComponents: min !== Infinity,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredients, inventoryItems, units]);
  const limitingItemName = producibleInfo.limitingId
    ? getInvItem(producibleInfo.limitingId)?.name ?? ""
    : "";

  const rawCost = useMemo(
    () => ingredients.reduce((s, g) => s + getIngredientLineCost(g), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ingredients, inventoryItems, units]
  );
  const overheadValue = overheadPerUnit === "" ? 0 : Number(overheadPerUnit) || 0;
  const totalCost = rawCost + overheadValue;
  const compSellNum = price === "" ? 0 : Number(price) || 0;
  const profit = compSellNum - totalCost;
  const profitPositive = profit >= 0;

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
    const hasVariants = !isService && variants.length > 0;
    if (!name.trim() || (!hasVariants && !price) || !subcategory) return;
    if (hasVariants && variants.some((v) => !v.name.trim())) return;
    if (selectedOutletIds.length === 0) return;
    if (isComposite) {
      // Require at least one valid ingredient on composite items.
      const valid = ingredients.filter((g) => g.inventoryItemId && g.quantity > 0);
      if (valid.length === 0) return;
    }
    const cat = categories.find((c) => c.id === selectedCatId);
    const basePrice = hasVariants ? Math.min(...variants.map((v) => v.price)) : parseFloat(price);
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
    onSave({
      id: item?.id ?? crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      category: cat?.name ?? "",
      subcategory,
      price: basePrice,
      quantity: baseQty,
      salePrice: isService || hasVariants ? null : (showSale && salePrice ? parseFloat(salePrice) : null),
      salePeriodStart: isService || hasVariants ? null : (showSale ? salePeriodStart : null),
      salePeriodEnd: isService || hasVariants ? null : (showSale ? salePeriodEnd : null),
      sku: item?.sku || autoSku,
      status: isActive ? "active" : "inactive",
      images: isService ? [] : images,
      variants: isService ? [] : finalVariants,
      extras: isService ? [] : extras,
      trackInventory: isService ? false : (hasVariants ? false : trackInventory),
      itemType,
      linkedInventoryItemId: itemType === "simple" && linkedInventoryItemId ? linkedInventoryItemId : undefined,
      ingredients: itemType === "composite"
        ? ingredients.filter((g) => g.inventoryItemId && g.quantity > 0)
        : undefined,
      overheadPerUnit: itemType === "composite" && overheadPerUnit !== ""
        ? Number(overheadPerUnit)
        : undefined,
      pricingMethod: itemType === "composite" ? pricingMethod : undefined,
      pricingValue: itemType === "composite" ? pricingValue : undefined,
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

        <div className="space-y-5">
          {/* Item Type selector — drives which sections are shown below. */}
          <div>
            <Label className="text-sm font-medium">Item Type *</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Choose how this item behaves at the POS and in inventory.
            </p>
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
          </div>

          {/* Link to Inventory — Simple items only */}
          {itemType === "simple" && (
            <div className="border border-border rounded-lg p-3 space-y-2 bg-muted/30">
              <div className="flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Link to Inventory</Label>
                <span className="text-[11px] text-muted-foreground">(optional)</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Connect this catalog item to a stocked product. Auto-fills name, SKU and suggests a category.
              </p>
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
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="secondary" className="text-[10px]">Linked</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      Stock: <span className="font-medium text-foreground tabular-nums">{inv.stock}</span> · Cost: <span className="font-medium text-foreground tabular-nums">{inv.costPrice}</span>
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Images — hidden for Service items to keep the form minimal. */}
          {itemType !== "service" && (
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
          )}

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

            <div className="sm:col-span-2">
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
              <div className={cn("grid gap-4", itemType === "service" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
                <div>
                  <Label htmlFor="item-price-nv">Price *</Label>
                  <Input id="item-price-nv" className="mt-1" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                </div>
                {itemType !== "service" && (
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

              {/* Track from Inventory — only meaningful for Simple items
                  without a direct inventory link. Composite items consume
                  inventory via ingredients; Service items have no stock. */}
              {itemType === "simple" && !linkedInventoryItemId && (
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

              {itemType !== "service" && (
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
              )}
            </>
          )}

          {/* Composition + Cost & Pricing — Composite items only.
              Mirrors the original CompositeItemForm 1:1 (ingredient builder
              with units & roles, per-line cost, producibility panel,
              overhead override, pricing method, profit/margin readout). */}
          {itemType === "composite" && (
            <div className="space-y-4">
              {/* Ingredients */}
              <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <ChefHat className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Ingredients / Composition *</Label>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Inventory items consumed each time this item is sold.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIngredients((prev) => [...prev, { inventoryItemId: "", quantity: 1, role: "primary" }])}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>

                {ingredients.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">
                    No ingredients yet. Add inventory items that make up this item.
                  </p>
                )}

                <div className="space-y-2">
                  {ingredients.map((g, idx) => {
                    const inv = inventoryItems.find((i) => i.id === g.inventoryItemId);
                    const unitOptions = g.inventoryItemId ? getIngredientUnitOptions(g.inventoryItemId) : [];
                    const activeUnitId = g.unitId || inv?.unitId || "";
                    const unitCost = getIngredientUnitCost(g);
                    const lineCost = unitCost * (g.quantity || 0);
                    const role = g.role ?? "primary";
                    return (
                      <div key={idx} className="space-y-2 p-3 border rounded-lg bg-background">
                        <div className="flex items-center gap-2">
                          <Popover open={ingredientPickerOpenIdx === idx} onOpenChange={(o) => setIngredientPickerOpenIdx(o ? idx : null)}>
                            <PopoverTrigger asChild>
                              <Button type="button" variant="outline" role="combobox" className="flex-1 justify-between font-normal h-9 text-sm">
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
                                          // Reset unit when underlying item changes.
                                          setIngredients((prev) => prev.map((p, i) => i === idx ? { ...p, inventoryItemId: it.id, unitId: undefined } : p));
                                          setIngredientPickerOpenIdx(null);
                                        }}
                                      >
                                        <Check className={cn("h-3.5 w-3.5 mr-2", g.inventoryItemId === it.id ? "opacity-100" : "opacity-0")} />
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm truncate">{it.name}</div>
                                          <div className="text-[11px] text-muted-foreground truncate">{it.sku} · stock {it.stock}</div>
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
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Input
                            type="number"
                            className="w-20 h-9 text-sm"
                            value={g.quantity || ""}
                            min={0}
                            step={0.01}
                            placeholder="Qty"
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              setIngredients((prev) => prev.map((p, i) => i === idx ? { ...p, quantity: v } : p));
                            }}
                          />
                          {g.inventoryItemId && unitOptions.length > 1 ? (
                            <Select
                              value={activeUnitId}
                              onValueChange={(v) => setIngredients((prev) => prev.map((p, i) => i === idx ? { ...p, unitId: v } : p))}
                            >
                              <SelectTrigger className="h-9 w-32 text-sm">
                                <SelectValue placeholder="Unit" />
                              </SelectTrigger>
                              <SelectContent>
                                {unitOptions.map((opt) => (
                                  <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs text-muted-foreground w-10 shrink-0">
                              {getUnitAbbr(inv?.unitId)}
                            </span>
                          )}
                          {g.inventoryItemId && (
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              @ {formatNaira(unitCost)} = <span className="font-medium text-foreground">{formatNaira(lineCost)}</span>
                            </span>
                          )}
                          <div className="flex gap-1 ml-auto">
                            <Button
                              type="button"
                              variant={role === "primary" ? "default" : "outline"}
                              size="sm"
                              className="h-7 text-xs px-2.5"
                              onClick={() => setIngredients((prev) => prev.map((p, i) => i === idx ? { ...p, role: "primary" } : p))}
                            >
                              Primary
                            </Button>
                            <Button
                              type="button"
                              variant={role === "secondary" ? "secondary" : "outline"}
                              size="sm"
                              className="h-7 text-xs px-2.5"
                              onClick={() => setIngredients((prev) => prev.map((p, i) => i === idx ? { ...p, role: "secondary" } : p))}
                            >
                              Secondary
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Producible-from-stock panel */}
                {producibleInfo.hasComponents && (
                  <div className={cn(
                    "rounded-lg border p-3 flex items-center justify-between gap-3 text-xs",
                    producibleInfo.producible === 0
                      ? "border-destructive/40 bg-destructive/5"
                      : producibleInfo.producible < 5
                        ? "border-warning/40 bg-warning/5"
                        : "border-success/40 bg-success/5"
                  )}>
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-muted-foreground">Available to sell from current stock</div>
                      {limitingItemName && (
                        <div className="text-[11px] text-muted-foreground truncate">
                          Limited by <span className="font-medium text-foreground">{limitingItemName}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn(
                        "text-lg font-bold tabular-nums leading-none",
                        producibleInfo.producible === 0 ? "text-destructive" : "text-foreground"
                      )}>
                        {producibleInfo.producible}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">units</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cost & Selling Price — derived from BOM */}
              <div className="border border-border rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-medium">Cost & Selling Price</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="How is cost calculated?">
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" align="start" collisionPadding={12} className="w-[280px] text-xs leading-relaxed whitespace-normal break-words">
                      <p>Raw cost is auto-calculated from each ingredient's cost × quantity. Add an optional overhead (packaging, staff, power) per unit produced. Then pick a pricing method — <strong>Markup %</strong>, <strong>Margin %</strong>, or <strong>Fixed Price</strong> — to derive the selling price. Editing the price above also stays in sync.</p>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Raw materials cost</span>
                    <span className="font-medium tabular-nums">{formatNaira(rawCost)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">Overhead override (₦)</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={overheadPerUnit}
                      onChange={(e) => setOverheadPerUnit(e.target.value)}
                      placeholder="Outlet default"
                      className="h-7 max-w-[120px] text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t pt-1.5 mt-1">
                    <span className="font-medium">Total cost / unit</span>
                    <span className="font-semibold tabular-nums">{formatNaira(totalCost)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_1fr_1fr] gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Pricing</Label>
                    <Select
                      value={pricingMethod}
                      onValueChange={(v) => {
                        const method = v as CompositePricingMethod;
                        setPricingMethod(method);
                        if (totalCost > 0) {
                          const newSell = Math.round(calcCompositeSellPrice(totalCost, method, pricingValue) * 100) / 100;
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
                    <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      {pricingMethod === "fixed" ? "Price" : "%"}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={pricingValue}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPricingValue(val);
                        if (totalCost > 0) {
                          const newSell = Math.round(calcCompositeSellPrice(totalCost, pricingMethod, val) * 100) / 100;
                          setPrice(String(newSell));
                        }
                      }}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Sell Price (₦)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>

                {totalCost > 0 && compSellNum > 0 && (
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <TrendingUp className={cn("h-3.5 w-3.5", profitPositive ? "text-success" : "text-destructive")} />
                    <span className={cn("font-medium", profitPositive ? "text-success" : "text-destructive")}>
                      {formatNaira(profit)}/unit profit
                    </span>
                    <span className="text-muted-foreground">
                      ({((profit / totalCost) * 100).toFixed(1)}% markup · {((profit / compSellNum) * 100).toFixed(1)}% margin)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Variants — hidden for Service items */}
          {itemType !== "service" && (
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
          )}

          {/* Extras / Sides / Toppings / Add-ons */}
          {itemType !== "service" && features?.hasExtras && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{features.extrasLabel}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {extras.length > 0
                      ? `${extras.length} ${extras.length === 1 ? "item" : "items"} added`
                      : `Optional add-ons customers can select at checkout`}
                  </p>
                </div>
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
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || (variants.length === 0 && !price) || !subcategory || selectedOutletIds.length === 0 || (variants.length > 0 && variants.some((v) => !v.name.trim())) || (itemType === "composite" && ingredients.filter((g) => g.inventoryItemId && g.quantity > 0).length === 0)}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
