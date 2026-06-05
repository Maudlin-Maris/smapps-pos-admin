import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
  User,
  MapPin,
  Receipt,
  Sparkles,
  Award,
  Utensils,
  StickyNote,
} from "lucide-react";
import type { Transaction } from "@/components/TransactionsTable";
import TransactionReceiptPreview from "./TransactionReceiptPreview";

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

function formatOrderType(t?: string) {
  if (!t) return null;
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
  const hasItems = transaction.items && transaction.items.length > 0;
  const orderTypeLabel = formatOrderType(transaction.orderType);

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
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="!w-full sm:!max-w-md lg:!max-w-lg p-0 flex flex-col overflow-hidden [&>button]:z-20"
        >
          {/* Header */}
          <div className="px-4 sm:px-5 pt-5 pb-3 border-b border-border bg-card">
            <div className="flex items-start justify-between gap-3 pr-8">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground shrink-0" />
                  <h2 className="text-base sm:text-lg font-heading font-semibold truncate">
                    {transaction.orderId}
                  </h2>
                  <button
                    onClick={handleCopyId}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title="Copy Order ID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{transaction.date}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
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
                      <DropdownMenuItem
                        onClick={() => setVoidConfirmOpen(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Ban className="h-4 w-4 mr-2" /> Void Order
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 flex-wrap mt-3">
              <Badge variant="outline" className={`gap-1.5 ${pStatus.class}`}>
                <PaymentIcon className="h-3 w-3" />
                {transaction.paymentStatus}
              </Badge>
              <Badge variant="outline" className={`gap-1.5 ${oStatus.class}`}>
                <OrderIcon className="h-3 w-3" />
                {transaction.orderStatus}
              </Badge>
              {orderTypeLabel && (
                <Badge variant="secondary" className="gap-1.5">
                  <Utensils className="h-3 w-3" />
                  {orderTypeLabel}
                </Badge>
              )}
              {transaction.tableLabel && (
                <Badge variant="secondary">{transaction.tableLabel}</Badge>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-5">
            {/* Outlet & Cashier */}
            <section>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Outlet
              </p>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
                <p className="font-medium text-sm">{transaction.location}</p>
                {transaction.outletAddress && (
                  <p className="text-xs text-muted-foreground mt-0.5">{transaction.outletAddress}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Cashier: <span className="text-foreground font-medium">{transaction.cashier}</span>
                </p>
              </div>
            </section>

            {/* Customer */}
            <section>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Customer
              </p>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 space-y-1">
                {transaction.customerName ? (
                  <p className="font-medium text-sm">{transaction.customerName}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Walk-in customer</p>
                )}
                <p className="text-xs text-muted-foreground">{transaction.customerPhone || "No phone provided"}</p>
              </div>
            </section>

            {/* Order Notes */}
            {transaction.notes && (
              <section>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <StickyNote className="h-3.5 w-3.5" /> Order Notes
                </p>
                <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-foreground">
                  {transaction.notes}
                </div>
              </section>
            )}

            {/* Items */}
            {hasItems && (
              <section>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5" /> Items ({transaction.items!.length})
                </p>
                <div className="rounded-md border border-border overflow-hidden divide-y divide-border">
                  {transaction.items!.map((item, i) => (
                    <div key={i} className="p-3 bg-card">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            <span className="text-muted-foreground mr-1">{item.qty}×</span>
                            {item.name}
                          </p>
                          {item.variantName && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.variantName}</p>
                          )}
                          {item.notes && (
                            <p className="text-xs text-muted-foreground italic mt-0.5">Note: {item.notes}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">{item.total}</p>
                          <p className="text-[11px] text-muted-foreground">{item.unitPrice} ea</p>
                        </div>
                      </div>
                      {item.extras && item.extras.length > 0 && (
                        <div className="mt-2 pl-3 border-l-2 border-border space-y-0.5">
                          {item.extras.map((e, j) => (
                            <div key={j} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                + {(e.qty ?? 1) > 1 ? `${e.qty}× ` : ""}{e.name}
                              </span>
                              <span className="text-muted-foreground">{e.price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Totals breakdown */}
            <section>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Order Total
              </p>
              <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5 space-y-1.5 text-sm">
                {transaction.subtotal && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{transaction.subtotal}</span>
                  </div>
                )}
                {transaction.discount && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Discount{transaction.discountName ? ` (${transaction.discountName})` : ""}
                    </span>
                    <span className="font-medium text-success">−{transaction.discount}</span>
                  </div>
                )}
                {transaction.fees?.map((fee, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{fee.name}</span>
                    <span className="font-medium">{fee.amount}</span>
                  </div>
                ))}
                {transaction.tip && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tip</span>
                    <span className="font-medium">{transaction.tip}</span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-base">{transaction.amount}</span>
                </div>
              </div>
            </section>

            {/* Payment breakdown */}
            <section>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" /> Payment Breakdown
              </p>
              <div className="space-y-1.5">
                {transaction.payments.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm bg-muted/40 rounded-md px-3 py-2"
                  >
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
                        <Button
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => handleUpdatePaymentMethod(i)}
                          disabled={!newPaymentMethod}
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => { setEditingPaymentIndex(null); setNewPaymentMethod(""); }}
                        >
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
                {(transaction.paidAmount || transaction.changeDue || transaction.balanceDue) && (
                  <div className="mt-2 pt-2 border-t border-border space-y-1 text-sm">
                    {transaction.paidAmount && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Amount Paid</span>
                        <span className="font-medium">{transaction.paidAmount}</span>
                      </div>
                    )}
                    {transaction.changeDue && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Change Due</span>
                        <span className="font-semibold text-success">{transaction.changeDue}</span>
                      </div>
                    )}
                    {transaction.balanceDue && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Balance Due</span>
                        <span className="font-semibold text-warning">{transaction.balanceDue}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Loyalty */}
            {transaction.loyalty && (
              <section>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> Loyalty
                </p>
                <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">{transaction.loyalty.customerName}</p>
                    </div>
                    {transaction.loyalty.tier && (
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                        {transaction.loyalty.tier}
                      </Badge>
                    )}
                  </div>
                  {transaction.loyalty.rewardName && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Reward Redeemed</span>
                      <span className="font-medium">
                        {transaction.loyalty.rewardName}
                        {transaction.loyalty.discountValue && ` (−${transaction.loyalty.discountValue})`}
                      </span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {transaction.loyalty.pointsUsed !== undefined && (
                      <div className="text-center bg-background rounded-md p-2">
                        <p className="text-[10px] text-muted-foreground uppercase">Used</p>
                        <p className="text-sm font-semibold">{transaction.loyalty.pointsUsed}</p>
                      </div>
                    )}
                    {transaction.loyalty.pointsEarned !== undefined && (
                      <div className="text-center bg-background rounded-md p-2">
                        <p className="text-[10px] text-muted-foreground uppercase">Earned</p>
                        <p className="text-sm font-semibold text-success">+{transaction.loyalty.pointsEarned}</p>
                      </div>
                    )}
                    {transaction.loyalty.pointsBalance !== undefined && (
                      <div className="text-center bg-background rounded-md p-2">
                        <p className="text-[10px] text-muted-foreground uppercase">Balance</p>
                        <p className="text-sm font-semibold">{transaction.loyalty.pointsBalance}</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Footer actions */}
          <div className="border-t border-border px-4 sm:px-5 py-3 bg-card flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs flex-1" onClick={handleResend}>
              <Send className="h-3.5 w-3.5" /> Resend
            </Button>
            {canVoid && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 text-xs flex-1"
                onClick={() => setVoidConfirmOpen(true)}
              >
                <Ban className="h-3.5 w-3.5" /> Void
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Void confirmation with code */}
      <AlertDialog
        open={voidConfirmOpen}
        onOpenChange={(open) => {
          setVoidConfirmOpen(open);
          if (!open) { setVoidCode(""); setVoidCodeError(""); }
        }}
      >
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
      <AlertDialog
        open={removePaymentIndex !== null}
        onOpenChange={(open) => { if (!open) setRemovePaymentIndex(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove payment method?</AlertDialogTitle>
            <AlertDialogDescription>
              {removePaymentIndex !== null && transaction.payments[removePaymentIndex] ? (
                <>
                  This will remove the{" "}
                  <span className="font-medium text-foreground">
                    {transaction.payments[removePaymentIndex].method}
                  </span>{" "}
                  payment of{" "}
                  <span className="font-medium text-foreground">
                    {transaction.payments[removePaymentIndex].amount}
                  </span>{" "}
                  from this order. This action cannot be undone.
                </>
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
