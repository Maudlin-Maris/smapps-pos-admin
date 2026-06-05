import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import { toast } from "sonner";
import type { Transaction } from "@/components/TransactionsTable";

interface Props {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatOrderType(t?: string) {
  if (!t) return null;
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TransactionReceiptPreview({ transaction, open, onOpenChange }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;

  const handlePrint = () => {
    const el = receiptRef.current;
    if (!el) return;
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (!printWindow) {
      toast.error("Please allow popups to print");
      return;
    }
    const css = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 80mm; background: #fff; color: #000; }
      body {
        font-family: 'Courier New', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        padding: 6px 8px;
        font-size: 12px;
        line-height: 1.35;
      }
      .center { text-align: center; }
      .right { text-align: right; }
      .bold { font-weight: 700; }
      .muted { color: #444; }
      .row { display: flex; justify-content: space-between; gap: 8px; }
      .sep { border-top: 1px dashed #000; margin: 6px 0; }
      .double { border-top: 2px solid #000; margin: 6px 0; }
      .item-name { font-weight: 600; }
      .indent { padding-left: 10px; }
      .small { font-size: 11px; }
      .xsmall { font-size: 10px; }
      .mt { margin-top: 4px; }
      h1 { font-size: 14px; font-weight: 700; }
      @media print {
        @page { margin: 0; size: 80mm auto; }
        html, body { width: 80mm; margin: 0; }
      }
    `;
    printWindow.document.write(
      `<!DOCTYPE html><html><head><title>Receipt ${transaction.orderId}</title><meta charset="utf-8"><style>${css}</style></head><body>${el.innerHTML}</body></html>`
    );
    printWindow.document.close();
    const doPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } finally {
        setTimeout(() => printWindow.close(), 100);
      }
    };
    if (printWindow.document.readyState === "complete") setTimeout(doPrint, 200);
    else printWindow.addEventListener("load", () => setTimeout(doPrint, 200));
  };

  const orderTypeLabel = formatOrderType(transaction.orderType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b border-border">
          <DialogTitle className="text-base">Receipt Preview — {transaction.orderId}</DialogTitle>
        </DialogHeader>

        <div className="bg-muted/40 px-4 py-4 max-h-[65vh] overflow-y-auto">
          <div className="mx-auto bg-white text-black shadow-sm rounded-sm" style={{ width: "302px" }}>
            <div
              ref={receiptRef}
              className="font-mono text-[12px] leading-[1.35] p-3"
              style={{ fontFamily: "'Courier New', monospace" }}
            >
              {/* Header */}
              <div className="center">
                <h1>{transaction.location}</h1>
                {transaction.outletAddress && (
                  <div className="xsmall muted">{transaction.outletAddress}</div>
                )}
              </div>
              <div className="sep" />

              {/* Meta */}
              <div className="row small">
                <span>Order</span>
                <span className="bold">{transaction.orderId}</span>
              </div>
              <div className="row small">
                <span>Date</span>
                <span>{transaction.date}</span>
              </div>
              <div className="row small">
                <span>Cashier</span>
                <span>{transaction.cashier}</span>
              </div>
              {orderTypeLabel && (
                <div className="row small">
                  <span>Type</span>
                  <span>{orderTypeLabel}{transaction.tableLabel ? ` · ${transaction.tableLabel}` : ""}</span>
                </div>
              )}
              {(transaction.customerName || transaction.customerPhone) && (
                <div className="row small">
                  <span>Customer</span>
                  <span>{transaction.customerName || transaction.customerPhone}</span>
                </div>
              )}

              <div className="sep" />

              {/* Items */}
              {transaction.items && transaction.items.length > 0 ? (
                <>
                  {transaction.items.map((it, i) => (
                    <div key={i} className="mt">
                      <div className="row">
                        <span className="item-name">{it.qty}× {it.name}</span>
                        <span className="bold">{it.total}</span>
                      </div>
                      {it.variantName && (
                        <div className="indent xsmall muted">{it.variantName}</div>
                      )}
                      {it.extras?.map((e, j) => (
                        <div key={j} className="indent xsmall row">
                          <span>+ {(e.qty ?? 1) > 1 ? `${e.qty}× ` : ""}{e.name}</span>
                          <span>{e.price}</span>
                        </div>
                      ))}
                      {it.notes && (
                        <div className="indent xsmall muted">Note: {it.notes}</div>
                      )}
                      <div className="indent xsmall muted">@ {it.unitPrice}</div>
                    </div>
                  ))}
                  <div className="sep" />
                </>
              ) : null}

              {/* Totals */}
              {transaction.subtotal && (
                <div className="row small">
                  <span>Subtotal</span>
                  <span>{transaction.subtotal}</span>
                </div>
              )}
              {transaction.discount && (
                <div className="row small">
                  <span>Discount{transaction.discountName ? ` (${transaction.discountName})` : ""}</span>
                  <span>−{transaction.discount}</span>
                </div>
              )}
              {transaction.fees?.map((fee, i) => (
                <div key={i} className="row small">
                  <span>{fee.name}</span>
                  <span>{fee.amount}</span>
                </div>
              ))}
              {transaction.tip && (
                <div className="row small">
                  <span>Tip</span>
                  <span>{transaction.tip}</span>
                </div>
              )}
              <div className="double" />
              <div className="row bold">
                <span>TOTAL</span>
                <span>{transaction.amount}</span>
              </div>
              <div className="sep" />

              {/* Payments */}
              <div className="small bold">Payment</div>
              {transaction.payments.map((p, i) => (
                <div key={i} className="row small">
                  <span>{p.method}</span>
                  <span>{p.amount}</span>
                </div>
              ))}
              {transaction.paidAmount && (
                <div className="row small">
                  <span>Paid</span>
                  <span>{transaction.paidAmount}</span>
                </div>
              )}
              {transaction.changeDue && (
                <div className="row small bold">
                  <span>Change</span>
                  <span>{transaction.changeDue}</span>
                </div>
              )}
              {transaction.balanceDue && (
                <div className="row small bold">
                  <span>Balance Due</span>
                  <span>{transaction.balanceDue}</span>
                </div>
              )}

              {transaction.loyalty && (
                <>
                  <div className="sep" />
                  <div className="small bold">Loyalty — {transaction.loyalty.customerName}</div>
                  {transaction.loyalty.tier && (
                    <div className="row xsmall">
                      <span>Tier</span>
                      <span>{transaction.loyalty.tier}</span>
                    </div>
                  )}
                  {transaction.loyalty.rewardName && (
                    <div className="row xsmall">
                      <span>Reward</span>
                      <span>{transaction.loyalty.rewardName}</span>
                    </div>
                  )}
                  {transaction.loyalty.pointsUsed !== undefined && (
                    <div className="row xsmall">
                      <span>Points Used</span>
                      <span>{transaction.loyalty.pointsUsed}</span>
                    </div>
                  )}
                  {transaction.loyalty.pointsEarned !== undefined && (
                    <div className="row xsmall">
                      <span>Points Earned</span>
                      <span>+{transaction.loyalty.pointsEarned}</span>
                    </div>
                  )}
                  {transaction.loyalty.pointsBalance !== undefined && (
                    <div className="row xsmall">
                      <span>Balance</span>
                      <span>{transaction.loyalty.pointsBalance}</span>
                    </div>
                  )}
                </>
              )}

              {transaction.notes && (
                <>
                  <div className="sep" />
                  <div className="xsmall"><span className="bold">Note: </span>{transaction.notes}</div>
                </>
              )}

              <div className="sep" />
              <div className="center xsmall muted">Thank you for your patronage!</div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-4 py-3 border-t border-border flex-row sm:justify-end gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onOpenChange(false)}>
            <X className="h-3.5 w-3.5" /> Close
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
