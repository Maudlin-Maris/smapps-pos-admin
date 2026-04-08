import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wifi, Usb, Bluetooth, Search, Loader2, CheckCircle2,
  Printer, Radio, ArrowLeft, RefreshCw, AlertCircle, Signal
} from "lucide-react";
import { toast } from "sonner";
import type { POSPrinter } from "./PrinterManagementDialog";

// Simulated discovered printers per connection type
const MOCK_NETWORK_PRINTERS = [
  { id: "net-1", name: "Epson TM-T88VI", ip: "192.168.1.101", port: 9100, model: "TM-T88VI", signal: 92 },
  { id: "net-2", name: "Star TSP143IV", ip: "192.168.1.115", port: 9100, model: "TSP143IV", signal: 87 },
  { id: "net-3", name: "Epson TM-m30II", ip: "192.168.1.203", port: 9100, model: "TM-m30II", signal: 74 },
];

const MOCK_USB_PRINTERS = [
  { id: "usb-1", name: "Star mC-Print3", port: 0, model: "mC-Print3", signal: 100 },
  { id: "usb-2", name: "Epson TM-T20III", port: 1, model: "TM-T20III", signal: 100 },
];

const MOCK_BT_PRINTERS = [
  { id: "bt-1", name: "Star SM-L200", model: "SM-L200", signal: 65 },
  { id: "bt-2", name: "Epson TM-P80II", model: "TM-P80II", signal: 48 },
];

interface DiscoveredPrinter {
  id: string;
  name: string;
  ip?: string;
  port?: number;
  model: string;
  signal: number;
}

type WizardStep = "connection" | "scanning" | "select" | "configure" | "installing" | "done";

const INSTALL_STEPS = [
  { label: "Connecting to printer", duration: 1200 },
  { label: "Verifying compatibility", duration: 800 },
  { label: "Installing printer driver", duration: 1800 },
  { label: "Configuring print settings", duration: 1000 },
  { label: "Sending test signal", duration: 900 },
  { label: "Finalizing setup", duration: 600 },
];

interface Props {
  outletId: string;
  departments: { id: string; name: string }[];
  onInstall: (printer: POSPrinter) => void;
  onCancel: () => void;
  editingPrinter?: POSPrinter | null;
}

