import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Upload, Download, FileSpreadsheet, AlertCircle, Check, Trash2, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as XLSX from "@/lib/xlsx-compat";
import type { MenuItem, MenuVariant, MenuItemType } from "./MenuItemForm";
import { formatNaira } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImportMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: MenuItem[]) => void;
}

interface ParsedRow {
  name: string;
  description: string;
  category: string;
  itemType: string;
  pricingStrategy: string;
  price: number;
  costPrice: number;
  sellingUnit: string;
  quantity: number;
  sku: string;
  status: string;
  variantName: string;
  variantPrice: number;
  variantSku: string;
  variantStatus: string;
  error?: string;
}

const EXPECTED_HEADERS = [
  "Name", "Description", "Category", "Item Type", "Pricing Strategy",
  "Price", "Cost Price", "Selling Unit", "Quantity",
  "SKU", "Status", "Variant Name", "Variant Price", "Variant SKU", "Variant Status",
];

const SAMPLE_DATA = [
  ["Cappuccino", "Rich espresso with steamed milk", "Food & Beverages", "simple", "base", 4500, 2000, "pcs", 150, "HD-001", "active", "", "", "", ""],
  ["Iced Latte", "Chilled espresso with cold milk", "Food & Beverages", "simple", "variant", "", "", "pcs", 80, "CD-001", "active", "Regular", 5000, "CD-001-R", "active"],
  ["Iced Latte", "", "", "", "", "", "", "", "", "", "", "Large", 6500, "CD-001-L", "active"],
  ["Haircut", "Professional styling", "Services", "service", "base", 15000, "", "session", "", "SV-001", "active", "", "", "", ""],
  ["Croissant", "Buttery French pastry", "Food & Beverages", "simple", "base", 3250, 1500, "pcs", 40, "PS-001", "active", "", "", "", ""],
];

const ITEMS_PER_PAGE = 10;

