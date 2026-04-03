import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Percent } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import FeeFormDialog, { type FeeFormData } from "@/components/fees/FeeFormDialog";
import { getFeatures } from "@/data/businessTypes";

const serviceOptionLabels: Record<string, string> = {
  all: "All",
  dine_in: "Dine-In Only",
  takeaway: "Takeaway Only",
};

interface FeeManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: number;
  outletName: string;
  businessType: string;
  fees: FeeFormData[];
  onUpdateFees: (fees: FeeFormData[]) => void;
}

export default function FeeManagerDialog({
  open, onOpenChange, outletId, outletName, businessType, fees, onUpdateFees,
}: FeeManagerDialogProps) {
  const outletFees = fees.filter((f) => f.outletId === String(outletId));
  const features = getFeatures(businessType);
  const showServiceOption = features.hasDineIn || features.hasTakeaway;

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingFee, setEditingFee] = useState<FeeFormData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeeFormData | null>(null);

  const handleAdd = () => {
    setFormMode("add");
    setEditingFee(null);
    setFormOpen(true);
  };

  const handleEdit = (fee: FeeFormData) => {
    setFormMode("edit");
    setEditingFee(fee);
    setFormOpen(true);
  };

  const handleSubmit = (data: FeeFormData) => {
    if (formMode === "add") {
      const newFee: FeeFormData = { ...data, id: Date.now(), outletId: String(outletId) };
      onUpdateFees([...fees, newFee]);
      toast.success(`Fee "${data.name}" added`);
    } else {
      onUpdateFees(fees.map((f) => (f.id === data.id ? { ...data, outletId: String(outletId) } : f)));
      toast.success(`Fee "${data.name}" updated`);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    onUpdateFees(fees.filter((f) => f.id !== deleteTarget.id));
    toast.success(`Fee "${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fees & Taxes — {outletName}</DialogTitle>
            <DialogDescription>Manage fees and taxes for this outlet.</DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" /> Add Fee / Tax
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  {showServiceOption && <TableHead>Service</TableHead>}
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-center">Customer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outletFees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showServiceOption ? 6 : 5} className="text-center py-10 text-muted-foreground">
                      <Percent className="h-7 w-7 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No fees or taxes yet</p>
                      <Button variant="link" size="sm" onClick={handleAdd} className="mt-1">
                        Add your first fee
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  outletFees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="font-medium">{fee.name}</TableCell>
                      {showServiceOption && (
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {serviceOptionLabels[fee.serviceOption]}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <Badge variant={fee.isFixed ? "default" : "outline"} className="text-xs">
                          {fee.isFixed ? "Fixed" : "Percentage"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {fee.isFixed ? (
                          <span className="text-xs text-muted-foreground">
                            {fee.minimumFee}/{fee.maximumFee} @{fee.orderPeg}
                          </span>
                        ) : (
                          <span>{fee.value}%</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${fee.chargeToCustomers ? "bg-success/10 text-success" : ""}`}
                        >
                          {fee.chargeToCustomers ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
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
        </DialogContent>
      </Dialog>

      <FeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialData={editingFee ? { ...editingFee, outletId: String(outletId) } : { outletId: String(outletId) }}
        onSubmit={handleSubmit}
        hideOutletSelector
        showServiceOption={showServiceOption}
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
    </>
  );
}
