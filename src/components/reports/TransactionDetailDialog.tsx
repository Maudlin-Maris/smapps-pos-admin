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
  RefreshCw,
  CreditCard,
  Printer,
  Send,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ShoppingBag,
} from "lucide-react";
import type { Transaction } from "@/components/TransactionsTable";

const paymentStatusConfig: Record<string, { class: string; icon: React.ElementType }> = {
  Paid: { class: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  Pending: { class: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  Failed: { class: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  Refunded: { class: "bg-info/10 text-info border-info/20", icon: RefreshCw },
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
  const [refundConfirmOpen, setRefundConfirmOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");

  if (!transaction) return null;

  const pStatus = paymentStatusConfig[transaction.paymentStatus] ?? paymentStatusConfig.Pending;
  const oStatus = orderStatusConfig[transaction.orderStatus] ?? orderStatusConfig.Processing;
  const PaymentIcon = pStatus.icon;
  const OrderIcon = oStatus.icon;

  const canVoid = transaction.orderStatus !== "Cancelled" && transaction.paymentStatus !== "Refunded";
  const canRefund = transaction.paymentStatus === "Paid";
  const canUpdatePayment = transaction.paymentStatus === "Pending" || transaction.paymentStatus === "Failed";

  const handleVoid = () => {
    onUpdate({
      ...transaction,
      orderStatus: "Cancelled",
      paymentStatus: "Refunded",
    });
    setVoidConfirmOpen(false);
    toast.success(`Order ${transaction.orderId} has been voided`);
  };

  const handleRefund = () => {
    onUpdate({ ...transaction, paymentStatus: "Refunded" });
    setRefundConfirmOpen(false);
    toast.success(`Refund initiated for ${transaction.orderId}`);
  };

  const handleUpdatePayment = () => {
    if (!newPaymentMethod) return;
    const updated: Transaction = {
      ...transaction,
      payments: [{ method: newPaymentMethod, amount: transaction.amount }],
      paymentStatus: "Paid",
      orderStatus: transaction.orderStatus === "On Hold" ? "Processing" : transaction.orderStatus,
    };
    onUpdate(updated);
    setEditingPayment(false);
    setNewPaymentMethod("");
    toast.success(`Payment method updated to ${newPaymentMethod}`);
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
                  <DropdownMenuSeparator />
                  {canRefund && (
                    <DropdownMenuItem onClick={() => setRefundConfirmOpen(true)} className="text-warning focus:text-warning">
                      <RefreshCw className="h-4 w-4 mr-2" /> Issue Refund
                    </DropdownMenuItem>
                  )}
                  {canVoid && (
                    <DropdownMenuItem onClick={() => setVoidConfirmOpen(true)} className="text-destructive focus:text-destructive">
                      <Ban className="h-4 w-4 mr-2" /> Void Order
                    </DropdownMenuItem>
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
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payment Breakdown</p>
                {canUpdatePayment && !editingPayment && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setEditingPayment(true)}>
                    <CreditCard className="h-3 w-3" /> Update
                  </Button>
                )}
              </div>

              {editingPayment ? (
                <div className="flex items-center gap-2">
                  <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="h-8 text-xs" onClick={handleUpdatePayment} disabled={!newPaymentMethod}>
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setEditingPayment(false); setNewPaymentMethod(""); }}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {transaction.payments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-muted/40 rounded-md px-3 py-2">
                      <span className="text-muted-foreground">{p.method}</span>
                      <span className="font-medium">{p.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions footer */}
            <div className="flex items-center gap-2 pt-2">
              {canVoid && (
                <Button variant="destructive" size="sm" className="gap-1.5 text-xs flex-1" onClick={() => setVoidConfirmOpen(true)}>
                  <Ban className="h-3.5 w-3.5" /> Void Order
                </Button>
              )}
              {canRefund && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1" onClick={() => setRefundConfirmOpen(true)}>
                  <RefreshCw className="h-3.5 w-3.5" /> Refund
                </Button>
              )}
              {canUpdatePayment && (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1" onClick={() => setEditingPayment(true)}>
                  <CreditCard className="h-3.5 w-3.5" /> Update Payment
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Void confirmation */}
      <AlertDialog open={voidConfirmOpen} onOpenChange={setVoidConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Order {transaction.orderId}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the order and initiate a refund of {transaction.amount}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVoid} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Void Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund confirmation */}
      <AlertDialog open={refundConfirmOpen} onOpenChange={setRefundConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund {transaction.amount}?</AlertDialogTitle>
            <AlertDialogDescription>
              A refund of {transaction.amount} will be initiated for order {transaction.orderId}. This may take 3-5 business days to process.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRefund}>Issue Refund</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
