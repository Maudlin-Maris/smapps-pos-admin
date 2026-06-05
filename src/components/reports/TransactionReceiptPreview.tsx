import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import logoDark from "@/assets/logo-dark.png";
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

// Load image to data URL for jsPDF
async function loadImageDataUrl(src: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 200, h: 60 });
      img.src = data;
    });
    return { data, w: dims.w, h: dims.h };
  } catch {
    return null;
  }
}

export default function TransactionReceiptPreview({ transaction, open, onOpenChange }: Props) {
  if (!transaction) return null;

  const orderTypeLabel = formatOrderType(transaction.orderType);

  const handleDownload = async () => {
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const M = 18; // page margin
      const contentW = pageW - M * 2;
      let y = M;

      const ensureSpace = (need: number) => {
        if (y + need > pageH - M) {
          doc.addPage();
          y = M;
        }
      };

      // ── Header: Logo + Business ──────────────────────────────
      const logo = await loadImageDataUrl(logoDark);
      const headerTop = y;
      if (logo) {
        const logoH = 14;
        const logoW = (logo.w / logo.h) * logoH;
        doc.addImage(logo.data, "PNG", M, headerTop, logoW, logoH);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      const rightX = pageW - M;
      doc.text(transaction.location, rightX, headerTop + 4, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      if (transaction.outletAddress) {
        const addrLines = doc.splitTextToSize(transaction.outletAddress, 80);
        doc.text(addrLines, rightX, headerTop + 9, { align: "right" });
      }

      y = headerTop + 20;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(M, y, pageW - M, y);
      y += 8;

      // ── Document Title ───────────────────────────────────────
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(20, 20, 20);
      doc.text("RECEIPT", M, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(110, 110, 110);
      doc.text(`#${transaction.orderId}`, M, y + 5);
      y += 12;

      // ── Meta grid (2 columns) ────────────────────────────────
      const metaRows: Array<[string, string]> = [
        ["Date", transaction.date],
        ["Cashier", transaction.cashier],
      ];
      if (orderTypeLabel) metaRows.push(["Order Type", `${orderTypeLabel}${transaction.tableLabel ? ` · ${transaction.tableLabel}` : ""}`]);

      const customerRows: Array<[string, string]> = [];
      if (transaction.customerName) customerRows.push(["Customer", transaction.customerName]);
      if (transaction.customerPhone) customerRows.push(["Phone", transaction.customerPhone]);
      if (!customerRows.length) customerRows.push(["Customer", "Walk-in"]);

      const colW = contentW / 2;
      const drawMetaCol = (rows: Array<[string, string]>, x: number, title: string) => {
        let cy = y;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(title.toUpperCase(), x, cy);
        cy += 5;
        rows.forEach(([k, v]) => {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(k, x, cy);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(30, 30, 30);
          const vLines = doc.splitTextToSize(v, colW - 4);
          doc.text(vLines, x, cy + 4);
          cy += 4 + vLines.length * 4 + 2;
        });
        return cy;
      };
      const leftEnd = drawMetaCol(metaRows, M, "Order Info");
      const rightEnd = drawMetaCol(customerRows, M + colW, "Bill To");
      y = Math.max(leftEnd, rightEnd) + 4;

      // ── Items table ──────────────────────────────────────────
      ensureSpace(20);
      const colItem = M;
      const colQty = M + contentW * 0.62;
      const colPrice = M + contentW * 0.78;
      const colTotal = pageW - M;

      doc.setFillColor(245, 246, 248);
      doc.rect(M, y, contentW, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text("ITEM", colItem + 2, y + 5.5);
      doc.text("QTY", colQty, y + 5.5, { align: "right" });
      doc.text("PRICE", colPrice, y + 5.5, { align: "right" });
      doc.text("TOTAL", colTotal - 2, y + 5.5, { align: "right" });
      y += 10;

      if (transaction.items?.length) {
        transaction.items.forEach((it) => {
          const extraLines: string[] = [];
          if (it.variantName) extraLines.push(it.variantName);
          it.extras?.forEach((e) => extraLines.push(`+ ${(e.qty ?? 1) > 1 ? `${e.qty}× ` : ""}${e.name}${e.price ? `  ${e.price}` : ""}`));
          if (it.notes) extraLines.push(`Note: ${it.notes}`);

          const nameLines = doc.splitTextToSize(it.name, (colQty - colItem) - 6);
          const rowH = Math.max(6, nameLines.length * 4 + extraLines.length * 3.6) + 3;
          ensureSpace(rowH + 2);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(30, 30, 30);
          doc.text(nameLines, colItem + 2, y + 4);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(110, 110, 110);
          extraLines.forEach((ln, i) => {
            const wrapped = doc.splitTextToSize(ln, (colQty - colItem) - 8);
            doc.text(wrapped, colItem + 4, y + 4 + nameLines.length * 4 + i * 3.6);
          });

          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(30, 30, 30);
          doc.text(String(it.qty), colQty, y + 4, { align: "right" });
          doc.text(it.unitPrice, colPrice, y + 4, { align: "right" });
          doc.setFont("helvetica", "bold");
          doc.text(it.total, colTotal - 2, y + 4, { align: "right" });

          y += rowH;
          doc.setDrawColor(235, 235, 235);
          doc.setLineWidth(0.2);
          doc.line(M, y, pageW - M, y);
          y += 2;
        });
      }

      y += 4;

      // ── Totals (right aligned block) ─────────────────────────
      const totalsX = pageW - M - 70;
      const totalsValX = pageW - M;
      const totalRow = (label: string, value: string, opts: { bold?: boolean; size?: number; muted?: boolean } = {}) => {
        ensureSpace(7);
        doc.setFont("helvetica", opts.bold ? "bold" : "normal");
        doc.setFontSize(opts.size ?? 10);
        doc.setTextColor(opts.muted ? 110 : 30, opts.muted ? 110 : 30, opts.muted ? 110 : 30);
        doc.text(label, totalsX, y);
        doc.text(value, totalsValX, y, { align: "right" });
        y += 5.5;
      };

      if (transaction.subtotal) totalRow("Subtotal", transaction.subtotal, { muted: true });
      if (transaction.discount) totalRow(`Discount${transaction.discountName ? ` (${transaction.discountName})` : ""}`, `−${transaction.discount}`, { muted: true });
      transaction.fees?.forEach((fee) => totalRow(fee.name, fee.amount, { muted: true }));
      if (transaction.tip) totalRow("Tip", transaction.tip, { muted: true });

      ensureSpace(10);
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.5);
      doc.line(totalsX, y, totalsValX, y);
      y += 5;
      totalRow("TOTAL", transaction.amount, { bold: true, size: 13 });
      y += 4;

      // ── Payment ──────────────────────────────────────────────
      ensureSpace(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 30, 30);
      doc.text("Payment", M, y);
      y += 6;
      doc.setDrawColor(235, 235, 235);
      doc.setLineWidth(0.2);
      doc.line(M, y - 2, pageW - M, y - 2);

      transaction.payments.forEach((p) => {
        ensureSpace(6);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        doc.text(p.method, M, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(p.amount, pageW - M, y, { align: "right" });
        y += 5.5;
      });

      if (transaction.paidAmount || transaction.changeDue || transaction.balanceDue) y += 1;
      if (transaction.paidAmount) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(110, 110, 110);
        doc.text("Paid", M, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(transaction.paidAmount, pageW - M, y, { align: "right" });
        y += 5;
      }
      if (transaction.changeDue) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(110, 110, 110);
        doc.text("Change", M, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(transaction.changeDue, pageW - M, y, { align: "right" });
        y += 5;
      }
      if (transaction.balanceDue) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(180, 50, 50);
        doc.text("Balance Due", M, y);
        doc.text(transaction.balanceDue, pageW - M, y, { align: "right" });
        y += 6;
      }

      // ── Loyalty ──────────────────────────────────────────────
      if (transaction.loyalty) {
        y += 4;
        ensureSpace(24);
        doc.setFillColor(248, 249, 251);
        doc.setDrawColor(225, 228, 234);
        doc.roundedRect(M, y, contentW, 22, 1.5, 1.5, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text(`Loyalty — ${transaction.loyalty.customerName}`, M + 4, y + 6);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(90, 90, 90);
        const ly = y + 12;
        const parts: string[] = [];
        if (transaction.loyalty.tier) parts.push(`Tier: ${transaction.loyalty.tier}`);
        if (transaction.loyalty.rewardName) parts.push(`Reward: ${transaction.loyalty.rewardName}`);
        if (transaction.loyalty.pointsUsed !== undefined) parts.push(`Used: ${transaction.loyalty.pointsUsed}`);
        if (transaction.loyalty.pointsEarned !== undefined) parts.push(`Earned: +${transaction.loyalty.pointsEarned}`);
        if (transaction.loyalty.pointsBalance !== undefined) parts.push(`Balance: ${transaction.loyalty.pointsBalance}`);
        doc.text(parts.join("   ·   "), M + 4, ly);
        const ly2 = y + 17.5;
        if (parts.length > 4) {
          // wrap fallback
        }
        y += 26;
      }

      // ── Order notes ──────────────────────────────────────────
      if (transaction.notes) {
        ensureSpace(14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(110, 110, 110);
        doc.text("NOTES", M, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        const noteLines = doc.splitTextToSize(transaction.notes, contentW);
        doc.text(noteLines, M, y + 1);
        y += noteLines.length * 4.5 + 4;
      }

      // ── Footer ───────────────────────────────────────────────
      const footerY = pageH - M + 4;
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(M, footerY - 8, pageW - M, footerY - 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text("Thank you for your patronage!", pageW / 2, footerY - 3, { align: "center" });
      doc.setFontSize(8);
      doc.text(`Generated ${new Date().toLocaleString()}`, M, footerY - 3);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageW - M, footerY - 3, { align: "right" });

      doc.save(`Receipt-${transaction.orderId}.pdf`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-3 border-b border-border">
          <DialogTitle className="text-base">Bill Preview — {transaction.orderId}</DialogTitle>
        </DialogHeader>

        <div className="bg-muted/40 px-6 py-6 max-h-[70vh] overflow-y-auto">
          {/* A4-proportioned preview */}
          <div
            className="mx-auto bg-white text-neutral-900 shadow-md"
            style={{ width: "100%", maxWidth: "560px", aspectRatio: "1 / 1.414", padding: "32px 36px" }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <img src={logoDark} alt="Smapps POS" className="h-9 object-contain" />
              <div className="text-right">
                <div className="font-bold text-sm">{transaction.location}</div>
                {transaction.outletAddress && (
                  <div className="text-[10px] text-neutral-500 max-w-[200px] ml-auto">{transaction.outletAddress}</div>
                )}
              </div>
            </div>

            <div className="border-t border-neutral-200 my-4" />

            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-xl font-bold tracking-tight">RECEIPT</div>
                <div className="text-xs text-neutral-500">#{transaction.orderId}</div>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-4 mb-5 text-[11px]">
              <div>
                <div className="font-bold text-[9px] text-neutral-500 uppercase tracking-wider mb-1">Order Info</div>
                <div className="text-neutral-500">Date</div>
                <div className="font-semibold mb-1.5">{transaction.date}</div>
                <div className="text-neutral-500">Cashier</div>
                <div className="font-semibold mb-1.5">{transaction.cashier}</div>
                {orderTypeLabel && (
                  <>
                    <div className="text-neutral-500">Order Type</div>
                    <div className="font-semibold">{orderTypeLabel}{transaction.tableLabel ? ` · ${transaction.tableLabel}` : ""}</div>
                  </>
                )}
              </div>
              <div>
                <div className="font-bold text-[9px] text-neutral-500 uppercase tracking-wider mb-1">Bill To</div>
                <div className="text-neutral-500">Customer</div>
                <div className="font-semibold mb-1.5">{transaction.customerName || "Walk-in"}</div>
                {transaction.customerPhone && (
                  <>
                    <div className="text-neutral-500">Phone</div>
                    <div className="font-semibold">{transaction.customerPhone}</div>
                  </>
                )}
              </div>
            </div>

            {/* Items table */}
            <div className="rounded overflow-hidden border border-neutral-200">
              <div className="grid grid-cols-12 gap-2 px-2 py-1.5 bg-neutral-50 text-[9px] font-bold text-neutral-600 uppercase tracking-wider">
                <div className="col-span-7">Item</div>
                <div className="col-span-1 text-right">Qty</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              {transaction.items?.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-2 py-1.5 text-[11px] border-t border-neutral-100">
                  <div className="col-span-7">
                    <div className="font-semibold">{it.name}</div>
                    {it.variantName && <div className="text-[10px] text-neutral-500 pl-1">{it.variantName}</div>}
                    {it.extras?.map((e, j) => (
                      <div key={j} className="text-[10px] text-neutral-500 pl-1">+ {(e.qty ?? 1) > 1 ? `${e.qty}× ` : ""}{e.name} {e.price && <span className="text-neutral-400">{e.price}</span>}</div>
                    ))}
                    {it.notes && <div className="text-[10px] text-neutral-500 pl-1 italic">Note: {it.notes}</div>}
                  </div>
                  <div className="col-span-1 text-right">{it.qty}</div>
                  <div className="col-span-2 text-right">{it.unitPrice}</div>
                  <div className="col-span-2 text-right font-bold">{it.total}</div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-4">
              <div className="w-[55%] text-[11px] space-y-1">
                {transaction.subtotal && <div className="flex justify-between text-neutral-500"><span>Subtotal</span><span>{transaction.subtotal}</span></div>}
                {transaction.discount && <div className="flex justify-between text-neutral-500"><span>Discount{transaction.discountName ? ` (${transaction.discountName})` : ""}</span><span>−{transaction.discount}</span></div>}
                {transaction.fees?.map((fee, i) => (
                  <div key={i} className="flex justify-between text-neutral-500"><span>{fee.name}</span><span>{fee.amount}</span></div>
                ))}
                {transaction.tip && <div className="flex justify-between text-neutral-500"><span>Tip</span><span>{transaction.tip}</span></div>}
                <div className="border-t border-neutral-900 my-1.5" />
                <div className="flex justify-between font-bold text-sm"><span>TOTAL</span><span>{transaction.amount}</span></div>
              </div>
            </div>

            {/* Payment */}
            <div className="mt-5">
              <div className="font-bold text-[12px] mb-1 border-b border-neutral-200 pb-1">Payment</div>
              {transaction.payments.map((p, i) => (
                <div key={i} className="flex justify-between text-[11px] py-0.5"><span className="text-neutral-600">{p.method}</span><span className="font-bold">{p.amount}</span></div>
              ))}
              {transaction.balanceDue && (
                <div className="flex justify-between text-[11px] font-bold mt-1" style={{ color: "rgb(180,50,50)" }}><span>Balance Due</span><span>{transaction.balanceDue}</span></div>
              )}
            </div>

            {transaction.loyalty && (
              <div className="mt-4 rounded border border-neutral-200 bg-neutral-50 p-2 text-[10px]">
                <div className="font-bold mb-0.5">Loyalty — {transaction.loyalty.customerName}</div>
                <div className="text-neutral-600">
                  {transaction.loyalty.tier && <>Tier: {transaction.loyalty.tier} · </>}
                  {transaction.loyalty.pointsEarned !== undefined && <>Earned: +{transaction.loyalty.pointsEarned} · </>}
                  {transaction.loyalty.pointsBalance !== undefined && <>Balance: {transaction.loyalty.pointsBalance}</>}
                </div>
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-neutral-200 text-center text-[10px] text-neutral-500">
              Thank you for your patronage!
            </div>
          </div>
        </div>

        <DialogFooter className="px-5 py-3 border-t border-border flex-row sm:justify-end gap-2">
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
