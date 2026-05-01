import { useState } from "react";
import { usePOS } from "@/contexts/POSContext";
import { initialDepartments } from "@/data/departments";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Plus, Pencil, Trash2, Wifi, WifiOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import PrinterDiscoveryWizard from "./PrinterDiscoveryWizard";

export interface POSPrinter {
  id: string;
  name: string;
  type: "thermal" | "label" | "standard";
  connectionType: "usb" | "network" | "bluetooth";
  ipAddress?: string;
  port?: number;
  assignedDepartments: string[];
  outletId: string;
  enabled: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  printers: POSPrinter[];
  onPrintersChange: (printers: POSPrinter[]) => void;
}

type ViewMode = "list" | "wizard";

export default function PrinterManagementDialog({ open, onClose, printers, onPrintersChange }: Props) {
  const { currentOutlet } = usePOS();
  const [view, setView] = useState<ViewMode>("list");
  const [editingPrinter, setEditingPrinter] = useState<POSPrinter | null>(null);

  const outletId = currentOutlet?.id || "";
  const outletNum = parseInt(outletId.replace("outlet-", ""));
  const departments = initialDepartments.filter((d) => d.outletId === outletNum);

  const openAddWizard = () => { setEditingPrinter(null); setView("wizard"); };
  const openEditWizard = (printer: POSPrinter) => { setEditingPrinter(printer); setView("wizard"); };

  const handleInstall = (printer: POSPrinter) => {
    if (editingPrinter) {
      onPrintersChange(printers.map(p => p.id === editingPrinter.id ? printer : p));
      toast.success(`Printer "${printer.name}" updated`);
    } else {
      onPrintersChange([...printers, printer]);
      toast.success(`Printer "${printer.name}" installed`);
    }
    setEditingPrinter(null);
    setView("list");
  };

  const handleDelete = (printerId: string) => { onPrintersChange(printers.filter((p) => p.id !== printerId)); toast.success("Printer removed"); };
  const toggleEnabled = (printerId: string) => { onPrintersChange(printers.map((p) => (p.id === printerId ? { ...p, enabled: !p.enabled } : p))); };
  const handleTestPrint = (printer: POSPrinter) => { toast.success(`Test page sent to "${printer.name}"`, { description: "Check the printer for output" }); };
  const getDeptName = (deptId: string) => initialDepartments.find((d) => d.id === deptId)?.name || deptId;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { setView("list"); setEditingPrinter(null); onClose(); } }}>
      <SheetContent side="right" className="!w-full !max-w-none lg:!max-w-md p-0 flex flex-col overflow-hidden [&>button]:z-10">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            {view === "list" ? "Printer Management" : editingPrinter ? "Edit Printer" : "Add Printer"}
          </SheetTitle>
          <SheetDescription>
            {view === "list" ? "Manage printers and assign them to departments for automatic docket routing." : editingPrinter ? "Update printer configuration." : "Search for and install a printer."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {view === "list" ? (
            <div className="space-y-3">
              {printers.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Printer className="w-10 h-10 mx-auto text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No printers installed</p>
                  <p className="text-xs text-muted-foreground">Add a printer to enable automatic docket printing</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {printers.map((printer) => (
                    <div key={printer.id} className={`border rounded-lg p-3 space-y-2 transition-colors ${printer.enabled ? "border-border" : "border-border/50 opacity-60"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{printer.name}</span>
                            {printer.enabled ? <Wifi className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <WifiOff className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[10px] h-5">{printer.type}</Badge>
                            <Badge variant="outline" className="text-[10px] h-5">{printer.connectionType}</Badge>
                            {printer.ipAddress && <span className="text-[10px] text-muted-foreground">{printer.ipAddress}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleTestPrint(printer)} title="Test Print"><CheckCircle2 className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditWizard(printer)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(printer.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                      {printer.assignedDepartments.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {printer.assignedDepartments.map((deptId) => (
                            <Badge key={deptId} variant="default" className="text-[10px] h-5 font-normal">{getDeptName(deptId)}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t border-border/50">
                        <button onClick={() => toggleEnabled(printer.id)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          {printer.enabled ? (<><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Enabled</>) : (<><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> Disabled</>)}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={openAddWizard} className="w-full gap-2"><Plus className="w-4 h-4" /> Add Printer</Button>
            </div>
          ) : (
            <PrinterDiscoveryWizard outletId={outletId} departments={departments} onInstall={handleInstall} onCancel={() => { setEditingPrinter(null); setView("list"); }} editingPrinter={editingPrinter} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
