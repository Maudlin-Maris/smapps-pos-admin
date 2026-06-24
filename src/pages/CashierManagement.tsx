import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus, Search, Pencil, Trash2, Store, Building2, Mail, Phone,
  LayoutGrid, List, KeyRound, ShieldOff, ShieldCheck, Copy, CheckCircle2, ShieldAlert,
  MoreVertical,
} from "lucide-react";
import CashierFormDialog, {
  type CashierFormData,
} from "@/components/cashiers/CashierFormDialog";
import { toast } from "sonner";
import { usePagination } from "@/hooks/use-pagination";
import { ResuablePagination } from "@/components/ui/reusable-pagination";
import {
  useGetCashiers,
  useCreateCashier,
  useUpdateCashier,
  useRegenerateCashierPin,
  useDeleteCashier,
} from "@/services/api/cashiers";

type CashierStatus = "active" | "suspended";

interface CashierRecord {
  id: string | number;
  data: CashierFormData;
  pin: string;
  status: CashierStatus;
  pinIssuedAt: string;
}

function generatePin(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 10000).padStart(4, "0");
}

const initialCashiers: CashierRecord[] = [
  {
    id: 1, pin: "1234", status: "active", pinIssuedAt: new Date().toISOString(),
    data: {
      firstName: "Adebayo", lastName: "Ogunleye",
      email: "adebayo@example.com", phone: "+234 801 234 5678",
      assignments: [
        { outletId: "outlet-1", outletName: "Downtown Flagship", departments: [{ id: "dept-1", name: "Kitchen" }, { id: "dept-2", name: "Bar" }] },
        { outletId: "outlet-2", outletName: "Mall Branch", departments: [{ id: "dept-5", name: "Sales Floor" }] },
      ],
    },
  },
  {
    id: 2, pin: "5678", status: "active", pinIssuedAt: new Date().toISOString(),
    data: {
      firstName: "Chioma", lastName: "Nwosu",
      email: "chioma@example.com", phone: "+234 802 345 6789",
      assignments: [{ outletId: "outlet-1", outletName: "Downtown Flagship", departments: [{ id: "dept-3", name: "Front of House" }] }],
    },
  },
  {
    id: 3, pin: "9012", status: "suspended", pinIssuedAt: new Date().toISOString(),
    data: {
      firstName: "Emeka", lastName: "Eze",
      email: "emeka@example.com", phone: "+234 803 456 7890",
      assignments: [
        { outletId: "outlet-3", outletName: "Airport Kiosk", departments: [{ id: "dept-9", name: "Counter" }] },
        { outletId: "outlet-4", outletName: "Suburban Store", departments: [{ id: "dept-11", name: "Dispensary" }] },
      ],
    },
  },
];

interface PinRevealState {
  cashier: CashierRecord;
  reason: "created" | "regenerated";
}

