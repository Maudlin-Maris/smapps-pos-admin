import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import type { Category } from "./CategoryManager";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  price: number;
  sku: string;
  status: "active" | "inactive";
}

interface MenuItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  item?: MenuItem | null;
  onSave: (item: MenuItem) => void;
}

export default function MenuItemForm({ open, onOpenChange, categories, item, onSave }: MenuItemFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [price, setPrice] = useState("");
  const [sku, setSku] = useState("");
  const [isActive, setIsActive] = useState(true);

  const selectedCat = categories.find((c) => c.id === selectedCatId);
  const subcategories = selectedCat?.subcategories ?? [];

  useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name);
        setDescription(item.description);
        setPrice(item.price.toString());
        setSku(item.sku);
        setIsActive(item.status === "active");
        // Find the category by matching subcategory name
        const cat = categories.find((c) => c.name === item.category || c.subcategories.some((s) => s.name === item.subcategory));
        setSelectedCatId(cat?.id ?? "");
        setSubcategory(item.subcategory);
      } else {
        setName("");
        setDescription("");
        setSelectedCatId("");
        setSubcategory("");
        setPrice("");
        setSku("");
        setIsActive(true);
      }
    }
  }, [open, item, categories]);

  const handleSave = () => {
    if (!name.trim() || !price || !subcategory) return;
    const cat = categories.find((c) => c.id === selectedCatId);
    onSave({
      id: item?.id ?? crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      category: cat?.name ?? "",
      subcategory,
      price: parseFloat(price),
      sku: sku.trim(),
      status: isActive ? "active" : "inactive",
    });
    onOpenChange(false);
  };

  const isEditing = !!item;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update the details of this menu item." : "Fill in the details to create a new menu item."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="item-name">Item Name *</Label>
              <Input id="item-name" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cappuccino" />
            </div>

            <div>
              <Label>Category *</Label>
              <Select value={selectedCatId} onValueChange={(v) => { setSelectedCatId(v); setSubcategory(""); }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subcategory *</Label>
              <Select value={subcategory} onValueChange={setSubcategory} disabled={!selectedCatId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="item-price">Price *</Label>
              <Input id="item-price" className="mt-1" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
            </div>

            <div>
              <Label htmlFor="item-sku">SKU</Label>
              <Input id="item-sku" className="mt-1" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. CAP-001" />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea id="item-desc" className="mt-1" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the item..." />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between">
              <div>
                <Label>Status</Label>
                <p className="text-xs text-muted-foreground">Item will be {isActive ? "visible" : "hidden"} on the menu</p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || !price || !subcategory}>
            {isEditing ? "Update Item" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
