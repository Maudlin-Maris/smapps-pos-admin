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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as XLSX from "@/lib/xlsx-compat";
import type { InventoryItem, ItemConversion } from "./InventoryItemForm";
import { RETAIL_BUSINESS_TYPES, BATCH_EXPIRY_BUSINESS_TYPES } from "./InventoryItemForm";
import type { InventoryCategory } from "./InventoryCategoryManager";
import type { MeasuringUnit } from "./MeasuringUnitManager";
import { useGetOutlets } from "@/services/api/outlets";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: InventoryCategory[];
  units: MeasuringUnit[];
  selectedOutletId: string;
  existingItems: InventoryItem[];
  onImport: (items: InventoryItem[]) => void;
}

interface ParsedRow {
  name: string;
  description: string;
  sku: string;
  category: string;
  unit: string;
  stock: number;
  minStock: number;
  costPrice: number;
  sellPrice: number;
  pricingMethod: string;
  pricingValue: number;
  batchNumber: string;
  expiryDate: string;
  convFromQty: number;
  convToQty: number;
  convUnit: string;
  isContinuation: boolean;
  errors: string[];
}

const EXPECTED_HEADERS = [
  "Name",
  "Description",
  "SKU",
  "Category",
  "Unit",
  "Stock",
  "Min Stock",
  "Cost Price",
  "Sell Price",
  "Pricing Method",
  "Pricing Value",
  "Batch Number",
  "Expiry Date",
  "Conversion From Qty",
  "Conversion To Qty",
  "Conversion Unit",
];

const SAMPLE_DATA: (string | number)[][] = [
  ["Espresso Beans", "Premium arabica beans", "INV-COF-001", "Food & Beverages", "kg", 25, 5, 4500, 0, "markup", 30, "", "", 1, 1000, "g"],
  ["Whole Milk", "Fresh dairy milk", "INV-DAIRY-001", "Food & Beverages", "L", 40, 10, 1200, 0, "markup", 25, "", "", 1, 1000, "ml"],
  ["Paracetamol 500mg", "Pain relief tablets", "INV-PHM-001", "Healthcare", "box", 50, 10, 1800, 2500, "fixed", 2500, "BN-2026-A", "2027-06-30", 1, 100, "tab"],
  ["Hair Conditioner 1L", "Salon professional", "INV-SAL-001", "Beauty & Personal Care", "btl", 12, 3, 3500, 5500, "markup", 60, "", "", "", "", ""],
  ["USB-C Cable 1m", "Braided fast charge", "INV-ELEC-001", "Electronics", "pcs", 80, 20, 1500, 2999, "margin", 50, "", "", "", "", ""],
];

const ITEMS_PER_PAGE = 10;

const DATE_FMT_HINT = "YYYY-MM-DD";

function findCategoryId(name: string, categories: InventoryCategory[]) {
  if (!name) return "";
  const found = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
  return found?.id ?? "";
}

function findUnitId(value: string, units: MeasuringUnit[]) {
  if (!value) return "";
  const v = value.toLowerCase().trim();
  const found = units.find(
    (u) => u.abbreviation.toLowerCase() === v || u.name.toLowerCase() === v
  );
  return found?.id ?? "";
}

function normalizeDate(raw: unknown): string {
  if (raw == null || raw === "") return "";
  if (raw instanceof Date) return raw.toISOString().slice(0, 10);
  const s = String(raw).trim();
  // already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s;
}

