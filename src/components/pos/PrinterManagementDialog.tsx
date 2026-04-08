import { useState } from "react";
import { usePOS } from "@/contexts/POSContext";
import { initialDepartments } from "@/data/departments";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, Plus, Pencil, Trash2, Wifi, WifiOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export interface POSPrinter {
  id: string;
  name: string;
  type: "thermal" | "label" | "standard";
  connectionType: "usb" | "network" | "bluetooth";
  ipAddress?: string;
  port?: number;
  assignedDepartments: string[]; // department IDs
  outletId: string;
  enabled: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  printers: POSPrinter[];
  onPrintersChange: (printers: POSPrinter[]) => void;
}

type ViewMode = "list" | "form";

export default function PrinterManagementDialog({ open, onClose, printers, onPrintersChange }: Props) {
  const { currentOutlet } = usePOS();
  const [view, setView] = useState<ViewMode>("list");
  const [editingPrinter, setEditingPrinter] = useState<POSPrinter | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<POSPrinter["type"]>("thermal");
  const [connectionType, setConnectionType] = useState<POSPrinter["connectionType"]>("network");
  const [ipAddress, setIpAddress] = useState("");
  const [port, setPort] = useState("9100");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);

  const outletId = currentOutlet?.id || "";
  const outletNum = parseInt(outletId.replace("outlet-", ""));
  const departments = initialDepartments.filter((d) => d.outletId === outletNum);

  const resetForm = () => {
    setName("");
    setType("thermal");
    setConnectionType("network");
    setIpAddress("");
    setPort("9100");
    setSelectedDepts([]);
    setEnabled(true);
    setEditingPrinter(null);
  };

  const openAddForm = () => {
    resetForm();
    setView("form");
  };

  const openEditForm = (printer: POSPrinter) => {
    setEditingPrinter(printer);
    setName(printer.name);
    setType(printer.type);
    setConnectionType(printer.connectionType);
    setIpAddress(printer.ipAddress || "");
    setPort(String(printer.port || 9100));
    setSelectedDepts(printer.assignedDepartments);
    setEnabled(printer.enabled);
    setView("form");
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Printer name is required");
      return;
    }
    if (connectionType === "network" && !ipAddress.trim()) {
      toast.error("IP address is required for network printers");
      return;
    }

    if (editingPrinter) {
      const updated = printers.map((p) =>
        p.id === editingPrinter.id
          ? { ...p, name: name.trim(), type, connectionType, ipAddress: ipAddress.trim() || undefined, port: parseInt(port) || 9100, assignedDepartments: selectedDepts, enabled }
          : p
      );
      onPrintersChange(updated);
      toast.success(`Printer "${name}" updated`);
    } else {
      const newPrinter: POSPrinter = {
        id: `printer-${Date.now()}`,
        name: name.trim(),
        type,
        connectionType,
        ipAddress: ipAddress.trim() || undefined,
        port: parseInt(port) || 9100,
        assignedDepartments: selectedDepts,
        outletId,
        enabled,
      };
      onPrintersChange([...printers, newPrinter]);
      toast.success(`Printer "${name}" added`);
    }
    resetForm();
    setView("list");
  };

  const handleDelete = (printerId: string) => {
    onPrintersChange(printers.filter((p) => p.id !== printerId));
    toast.success("Printer removed");
  };

  const toggleEnabled = (printerId: string) => {
    onPrintersChange(
      printers.map((p) => (p.id === printerId ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleTestPrint = (printer: POSPrinter) => {
    toast.success(`Test page sent to "${printer.name}"`, {
      description: "Check the printer for output",
    });
  };

  const toggleDept = (deptId: string) => {
    setSelectedDepts((prev) =>
      prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId]
    );
  };

  const getDeptName = (deptId: string) => {
    return initialDepartments.find((d) => d.id === deptId)?.name || deptId;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            {view === "list" ? "Printer Management" : editingPrinter ? "Edit Printer" : "Add Printer"}
          </DialogTitle>
          <DialogDescription>
            {view === "list"
              ? "Manage printers and assign them to departments for automatic docket routing."
              : "Configure printer details and department assignments."}
          </DialogDescription>
        </DialogHeader>

        {view === "list" ? (
          <div className="space-y-3">
            {printers.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Printer className="w-10 h-10 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No printers installed</p>
                <p className="text-xs text-muted-foreground">Add a printer to enable automatic docket printing</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {printers.map((printer) => (
                  <div
                    key={printer.id}
                    className={`border rounded-lg p-3 space-y-2 transition-colors ${
                      printer.enabled ? "border-border" : "border-border/50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{printer.name}</span>
                          {printer.enabled ? (
                            <Wifi className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <WifiOff className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {printer.type}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] h-5">
                            {printer.connectionType}
                          </Badge>
                          {printer.ipAddress && (
                            <span className="text-[10px] text-muted-foreground">{printer.ipAddress}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleTestPrint(printer)} title="Test Print">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditForm(printer)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(printer.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {printer.assignedDepartments.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {printer.assignedDepartments.map((deptId) => (
                          <Badge key={deptId} variant="default" className="text-[10px] h-5 font-normal">
                            {getDeptName(deptId)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <button
                        onClick={() => toggleEnabled(printer.id)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {printer.enabled ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Enabled
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> Disabled
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button onClick={openAddForm} className="w-full gap-2">
              <Plus className="w-4 h-4" /> Add Printer
            </Button>
          </div>
        ) : (
          /* ===== ADD / EDIT FORM ===== */
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Printer Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kitchen Printer, Bar Printer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Printer Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as POSPrinter["type"])}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thermal">Thermal (80mm)</SelectItem>
                    <SelectItem value="label">Label</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Connection</Label>
                <Select value={connectionType} onValueChange={(v) => setConnectionType(v as POSPrinter["connectionType"])}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="network">Network (IP)</SelectItem>
                    <SelectItem value="usb">USB</SelectItem>
                    <SelectItem value="bluetooth">Bluetooth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {connectionType === "network" && (
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>IP Address</Label>
                  <Input
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="192.168.1.100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="9100"
                  />
                </div>
              </div>
            )}

            {/* Department assignments */}
            <div className="space-y-2">
              <Label>Assigned Departments</Label>
              <p className="text-xs text-muted-foreground">
                Dockets for items in these departments will automatically print to this printer
              </p>
              {departments.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  No departments configured for this outlet
                </p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto border rounded-lg p-2 bg-muted/20">
                  {departments.map((dept) => (
                    <label
                      key={dept.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedDepts.includes(dept.id)}
                        onCheckedChange={() => toggleDept(dept.id)}
                      />
                      <span className="text-sm">{dept.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Enable toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={enabled}
                onCheckedChange={(c) => setEnabled(!!c)}
              />
              <span className="text-sm">Enable printer</span>
            </label>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { resetForm(); setView("list"); }}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                {editingPrinter ? "Update Printer" : "Add Printer"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