async function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([EXPECTED_HEADERS, ...SAMPLE_DATA]);

  ws["!cols"] = [
    { wch: 18 }, { wch: 35 }, { wch: 18 }, { wch: 12 }, { wch: 16 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
    { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 14 }, { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Catalog Items");
  await XLSX.writeFile(wb, "catalog-import-template.xlsx");
}

async function parseFile(data: ArrayBuffer): Promise<{ rows: ParsedRow[]; errors: string[] }> {
  const wb = await XLSX.read(data);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  if (raw.length < 2) return { rows: [], errors: ["File is empty or has no data rows."] };

  const headers = (raw[0] as string[]).map((h) => String(h).trim());
  const missing = EXPECTED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return { rows: [], errors: [`Missing columns: ${missing.join(", ")}`] };
  }

  const colIdx = Object.fromEntries(EXPECTED_HEADERS.map((h) => [h, headers.indexOf(h)]));
  const errors: string[] = [];
  const rows: ParsedRow[] = [];

  for (let i = 1; i < raw.length; i++) {
    const r = raw[i] as unknown[];
    if (!r || r.every((c) => c === undefined || c === null || c === "")) continue;

    const name = String(r[colIdx["Name"]] ?? "").trim();
    const variantName = String(r[colIdx["Variant Name"]] ?? "").trim();

    if (!name && variantName) {
      rows.push({
        name: "", description: "", category: "", itemType: "", pricingStrategy: "",
        price: 0, costPrice: 0, sellingUnit: "", quantity: 0, sku: "", status: "",
        variantName,
        variantPrice: Number(r[colIdx["Variant Price"]]) || 0,
        variantSku: String(r[colIdx["Variant SKU"]] ?? "").trim(),
        variantStatus: String(r[colIdx["Variant Status"]] ?? "active").trim(),
      });
      continue;
    }

    if (!name) {
      errors.push(`Row ${i + 1}: Missing item name.`);
      continue;
    }

    const price = Number(r[colIdx["Price"]]);
    if (isNaN(price) && String(r[colIdx["Price"]] ?? "").trim() !== "") {
      errors.push(`Row ${i + 1}: Invalid price for "${name}".`);
    }

    const itemType = String(r[colIdx["Item Type"]] ?? "simple").trim().toLowerCase();
    if (itemType && !["simple", "composite", "service"].includes(itemType)) {
      errors.push(`Row ${i + 1}: Invalid item type "${itemType}" for "${name}". Use simple, composite, or service.`);
    }

    const pricingStrategy = String(r[colIdx["Pricing Strategy"]] ?? "base").trim().toLowerCase();
    if (pricingStrategy && !["base", "variant", "open"].includes(pricingStrategy)) {
      errors.push(`Row ${i + 1}: Invalid pricing strategy "${pricingStrategy}" for "${name}". Use base, variant, or open.`);
    }

    rows.push({
      name,
      description: String(r[colIdx["Description"]] ?? "").trim(),
      category: String(r[colIdx["Category"]] ?? "").trim(),
      itemType: itemType || "simple",
      pricingStrategy: pricingStrategy || "base",
      price: isNaN(price) ? 0 : price,
      costPrice: Number(r[colIdx["Cost Price"]]) || 0,
      sellingUnit: String(r[colIdx["Selling Unit"]] ?? "").trim(),
      quantity: Number(r[colIdx["Quantity"]]) || 0,
      sku: String(r[colIdx["SKU"]] ?? "").trim(),
      status: String(r[colIdx["Status"]] ?? "active").trim(),
      variantName,
      variantPrice: Number(r[colIdx["Variant Price"]]) || 0,
      variantSku: String(r[colIdx["Variant SKU"]] ?? "").trim(),
      variantStatus: String(r[colIdx["Variant Status"]] ?? "active").trim(),
    });
  }

  return { rows, errors };
}

function rowsToMenuItems(rows: ParsedRow[]): MenuItem[] {
  const items: MenuItem[] = [];
  let current: MenuItem | null = null;

  for (const row of rows) {
    if (row.name) {
      current = {
        id: crypto.randomUUID(),
        name: row.name,
        description: row.description,
        category: row.category,
        subcategory: "",
        price: row.price,
        quantity: row.quantity,
        sku: row.sku,
        status: (row.status === "inactive" ? "inactive" : "active") as "active" | "inactive",
        salePrice: null,
        salePeriodStart: null,
        salePeriodEnd: null,
        images: [],
        trackInventory: false,
        variants: [],
        extras: [],
        itemType: (["simple", "composite", "service"].includes(row.itemType) ? row.itemType : "simple") as MenuItemType,
        pricingStrategy: (["base", "variant", "open"].includes(row.pricingStrategy) ? row.pricingStrategy : "base") as "base" | "variant" | "open",
        costPrice: row.costPrice || undefined,
        sellingUnit: row.sellingUnit || undefined,
      };

      if (row.variantName) {
        current.variants.push({
          id: crypto.randomUUID(),
          name: row.variantName,
          price: row.variantPrice,
          quantity: row.quantity,
          sku: row.variantSku,
          status: (row.variantStatus === "inactive" ? "inactive" : "active") as "active" | "inactive",
          salePrice: null,
          salePeriodStart: null,
          salePeriodEnd: null,
          trackInventory: false,
        });
      }

      items.push(current);
    } else if (row.variantName && current) {
      current.variants.push({
        id: crypto.randomUUID(),
        name: row.variantName,
        price: row.variantPrice,
        quantity: 0,
        sku: row.variantSku,
        status: (row.variantStatus === "inactive" ? "inactive" : "active") as "active" | "inactive",
        salePrice: null,
        salePeriodStart: null,
        salePeriodEnd: null,
        trackInventory: false,
      });
    }
  }

  return items;
}

export default function ImportMenuDialog({ open, onOpenChange, onImport }: ImportMenuDialogProps) {
  const [parsedItems, setParsedItems] = useState<MenuItem[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);

  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

  const totalPages = Math.max(1, Math.ceil(parsedItems.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = parsedItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalVariants = useMemo(() => parsedItems.reduce((s, i) => s + i.variants.length, 0), [parsedItems]);

  const updateItem = (id: string, field: keyof MenuItem, value: string | number) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const updateVariant = (itemId: string, variantId: string, field: keyof MenuVariant, value: string | number) => {
    setParsedItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              variants: item.variants.map((v) =>
                v.id === variantId ? { ...v, [field]: value } : v
              ),
            }
          : item
      )
    );
  };

  const EditableCell = ({ value, itemId, field, type = "text", className = "" }: {
    value: string | number;
    itemId: string;
    field: keyof MenuItem;
    type?: "text" | "number";
    className?: string;
  }) => {
    const isEditing = editingCell?.id === itemId && editingCell?.field === field;
    if (isEditing) {
      return (
        <Input
          autoFocus
          type={type}
          defaultValue={value}
          className={cn("h-7 text-xs px-1.5", className)}
          onBlur={(e) => {
            const v = type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
            updateItem(itemId, field, v);
            setEditingCell(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") setEditingCell(null);
          }}
        />
      );
    }
    return (
      <span
        className={cn("cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 inline-block min-w-[2ch]", className)}
        onClick={() => setEditingCell({ id: itemId, field })}
      >
        {value || "—"}
      </span>
    );
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as ArrayBuffer;
      const { rows, errors } = parseFile(data);
      setParseErrors(errors);
      const items = rowsToMenuItems(rows);
      setParsedItems(items);
      setPage(1);
      if (items.length === 0 && errors.length === 0) {
        setParseErrors(["No valid catalog items found in the file."]);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const removeItem = (id: string) => {
    setParsedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleImport = () => {
    if (parsedItems.length === 0) return;
    onImport(parsedItems);
    toast.success(`${parsedItems.length} catalog item${parsedItems.length > 1 ? "s" : ""} imported`);
    reset();
    onOpenChange(false);
  };

  const reset = () => {
    setParsedItems([]);
    setParseErrors([]);
    setFileName("");
    setPage(1);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const itemTypeLabel = (t?: string) => {
    if (t === "composite") return "Composite";
    if (t === "service") return "Service";
    return "Simple";
  };

  const pricingLabel = (p?: string) => {
    if (p === "variant") return "Variant";
    if (p === "open") return "Open";
    return "Base";
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="!w-full !max-w-none lg:!max-w-3xl p-0 flex flex-col overflow-hidden [&>button]:z-10">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Catalog from Excel
          </SheetTitle>
          <SheetDescription>
            Upload an Excel file to bulk-import catalog items. Items with variants use continuation rows.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col min-h-0 px-6">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFile}
            />
            <Button
              variant="outline"
              onClick={() => fileRef.current?.click()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {fileName || "Choose File"}
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              Download Template
            </Button>
          </div>

          {parseErrors.length > 0 && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm space-y-1">
              <div className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="h-4 w-4" />
                Import warnings
              </div>
              {parseErrors.map((e, i) => (
                <p key={i} className="text-xs pl-5">{e}</p>
              ))}
            </div>
          )}

          {parsedItems.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {parsedItems.length} item{parsedItems.length !== 1 ? "s" : ""}
                  </Badge>
                  {totalVariants > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {totalVariants} variant{totalVariants !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="min-w-[4ch] text-center">{currentPage}/{totalPages}</span>
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-auto flex-1 min-h-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[140px]">Name</TableHead>
                      <TableHead className="min-w-[100px]">Category</TableHead>
                      <TableHead className="min-w-[80px]">Type</TableHead>
                      <TableHead className="min-w-[80px]">Pricing</TableHead>
                      <TableHead className="text-right min-w-[80px]">Price</TableHead>
                      <TableHead className="min-w-[80px]">SKU</TableHead>
                      <TableHead className="min-w-[70px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Variants</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-sm">
                          <EditableCell value={item.name} itemId={item.id} field="name" />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <EditableCell value={item.category} itemId={item.id} field="category" />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.itemType || "simple"}
                            onValueChange={(v) => updateItem(item.id, "itemType", v)}
                          >
                            <SelectTrigger className="h-7 text-[10px] w-[85px] px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="simple">Simple</SelectItem>
                              <SelectItem value="composite">Composite</SelectItem>
                              <SelectItem value="service">Service</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.pricingStrategy || "base"}
                            onValueChange={(v) => updateItem(item.id, "pricingStrategy", v)}
                          >
                            <SelectTrigger className="h-7 text-[10px] w-[80px] px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="base">Base</SelectItem>
                              <SelectItem value="variant">Variant</SelectItem>
                              <SelectItem value="open">Open</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          <EditableCell value={item.price} itemId={item.id} field="price" type="number" />
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          <EditableCell value={item.sku} itemId={item.id} field="sku" />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.status}
                            onValueChange={(v) => updateItem(item.id, "status", v)}
                          >
                            <SelectTrigger className="h-7 text-[10px] w-[80px] px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">active</SelectItem>
                              <SelectItem value="inactive">inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {item.variants.length > 0 ? (
                            <div className="space-y-1">
                              {item.variants.map((v) => {
                                const isEditingVariantName = editingCell?.id === v.id && editingCell?.field === "name";
                                const isEditingVariantPrice = editingCell?.id === v.id && editingCell?.field === "price";
                                return (
                                  <div key={v.id} className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                    {isEditingVariantName ? (
                                      <Input
                                        autoFocus
                                        defaultValue={v.name}
                                        className="h-5 text-[11px] px-1 w-16"
                                        onBlur={(e) => { updateVariant(item.id, v.id, "name", e.target.value); setEditingCell(null); }}
                                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingCell(null); }}
                                      />
                                    ) : (
                                      <span className="cursor-pointer hover:bg-muted/50 rounded px-0.5" onClick={() => setEditingCell({ id: v.id, field: "name" })}>{v.name}</span>
                                    )}
                                    <span>—</span>
                                    {isEditingVariantPrice ? (
                                      <Input
                                        autoFocus
                                        type="number"
                                        defaultValue={v.price}
                                        className="h-5 text-[11px] px-1 w-14"
                                        onBlur={(e) => { updateVariant(item.id, v.id, "price", parseFloat(e.target.value) || 0); setEditingCell(null); }}
                                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingCell(null); }}
                                      />
                                    ) : (
                                      <span className="cursor-pointer hover:bg-muted/50 rounded px-0.5" onClick={() => setEditingCell({ id: v.id, field: "price" })}>₦{v.price.toLocaleString()}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {parsedItems.length === 0 && parseErrors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <FileSpreadsheet className="h-10 w-10 opacity-40" />
              <p className="text-sm">Upload an Excel file to preview items</p>
              <p className="text-xs">Download the template to see the expected format</p>
            </div>
          )}
        </div>
        <SheetFooter className="px-6 py-4 border-t gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={parsedItems.length === 0} className="gap-2">
            <Check className="h-4 w-4" />
            Import {parsedItems.length > 0 ? `${parsedItems.length} item${parsedItems.length > 1 ? "s" : ""}` : ""}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
