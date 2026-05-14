import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Wallet, Plus, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getOutletPaymentMethods,
  addOutletPaymentMethod,
  updateOutletPaymentMethod,
  deleteOutletPaymentMethod,
  MAX_PAYMENT_METHODS_PER_OUTLET,
  type OutletPaymentMethod,
} from "@/data/outletPaymentMethods";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: string | number;
  outletName: string;
}

export default function PaymentMethodManagerDialog({ open, onOpenChange, outletId, outletName }: Props) {
  const [methods, setMethods] = useState<OutletPaymentMethod[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<OutletPaymentMethod | null>(null);

  const reload = () => setMethods(getOutletPaymentMethods(outletId));

  useEffect(() => { if (open) { reload(); setShowForm(false); setEditingId(null); } }, [open, outletId]);

  const atLimit = methods.length >= MAX_PAYMENT_METHODS_PER_OUTLET;

  const startCreate = () => {
    if (atLimit) {
      toast.error(`You can only add up to ${MAX_PAYMENT_METHODS_PER_OUTLET} payment methods per outlet.`);
      return;
    }
    setEditingId(null);
    setFormLabel("");
    setShowForm(true);
  };

  const startEdit = (m: OutletPaymentMethod) => {
    setEditingId(m.id);
    setFormLabel(m.label);
    setShowForm(true);
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); };

  const submitForm = () => {
    const label = formLabel.trim();
    if (!label) { toast.error("Enter a name for the payment method"); return; }
    if (editingId) {
      updateOutletPaymentMethod(outletId, editingId, { label });
      toast.success("Payment method updated");
    } else {
      const added = addOutletPaymentMethod(outletId, { label, enabled: true });
      if (!added) {
        toast.error(`Limit reached — max ${MAX_PAYMENT_METHODS_PER_OUTLET} payment methods per outlet.`);
        return;
      }
      toast.success("Payment method added");
    }
    reload();
    cancelForm();
  };

  const toggleEnabled = (m: OutletPaymentMethod, enabled: boolean) => {
    updateOutletPaymentMethod(outletId, m.id, { enabled });
    reload();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteOutletPaymentMethod(outletId, deleteTarget.id);
    toast.success(`Removed "${deleteTarget.label}"`);
    setDeleteTarget(null);
    reload();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Payment Methods — {outletName}
            </DialogTitle>
            <DialogDescription>
              Add the payment methods cashiers can accept at this outlet. You can add up to {MAX_PAYMENT_METHODS_PER_OUTLET}.
            </DialogDescription>
          </DialogHeader>

          {showForm && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-medium">{editingId ? "Edit Payment Method" : "New Payment Method"}</p>
              <div className="space-y-1.5">
                <Label htmlFor="pm-label">Name</Label>
                <Input
                  id="pm-label"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  placeholder="e.g. Cash, POS Terminal, Opay Transfer"
                  maxLength={40}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitForm(); } }}
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={cancelForm}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={submitForm}>
                  <Check className="h-4 w-4 mr-1" /> {editingId ? "Save" : "Add Method"}
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-[100px] text-center">Enabled</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">
                      No payment methods yet. Click "Add Method" to create one.
                    </TableCell>
                  </TableRow>
                )}
                {methods.map((m) => (
                  <TableRow key={m.id} className={!m.enabled ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{m.label}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={m.enabled}
                        onCheckedChange={(v) => toggleEnabled(m, v)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(m)} title="Edit">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(m)} title="Delete">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            {methods.length} of {MAX_PAYMENT_METHODS_PER_OUTLET} methods used.
          </p>

          <DialogFooter className="sm:justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={startCreate}
              disabled={(showForm && !editingId) || atLimit}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Method
            </Button>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.label}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Cashiers at this outlet will no longer be able to accept this payment method. Existing payment records are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
