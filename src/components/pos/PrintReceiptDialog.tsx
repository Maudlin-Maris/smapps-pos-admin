import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { usePOS } from "@/contexts/POSContext";
import type { POSOrder } from "@/data/posData";
import { initialDepartments } from "@/data/departments";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Printer, Mail, ChefHat, Receipt } from "lucide-react";
import { toast } from "sonner";
import ThermalReceipt from "./ThermalReceipt";
import KitchenDocket, { groupItemsByDepartment } from "./KitchenDocket";
import type { POSPrinter } from "./PrinterManagementDialog";

interface Props {
  open: boolean;
  onClose: () => void;
  order: POSOrder | null;
  onBack?: () => void;
  printers?: POSPrinter[];
}

export default function PrintReceiptDialog({ open, onClose, order, onBack, printers = [] }: Props) {
  const { currentOutlet } = usePOS();
  const receiptRef = useRef<HTMLDivElement>(null);
  const docketRef = useRef<HTMLDivElement>(null);
  const docketRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedTab, setSelectedTab] = useState("receipt");

  const enabledPrinters = printers.filter(p => p.enabled);
  const outletNum = parseInt((currentOutlet?.id || "").replace("outlet-", ""));
  const departments = initialDepartments.filter(d => d.outletId === outletNum);

  const routeToPrinter = (departmentName: string) => {
    const dept = departments.find(d => d.name === departmentName);
    if (!dept) return;
    const assignedPrinters = enabledPrinters.filter(p => p.assignedDepartments.includes(dept.id));
    if (assignedPrinters.length === 0) return;
    for (const printer of assignedPrinters) {
      console.log(`[Print] Routing ${departmentName} docket to "${printer.name}"`);
    }
    const names = assignedPrinters.map(p => p.name).join(", ");
    toast.success(`Docket sent to ${names}`, { description: `${departmentName} — Order ${order?.orderNumber}`, duration: 3000 });
  };

  if (!order) return null;

  const docketGroups = groupItemsByDepartment(order.items, order.outletId);

  const printElement = (element: HTMLElement, title: string) => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (!printWindow) { toast.error("Please allow popups to print"); return; }
    const content = element.outerHTML;
    const css = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 80mm; background: #fff; color: #000; }
      body {
        font-family: 'Courier New', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        display: block !important;
        margin: 0; padding: 0;
        color: #000;
      }
      /* Tailwind class fallbacks (print window has no Tailwind loaded) */
      .bg-white { background-color: #ffffff !important; }
      .text-black { color: #000000 !important; }
      .text-center { text-align: center; }
      .font-mono { font-family: 'Courier New', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
      /* Root wrapper (KitchenDocket flex column) → stack as block pages */
      body > div {
        width: 302px !important;
        margin: 0 auto !important;
        display: block !important;
        gap: 0 !important;
        padding: 0 !important;
      }
      /* Each department docket */
      body > div > div {
        width: 302px !important;
        margin: 0 auto !important;
        page-break-after: always;
        break-after: page;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      body > div > div:last-child {
        page-break-after: auto;
        break-after: auto;
      }
      @media print {
        @page { margin: 0; size: 80mm auto; }
        html, body { width: 80mm; margin: 0; padding: 0; }
      }
    `;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title><meta charset="utf-8"><style>${css}</style></head><body>${content}</body></html>`);
    printWindow.document.close();
    // Wait for layout/fonts before printing
    const doPrint = () => { try { printWindow.focus(); printWindow.print(); } finally { setTimeout(() => printWindow.close(), 100); } };
    if (printWindow.document.readyState === "complete") setTimeout(doPrint, 200);
    else printWindow.addEventListener("load", () => setTimeout(doPrint, 200));
  };


  const handlePrint = (ref: React.RefObject<HTMLDivElement>, title: string) => {
    if (!ref.current) return;
    printElement(ref.current, title);
  };

  const handlePrintDepartment = (departmentName: string) => {
    const el = docketRefs.current.get(departmentName);
    if (el) printElement(el, `Docket-${departmentName}-${order.orderNumber}`);
    routeToPrinter(departmentName);
  };

  const handlePrintAllDockets = () => {
    handlePrint(docketRef, `Docket-${order.orderNumber}`);
    let sentCount = 0;
    for (const group of docketGroups) {
      const dept = departments.find(d => d.name === group.departmentName);
      if (!dept) continue;
      const assigned = enabledPrinters.filter(p => p.assignedDepartments.includes(dept.id));
      if (assigned.length > 0) {
        for (const printer of assigned) console.log(`[Print] Routing ${group.departmentName} docket to "${printer.name}"`);
        sentCount += assigned.length;
      }
    }
    if (sentCount > 0) toast.success(`Dockets routed to ${sentCount} printer${sentCount > 1 ? "s" : ""}`, { description: `Order ${order.orderNumber} — auto-routed by department`, duration: 3000 });
  };

  const handleEmailReceipt = () => {
    if (!customerEmail.trim()) { toast.error("Please enter customer email"); return; }
    toast.success(`Receipt sent to ${customerEmail}`);
    setCustomerEmail("");
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="!w-full !max-w-none lg:!max-w-lg p-0 flex flex-col overflow-hidden [&>button]:z-10">
        <SheetHeader className="px-4 pt-4 pb-0 border-b-0">
          <SheetTitle className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { onClose(); onBack(); }}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Receipt className="w-5 h-5" />
            Print & Share — {order.orderNumber}
          </SheetTitle>
        </SheetHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex flex-col flex-1 min-h-0">
          <TabsList className="mx-4 mt-3 grid grid-cols-2">
            <TabsTrigger value="receipt" className="gap-1.5 text-xs"><Receipt className="w-3.5 h-3.5" /> Receipt</TabsTrigger>
            <TabsTrigger value="docket" className="gap-1.5 text-xs"><ChefHat className="w-3.5 h-3.5" /> Dockets</TabsTrigger>
          </TabsList>

          <TabsContent value="receipt" className="mt-0 flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <div className="flex justify-center">
                <div className="border border-border rounded-lg overflow-hidden shadow-sm">
                  <ThermalReceipt ref={receiptRef} order={order} outlet={currentOutlet} />
                </div>
              </div>
            </div>
            <div className="border-t border-border p-4 space-y-3">
              <Button onClick={() => handlePrint(receiptRef, `Receipt-${order.orderNumber}`)} className="w-full gap-2"><Printer className="w-4 h-4" /> Print Receipt</Button>
              <div className="flex gap-2">
                <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="customer@email.com" className="h-9" />
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={handleEmailReceipt}><Mail className="w-3.5 h-3.5" /> Send</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="docket" forceMount className="mt-0 data-[state=inactive]:hidden flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4">
              {docketGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No department dockets for this order</p>
              ) : (
                docketGroups.map((group) => (
                  <div key={group.departmentName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="gap-1 text-xs font-semibold"><ChefHat className="w-3 h-3" /> {group.departmentName}</Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{group.items.length} item{group.items.length > 1 ? "s" : ""}</span>
                        <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs" onClick={() => handlePrintDepartment(group.departmentName)}><Printer className="w-3 h-3" /> Print</Button>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-white">
                        <KitchenDocket ref={(el: HTMLDivElement | null) => { if (el) docketRefs.current.set(group.departmentName, el); }} order={order} outlet={currentOutlet} departmentFilter={group.departmentName} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="shrink-0 border-t border-border p-4 space-y-2">
              <Button onClick={handlePrintAllDockets} className="w-full gap-2"><Printer className="w-4 h-4" /> Print All Dockets</Button>
              <p className="text-[10px] text-muted-foreground text-center">Each department docket prints on a separate page</p>
            </div>
            <div aria-hidden className="sr-only" style={{ position: "fixed", left: "-99999px", top: 0, width: "302px", pointerEvents: "none", visibility: "hidden" }}>
              <KitchenDocket ref={docketRef} order={order} outlet={currentOutlet} />
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
