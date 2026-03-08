import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import * as XLSX from "xlsx";
import type { MenuItem, MenuVariant } from "./MenuItemForm";
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
  subcategory: string;
  price: number;
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
  "Name", "Description", "Category", "Subcategory", "Price", "Quantity",
  "SKU", "Status", "Variant Name", "Variant Price", "Variant SKU", "Variant Status",
];

const SAMPLE_DATA = [
  ["Cappuccino", "Rich espresso with steamed milk", "Food & Beverages", "Hot Drinks", 3.5, 150, "HD-001", "active", "", "", "", ""],
  ["Iced Latte", "Chilled espresso with cold milk", "Food & Beverages", "Cold Drinks", 5.0, 80, "CD-001", "active", "Regular", 5.0, "CD-001-R", "active"],
  ["Iced Latte", "", "", "", "", "", "", "", "Large", 6.5, "CD-001-L", "active"],
  ["Croissant", "Buttery French pastry", "Food & Beverages", "Pastries", 3.25, 40, "PS-001", "active", "", "", "", ""],
];

const ITEMS_PER_PAGE = 10;

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([EXPECTED_HEADERS, ...SAMPLE_DATA]);

  // Column widths
  ws["!cols"] = [
    { wch: 18 }, { wch: 35 }, { wch: 18 }, { wch: 15 }, { wch: 8 },
    { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 12 },
    { wch: 14 }, { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Menu Items");
  XLSX.writeFile(wb, "menu-import-template.xlsx");
}

function parseFile(data: ArrayBuffer): { rows: ParsedRow[]; errors: string[] } {
  const wb = XLSX.read(data, { type: "array" });
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

    // Variant-only row (continuation of previous item)
    if (!name && variantName) {
      rows.push({
        name: "",
        description: "",
        category: "",
        subcategory: "",
        price: 0,
        quantity: 0,
        sku: "",
        status: "",
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
    if (isNaN(price) || price < 0) {
      errors.push(`Row ${i + 1}: Invalid price for "${name}".`);
    }

    rows.push({
      name,
      description: String(r[colIdx["Description"]] ?? "").trim(),
      category: String(r[colIdx["Category"]] ?? "").trim(),
      subcategory: String(r[colIdx["Subcategory"]] ?? "").trim(),
      price: isNaN(price) ? 0 : price,
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
      // New item
      current = {
        id: crypto.randomUUID(),
        name: row.name,
        description: row.description,
        category: row.category,
        subcategory: row.subcategory,
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
      // Variant continuation row
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

  const totalPages = Math.max(1, Math.ceil(parsedItems.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = parsedItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalVariants = useMemo(() => parsedItems.reduce((s, i) => s + i.variants.length, 0), [parsedItems]);

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
        setParseErrors(["No valid menu items found in the file."]);
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const removeItem = (id: string) => {
    setParsedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleImport = () => {
    if (parsedItems.length === 0) return;
    onImport(parsedItems);
    toast.success(`${parsedItems.length} menu item${parsedItems.length > 1 ? "s" : ""} imported`);
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Menu from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file to bulk-import menu items. Items with variants use continuation rows.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Upload area & template */}
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

          {/* Errors */}
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

          {/* Preview table */}
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
                      <TableHead className="min-w-[120px]">Category</TableHead>
                      <TableHead className="min-w-[100px]">Subcategory</TableHead>
                      <TableHead className="text-right min-w-[70px]">Price</TableHead>
                      <TableHead className="min-w-[80px]">SKU</TableHead>
                      <TableHead className="min-w-[70px]">Status</TableHead>
                      <TableHead className="min-w-[100px]">Variants</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-sm">{item.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.category}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.subcategory}</TableCell>
                        <TableCell className="text-right text-sm">${item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-xs font-mono">{item.sku || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-[10px]">
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.variants.length > 0 ? (
                            <div className="space-y-0.5">
                              {item.variants.map((v) => (
                                <p key={v.id} className="text-[11px] text-muted-foreground">
                                  {v.name} — ${v.price.toFixed(2)}
                                </p>
                              ))}
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

          {/* Empty state */}
          {parsedItems.length === 0 && parseErrors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <FileSpreadsheet className="h-10 w-10 opacity-40" />
              <p className="text-sm">Upload an Excel file to preview items</p>
              <p className="text-xs">Download the template to see the expected format</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={parsedItems.length === 0} className="gap-2">
            <Check className="h-4 w-4" />
            Import {parsedItems.length > 0 ? `${parsedItems.length} item${parsedItems.length > 1 ? "s" : ""}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