async function downloadTemplate() {
  const wb = XLSX.utils.book_new();

  // Items sheet
  const itemsWs = XLSX.utils.aoa_to_sheet([EXPECTED_HEADERS, ...SAMPLE_DATA]);
  itemsWs["!cols"] = [
    { wch: 24 }, { wch: 28 }, { wch: 16 }, { wch: 22 }, { wch: 10 },
    { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, itemsWs, "Inventory Items");

  // Instructions sheet
  const instructions: (string | number)[][] = [
    ["Bulk Inventory Import Template"],
    [],
    ["Field", "Required", "Notes"],
    ["Name", "Yes", "Unique within outlet. Duplicates with existing SKUs are skipped."],
    ["Description", "No", "Free-text description."],
    ["SKU", "Recommended", "Unique stock-keeping unit."],
    ["Category", "Yes", "Must match a category in the Categories tab (case-insensitive)."],
    ["Unit", "Yes", "Base unit. Use abbreviation (kg, L, pcs, box, btl, ml, g, tab, etc.) or full name."],
    ["Stock", "Yes", "Opening stock quantity in the base unit."],
    ["Min Stock", "Yes", "Reorder threshold."],
    ["Cost Price", "Yes", "Cost per base unit (NGN)."],
    ["Sell Price", "Retail only", "Required for retail outlets when Pricing Method is 'fixed'."],
    ["Pricing Method", "Retail only", "One of: markup, margin, fixed. Defaults to 'markup'."],
    ["Pricing Value", "Retail only", "Markup % / margin % / fixed price depending on method."],
    ["Batch Number", "Pharmacy/Grocery/Supermarket", "Optional batch identifier."],
    ["Expiry Date", "Pharmacy/Grocery/Supermarket", `Date format: ${DATE_FMT_HINT}. Optional.`],
    ["Conversion From Qty", "Yes (at least one)", "e.g. 1 (1 kg)."],
    ["Conversion To Qty", "Yes (at least one)", "e.g. 1000 (= 1000 g)."],
    ["Conversion Unit", "Yes (at least one)", "Sub-unit abbreviation or name (e.g. g, ml, tab)."],
    [],
    ["Multiple conversions for the same item"],
    ["Leave Name empty on the next row and fill only the three Conversion columns."],
    [],
    ["Same template works for all business types"],
    ["Restaurant, Retail, Pharmacy, Salon, Grocery, Electronics, etc. — only fill the columns that apply."],
  ];
  const instrWs = XLSX.utils.aoa_to_sheet(instructions);
  instrWs["!cols"] = [{ wch: 26 }, { wch: 22 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, instrWs, "Instructions");

  await XLSX.writeFile(wb, "inventory-import-template.xlsx");
}

async function parseFile(
  data: ArrayBuffer,
  categories: InventoryCategory[],
  units: MeasuringUnit[]
): Promise<{ rows: ParsedRow[]; errors: string[] }> {
  const wb = await XLSX.read(data);
  const ws = wb.Sheets["Inventory Items"] ?? wb.Sheets[wb.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  if (raw.length < 2) return { rows: [], errors: ["File is empty or has no data rows."] };

  const headers = (raw[0] as string[]).map((h) => String(h).trim());
  const missing = EXPECTED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return { rows: [], errors: [`Missing columns: ${missing.join(", ")}`] };
  }

  const idx = Object.fromEntries(EXPECTED_HEADERS.map((h) => [h, headers.indexOf(h)]));
  const errors: string[] = [];
  const rows: ParsedRow[] = [];

  for (let i = 1; i < raw.length; i++) {
    const r = raw[i] as unknown[];
    if (!r || r.every((c) => c === undefined || c === null || c === "")) continue;

    const name = String(r[idx["Name"]] ?? "").trim();
    const rowErrs: string[] = [];

    const convFromQty = Number(r[idx["Conversion From Qty"]]) || 0;
    const convToQty = Number(r[idx["Conversion To Qty"]]) || 0;
    const convUnit = String(r[idx["Conversion Unit"]] ?? "").trim();

    // Continuation row (extra conversion for prior item)
    if (!name) {
      if (!convUnit && convFromQty <= 0 && convToQty <= 0) continue;
      if (!convUnit || convFromQty <= 0 || convToQty <= 0) {
        rowErrs.push(`Row ${i + 1}: incomplete conversion on continuation row.`);
      } else if (!findUnitId(convUnit, units)) {
        rowErrs.push(`Row ${i + 1}: unknown conversion unit "${convUnit}".`);
      }
      rows.push({
        name: "",
        description: "",
        sku: "",
        category: "",
        unit: "",
        stock: 0,
        minStock: 0,
        costPrice: 0,
        sellPrice: 0,
        pricingMethod: "",
        pricingValue: 0,
        batchNumber: "",
        expiryDate: "",
        convFromQty,
        convToQty,
        convUnit,
        isContinuation: true,
        errors: rowErrs,
      });
      errors.push(...rowErrs);
      continue;
    }

    const category = String(r[idx["Category"]] ?? "").trim();
    const unit = String(r[idx["Unit"]] ?? "").trim();
    const stock = Number(r[idx["Stock"]]) || 0;
    const minStock = Number(r[idx["Min Stock"]]) || 0;
    const costPrice = Number(r[idx["Cost Price"]]) || 0;
    const sellPrice = Number(r[idx["Sell Price"]]) || 0;
    const pricingMethod = String(r[idx["Pricing Method"]] ?? "").trim().toLowerCase();
    const pricingValue = Number(r[idx["Pricing Value"]]) || 0;
    const batchNumber = String(r[idx["Batch Number"]] ?? "").trim();
    const expiryDate = normalizeDate(r[idx["Expiry Date"]]);

    if (!category) rowErrs.push(`Row ${i + 1}: Category is required.`);
    else if (!findCategoryId(category, categories))
      rowErrs.push(`Row ${i + 1}: Unknown category "${category}".`);

    if (!unit) rowErrs.push(`Row ${i + 1}: Unit is required.`);
    else if (!findUnitId(unit, units))
      rowErrs.push(`Row ${i + 1}: Unknown unit "${unit}".`);

    if (costPrice < 0) rowErrs.push(`Row ${i + 1}: Cost price cannot be negative.`);

    if (pricingMethod && !["markup", "margin", "fixed"].includes(pricingMethod)) {
      rowErrs.push(
        `Row ${i + 1}: Invalid pricing method "${pricingMethod}". Use markup, margin, or fixed.`
      );
    }

    // Need at least one valid conversion in this header row
    if (!convUnit || convFromQty <= 0 || convToQty <= 0) {
      rowErrs.push(`Row ${i + 1}: At least one conversion (From Qty, To Qty, Unit) is required.`);
    } else if (!findUnitId(convUnit, units)) {
      rowErrs.push(`Row ${i + 1}: Unknown conversion unit "${convUnit}".`);
    }

    rows.push({
      name,
      description: String(r[idx["Description"]] ?? "").trim(),
      sku: String(r[idx["SKU"]] ?? "").trim(),
      category,
      unit,
      stock,
      minStock,
      costPrice,
      sellPrice,
      pricingMethod,
      pricingValue,
      batchNumber,
      expiryDate,
      convFromQty,
      convToQty,
      convUnit,
      isContinuation: false,
      errors: rowErrs,
    });
    errors.push(...rowErrs);
  }

  return { rows, errors };
}

function computeStatus(stock: number, min: number): InventoryItem["status"] {
  if (stock <= min * 0.3) return "critical";
  if (stock <= min) return "low";
  return "good";
}

function rowsToInventoryItems(
  rows: ParsedRow[],
  categories: InventoryCategory[],
  units: MeasuringUnit[],
  outletId: string,
  outlets: any[]
): InventoryItem[] {
  const items: InventoryItem[] = [];
  let current: InventoryItem | null = null;

  const isRetail = (() => {
    const o = outlets.find((x) => x.id === outletId);
    return o ? RETAIL_BUSINESS_TYPES.includes(o.businessType) : false;
  })();

  const isBatchTracked = (() => {
    const o = outlets.find((x) => x.id === outletId);
    return o ? BATCH_EXPIRY_BUSINESS_TYPES.includes(o.businessType) : false;
  })();

  for (const row of rows) {
    if (row.errors.length > 0) continue;

    if (row.isContinuation && current) {
      const unitId = findUnitId(row.convUnit, units);
      if (!unitId) continue;
      current.conversions.push({
        id: crypto.randomUUID(),
        fromQuantity: row.convFromQty,
        toQuantity: row.convToQty,
        toUnitId: unitId,
        sellable: true,
        sellPrice: 0,
      });
      continue;
    }

    if (!row.name) continue;

    const categoryId = findCategoryId(row.category, categories);
    const unitId = findUnitId(row.unit, units);
    if (!categoryId || !unitId) continue;

    const conversions: ItemConversion[] = [];
    const convUnitId = findUnitId(row.convUnit, units);
    if (convUnitId && row.convFromQty > 0 && row.convToQty > 0) {
      conversions.push({
        id: crypto.randomUUID(),
        fromQuantity: row.convFromQty,
        toQuantity: row.convToQty,
        toUnitId: convUnitId,
        sellable: true,
        sellPrice: 0,
      });
    }

    const batches =
      isBatchTracked && (row.batchNumber || row.expiryDate)
        ? [
            {
              id: crypto.randomUUID(),
              batchNumber: row.batchNumber || `BN-${Date.now()}`,
              expiryDate: row.expiryDate,
              quantity: row.stock,
              initialQuantity: row.stock,
              costPrice: row.costPrice,
              createdAt: new Date().toISOString(),
            },
          ]
        : undefined;

    current = {
      id: crypto.randomUUID(),
      name: row.name,
      description: row.description || undefined,
      sku: row.sku || `SKU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      categoryId,
      unitId,
      stock: row.stock,
      minStock: row.minStock,
      costPrice: row.costPrice,
      sellPrice: isRetail ? row.sellPrice || undefined : undefined,
      pricingMethod: isRetail ? ((row.pricingMethod || "markup") as InventoryItem["pricingMethod"]) : undefined,
      pricingValue: isRetail ? row.pricingValue || 30 : undefined,
      status: computeStatus(row.stock, row.minStock),
      conversions,
      outletId,
      batches,
    };
    items.push(current);
  }

  return items;
}

export default function BulkImportInventoryDialog({
  open,
  onOpenChange,
  categories,
  units,
  selectedOutletId,
  existingItems,
  onImport,
}: Props) {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [page, setPage] = useState(1);
  const [targetOutlet, setTargetOutlet] = useState<string>(
    selectedOutletId && selectedOutletId !== "all" ? selectedOutletId : ""
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: outlets = [] } = useGetOutlets();

  const headerRows = useMemo(() => parsedRows.filter((r) => !r.isContinuation), [parsedRows]);
  const totalConversions = useMemo(
    () =>
      parsedRows.filter(
        (r) => r.isContinuation && r.convUnit && r.convFromQty > 0 && r.convToQty > 0
      ).length + headerRows.length,
    [parsedRows, headerRows.length]
  );

  const totalPages = Math.max(1, Math.ceil(headerRows.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = headerRows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const importableCount = useMemo(
    () =>
      rowsToInventoryItems(parsedRows, categories, units, targetOutlet || "preview", outlets).length,
    [parsedRows, categories, units, targetOutlet, outlets]
  );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const data = ev.target?.result as ArrayBuffer;
      const { rows, errors } = await parseFile(data, categories, units);
      setParseErrors(errors);
      setParsedRows(rows);
      setPage(1);
      if (rows.length === 0 && errors.length === 0) {
        setParseErrors(["No valid inventory items found in the file."]);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const removeRow = (index: number) => {
    // Remove the header row and its continuation rows below it (until next header)
    setParsedRows((prev) => {
      const idx = prev.findIndex((_r, i) => {
        const head = prev.slice(0, i + 1).filter((x) => !x.isContinuation).length - 1;
        return head === index && !prev[i].isContinuation;
      });
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      while (idx < next.length && next[idx].isContinuation) {
        next.splice(idx, 1);
      }
      return next;
    });
  };

  const reset = () => {
    setParsedRows([]);
    setParseErrors([]);
    setFileName("");
    setPage(1);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleImport = () => {
    if (!targetOutlet) {
      toast.error("Select an outlet to assign these items to");
      return;
    }
    const items = rowsToInventoryItems(parsedRows, categories, units, targetOutlet, outlets);
    if (items.length === 0) {
      toast.error("No valid items to import. Fix the errors above first.");
      return;
    }

    // Skip duplicates by SKU within outlet
    const existingSkus = new Set(
      existingItems.filter((i) => i.outletId === targetOutlet).map((i) => i.sku.toLowerCase())
    );
    const toImport = items.filter((i) => !existingSkus.has(i.sku.toLowerCase()));
    const skipped = items.length - toImport.length;

    if (toImport.length === 0) {
      toast.error("All items match existing SKUs in this outlet.");
      return;
    }

    onImport(toImport);
    toast.success(
      `${toImport.length} item${toImport.length > 1 ? "s" : ""} imported${
        skipped > 0 ? ` (${skipped} duplicate SKU${skipped > 1 ? "s" : ""} skipped)` : ""
      }`
    );
    handleOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="!w-full !max-w-none lg:!max-w-3xl p-0 flex flex-col overflow-hidden [&>button]:z-10"
      >
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Bulk Import Inventory
          </SheetTitle>
          <SheetDescription>
            Upload an Excel file to register many inventory items at once. The template works for
            all business types.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col min-h-0 px-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Outlet</span>
              <Select value={targetOutlet} onValueChange={setTargetOutlet}>
                <SelectTrigger className="h-9 w-[200px]">
                  <SelectValue placeholder="Select outlet" />
                </SelectTrigger>
                <SelectContent>
                  {outlets.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFile}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" />
              {fileName || "Choose File"}
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" />
              Download Template
            </Button>
          </div>

          {parseErrors.length > 0 && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm space-y-1 max-h-40 overflow-y-auto">
              <div className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="h-4 w-4" />
                Import warnings ({parseErrors.length})
              </div>
              {parseErrors.slice(0, 20).map((e, i) => (
                <p key={i} className="text-xs pl-5">
                  {e}
                </p>
              ))}
              {parseErrors.length > 20 && (
                <p className="text-xs pl-5 italic">…and {parseErrors.length - 20} more.</p>
              )}
            </div>
          )}

          {headerRows.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {headerRows.length} item{headerRows.length !== 1 ? "s" : ""}
                  </Badge>
                  {totalConversions > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {totalConversions} conversion{totalConversions !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      importableCount === headerRows.length
                        ? "border-success/40 text-success"
                        : "border-warning/40 text-warning"
                    )}
                  >
                    {importableCount} ready
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="min-w-[4ch] text-center">
                    {currentPage}/{totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-auto flex-1 min-h-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[160px]">Name</TableHead>
                      <TableHead className="min-w-[100px]">SKU</TableHead>
                      <TableHead className="min-w-[120px]">Category</TableHead>
                      <TableHead className="min-w-[70px]">Unit</TableHead>
                      <TableHead className="text-right min-w-[70px]">Stock</TableHead>
                      <TableHead className="text-right min-w-[80px]">Cost</TableHead>
                      <TableHead className="text-right min-w-[80px]">Sell</TableHead>
                      <TableHead className="min-w-[120px]">Conversion</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((row, i) => {
                      const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + i;
                      const ok = row.errors.length === 0;
                      return (
                        <TableRow key={globalIndex} className={cn(!ok && "bg-destructive/5")}>
                          <TableCell className="font-medium text-sm">{row.name}</TableCell>
                          <TableCell className="text-xs font-mono">{row.sku || "—"}</TableCell>
                          <TableCell className="text-xs">{row.category}</TableCell>
                          <TableCell className="text-xs">{row.unit}</TableCell>
                          <TableCell className="text-right text-xs">{row.stock}</TableCell>
                          <TableCell className="text-right text-xs">
                            ₦{row.costPrice.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {row.sellPrice > 0 ? `₦${row.sellPrice.toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.convFromQty > 0 && row.convToQty > 0 && row.convUnit
                              ? `${row.convFromQty} ${row.unit} = ${row.convToQty} ${row.convUnit}`
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {ok ? (
                              <Badge variant="outline" className="text-[10px] border-success/40 text-success">
                                Ready
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive">
                                {row.errors.length} issue{row.errors.length > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => removeRow(globalIndex)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {headerRows.length === 0 && parseErrors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <FileSpreadsheet className="h-10 w-10 opacity-40" />
              <p className="text-sm">Upload an Excel file to preview inventory items</p>
              <p className="text-xs">Download the template to see the expected format</p>
            </div>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={importableCount === 0 || !targetOutlet}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Import {importableCount > 0 ? `${importableCount} item${importableCount > 1 ? "s" : ""}` : ""}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
