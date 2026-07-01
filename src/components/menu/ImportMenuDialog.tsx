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
import { NumericInput } from "@/components/ui/numeric-input";
import { Upload, Download, FileSpreadsheet, AlertCircle, Check, Trash2, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { MenuItem, MenuVariant, MenuItemType } from "./MenuItemForm";
import { formatNaira } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useImportCatalogPreview, downloadImportTemplate } from "@/services/api/catalog/item";

interface ImportMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: MenuItem[]) => void;
}

const ITEMS_PER_PAGE = 10;

export default function ImportMenuDialog({ open, onOpenChange, onImport }: ImportMenuDialogProps) {
  const [parsedItems, setParsedItems] = useState<MenuItem[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);

  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

  const { trigger: triggerPreview, isMutating: isPreviewing } = useImportCatalogPreview();

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
      if (type === "number") {
        return (
          <NumericInput
            autoFocus
            precision={2}
            min={0}
            defaultValue={value}
            className={cn("h-7 text-xs px-1.5", className)}
            onBlur={(e) => {
              const v = parseFloat(e.target.value) || 0;
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

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await triggerPreview(formData);
      if (res) {
        setParseErrors(res.errors || []);
        const items = (res.items || []).map((item) => ({
          ...item,
          id: (item as any).id || crypto.randomUUID(),
          variants: (item.variants || []).map((v) => ({
            ...v,
            id: (v as any).id || crypto.randomUUID(),
          })),
        })) as unknown as MenuItem[];
        setParsedItems(items);
        setPage(1);
        if (items.length === 0 && (res.errors || []).length === 0) {
          setParseErrors(["No valid catalog items found in the file."]);
        }
      }
    } catch (err) {
      // Handled
    }
    e.target.value = "";
  };

  const downloadTemplate = async () => {
    try {
      await downloadImportTemplate();
      toast.success("Template downloaded successfully");
    } catch (err) {
      toast.error("Failed to download template");
    }
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
              isLoading={isPreviewing}
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
                                      <NumericInput
                                        autoFocus
                                        precision={2}
                                        min={0}
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