export default function CashierManagement() {
  const { data: cashiersList = [], isLoading, mutate } = useGetCashiers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingCashier, setEditingCashier] = useState<CashierRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CashierRecord | null>(null);
  const [regenTarget, setRegenTarget] = useState<CashierRecord | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<CashierRecord | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<CashierRecord | null>(null);
  const [pinReveal, setPinReveal] = useState<PinRevealState | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CashierStatus>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const { trigger: createCashier, isMutating: isCreating } = useCreateCashier({
    onSuccess: (result) => {
      mutate();
      setDialogOpen(false);
      if (result) {
        setPinReveal({ cashier: result as any, reason: "created" });
      }
    }
  });

  const { trigger: updateCashier, isMutating: isUpdating } = useUpdateCashier(editingCashier?.id, {
    onSuccess: () => {
      mutate();
      setDialogOpen(false);
    }
  });

  const { trigger: deleteCashier, isMutating: isDeleting } = useDeleteCashier(deleteTarget?.id, {
    onSuccess: () => {
      mutate();
      setDeleteTarget(null);
      toast.success("Cashier removed successfully");
    }
  });

  const { trigger: regeneratePin, isMutating: isRegenerating } = useRegenerateCashierPin(regenTarget?.id, {
    onSuccess: (result) => {
      mutate();
      setRegenTarget(null);
      if (result) {
        setPinReveal({ cashier: result as any, reason: "regenerated" });
        toast.success(`New PIN emailed to ${result.data.email || "cashier"}`);
      }
    }
  });

  const { trigger: suspendCashier, isMutating: isSuspending } = useUpdateCashier(suspendTarget?.id, {
    onSuccess: (result) => {
      mutate();
      setSuspendTarget(null);
      if (result) {
        toast.warning(`${result.data.firstName}'s POS access suspended. Active sessions terminated.`);
      }
    }
  });

  const { trigger: reactivateCashier, isMutating: isReactivating } = useUpdateCashier(reactivateTarget?.id, {
    onSuccess: (result) => {
      mutate();
      setReactivateTarget(null);
      if (result) {
        toast.success(`${result.data.firstName}'s POS access reactivated`);
      }
    }
  });

  useEffect(() => {
    if (reactivateTarget) {
      reactivateCashier({ status: "active" });
    }
  }, [reactivateTarget]);

  const handleAdd = () => {
    setDialogMode("add"); setEditingCashier(null); setDialogOpen(true);
  };
  const handleEdit = (cashier: CashierRecord) => {
    setDialogMode("edit"); setEditingCashier(cashier); setDialogOpen(true);
  };

  const handleSubmit = async (data: CashierFormData) => {
    if (dialogMode === "add") {
      try {
        await createCashier(data);
      } catch (e) {}
    } else if (editingCashier) {
      try {
        await updateCashier(data);
        toast.success(`Cashier ${data.firstName} ${data.lastName} updated`);
      } catch (e) {}
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCashier();
    } catch (e) {}
  };

  const handleRegenerate = async () => {
    if (!regenTarget) return;
    try {
      await regeneratePin();
    } catch (e) {}
  };

  const toggleStatus = (cashier: CashierRecord) => {
    const next: CashierStatus = cashier.status === "active" ? "suspended" : "active";
    if (next === "suspended") {
      setSuspendTarget(cashier);
    } else {
      setReactivateTarget(cashier);
    }
  };

  const copyPin = async (pin: string) => {
    try {
      await navigator.clipboard.writeText(pin);
      toast.success("PIN copied to clipboard");
    } catch {
      toast.error("Unable to copy PIN");
    }
  };

  const filtered = cashiersList.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      c.data.firstName.toLowerCase().includes(q) ||
      c.data.lastName.toLowerCase().includes(q) ||
      c.data.email.toLowerCase().includes(q) ||
      c.data.assignments.some((a) => a.outletName.toLowerCase().includes(q));
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const {
    page, setPage, perPage, setPerPage, totalPages,
    paginatedItems, totalItems, pageSizeOptions,
  } = usePagination(filtered, 10);

  const StatusBadge = ({ status }: { status: CashierStatus }) =>
    status === "active" ? (
      <Badge className="bg-success/15 text-success hover:bg-success/15 border-success/20 gap-1">
        <ShieldCheck className="h-3 w-3" /> Active
      </Badge>
    ) : (
      <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/5 gap-1">
        <ShieldOff className="h-3 w-3" /> Suspended
      </Badge>
    );

  const RowActions = ({ cashier }: { cashier: CashierRecord }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleEdit(cashier)}>
          <Pencil className="h-3.5 w-3.5 mr-2" /> Edit details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setRegenTarget(cashier)}>
          <KeyRound className="h-3.5 w-3.5 mr-2" /> Regenerate PIN
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {cashier.status === "active" ? (
          <DropdownMenuItem onClick={() => setSuspendTarget(cashier)} className="text-destructive focus:text-destructive">
            <ShieldOff className="h-3.5 w-3.5 mr-2" /> Suspend access
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => toggleStatus(cashier)} className="text-success focus:text-success">
            <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Reactivate access
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setDeleteTarget(cashier)} className="text-destructive focus:text-destructive">
          <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete cashier
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">Cashiers</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage cashiers, PINs and POS access
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

      {/* Toolbar */}
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
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
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
            <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setViewMode("table")} title="Table view">
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={() => setViewMode("grid")} title="Grid view">
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
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[60px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                          <div className="space-y-2">
                            <div className="h-4 w-28 bg-muted rounded" />
                            <div className="h-3 w-20 bg-muted rounded md:hidden" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1.5">
                          <div className="h-3 w-32 bg-muted rounded" />
                          <div className="h-3 w-24 bg-muted rounded" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-5 w-24 bg-muted rounded-full" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 w-16 bg-muted rounded-full" />
                      </TableCell>
                      <TableCell>
                        <div className="h-8 w-8 bg-muted rounded-md ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : paginatedItems.map((cashier) => (
                  <TableRow key={cashier.id} className={cashier.status === "suspended" ? "opacity-70" : ""}>
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
                      <div className="flex flex-col gap-1.5">
                        {cashier.data.assignments.map((a) => (
                          <div key={a.outletId} className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-normal gap-1">
                              <Store className="h-2.5 w-2.5 text-accent" />
                              {a.outletName}
                            </Badge>
                            {a.departments?.map((d) => (
                              <Badge key={d.id} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                                {d.name}
                              </Badge>
                            ))}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={cashier.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <RowActions cashier={cashier} />
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && paginatedItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
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
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-4 space-y-4 animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-24 bg-muted rounded" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
                <div className="h-px bg-muted" />
                <div className="flex justify-between items-center">
                  <div className="h-5 w-16 bg-muted rounded" />
                  <div className="h-5 w-12 bg-muted rounded" />
                </div>
              </Card>
            ))
          ) : paginatedItems.map((cashier) => (
            <Card key={cashier.id} className={`p-4 hover:shadow-md transition-shadow ${cashier.status === "suspended" ? "opacity-70" : ""}`}>
              <div className="flex items-start justify-between mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                    {cashier.data.firstName[0]}{cashier.data.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-heading font-semibold text-sm leading-tight truncate">
                      {cashier.data.firstName} {cashier.data.lastName}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {cashier.data.assignments.length} outlet{cashier.data.assignments.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <RowActions cashier={cashier} />
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

              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {cashier.data.assignments.slice(0, 2).map((a) => (
                    <Badge key={a.outletId} variant="outline" className="text-[10px] px-1.5 py-0 font-normal gap-1">
                      <Store className="h-2.5 w-2.5 text-accent" />
                      {a.outletName}
                    </Badge>
                  ))}
                  {cashier.data.assignments.length > 2 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                      +{cashier.data.assignments.length - 2}
                    </Badge>
                  )}
                </div>
                <StatusBadge status={cashier.status} />
              </div>
            </Card>
          ))}

          {!isLoading && paginatedItems.length === 0 && (
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
        <ResuablePagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalItems}
          rowsPerPage={perPage}
          onRowsPerPageChange={setPerPage}
          rowsPerPageOptions={pageSizeOptions}
        />
      )}

      <CashierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialData={editingCashier?.data}
        onSubmit={handleSubmit}
      />

      {/* PIN Reveal Modal — creation or regeneration */}
      <Dialog open={!!pinReveal} onOpenChange={(o) => !o && setPinReveal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15 mb-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <DialogTitle>
              {pinReveal?.reason === "created" ? "Cashier created" : "New PIN generated"}
            </DialogTitle>
            <DialogDescription>
              {pinReveal?.reason === "created"
                ? "The PIN below has been emailed to the cashier. It won't be shown again."
                : "Old PIN has been invalidated. The new PIN below has been emailed to the cashier and won't be shown again."}
            </DialogDescription>
          </DialogHeader>

          {pinReveal && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex justify-between items-start gap-3 text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium text-right">
                    {pinReveal.cashier.data.firstName} {pinReveal.cashier.data.lastName}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-3 text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium text-right truncate">{pinReveal.cashier.data.email || "—"}</span>
                </div>
                <div className="flex justify-between items-start gap-3 text-sm">
                  <span className="text-muted-foreground">Outlets</span>
                  <span className="font-medium text-right">
                    {pinReveal.cashier.data.assignments.map((a) => a.outletName).join(", ") || "—"}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Generated PIN</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-center font-mono text-3xl font-bold tracking-[0.5em] text-primary">
                    {pinReveal.cashier.pin}
                  </div>
                  <Button variant="outline" size="icon" className="h-12 w-12" onClick={() => copyPin(pinReveal.cashier.pin)} title="Copy PIN">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-xs">
                <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <span>
                  For security, the PIN cannot be retrieved later. If lost, you'll need to regenerate it.
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setPinReveal(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate PIN confirmation */}
      <AlertDialog open={!!regenTarget} onOpenChange={() => setRegenTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate PIN?</AlertDialogTitle>
            <AlertDialogDescription>
              A new PIN will be generated for{" "}
              <span className="font-semibold text-foreground">
                {regenTarget?.data.firstName} {regenTarget?.data.lastName}
              </span>{" "}
              and emailed to them. The current PIN will be invalidated immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate} disabled={isRegenerating}>
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend confirmation */}
      <AlertDialog open={!!suspendTarget} onOpenChange={() => setSuspendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend cashier access?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">
                {suspendTarget?.data.firstName} {suspendTarget?.data.lastName}
              </span>{" "}
              will be unable to log into POS terminals and any active sessions will be terminated immediately. They'll see an access-denied message if they try to sign in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => suspendTarget && suspendCashier({ status: "suspended" })}
              disabled={isSuspending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSuspending ? "Suspending..." : "Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
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
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
