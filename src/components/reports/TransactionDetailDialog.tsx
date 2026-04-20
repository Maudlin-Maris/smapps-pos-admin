import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  MoreHorizontal,
  Ban,
  CreditCard,
  Printer,
  Send,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ShoppingBag,
  Trash2,
  Pencil,
} from "lucide-react";
import type { Transaction } from "@/components/TransactionsTable";

const VOID_CODE = "1234"; // In production, this would be validated server-side

const paymentStatusConfig: Record<string, { class: string; icon: React.ElementType }> = {
  Paid: { class: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  Pending: { class: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  Failed: { class: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  Refunded: { class: "bg-info/10 text-info border-info/20", icon: CreditCard },
};

const orderStatusConfig: Record<string, { class: string; icon: React.ElementType }> = {
  Completed: { class: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  Processing: { class: "bg-info/10 text-info border-info/20", icon: Clock },
  Cancelled: { class: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  "On Hold": { class: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle },
};

const paymentMethods = ["Cash", "Card", "Mobile Money", "Bank Transfer"];

interface TransactionDetailDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updated: Transaction) => void;
}

export default function TransactionDetailDialog({
  transaction,
  open,
  onOpenChange,
  onUpdate,
}: TransactionDetailDialogProps) {
  const [voidConfirmOpen, setVoidConfirmOpen] = useState(false);
  const [voidCode, setVoidCode] = useState("");
  const [voidCodeError, setVoidCodeError] = useState("");
  const [editingPaymentIndex, setEditingPaymentIndex] = useState<number | null>(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [removePaymentIndex, setRemovePaymentIndex] = useState<number | null>(null);

  if (!transaction) return null;

  const pStatus = paymentStatusConfig[transaction.paymentStatus] ?? paymentStatusConfig.Pending;
  const oStatus = orderStatusConfig[transaction.orderStatus] ?? orderStatusConfig.Processing;
  const PaymentIcon = pStatus.icon;
  const OrderIcon = oStatus.icon;

  const canVoid = transaction.orderStatus !== "Cancelled" && transaction.paymentStatus !== "Refunded";

  const handleVoid = () => {
    if (voidCode !== VOID_CODE) {
      setVoidCodeError("Invalid void code. Please try again.");
      return;
    }
    onUpdate({
      ...transaction,
      orderStatus: "Cancelled",
      paymentStatus: "Refunded",
    });
    setVoidConfirmOpen(false);
    setVoidCode("");
    setVoidCodeError("");
    toast.success(`Order ${transaction.orderId} has been voided`);
  };

  const handleUpdatePaymentMethod = (index: number) => {
    if (!newPaymentMethod) return;
    const updatedPayments = [...transaction.payments];
    updatedPayments[index] = { ...updatedPayments[index], method: newPaymentMethod };
    onUpdate({ ...transaction, payments: updatedPayments });
    setEditingPaymentIndex(null);
    setNewPaymentMethod("");
    toast.success("Payment method updated");
  };

  const requestRemovePayment = (index: number) => {
    if (transaction.payments.length <= 1) {
      toast.error("Cannot remove the only payment method");
      return;
    }
    setRemovePaymentIndex(index);
  };

  const confirmRemovePayment = () => {
    if (removePaymentIndex === null) return;
    const updatedPayments = transaction.payments.filter((_, i) => i !== removePaymentIndex);
    onUpdate({ ...transaction, payments: updatedPayments });
    setRemovePaymentIndex(null);
    toast.success("Payment method removed");
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(transaction.orderId);
    toast.success("Order ID copied");
  };

  const handlePrint = () => toast.info("Receipt printing initiated…");
  const handleResend = () => toast.info("Receipt sent to customer");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="p-4 sm:p-5 pb-0">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-base sm:text-lg font-heading flex items-center gap-2">
                  {transaction.orderId}
                  <button onClick={handleCopyId} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{transaction.date}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-2" /> Print Receipt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleResend}>
                    <Send className="h-4 w-4 mr-2" /> Resend Receipt
                  </DropdownMenuItem>
                  {canVoid && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setVoidConfirmOpen(true)} className="text-destructive focus:text-destructive">
                        <Ban className="h-4 w-4 mr-2" /> Void Order
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogHeader>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Status badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`gap-1.5 ${pStatus.class}`}>
                <PaymentIcon className="h-3 w-3" />
                {transaction.paymentStatus}
              </Badge>
              <Badge variant="outline" className={`gap-1.5 ${oStatus.class}`}>
                <OrderIcon className="h-3 w-3" />
                {transaction.orderStatus}
              </Badge>
            </div>

            <Separator />

            {/* Detail rows */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="font-medium">{transaction.customerPhone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-semibold text-base">{transaction.amount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cashier</p>
                <p className="font-medium">{transaction.cashier}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium">{transaction.location}</p>
              </div>
            </div>

            <Separator />

            {/* Payment breakdown */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Payment Breakdown</p>
              <div className="space-y-1.5">
                {transaction.payments.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-muted/40 rounded-md px-3 py-2">
                    {editingPaymentIndex === i ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                          <SelectTrigger className="h-7 text-xs flex-1">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((m) => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleUpdatePaymentMethod(i)} disabled={!newPaymentMethod}>
                          Save
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => { setEditingPaymentIndex(null); setNewPaymentMethod(""); }}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-muted-foreground">{p.method}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{p.amount}</span>
                          <button
                            onClick={() => { setEditingPaymentIndex(i); setNewPaymentMethod(p.method); }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Change payment method"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          {transaction.payments.length > 1 && (
                            <button
                              onClick={() => requestRemovePayment(i)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove payment method"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Order Items */}
            {transaction.items && transaction.items.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" /> Order Items
                  </p>
                  <div className="rounded-md border border-border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50 text-muted-foreground">
                          <th className="text-left py-1.5 px-3 font-medium">Item</th>
                          <th className="text-center py-1.5 px-2 font-medium">Qty</th>
                          <th className="text-right py-1.5 px-2 font-medium">Price</th>
                          <th className="text-right py-1.5 px-3 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaction.items.map((item, i) => (
                          <tr key={i} className="border-t border-border/50">
                            <td className="py-1.5 px-3 font-medium">{item.name}</td>
                            <td className="py-1.5 px-2 text-center text-muted-foreground">{item.qty}</td>
                            <td className="py-1.5 px-2 text-right text-muted-foreground">{item.unitPrice}</td>
                            <td className="py-1.5 px-3 text-right font-medium">{item.total}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-border bg-muted/30">
                          <td colSpan={3} className="py-1.5 px-3 font-semibold text-right">Total</td>
                          <td className="py-1.5 px-3 text-right font-semibold">{transaction.amount}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Quick actions footer */}
            <div className="flex items-center gap-2 pt-2">
              {canVoid && (
                <Button variant="destructive" size="sm" className="gap-1.5 text-xs flex-1" onClick={() => setVoidConfirmOpen(true)}>
                  <Ban className="h-3.5 w-3.5" /> Void Order
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Void confirmation with code */}
      <AlertDialog open={voidConfirmOpen} onOpenChange={(open) => { setVoidConfirmOpen(open); if (!open) { setVoidCode(""); setVoidCodeError(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Order {transaction.orderId}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the order and initiate a refund of {transaction.amount}. Enter the void authorization code to proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              type="password"
              placeholder="Enter void code"
              value={voidCode}
              onChange={(e) => { setVoidCode(e.target.value); setVoidCodeError(""); }}
              className={voidCodeError ? "border-destructive" : ""}
            />
            {voidCodeError && (
              <p className="text-xs text-destructive mt-1.5">{voidCodeError}</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleVoid(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!voidCode}
            >
              Void Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove payment method confirmation */}
      <AlertDialog open={removePaymentIndex !== null} onOpenChange={(open) => { if (!open) setRemovePaymentIndex(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove payment method?</AlertDialogTitle>
            <AlertDialogDescription>
              {removePaymentIndex !== null && transaction.payments[removePaymentIndex] ? (
                <>This will remove the <span className="font-medium text-foreground">{transaction.payments[removePaymentIndex].method}</span> payment of <span className="font-medium text-foreground">{transaction.payments[removePaymentIndex].amount}</span> from this order. This action cannot be undone.</>
              ) : (
                <>This action cannot be undone.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmRemovePayment(); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
