import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { usePOS } from "@/contexts/POSContext";
import type { POSOrder } from "@/data/posData";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Printer, Mail, ChefHat, Receipt } from "lucide-react";
import { toast } from "sonner";
import ThermalReceipt from "./ThermalReceipt";
import KitchenDocket, { groupItemsByDepartment } from "./KitchenDocket";

interface Props {
  open: boolean;
  onClose: () => void;
  order: POSOrder | null;
  onBack?: () => void;
}

export default function PrintReceiptDialog({ open, onClose, order, onBack }: Props) {
  const { currentOutlet } = usePOS();
  const receiptRef = useRef<HTMLDivElement>(null);
  const docketRef = useRef<HTMLDivElement>(null);
  const docketRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedTab, setSelectedTab] = useState("receipt");

  if (!order) return null;

  const docketGroups = groupItemsByDepartment(order.items, order.outletId);

  const printElement = (element: HTMLElement, title: string) => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (!printWindow) {
      toast.error("Please allow popups to print");
      return;
    }
    const content = element.outerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            display: flex;
            justify-content: center;
            width: 80mm;
            margin: 0 auto;
          }
          body > div {
            width: 302px;
            margin: 0 auto;
          }
          .text-center { text-align: center; }
          @media print {
            @page { margin: 0; size: 80mm auto; }
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handlePrint = (ref: React.RefObject<HTMLDivElement>, title: string) => {
    if (!ref.current) return;
    printElement(ref.current, title);
  };

  const handlePrintDepartment = (departmentName: string) => {
    const el = docketRefs.current.get(departmentName);
    if (!el) return;
    printElement(el, `Docket-${departmentName}-${order.orderNumber}`);
  };

  const handleEmailReceipt = () => {
    if (!customerEmail.trim()) {
      toast.error("Please enter customer email");
      return;
    }
    toast.success(`Receipt sent to ${customerEmail}`);
    setCustomerEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Print & Share — {order.orderNumber}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex flex-col">
          <TabsList className="mx-4 mt-3 grid grid-cols-2">
            <TabsTrigger value="receipt" className="gap-1.5 text-xs">
              <Receipt className="w-3.5 h-3.5" /> Receipt
            </TabsTrigger>
            <TabsTrigger value="docket" className="gap-1.5 text-xs">
              <ChefHat className="w-3.5 h-3.5" /> Dockets
            </TabsTrigger>
          </TabsList>

          {/* ===== RECEIPT TAB ===== */}
          <TabsContent value="receipt" className="mt-0">
            <div className="px-4 py-3 max-h-[50vh] overflow-y-auto">
              <div className="flex justify-center">
                <div className="border border-border rounded-lg overflow-hidden shadow-sm">
                  <ThermalReceipt ref={receiptRef} order={order} outlet={currentOutlet} />
                </div>
              </div>
            </div>

            <div className="border-t border-border p-4 space-y-3">
              <Button
                onClick={() => handlePrint(receiptRef, `Receipt-${order.orderNumber}`)}
                className="w-full gap-2"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </Button>

              <div className="flex gap-2">
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="h-9"
                />
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={handleEmailReceipt}>
                  <Mail className="w-3.5 h-3.5" /> Send
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* ===== DOCKET TAB ===== */}
          <TabsContent value="docket" className="mt-0">
            <div className="px-4 py-3 max-h-[50vh] overflow-y-auto">
              <div className="space-y-4">
                {docketGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No department dockets for this order
                  </p>
                ) : (
                  docketGroups.map((group) => (
                    <div key={group.departmentName} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="gap-1 text-xs font-semibold">
                          <ChefHat className="w-3 h-3" /> {group.departmentName}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {group.items.length} item{group.items.length > 1 ? "s" : ""}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 gap-1 text-xs"
                            onClick={() => handlePrintDepartment(group.departmentName)}
                          >
                            <Printer className="w-3 h-3" /> Print
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div className="border border-border rounded-lg overflow-hidden shadow-sm">
                          <KitchenDocket
                            ref={(el: HTMLDivElement | null) => {
                              if (el) docketRefs.current.set(group.departmentName, el);
                            }}
                            order={order}
                            outlet={currentOutlet}
                            departmentFilter={group.departmentName}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-border p-4 space-y-2">
              <Button
                onClick={() => handlePrint(docketRef, `Docket-${order.orderNumber}`)}
                className="w-full gap-2"
              >
                <Printer className="w-4 h-4" /> Print All Dockets
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Each department docket prints on a separate page
              </p>
            </div>

            {/* Hidden combined docket for printing all */}
            <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
              <KitchenDocket ref={docketRef} order={order} outlet={currentOutlet} />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
