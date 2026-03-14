import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Store,
  Building2,
  Mail,
  Phone,
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
        { outletId: "outlet-1", outletName: "Downtown Flagship", department: "Front of House" },
        { outletId: "outlet-2", outletName: "Mall Branch", department: "Checkout" },
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

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Cashiers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage cashiers and their outlet assignments
          </p>
        </div>
        <Button size="sm" className="w-fit" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Cashier
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cashiers..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Cashier Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((cashier) => (
          <Card key={cashier.id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                  {cashier.data.firstName[0]}
                  {cashier.data.lastName[0]}
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-sm">
                    {cashier.data.firstName} {cashier.data.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {cashier.data.assignments.length} outlet
                    {cashier.data.assignments.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Edit cashier"
                  onClick={() => handleEdit(cashier)}
                >
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Delete cashier"
                  onClick={() => setDeleteTarget(cashier)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 text-sm mb-3">
              {cashier.data.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate text-xs">{cashier.data.email}</span>
                </div>
              )}
              {cashier.data.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-xs">{cashier.data.phone}</span>
                </div>
              )}
            </div>

            <Separator className="mb-3" />

            <div className="space-y-2">
              {cashier.data.assignments.map((a) => (
                <div
                  key={a.outletId}
                  className="flex items-center gap-2 text-xs"
                >
                  <Store className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span className="font-medium">{a.outletName}</span>
                  {a.department && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {a.department}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 text-center py-12">
            <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {search ? "No cashiers match your search" : "No cashiers yet"}
            </p>
          </div>
        )}
      </div>

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
