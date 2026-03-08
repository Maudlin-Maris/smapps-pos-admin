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
import { Search, Edit, Trash2, Copy, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import type { MenuItem } from "./MenuItemForm";

interface MenuListProps {
  items: MenuItem[];
  selectedSubcategory: string | null;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
  onClone: (item: MenuItem) => void;
}

export default function MenuList({ items, selectedSubcategory, onEdit, onDelete, onClone }: MenuListProps) {
  const [search, setSearch] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

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
                <TableHead>Category</TableHead>
                <TableHead>Subcategory</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Sale</TableHead>
                <TableHead>Variants</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((item) => (
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
                        {item.description && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{item.description}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{item.category}</TableCell>
                  <TableCell className="text-sm">{item.subcategory}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.sku || "—"}</TableCell>
                  <TableCell className="text-right font-heading font-semibold text-sm">${item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                  <TableCell>
                    {item.salePrice !== null ? (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Tag className="h-3 w-3" />${item.salePrice.toFixed(2)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.variants?.length > 0 ? (
                      <span className="text-xs text-muted-foreground">{item.variants.length} variant{item.variants.length > 1 ? "s" : ""}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === "active" ? "default" : "secondary"} className="text-xs">{item.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => onClone(item)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Clone"><Copy className="h-3.5 w-3.5" /></button>
                      <button onClick={() => onEdit(item)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground" title="Edit"><Edit className="h-3.5 w-3.5" /></button>
                      <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground text-sm">No menu items found</TableCell>
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