export default function PrinterDiscoveryWizard({ outletId, departments, onInstall, onCancel, editingPrinter }: Props) {
  const isEditing = !!editingPrinter;

  // Wizard state
  const [step, setStep] = useState<WizardStep>(isEditing ? "configure" : "connection");
  const [connectionType, setConnectionType] = useState<POSPrinter["connectionType"]>(editingPrinter?.connectionType || "network");

  // Scanning state
  const [scanProgress, setScanProgress] = useState(0);
  const [discovered, setDiscovered] = useState<DiscoveredPrinter[]>([]);
  const [scanComplete, setScanComplete] = useState(false);

  // Selection state
  const [selectedDevice, setSelectedDevice] = useState<DiscoveredPrinter | null>(null);

  // Configure state
  const [printerName, setPrinterName] = useState(editingPrinter?.name || "");
  const [printerType, setPrinterType] = useState<POSPrinter["type"]>(editingPrinter?.type || "thermal");
  const [ipAddress, setIpAddress] = useState(editingPrinter?.ipAddress || "");
  const [port, setPort] = useState(String(editingPrinter?.port || 9100));
  const [selectedDepts, setSelectedDepts] = useState<string[]>(editingPrinter?.assignedDepartments || []);
  const [enabled, setEnabled] = useState(editingPrinter?.enabled ?? true);

  // Install progress state
  const [installStep, setInstallStep] = useState(0);
  const [installProgress, setInstallProgress] = useState(0);
  const [installError, setInstallError] = useState(false);

  // --- Scanning simulation ---
  const startScan = useCallback(() => {
    setScanProgress(0);
    setDiscovered([]);
    setScanComplete(false);

    const mockPrinters =
      connectionType === "network" ? MOCK_NETWORK_PRINTERS
        : connectionType === "usb" ? MOCK_USB_PRINTERS
          : MOCK_BT_PRINTERS;

    // Simulate progressive discovery
    let progress = 0;
    let foundIndex = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 12 + 3;
      if (progress > 100) progress = 100;
      setScanProgress(Math.round(progress));

      // Discover printers at certain progress thresholds
      if (foundIndex < mockPrinters.length && progress > (foundIndex + 1) * (80 / mockPrinters.length)) {
        setDiscovered(prev => [...prev, mockPrinters[foundIndex]]);
        foundIndex++;
      }

      if (progress >= 100) {
        clearInterval(interval);
        setScanComplete(true);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [connectionType]);

  useEffect(() => {
    if (step === "scanning") {
      const cleanup = startScan();
      return cleanup;
    }
  }, [step, startScan]);

  // --- Installation simulation ---
  useEffect(() => {
    if (step !== "installing") return;

    let currentStep = 0;
    let progress = 0;

    const runStep = () => {
      if (currentStep >= INSTALL_STEPS.length) {
        setStep("done");
        return;
      }

      setInstallStep(currentStep);
      const duration = INSTALL_STEPS[currentStep].duration;
      const tickInterval = 50;
      const increment = (100 / INSTALL_STEPS.length) / (duration / tickInterval);

      const ticker = setInterval(() => {
        progress += increment;
        setInstallProgress(Math.min(Math.round(progress), 100));
      }, tickInterval);

      setTimeout(() => {
        clearInterval(ticker);
        currentStep++;
        runStep();
      }, duration);
    };

    runStep();
  }, [step]);

  // --- Handlers ---
  const handleSelectConnection = (type: POSPrinter["connectionType"]) => {
    setConnectionType(type);
    setStep("scanning");
  };

  const handleSelectDevice = (device: DiscoveredPrinter) => {
    setSelectedDevice(device);
    setPrinterName(device.name);
    setIpAddress(device.ip || "");
    setPort(String(device.port || 9100));
    setStep("configure");
  };

  const handleManualEntry = () => {
    setSelectedDevice(null);
    setPrinterName("");
    setIpAddress("");
    setPort("9100");
    setStep("configure");
  };

  const handleStartInstall = () => {
    if (!printerName.trim()) {
      toast.error("Printer name is required");
      return;
    }
    if (connectionType === "network" && !ipAddress.trim()) {
      toast.error("IP address is required for network printers");
      return;
    }

    if (isEditing) {
      // Skip install animation for edits
      handleFinish();
      return;
    }

    setInstallStep(0);
    setInstallProgress(0);
    setInstallError(false);
    setStep("installing");
  };

  const handleFinish = () => {
    const printer: POSPrinter = {
      id: editingPrinter?.id || `printer-${Date.now()}`,
      name: printerName.trim(),
      type: printerType,
      connectionType,
      ipAddress: connectionType === "network" ? ipAddress.trim() || undefined : undefined,
      port: connectionType === "network" ? parseInt(port) || 9100 : undefined,
      assignedDepartments: selectedDepts,
      outletId,
      enabled,
    };
    onInstall(printer);
  };

  const toggleDept = (deptId: string) => {
    setSelectedDepts(prev =>
      prev.includes(deptId) ? prev.filter(d => d !== deptId) : [...prev, deptId]
    );
  };

  const connectionOptions = [
    { type: "network" as const, icon: Wifi, title: "Network (IP)", desc: "Discover printers on your local network" },
    { type: "usb" as const, icon: Usb, title: "USB", desc: "Find printers connected via USB cable" },
    { type: "bluetooth" as const, icon: Bluetooth, title: "Bluetooth", desc: "Pair with nearby Bluetooth printers" },
  ];

  // --- Step 1: Choose Connection Type ---
  if (step === "connection") {
    return (
      <div className="space-y-4">
        <div className="text-center pb-2">
          <p className="text-sm text-muted-foreground">How is your printer connected?</p>
        </div>
        <div className="space-y-2">
          {connectionOptions.map(opt => (
            <button
              key={opt.type}
              onClick={() => handleSelectConnection(opt.type)}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <opt.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <p className="font-medium text-sm">{opt.title}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <Button variant="outline" className="w-full" onClick={onCancel}>Cancel</Button>
      </div>
    );
  }

  // --- Step 2: Scanning ---
  if (step === "scanning") {
    const connectionLabel = connectionType === "network" ? "network" : connectionType === "usb" ? "USB ports" : "Bluetooth devices";
    return (
      <div className="space-y-4">
        <button onClick={() => setStep("connection")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        <div className="text-center space-y-3 py-2">
          {!scanComplete ? (
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Radio className="w-8 h-8 text-primary animate-pulse" />
            </div>
          ) : (
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
          )}
          <div>
            <p className="font-medium text-sm">
              {scanComplete ? "Scan complete" : `Scanning ${connectionLabel}…`}
            </p>
            <p className="text-xs text-muted-foreground">
              {scanComplete
                ? `Found ${discovered.length} printer${discovered.length !== 1 ? "s" : ""}`
                : "Looking for available printers…"}
            </p>
          </div>
          <Progress value={scanProgress} className="h-1.5" />
        </div>

        {/* Discovered printers list (appears progressively) */}
        {discovered.length > 0 && (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {discovered.map(device => (
              <button
                key={device.id}
                onClick={() => scanComplete && handleSelectDevice(device)}
                disabled={!scanComplete}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left disabled:opacity-70 disabled:cursor-wait group"
              >
                <Printer className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{device.name}</p>
                  <div className="flex items-center gap-2">
                    {device.ip && <span className="text-[10px] text-muted-foreground">{device.ip}</span>}
                    <span className="text-[10px] text-muted-foreground">{device.model}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Signal className={`w-3.5 h-3.5 ${device.signal > 70 ? "text-emerald-500" : device.signal > 40 ? "text-amber-500" : "text-red-400"}`} />
                  <span className="text-[10px] text-muted-foreground">{device.signal}%</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {scanComplete && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setStep("scanning"); }}>
              <RefreshCw className="w-3.5 h-3.5" /> Rescan
            </Button>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={handleManualEntry}>
              Enter manually
            </Button>
          </div>
        )}
      </div>
    );
  }

  // --- Step 3: Configure ---
  if (step === "configure") {
    return (
      <div className="space-y-4">
        {!isEditing && (
          <button onClick={() => setStep(selectedDevice ? "scanning" : "connection")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        )}

        {selectedDevice && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
            <Printer className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{selectedDevice.name}</p>
              <p className="text-[10px] text-muted-foreground">{selectedDevice.model}{selectedDevice.ip ? ` · ${selectedDevice.ip}` : ""}</p>
            </div>
            <Badge variant="secondary" className="text-[10px]">{connectionType}</Badge>
          </div>
        )}

        <div className="space-y-2">
          <Label>Printer Name</Label>
          <Input value={printerName} onChange={e => setPrinterName(e.target.value)} placeholder="e.g. Kitchen Printer" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Printer Type</Label>
            <Select value={printerType} onValueChange={v => setPrinterType(v as POSPrinter["type"])}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="thermal">Thermal (80mm)</SelectItem>
                <SelectItem value="label">Label</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isEditing && (
            <div className="space-y-2">
              <Label>Connection</Label>
              <div className="h-9 flex items-center px-3 rounded-md border border-input bg-muted/30 text-sm capitalize">
                {connectionType === "network" ? "Network (IP)" : connectionType}
              </div>
            </div>
          )}
          {isEditing && (
            <div className="space-y-2">
              <Label>Connection</Label>
              <Select value={connectionType} onValueChange={v => setConnectionType(v as POSPrinter["connectionType"])}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="network">Network (IP)</SelectItem>
                  <SelectItem value="usb">USB</SelectItem>
                  <SelectItem value="bluetooth">Bluetooth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {connectionType === "network" && (
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>IP Address</Label>
              <Input value={ipAddress} onChange={e => setIpAddress(e.target.value)} placeholder="192.168.1.100" />
            </div>
            <div className="space-y-2">
              <Label>Port</Label>
              <Input type="number" value={port} onChange={e => setPort(e.target.value)} placeholder="9100" />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Assigned Departments</Label>
          <p className="text-xs text-muted-foreground">Dockets route to this printer based on department</p>
          {departments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">No departments configured</p>
          ) : (
            <div className="space-y-1.5 max-h-32 overflow-y-auto border rounded-lg p-2 bg-muted/20">
              {departments.map(dept => (
                <label key={dept.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                  <Checkbox checked={selectedDepts.includes(dept.id)} onCheckedChange={() => toggleDept(dept.id)} />
                  <span className="text-sm">{dept.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={enabled} onCheckedChange={c => setEnabled(!!c)} />
          <span className="text-sm">Enable printer</span>
        </label>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button className="flex-1" onClick={handleStartInstall}>
            {isEditing ? "Update Printer" : "Install Printer"}
          </Button>
        </div>
      </div>
    );
  }

  // --- Step 4: Installing ---
  if (step === "installing") {
    const currentStepLabel = INSTALL_STEPS[installStep]?.label || "Finishing…";
    return (
      <div className="space-y-6 py-4">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div>
            <p className="font-medium text-sm">Installing {printerName}</p>
            <p className="text-xs text-muted-foreground mt-1">{currentStepLabel}…</p>
          </div>
        </div>

        <Progress value={installProgress} className="h-2" />

        <div className="space-y-1.5">
          {INSTALL_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 px-2">
              {i < installStep ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : i === installStep ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-border shrink-0" />
              )}
              <span className={`text-xs ${i < installStep ? "text-foreground" : i === installStep ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Step 5: Done ---
  if (step === "done") {
    return (
      <div className="space-y-5 py-4">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <p className="font-medium text-sm">Printer installed successfully</p>
            <p className="text-xs text-muted-foreground mt-1">{printerName} is ready to use</p>
          </div>
        </div>

        <div className="rounded-lg border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Name</span>
            <span className="text-sm font-medium">{printerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Type</span>
            <Badge variant="secondary" className="text-[10px]">{printerType}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Connection</span>
            <Badge variant="outline" className="text-[10px]">{connectionType}</Badge>
          </div>
          {connectionType === "network" && ipAddress && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Address</span>
              <span className="text-xs">{ipAddress}:{port}</span>
            </div>
          )}
          {selectedDepts.length > 0 && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground shrink-0">Departments</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {selectedDepts.map(id => {
                  const dept = departments.find(d => d.id === id);
                  return <Badge key={id} variant="default" className="text-[10px] h-5 font-normal">{dept?.name || id}</Badge>;
                })}
              </div>
            </div>
          )}
        </div>

        <Button className="w-full" onClick={handleFinish}>Done</Button>
      </div>
    );
  }

  return null;
}
