import { useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { usePOS } from "@/contexts/POSContext";
import type { POSOrder } from "@/data/posData";
import { initialDepartments } from "@/data/departments";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [selectedPrinters, setSelectedPrinters] = useState<Record<string, string>>({});

  const enabledPrinters = printers.filter(p => p.enabled);
  const outletNum = parseInt((currentOutlet?.id || "").replace("outlet-", ""));
  const departments = initialDepartments.filter(d => d.outletId === outletNum);

  const getPrintersForDepartment = (departmentName: string) => {
    const dept = departments.find(d => d.name === departmentName);
    if (!dept) return enabledPrinters;
    return enabledPrinters.filter(p => p.assignedDepartments.includes(dept.id));
  };

  const handleSendToPrinter = (departmentName: string, printerId: string) => {
    const printer = enabledPrinters.find(p => p.id === printerId);
    if (!printer) return;
    console.log(`[Reprint] Sending ${departmentName} docket to "${printer.name}"`);
    toast.success(`Docket sent to ${printer.name}`, {
      description: `${departmentName} — Order ${order?.orderNumber}`,
      duration: 3000,
    });
  };

  const handleSendAllToPrinters = () => {
    if (!order) return;
    const docketGroups = groupItemsByDepartment(order.items, order.outletId);
    let sentCount = 0;

    for (const group of docketGroups) {
      const compatiblePrinters = getPrintersForDepartment(group.departmentName);
      if (compatiblePrinters.length > 0) {
        const targetId = selectedPrinters[group.departmentName] || compatiblePrinters[0].id;
        const printer = enabledPrinters.find(p => p.id === targetId);
        if (printer) {
          console.log(`[Reprint] Sending ${group.departmentName} docket to "${printer.name}"`);
          sentCount++;
        }
      }
    }

    if (sentCount > 0) {
      toast.success(`Dockets sent to ${sentCount} printer${sentCount > 1 ? "s" : ""}`, {
        description: `Order ${order.orderNumber} — auto-routed by department`,
        duration: 3000,
      });
    } else {
      toast.error("No printers configured for these departments");
    }
  };

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
            {onBack && (
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { onClose(); onBack(); }}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
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

                      {/* Send to printer selector */}
                      {enabledPrinters.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedPrinters[group.departmentName] || ""}
                            onValueChange={(val) => setSelectedPrinters(prev => ({ ...prev, [group.departmentName]: val }))}
                          >
                            <SelectTrigger className="h-7 text-xs flex-1">
                              <SelectValue placeholder="Select printer..." />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const compatible = getPrintersForDepartment(group.departmentName);
                                const others = enabledPrinters.filter(p => !compatible.find(c => c.id === p.id));
                                return (
                                  <>
                                    {compatible.length > 0 && (
                                      <>
                                        {compatible.map(p => (
                                          <SelectItem key={p.id} value={p.id} className="text-xs">
                                            <span className="flex items-center gap-1.5">
                                              <Printer className="w-3 h-3 text-[hsl(var(--success))]" />
                                              {p.name}
                                              <Badge variant="secondary" className="h-4 px-1 text-[9px]">assigned</Badge>
                                            </span>
                                          </SelectItem>
                                        ))}
                                      </>
                                    )}
                                    {others.length > 0 && (
                                      <>
                                        {others.map(p => (
                                          <SelectItem key={p.id} value={p.id} className="text-xs">
                                            <span className="flex items-center gap-1.5">
                                              <Printer className="w-3 h-3 text-muted-foreground" />
                                              {p.name}
                                            </span>
                                          </SelectItem>
                                        ))}
                                      </>
                                    )}
                                  </>
                                );
                              })()}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 px-2 gap-1 text-xs shrink-0"
                            disabled={!selectedPrinters[group.departmentName]}
                            onClick={() => handleSendToPrinter(group.departmentName, selectedPrinters[group.departmentName])}
                          >
                            <Send className="w-3 h-3" /> Send
                          </Button>
                        </div>
                      )}

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
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePrint(docketRef, `Docket-${order.orderNumber}`)}
                  className="flex-1 gap-2"
                >
                  <Printer className="w-4 h-4" /> Print All
                </Button>
                {enabledPrinters.length > 0 && (
                  <Button
                    variant="secondary"
                    onClick={handleSendAllToPrinters}
                    className="flex-1 gap-2"
                  >
                    <Send className="w-4 h-4" /> Send All to Printers
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                {enabledPrinters.length > 0
                  ? "Print via browser or send directly to configured printers"
                  : "Each department docket prints on a separate page"}
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
