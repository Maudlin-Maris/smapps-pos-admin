import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Percent } from "lucide-react";
import { toast } from "sonner";
import { outlets } from "@/data/outlets";
import FeeFormDialog, { type FeeFormData } from "@/components/fees/FeeFormDialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const serviceOptionLabels: Record<string, string> = {
  all: "All",
  dine_in: "Dine-In Only",
  takeaway: "Takeaway Only",
};

const initialFees: FeeFormData[] = [
  { id: 1, outletId: "outlet-1", name: "VAT", serviceOption: "all", isFixed: false, chargeToCustomers: true, orderPeg: "5", minimumFee: "0", maximumFee: "10000" },
  { id: 2, outletId: "outlet-1", name: "Service Charge", serviceOption: "dine_in", isFixed: true, chargeToCustomers: true, orderPeg: "10", minimumFee: "500", maximumFee: "5000" },
  { id: 3, outletId: "outlet-2", name: "Packaging Fee", serviceOption: "takeaway", isFixed: true, chargeToCustomers: false, orderPeg: "0", minimumFee: "200", maximumFee: "200" },
];

export default function FeesAndTaxes() {
  const [fees, setFees] = useState<FeeFormData[]>(initialFees);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editingFee, setEditingFee] = useState<FeeFormData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeeFormData | null>(null);

  const handleAdd = () => {
    setDialogMode("add");
    setEditingFee(null);
    setDialogOpen(true);
  };

  const handleEdit = (fee: FeeFormData) => {
    setDialogMode("edit");
    setEditingFee(fee);
    setDialogOpen(true);
  };

  const handleSubmit = (data: FeeFormData) => {
    if (dialogMode === "add") {
      setFees((prev) => [...prev, { ...data, id: Date.now() }]);
      toast.success(`Fee "${data.name}" added successfully`);
    } else {
      setFees((prev) => prev.map((f) => (f.id === data.id ? data : f)));
      toast.success(`Fee "${data.name}" updated successfully`);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setFees((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    toast.success(`Fee "${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
  };

  const getOutletName = (id: string) =>
    outlets.find((o) => o.id === id)?.name ?? id;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Fees & Taxes</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage fees and taxes applied to outlet orders</p>
        </div>
        <Button size="sm" className="w-fit" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add Fee / Tax
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Outlet</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="text-center">Fixed</TableHead>
                <TableHead className="text-center">Customer Charge</TableHead>
                <TableHead className="text-right">Order Peg</TableHead>
                <TableHead className="text-right">Min Fee</TableHead>
                <TableHead className="text-right">Max Fee</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <Percent className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>No fees or taxes configured yet</p>
                    <Button variant="link" size="sm" onClick={handleAdd} className="mt-1">
                      Add your first fee
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">{fee.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{getOutletName(fee.outletId)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {serviceOptionLabels[fee.serviceOption]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={fee.isFixed ? "default" : "outline"} className="text-xs">
                        {fee.isFixed ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${fee.chargeToCustomers ? "bg-success/10 text-success" : ""}`}
                      >
                        {fee.chargeToCustomers ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{fee.orderPeg || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{fee.minimumFee || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{fee.maximumFee || "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(fee)}>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(fee)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <FeeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        initialData={editingFee ?? undefined}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this fee/tax. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
