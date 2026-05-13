import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Banknote, CreditCard, Smartphone, ArrowRightLeft, Trash2, Wallet,
  Plus, Pencil, X, Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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
  type OutletPaymentMethod,
} from "@/data/outletPaymentMethods";
import type { PaymentMethod } from "@/data/posData";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: string | number;
  outletName: string;
}

const KIND_OPTIONS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: "cash", label: "Cash", icon: <Banknote className="w-4 h-4" /> },
  { value: "card", label: "Card", icon: <CreditCard className="w-4 h-4" /> },
  { value: "mobile", label: "Mobile", icon: <Smartphone className="w-4 h-4" /> },
  { value: "transfer", label: "Transfer", icon: <ArrowRightLeft className="w-4 h-4" /> },
];

const KIND_ICON: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote className="w-4 h-4" />,
  card: <CreditCard className="w-4 h-4" />,
  mobile: <Smartphone className="w-4 h-4" />,
  transfer: <ArrowRightLeft className="w-4 h-4" />,
};

export default function PaymentMethodManagerDialog({ open, onOpenChange, outletId, outletName }: Props) {
  const [methods, setMethods] = useState<OutletPaymentMethod[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formKind, setFormKind] = useState<PaymentMethod>("cash");
  const [deleteTarget, setDeleteTarget] = useState<OutletPaymentMethod | null>(null);

  const reload = () => setMethods(getOutletPaymentMethods(outletId));

  useEffect(() => { if (open) { reload(); setShowForm(false); setEditingId(null); } }, [open, outletId]);

  const startCreate = () => {
    setEditingId(null);
    setFormLabel("");
    setFormKind("cash");
    setShowForm(true);
  };

  const startEdit = (m: OutletPaymentMethod) => {
    setEditingId(m.id);
    setFormLabel(m.label);
    setFormKind(m.kind);
    setShowForm(true);
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); };

  const submitForm = () => {
    const label = formLabel.trim();
    if (!label) { toast.error("Enter a name for the payment method"); return; }
    if (editingId) {
      updateOutletPaymentMethod(outletId, editingId, { label, kind: formKind });
      toast.success("Payment method updated");
    } else {
      addOutletPaymentMethod(outletId, { label, kind: formKind, enabled: true });
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
              Create the payment methods cashiers can accept at this outlet. Cashiers will only see methods you add and enable here.
            </DialogDescription>
          </DialogHeader>

          {showForm && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-medium">{editingId ? "Edit Payment Method" : "New Payment Method"}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pm-label">Display name</Label>
                  <Input
                    id="pm-label"
                    value={formLabel}
                    onChange={(e) => setFormLabel(e.target.value)}
                    placeholder="e.g. POS Terminal, Opay Transfer"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pm-kind">Type</Label>
                  <Select value={formKind} onValueChange={(v) => setFormKind(v as PaymentMethod)}>
                    <SelectTrigger id="pm-kind"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {KIND_OPTIONS.map(k => (
                        <SelectItem key={k.value} value={k.value}>
                          <span className="flex items-center gap-2">{k.icon}{k.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  <TableHead className="w-[140px]">Type</TableHead>
                  <TableHead className="w-[100px] text-center">Enabled</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {methods.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                      No payment methods yet. Click "Add Method" to create one.
                    </TableCell>
                  </TableRow>
                )}
                {methods.map((m) => (
                  <TableRow key={m.id} className={!m.enabled ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{m.label}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm capitalize text-muted-foreground">
                        {KIND_ICON[m.kind]} {m.kind}
                      </span>
                    </TableCell>
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

          <DialogFooter className="sm:justify-between gap-2">
            <Button variant="outline" size="sm" onClick={startCreate} disabled={showForm && !editingId}>
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
