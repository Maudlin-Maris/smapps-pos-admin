import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Edit, Trash2, Copy, ChevronLeft, ChevronRight, Tag, PackageCheck, ScanBarcode } from "lucide-react";
import type { MenuItem } from "./MenuItemForm";
import type { Outlet } from "@/data/outlets";
import BarcodeScanner from "@/components/inventory/BarcodeScanner";

interface MenuListProps {
  items: MenuItem[];
  selectedSubcategory: string | null;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onClone: (item: MenuItem) => void;
  showOutlet?: boolean;
  readOnly?: boolean;
  outlets?: Outlet[];
}

export default function MenuList({ items, selectedSubcategory, onEdit, onDelete, onClone, showOutlet = false, readOnly = false, outlets = [] }: MenuListProps) {
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const getOutletName = (outletId?: string) => {
    if (!outletId) return "—";
    return outlets.find((o) => o.id === outletId)?.name ?? "—";
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        (!selectedSubcategory || item.subcategory === selectedSubcategory) &&
        (item.name.toLowerCase().includes(q) ||
          item.sku.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.subcategory.toLowerCase().includes(q))
    );
  }, [items, selectedSubcategory, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * rowsPerPage;
  const pageItems = filtered.slice(startIdx, startIdx + rowsPerPage);

  useMemo(() => setCurrentPage(1), [search, selectedSubcategory, rowsPerPage]);

  const colCount = 8 + (showOutlet ? 1 : 0) + (readOnly ? 0 : 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, SKU, category..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Rows</span>
          <Select value={String(rowsPerPage)} onValueChange={(v) => setRowsPerPage(Number(v))}>
            <SelectTrigger className="w-[70px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[5, 10, 20, 50].map((n) => (<SelectItem key={n} value={String(n)}>{n}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {showOutlet && <TableHead>Outlet</TableHead>}
                <TableHead>SKU</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Sale Price</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Inventory</TableHead>
                <TableHead>Status</TableHead>
                {!readOnly && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((item) => {
                const hasVariants = item.variants?.length > 0;

                if (hasVariants) {
                  return item.variants.map((v, vIdx) => (
                    <TableRow key={`${item.id}-${v.id}`} className={vIdx > 0 ? "border-t-0" : ""}>
                      {vIdx === 0 ? (
                        <TableCell rowSpan={item.variants.length} className="align-top border-r border-border/50">
                          <div className="flex items-center gap-2.5">
                            {item.images?.length > 0 ? (
                              <img src={item.images[0]} alt="" className="h-8 w-8 rounded-md object-cover shrink-0" />
                            ) : (
                              <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                                <span className="text-xs font-bold text-muted-foreground">{item.name.charAt(0)}</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.category} › {item.subcategory}</p>
                            </div>
                          </div>
                        </TableCell>
                      ) : null}
                      {showOutlet && vIdx === 0 ? (
                        <TableCell rowSpan={item.variants.length} className="align-top">
                          <Badge variant="outline" className="text-xs whitespace-nowrap">{getOutletName(item.outletId)}</Badge>
                        </TableCell>
                      ) : showOutlet && vIdx > 0 ? null : null}
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{v.sku || "—"}</TableCell>
                      <TableCell className="text-sm font-medium">{v.name}</TableCell>
                      <TableCell className="text-right font-heading font-semibold text-sm">
                        ${(v.price ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {v.salePrice != null ? (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Tag className="h-3 w-3" />${v.salePrice.toFixed(2)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">{v.quantity ?? 0}</TableCell>
                      <TableCell>
                        {v.trackInventory ? (
                          <Badge variant="outline" className="text-xs gap-1 text-primary border-primary/30">
                            <PackageCheck className="h-3 w-3" /> Tracked
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Manual</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={v.status === "active" ? "default" : "secondary"} className="text-xs">{v.status}</Badge>
                      </TableCell>
                      {!readOnly && vIdx === 0 ? (
                        <TableCell rowSpan={item.variants.length} className="align-top border-l border-border/50">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => onClone(item)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Clone"><Copy className="h-3.5 w-3.5" /></button>
                            <button onClick={() => onEdit(item)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Edit"><Edit className="h-3.5 w-3.5" /></button>
                            <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </TableCell>
                      ) : !readOnly && vIdx > 0 ? null : null}
                    </TableRow>
                  ));
                }

                // No variants - single row
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {item.images?.length > 0 ? (
                          <img src={item.images[0]} alt="" className="h-8 w-8 rounded-md object-cover shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-muted-foreground">{item.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.category} › {item.subcategory}</p>
                        </div>
                      </div>
                    </TableCell>
                    {showOutlet && (
                      <TableCell>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">{getOutletName(item.outletId)}</Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{item.sku || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">—</TableCell>
                    <TableCell className="text-right font-heading font-semibold text-sm">
                      ${(item.price ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {item.salePrice != null ? (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Tag className="h-3 w-3" />${item.salePrice.toFixed(2)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">{item.quantity ?? 0}</TableCell>
                    <TableCell>
                      {item.trackInventory ? (
                        <Badge variant="outline" className="text-xs gap-1 text-primary border-primary/30">
                          <PackageCheck className="h-3 w-3" /> Tracked
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Manual</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-xs">{item.status}</Badge>
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => onClone(item)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Clone"><Copy className="h-3.5 w-3.5" /></button>
                          <button onClick={() => onEdit(item)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Edit"><Edit className="h-3.5 w-3.5" /></button>
                          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={colCount} className="text-center py-8 text-muted-foreground text-sm">No menu items found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
          <span className="text-muted-foreground text-xs">
            {filtered.length > 0 ? `${startIdx + 1}–${Math.min(startIdx + rowsPerPage, filtered.length)} of ${filtered.length}` : "0 items"}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage <= 1} onClick={() => setCurrentPage(safePage - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) page = i + 1;
              else if (safePage <= 3) page = i + 1;
              else if (safePage >= totalPages - 2) page = totalPages - 4 + i;
              else page = safePage - 2 + i;
              return (
                <Button key={page} variant={safePage === page ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => setCurrentPage(page)}>
                  {page}
                </Button>
              );
            })}
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
