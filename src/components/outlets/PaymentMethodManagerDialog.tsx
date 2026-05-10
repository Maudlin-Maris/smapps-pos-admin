import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Banknote, CreditCard, Smartphone, ArrowRightLeft, Trash2, RotateCcw, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  getOutletPaymentMethods,
  setOutletPaymentMethods,
  DEFAULT_PAYMENT_METHODS,
  type OutletPaymentMethod,
} from "@/data/outletPaymentMethods";
import type { PaymentMethod } from "@/data/posData";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: string | number;
  outletName: string;
}

const ICONS: Record<PaymentMethod, React.ReactNode> = {
  cash: <Banknote className="w-4 h-4" />,
  card: <CreditCard className="w-4 h-4" />,
  mobile: <Smartphone className="w-4 h-4" />,
  transfer: <ArrowRightLeft className="w-4 h-4" />,
};

export default function PaymentMethodManagerDialog({ open, onOpenChange, outletId, outletName }: Props) {
  const [methods, setMethods] = useState<OutletPaymentMethod[]>([]);

  useEffect(() => {
    if (open) setMethods(getOutletPaymentMethods(outletId));
  }, [open, outletId]);

  const persist = (next: OutletPaymentMethod[]) => {
    setMethods(next);
    setOutletPaymentMethods(outletId, next);
  };

  const updateLabel = (id: PaymentMethod, label: string) => {
    persist(methods.map((m) => (m.id === id ? { ...m, label } : m)));
  };

  const toggleEnabled = (id: PaymentMethod, enabled: boolean) => {
    if (!enabled && methods.filter((m) => m.enabled).length === 1) {
      toast.error("At least one payment method must be enabled");
      return;
    }
    persist(methods.map((m) => (m.id === id ? { ...m, enabled } : m)));
    toast.success(enabled ? "Payment method enabled" : "Payment method disabled");
  };

  const removeMethod = (id: PaymentMethod) => {
    if (methods.filter((m) => m.enabled).length === 1 && methods.find((m) => m.id === id)?.enabled) {
      toast.error("At least one payment method must remain enabled");
      return;
    }
    persist(methods.map((m) => (m.id === id ? { ...m, enabled: false } : m)));
    toast.success("Payment method removed from POS");
  };

  const resetDefaults = () => {
    persist(DEFAULT_PAYMENT_METHODS.map((m) => ({ ...m })));
    toast.success("Payment methods reset to defaults");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Payment Methods — {outletName}
          </DialogTitle>
          <DialogDescription>
            Configure which payment methods cashiers can accept at this outlet. You can rename labels (e.g. "POS Terminal" instead of "Card") and disable unused methods.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Method</TableHead>
                <TableHead>Display Label</TableHead>
                <TableHead className="w-[100px] text-center">Enabled</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {methods.map((m) => (
                <TableRow key={m.id} className={!m.enabled ? "opacity-50" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {ICONS[m.id]}
                      <span className="capitalize font-medium">{m.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={m.label}
                      onChange={(e) => updateLabel(m.id, e.target.value)}
                      placeholder={m.id}
                      className="h-9"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={m.enabled}
                      onCheckedChange={(v) => toggleEnabled(m.id, v)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeMethod(m.id)}
                      title="Remove from POS"
                      disabled={!m.enabled}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" size="sm" onClick={resetDefaults}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset to Defaults
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
