import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
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
  if (!transaction) return null;

  const orderTypeLabel = formatOrderType(transaction.orderType);

  const handleDownload = () => {
    try {
      const width = 80; // mm
      const margin = 5;
      const innerWidth = width - margin * 2;
      const lineH = 3.6;

      const render = (doc: jsPDF) => {
        doc.setFont("courier", "normal");
        let y = margin;

        const writeRow = (left: string, right: string, opts: { bold?: boolean; size?: number } = {}) => {
          const size = opts.size ?? 9;
          doc.setFontSize(size);
          doc.setFont("courier", opts.bold ? "bold" : "normal");
          const rightW = doc.getTextWidth(right);
          const leftMax = innerWidth - rightW - 2;
          const leftLines = doc.splitTextToSize(left, leftMax);
          leftLines.forEach((ln: string, i: number) => {
            doc.text(ln, margin, y);
            if (i === 0) doc.text(right, margin + innerWidth, y, { align: "right" });
            y += lineH;
          });
        };

        const writeLine = (text: string, opts: { bold?: boolean; size?: number; align?: "left" | "center" | "right"; indent?: number } = {}) => {
          const size = opts.size ?? 9;
          doc.setFontSize(size);
          doc.setFont("courier", opts.bold ? "bold" : "normal");
          const indent = opts.indent ?? 0;
          const lines = doc.splitTextToSize(text, innerWidth - indent);
          lines.forEach((ln: string) => {
            if (opts.align === "center") doc.text(ln, margin + innerWidth / 2, y, { align: "center" });
            else if (opts.align === "right") doc.text(ln, margin + innerWidth, y, { align: "right" });
            else doc.text(ln, margin + indent, y);
            y += lineH;
          });
        };

        const sep = (dashed = true) => {
          y += 0.8;
          doc.setLineDashPattern(dashed ? [0.6, 0.6] : [], 0);
          doc.setLineWidth(dashed ? 0.2 : 0.4);
          doc.line(margin, y, margin + innerWidth, y);
          y += 2.2;
        };

        writeLine(transaction.location, { bold: true, size: 11, align: "center" });
        if (transaction.outletAddress) writeLine(transaction.outletAddress, { size: 8, align: "center" });
        sep();

        writeRow("Order", transaction.orderId, { bold: true, size: 8 });
        writeRow("Date", transaction.date, { size: 8 });
        writeRow("Cashier", transaction.cashier, { size: 8 });
        if (orderTypeLabel) writeRow("Type", `${orderTypeLabel}${transaction.tableLabel ? ` · ${transaction.tableLabel}` : ""}`, { size: 8 });
        if (transaction.customerName || transaction.customerPhone) {
          writeRow("Customer", transaction.customerName || transaction.customerPhone || "", { size: 8 });
        }
        sep();

        if (transaction.items?.length) {
          transaction.items.forEach((it) => {
            writeRow(`${it.qty}x ${it.name}`, it.total, { bold: true });
            if (it.variantName) writeLine(it.variantName, { size: 8, indent: 4 });
            it.extras?.forEach((e) => {
              writeRow(`+ ${(e.qty ?? 1) > 1 ? `${e.qty}x ` : ""}${e.name}`, e.price, { size: 8 });
            });
            if (it.notes) writeLine(`Note: ${it.notes}`, { size: 8, indent: 4 });
            writeLine(`@ ${it.unitPrice}`, { size: 8, indent: 4 });
          });
          sep();
        }

        if (transaction.subtotal) writeRow("Subtotal", transaction.subtotal, { size: 8 });
        if (transaction.discount) writeRow(`Discount${transaction.discountName ? ` (${transaction.discountName})` : ""}`, `-${transaction.discount}`, { size: 8 });
        transaction.fees?.forEach((fee) => writeRow(fee.name, fee.amount, { size: 8 }));
        if (transaction.tip) writeRow("Tip", transaction.tip, { size: 8 });
        sep(false);
        writeRow("TOTAL", transaction.amount, { bold: true, size: 10 });
        sep();

        writeLine("Payment", { bold: true, size: 9 });
        transaction.payments.forEach((p) => writeRow(p.method, p.amount, { size: 8 }));
        if (transaction.paidAmount) writeRow("Paid", transaction.paidAmount, { size: 8 });
        if (transaction.changeDue) writeRow("Change", transaction.changeDue, { bold: true, size: 8 });
        if (transaction.balanceDue) writeRow("Balance Due", transaction.balanceDue, { bold: true, size: 8 });

        if (transaction.loyalty) {
          sep();
          writeLine(`Loyalty - ${transaction.loyalty.customerName}`, { bold: true, size: 9 });
          if (transaction.loyalty.tier) writeRow("Tier", transaction.loyalty.tier, { size: 8 });
          if (transaction.loyalty.rewardName) writeRow("Reward", transaction.loyalty.rewardName, { size: 8 });
          if (transaction.loyalty.pointsUsed !== undefined) writeRow("Points Used", String(transaction.loyalty.pointsUsed), { size: 8 });
          if (transaction.loyalty.pointsEarned !== undefined) writeRow("Points Earned", `+${transaction.loyalty.pointsEarned}`, { size: 8 });
          if (transaction.loyalty.pointsBalance !== undefined) writeRow("Balance", String(transaction.loyalty.pointsBalance), { size: 8 });
        }

        if (transaction.notes) {
          sep();
          writeLine(`Note: ${transaction.notes}`, { size: 8 });
        }

        sep();
        writeLine("Thank you for your patronage!", { size: 8, align: "center" });
        return y + margin;
      };

      // Measure pass on a tall scratch doc
      const measureDoc = new jsPDF({ unit: "mm", format: [width, 1000] });
      const totalHeight = Math.max(render(measureDoc), 60);

      // Real doc sized to content
      const doc = new jsPDF({ unit: "mm", format: [width, totalHeight] });
      render(doc);
      doc.save(`Receipt-${transaction.orderId}.pdf`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b border-border">
          <DialogTitle className="text-base">Bill Preview — {transaction.orderId}</DialogTitle>
        </DialogHeader>

        <div className="bg-muted/40 px-4 py-4 max-h-[65vh] overflow-y-auto">
          <div className="mx-auto bg-white text-black shadow-sm rounded-sm" style={{ width: "302px" }}>
            <div className="font-mono text-[12px] leading-[1.35] p-3" style={{ fontFamily: "'Courier New', monospace" }}>
              <div className="text-center">
                <div className="font-bold text-sm">{transaction.location}</div>
                {transaction.outletAddress && <div className="text-[10px] text-neutral-600">{transaction.outletAddress}</div>}
              </div>
              <div className="border-t border-dashed border-black my-2" />

              <div className="flex justify-between text-[11px]"><span>Order</span><span className="font-bold">{transaction.orderId}</span></div>
              <div className="flex justify-between text-[11px]"><span>Date</span><span>{transaction.date}</span></div>
              <div className="flex justify-between text-[11px]"><span>Cashier</span><span>{transaction.cashier}</span></div>
              {orderTypeLabel && (
                <div className="flex justify-between text-[11px]"><span>Type</span><span>{orderTypeLabel}{transaction.tableLabel ? ` · ${transaction.tableLabel}` : ""}</span></div>
              )}
              {(transaction.customerName || transaction.customerPhone) && (
                <div className="flex justify-between text-[11px]"><span>Customer</span><span>{transaction.customerName || transaction.customerPhone}</span></div>
              )}

              <div className="border-t border-dashed border-black my-2" />

              {transaction.items?.map((it, i) => (
                <div key={i} className="mt-1">
                  <div className="flex justify-between"><span className="font-semibold">{it.qty}× {it.name}</span><span className="font-bold">{it.total}</span></div>
                  {it.variantName && <div className="pl-2.5 text-[10px] text-neutral-600">{it.variantName}</div>}
                  {it.extras?.map((e, j) => (
                    <div key={j} className="pl-2.5 text-[10px] flex justify-between"><span>+ {(e.qty ?? 1) > 1 ? `${e.qty}× ` : ""}{e.name}</span><span>{e.price}</span></div>
                  ))}
                  {it.notes && <div className="pl-2.5 text-[10px] text-neutral-600">Note: {it.notes}</div>}
                  <div className="pl-2.5 text-[10px] text-neutral-600">@ {it.unitPrice}</div>
                </div>
              ))}
              {transaction.items?.length ? <div className="border-t border-dashed border-black my-2" /> : null}

              {transaction.subtotal && <div className="flex justify-between text-[11px]"><span>Subtotal</span><span>{transaction.subtotal}</span></div>}
              {transaction.discount && <div className="flex justify-between text-[11px]"><span>Discount{transaction.discountName ? ` (${transaction.discountName})` : ""}</span><span>−{transaction.discount}</span></div>}
              {transaction.fees?.map((fee, i) => (
                <div key={i} className="flex justify-between text-[11px]"><span>{fee.name}</span><span>{fee.amount}</span></div>
              ))}
              {transaction.tip && <div className="flex justify-between text-[11px]"><span>Tip</span><span>{transaction.tip}</span></div>}
              <div className="border-t-2 border-black my-1.5" />
              <div className="flex justify-between font-bold"><span>TOTAL</span><span>{transaction.amount}</span></div>
              <div className="border-t border-dashed border-black my-2" />

              <div className="text-[11px] font-bold">Payment</div>
              {transaction.payments.map((p, i) => (
                <div key={i} className="flex justify-between text-[11px]"><span>{p.method}</span><span>{p.amount}</span></div>
              ))}
              {transaction.paidAmount && <div className="flex justify-between text-[11px]"><span>Paid</span><span>{transaction.paidAmount}</span></div>}
              {transaction.changeDue && <div className="flex justify-between text-[11px] font-bold"><span>Change</span><span>{transaction.changeDue}</span></div>}
              {transaction.balanceDue && <div className="flex justify-between text-[11px] font-bold"><span>Balance Due</span><span>{transaction.balanceDue}</span></div>}

              {transaction.loyalty && (
                <>
                  <div className="border-t border-dashed border-black my-2" />
                  <div className="text-[11px] font-bold">Loyalty — {transaction.loyalty.customerName}</div>
                  {transaction.loyalty.tier && <div className="flex justify-between text-[10px]"><span>Tier</span><span>{transaction.loyalty.tier}</span></div>}
                  {transaction.loyalty.rewardName && <div className="flex justify-between text-[10px]"><span>Reward</span><span>{transaction.loyalty.rewardName}</span></div>}
                  {transaction.loyalty.pointsUsed !== undefined && <div className="flex justify-between text-[10px]"><span>Points Used</span><span>{transaction.loyalty.pointsUsed}</span></div>}
                  {transaction.loyalty.pointsEarned !== undefined && <div className="flex justify-between text-[10px]"><span>Points Earned</span><span>+{transaction.loyalty.pointsEarned}</span></div>}
                  {transaction.loyalty.pointsBalance !== undefined && <div className="flex justify-between text-[10px]"><span>Balance</span><span>{transaction.loyalty.pointsBalance}</span></div>}
                </>
              )}

              {transaction.notes && (
                <>
                  <div className="border-t border-dashed border-black my-2" />
                  <div className="text-[10px]"><span className="font-bold">Note: </span>{transaction.notes}</div>
                </>
              )}

              <div className="border-t border-dashed border-black my-2" />
              <div className="text-center text-[10px] text-neutral-600">Thank you for your patronage!</div>
            </div>
          </div>
        </div>

        <DialogFooter className="px-4 py-3 border-t border-border flex-row sm:justify-end gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onOpenChange(false)}>
            <X className="h-3.5 w-3.5" /> Close
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" /> Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
