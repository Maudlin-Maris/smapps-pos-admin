import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Percent, Loader2 } from "lucide-react";
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
import {
  useGetOutletFees,
  useCreateOutletFee,
  useUpdateOutletFee,
  useDeleteOutletFee,
} from "@/services/api/outlets";
import type { FeeRecord } from "@/lib/types/outlet-subresources";

const serviceOptionLabels: Record<string, string> = {
  all: "All",
  dine_in: "Dine-In Only",
  takeaway: "Takeaway Only",
};

interface FeeManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: number | string;
  outletName: string;
  businessType: string;
  onUpdated?: () => void;
}

export default function FeeManagerDialog({
  open, onOpenChange, outletId, outletName, businessType, onUpdated,
}: FeeManagerDialogProps) {
  const { data: fees = [], isLoading: isLoadingFees, mutate: mutateFees } = useGetOutletFees(outletId);

  const { trigger: triggerCreate, isMutating: isCreating } = useCreateOutletFee(outletId);
  const { trigger: triggerUpdate, isMutating: isUpdating } = useUpdateOutletFee(outletId);
  const { trigger: triggerDelete, isMutating: isDeleting } = useDeleteOutletFee(outletId);

  const features = getFeatures(businessType);
  const showServiceOption = features.hasDineIn || features.hasTakeaway;

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingFee, setEditingFee] = useState<FeeRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeeRecord | null>(null);

  const handleAdd = () => {
    setFormMode("add");
    setEditingFee(null);
    setFormOpen(true);
  };

  const handleEdit = (fee: FeeRecord) => {
    setFormMode("edit");
    setEditingFee(fee);
    setFormOpen(true);
  };

  const handleSubmit = async (data: FeeFormData) => {
    try {
      if (formMode === "add") {
        await triggerCreate({
          name: data.name,
          serviceOption: data.serviceOption || "all",
          isFixed: data.isFixed || false,
          chargeToCustomers: data.chargeToCustomers || false,
          value: parseFloat(data.value) || 0,
        });
        toast.success(`Fee "${data.name}" added`);
      } else if (editingFee) {
        await triggerUpdate({
          feeId: editingFee.id,
          payload: {
            value: parseFloat(data.value) || 0,
            enabled: data.chargeToCustomers ?? true,
          },
        });
        toast.success(`Fee "${data.name}" updated`);
      }
      mutateFees();
      onUpdated?.();
      setFormOpen(false);
    } catch (e) {}
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await triggerDelete(deleteTarget.id);
      toast.success(`Fee "${deleteTarget.name}" deleted`);
      mutateFees();
      onUpdated?.();
      setDeleteTarget(null);
    } catch (e) {}
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
            <Button size="sm" onClick={handleAdd} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
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
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingFees ? (
                  <TableRow>
                    <TableCell colSpan={showServiceOption ? 6 : 5} className="text-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading fees...</p>
                    </TableCell>
                  </TableRow>
                ) : fees.length === 0 ? (
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
                  fees.map((fee) => {
                    const isFixed = fee.type === "fixed";
                    return (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium">{fee.name}</TableCell>
                        {showServiceOption && (
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {serviceOptionLabels["all"]}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          <Badge variant={isFixed ? "default" : "outline"} className="text-xs">
                            {isFixed ? "Fixed" : "Percentage"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          <span>{fee.value}%</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="secondary"
                            className={`text-xs ${fee.enabled ? "bg-success/10 text-success" : ""}`}
                          >
                            {fee.enabled ? "Enabled" : "Disabled"}
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {formOpen && (
        <FeeFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={formMode}
          initialData={
            editingFee
              ? {
                  id: editingFee.id,
                  outletId: String(outletId),
                  name: editingFee.name,
                  value: String(editingFee.value),
                  isFixed: editingFee.type === "fixed",
                  chargeToCustomers: editingFee.enabled,
                  serviceOption: "all",
                  orderPeg: "",
                  minimumFee: "",
                  maximumFee: "",
                }
              : { outletId: String(outletId) }
          }
          onSubmit={handleSubmit}
          hideOutletSelector
          showServiceOption={showServiceOption}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this fee/tax. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
