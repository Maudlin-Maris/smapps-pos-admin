import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Store,
  Building2,
  Mail,
  Phone,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import CashierFormDialog, {
  type CashierFormData,
  type OutletAssignment,
} from "@/components/cashiers/CashierFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { usePagination } from "@/hooks/use-pagination";

interface CashierRecord {
  id: number;
  data: CashierFormData;
}

const initialCashiers: CashierRecord[] = [
  {
    id: 1,
    data: {
      firstName: "Adebayo",
      lastName: "Ogunleye",
      email: "adebayo@example.com",
      phone: "+234 801 234 5678",
      pin: "1234",
      assignments: [
        { outletId: "outlet-1", outletName: "Downtown Flagship" },
        { outletId: "outlet-2", outletName: "Mall Branch" },
      ],
    },
  },
  {
    id: 2,
    data: {
      firstName: "Chioma",
      lastName: "Nwosu",
      email: "chioma@example.com",
      phone: "+234 802 345 6789",
      pin: "5678",
      assignments: [
        { outletId: "outlet-1", outletName: "Downtown Flagship", department: "Bar" },
      ],
    },
  },
  {
    id: 3,
    data: {
      firstName: "Emeka",
      lastName: "Eze",
      email: "emeka@example.com",
      phone: "+234 803 456 7890",
      pin: "9012",
      assignments: [
        { outletId: "outlet-3", outletName: "Airport Kiosk", department: "Counter" },
        { outletId: "outlet-4", outletName: "Suburban Store", department: "Front Desk" },
      ],
    },
  },
];

export default function CashierManagement() {
  const [cashiers, setCashiers] = useState<CashierRecord[]>(initialCashiers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingCashier, setEditingCashier] = useState<CashierRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CashierRecord | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const handleAdd = () => {
    setDialogMode("add");
    setEditingCashier(null);
    setDialogOpen(true);
  };

  const handleEdit = (cashier: CashierRecord) => {
    setDialogMode("edit");
    setEditingCashier(cashier);
    setDialogOpen(true);
  };

  const handleSubmit = (data: CashierFormData) => {
    if (dialogMode === "add") {
      setCashiers((prev) => [...prev, { id: Date.now(), data }]);
      toast.success(`Cashier ${data.firstName} ${data.lastName} added`);
    } else if (editingCashier) {
      setCashiers((prev) =>
        prev.map((c) => (c.id === editingCashier.id ? { ...c, data } : c))
      );
      toast.success(`Cashier ${data.firstName} ${data.lastName} updated`);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setCashiers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    toast.success(`Cashier ${deleteTarget.data.firstName} ${deleteTarget.data.lastName} removed`);
    setDeleteTarget(null);
  };

  const filtered = cashiers.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.data.firstName.toLowerCase().includes(q) ||
      c.data.lastName.toLowerCase().includes(q) ||
      c.data.email.toLowerCase().includes(q) ||
      c.data.assignments.some(
        (a) =>
          a.outletName.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q)
      )
    );
  });

  const {
    page,
    setPage,
    perPage,
    setPerPage,
    totalPages,
    paginatedItems,
    totalItems,
    pageSizeOptions,
  } = usePagination(filtered, 10);

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">Cashiers</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage cashiers and their outlet assignments
            </p>
          </div>
          <Badge variant="secondary" className="h-6 text-xs tabular-nums">
            {totalItems}
          </Badge>
        </div>
        <Button size="sm" className="w-fit" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Cashier
        </Button>
      </div>

      {/* Toolbar: Search + View toggle + Rows per page */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cashiers..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Rows</span>
            <Select value={String(perPage)} onValueChange={(v) => setPerPage(Number(v))}>
              <SelectTrigger className="h-8 w-[70px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((s) => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("table")}
              title="Table view"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Cashier</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead>Outlets</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((cashier) => (
                  <TableRow key={cashier.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                          {cashier.data.firstName[0]}{cashier.data.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {cashier.data.firstName} {cashier.data.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {cashier.data.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-0.5">
                        {cashier.data.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[200px]">{cashier.data.email}</span>
                          </div>
                        )}
                        {cashier.data.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{cashier.data.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {cashier.data.assignments.map((a) => (
                          <Badge key={a.outletId} variant="outline" className="text-[10px] px-2 py-0.5 font-normal gap-1">
                            <Store className="h-2.5 w-2.5 text-accent" />
                            {a.outletName}
                            {a.department && (
                              <span className="text-muted-foreground">· {a.department}</span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit cashier"
                          onClick={() => handleEdit(cashier)}
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Delete cashier"
                          onClick={() => setDeleteTarget(cashier)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">
                        {search ? "No cashiers match your search" : "No cashiers yet"}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedItems.map((cashier) => (
            <Card key={cashier.id} className="p-4 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                    {cashier.data.firstName[0]}{cashier.data.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-sm leading-tight">
                      {cashier.data.firstName} {cashier.data.lastName}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {cashier.data.assignments.length} outlet{cashier.data.assignments.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Edit" onClick={() => handleEdit(cashier)}>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Delete" onClick={() => setDeleteTarget(cashier)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1 text-xs mb-2.5">
                {cashier.data.email && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{cashier.data.email}</span>
                  </div>
                )}
                {cashier.data.phone && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>{cashier.data.phone}</span>
                  </div>
                )}
              </div>

              <Separator className="mb-2.5" />

              <div className="flex flex-wrap gap-1">
                {cashier.data.assignments.map((a) => (
                  <Badge key={a.outletId} variant="outline" className="text-[10px] px-1.5 py-0 font-normal gap-1">
                    <Store className="h-2.5 w-2.5 text-accent" />
                    {a.outletName}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}

          {paginatedItems.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-12">
              <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {search ? "No cashiers match your search" : "No cashiers yet"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalItems)} of {totalItems}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                className="h-8 w-8 text-xs"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <CashierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialData={editingCashier?.data}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cashier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.data.firstName} {deleteTarget?.data.lastName}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
