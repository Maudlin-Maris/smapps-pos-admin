import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { outlets } from "@/data/outlets";
import {
  ArrowLeftRight, ClipboardList, Search, Plus, Package, BarChart3,
  AlertTriangle, CheckCircle2, Clock, Hash, MapPin,
} from "lucide-react";
import { format } from "date-fns";

// ── Types ──
interface StockTransfer {
  id: string;
  fromOutletId: string;
  toOutletId: string;
  items: { itemName: string; sku: string; quantity: number }[];
  status: "pending" | "in_transit" | "received" | "cancelled";
  notes: string;
  createdAt: Date;
  receivedAt: Date | null;
}

interface CycleCount {
  id: string;
  outletId: string;
  status: "scheduled" | "in_progress" | "completed";
  itemsCount: number;
  discrepancies: number;
  scheduledDate: Date;
  completedDate: Date | null;
  countedBy: string;
}

interface SerializedItem {
  id: string;
  itemName: string;
  serialNumber: string;
  sku: string;
  outletId: string;
  status: "in_stock" | "sold" | "returned" | "damaged";
  purchaseDate: Date;
  warrantyExpiry: Date | null;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

// ── Defaults ──
const defaultTransfers: StockTransfer[] = [
  { id: "t1", fromOutletId: "outlet-1", toOutletId: "outlet-2", items: [{ itemName: "Coffee Beans", sku: "CB-001", quantity: 10 }, { itemName: "Sugar", sku: "SG-001", quantity: 5 }], status: "received", notes: "Weekly transfer", createdAt: new Date("2024-06-10"), receivedAt: new Date("2024-06-11") },
  { id: "t2", fromOutletId: "outlet-2", toOutletId: "outlet-3", items: [{ itemName: "Paper Cups", sku: "PC-012", quantity: 200 }], status: "in_transit", notes: "Urgent supply", createdAt: new Date("2024-06-13"), receivedAt: null },
  { id: "t3", fromOutletId: "outlet-1", toOutletId: "outlet-4", items: [{ itemName: "Napkins", sku: "NP-001", quantity: 100 }], status: "pending", notes: "", createdAt: new Date("2024-06-14"), receivedAt: null },
];

const defaultCycleCounts: CycleCount[] = [
  { id: "cc1", outletId: "outlet-1", status: "completed", itemsCount: 45, discrepancies: 3, scheduledDate: new Date("2024-06-01"), completedDate: new Date("2024-06-01"), countedBy: "Manager A" },
  { id: "cc2", outletId: "outlet-2", status: "in_progress", itemsCount: 32, discrepancies: 0, scheduledDate: new Date("2024-06-14"), completedDate: null, countedBy: "Manager B" },
  { id: "cc3", outletId: "outlet-3", status: "scheduled", itemsCount: 28, discrepancies: 0, scheduledDate: new Date("2024-06-20"), completedDate: null, countedBy: "" },
];

const defaultSerials: SerializedItem[] = [
  { id: "sr1", itemName: "iPhone 15 Pro", serialNumber: "SN-IP15P-001", sku: "IP15P", outletId: "outlet-2", status: "in_stock", purchaseDate: new Date("2024-05-01"), warrantyExpiry: new Date("2025-05-01") },
  { id: "sr2", itemName: "Samsung Galaxy S24", serialNumber: "SN-SGS24-001", sku: "SGS24", outletId: "outlet-2", status: "sold", purchaseDate: new Date("2024-04-15"), warrantyExpiry: new Date("2025-04-15") },
  { id: "sr3", itemName: "MacBook Air M3", serialNumber: "SN-MBA3-001", sku: "MBAM3", outletId: "outlet-2", status: "in_stock", purchaseDate: new Date("2024-06-01"), warrantyExpiry: new Date("2025-06-01") },
  { id: "sr4", itemName: "Hair Dryer Pro", serialNumber: "SN-HDP-001", sku: "HDP01", outletId: "outlet-3", status: "damaged", purchaseDate: new Date("2024-03-01"), warrantyExpiry: new Date("2025-03-01") },
];

const transferStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-muted text-muted-foreground", icon: Clock },
  in_transit: { label: "In Transit", color: "bg-info/15 text-info", icon: ArrowLeftRight },
  received: { label: "Received", color: "bg-success/15 text-success", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-destructive/15 text-destructive", icon: AlertTriangle },
};

const serialStatusConfig: Record<string, { color: string }> = {
  in_stock: { color: "bg-success/15 text-success" },
  sold: { color: "bg-accent/15 text-accent" },
  returned: { color: "bg-warning/15 text-warning" },
  damaged: { color: "bg-destructive/15 text-destructive" },
};

type Tab = "transfers" | "cycle_counts" | "serialized" | "valuation";

// ── Transfer Form ──
function TransferFormDialog({
  open, onOpenChange, onCreate,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; onCreate: (t: StockTransfer) => void;
}) {
  const [fromOutlet, setFromOutlet] = useState("");
  const [toOutlet, setToOutlet] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ itemName: "", sku: "", quantity: 1 }]);

  const addItem = () => setItems((prev) => [...prev, { itemName: "", sku: "", quantity: 1 }]);

  const handleCreate = () => {
    if (!fromOutlet || !toOutlet) { toast.error("Select both outlets"); return; }
    if (fromOutlet === toOutlet) { toast.error("Cannot transfer to same outlet"); return; }
    const valid = items.filter((i) => i.itemName.trim());
    if (!valid.length) { toast.error("Add at least one item"); return; }
    onCreate({
      id: crypto.randomUUID(), fromOutletId: fromOutlet, toOutletId: toOutlet,
      items: valid, status: "pending", notes: notes.trim(),
      createdAt: new Date(), receivedAt: null,
    });
    onOpenChange(false);
    toast.success("Transfer created");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create Stock Transfer</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>From Outlet *</Label>
              <Select value={fromOutlet} onValueChange={setFromOutlet}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Outlet *</Label>
              <Select value={toOutlet} onValueChange={setToOutlet}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Items</Label>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addItem}><Plus className="h-3 w-3 mr-1" />Add</Button>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-5 gap-1.5 mb-1.5">
                <Input className="col-span-2 h-8 text-xs" placeholder="Item name" value={item.itemName} onChange={(e) => { const n = [...items]; n[idx].itemName = e.target.value; setItems(n); }} />
                <Input className="h-8 text-xs" placeholder="SKU" value={item.sku} onChange={(e) => { const n = [...items]; n[idx].sku = e.target.value; setItems(n); }} />
                <Input className="h-8 text-xs" type="number" min={1} value={item.quantity} onChange={(e) => { const n = [...items]; n[idx].quantity = parseInt(e.target.value) || 1; setItems(n); }} />
                {items.length > 1 && <Button variant="ghost" size="sm" className="h-8 text-destructive" onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}>×</Button>}
              </div>
            ))}
          </div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create Transfer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdvancedInventory() {
  const [tab, setTab] = useState<Tab>("transfers");
  const [transfers, setTransfers] = useState(defaultTransfers);
  const [cycleCounts] = useState(defaultCycleCounts);
  const [serials] = useState(defaultSerials);
  const [search, setSearch] = useState("");
  const [transferFormOpen, setTransferFormOpen] = useState(false);

  // Valuation data
  const valuationData = useMemo(() => {
    const byOutlet = outlets.map((o) => ({
      outlet: o.name,
      items: Math.floor(Math.random() * 200 + 50),
      value: Math.floor(Math.random() * 5000000 + 500000),
      costValue: Math.floor(Math.random() * 3000000 + 300000),
    }));
    return byOutlet;
  }, []);

  const totalValue = valuationData.reduce((s, v) => s + v.value, 0);

  const tabs: { key: Tab; label: string }[] = [
    { key: "transfers", label: `Transfers (${transfers.length})` },
    { key: "cycle_counts", label: `Cycle Counts (${cycleCounts.length})` },
    { key: "serialized", label: `Serialized (${serials.length})` },
    { key: "valuation", label: "Valuation" },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Advanced Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Transfers, cycle counts, serialized tracking & valuation</p>
        </div>
        <div className="flex gap-2">
          {tab === "transfers" && <Button className="gap-1.5" onClick={() => setTransferFormOpen(true)}><ArrowLeftRight className="h-4 w-4" /> New Transfer</Button>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center"><ArrowLeftRight className="h-5 w-5 text-accent" /></div>
            <div><p className="text-xs text-muted-foreground">Active Transfers</p><p className="text-2xl font-heading font-bold">{transfers.filter((t) => t.status === "pending" || t.status === "in_transit").length}</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><ClipboardList className="h-5 w-5 text-warning" /></div>
            <div><p className="text-xs text-muted-foreground">Pending Counts</p><p className="text-2xl font-heading font-bold">{cycleCounts.filter((c) => c.status !== "completed").length}</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center"><Hash className="h-5 w-5 text-info" /></div>
            <div><p className="text-xs text-muted-foreground">Serialized Items</p><p className="text-2xl font-heading font-bold">{serials.filter((s) => s.status === "in_stock").length}</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-success" /></div>
            <div><p className="text-xs text-muted-foreground">Total Valuation</p><p className="text-xl font-heading font-bold">{fmt(totalValue)}</p></div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap", tab === t.key ? "bg-card shadow-sm" : "text-muted-foreground")}>{t.label}</button>
        ))}
      </div>

      {/* Transfers */}
      {tab === "transfers" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">From</th>
                  <th className="text-left p-3 font-medium">To</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Items</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => {
                  const sc = transferStatusConfig[t.status];
                  const Icon = sc.icon;
                  return (
                    <tr key={t.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-medium">{outlets.find((o) => o.id === t.fromOutletId)?.name ?? t.fromOutletId}</td>
                      <td className="p-3">{outlets.find((o) => o.id === t.toOutletId)?.name ?? t.toOutletId}</td>
                      <td className="p-3"><Badge variant="secondary" className={cn("text-xs gap-1", sc.color)}><Icon className="h-3 w-3" />{sc.label}</Badge></td>
                      <td className="p-3 text-right">{t.items.reduce((s, i) => s + i.quantity, 0)}</td>
                      <td className="p-3 text-muted-foreground">{format(t.createdAt, "MMM d, yyyy")}</td>
                      <td className="p-3 text-muted-foreground text-xs">{t.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Cycle Counts */}
      {tab === "cycle_counts" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cycleCounts.map((cc) => {
            const outlet = outlets.find((o) => o.id === cc.outletId);
            return (
              <Card key={cc.id} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{outlet?.name}</span>
                  </div>
                  <Badge variant="secondary" className={cn("text-xs",
                    cc.status === "completed" ? "bg-success/15 text-success" :
                    cc.status === "in_progress" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"
                  )}>{cc.status.replace("_", " ")}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Items to Count</span><span className="font-medium">{cc.itemsCount}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Discrepancies</span><span className={cn("font-medium", cc.discrepancies > 0 && "text-warning")}>{cc.discrepancies}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Scheduled</span><span>{format(cc.scheduledDate, "MMM d, yyyy")}</span></div>
                  {cc.countedBy && <div className="flex justify-between"><span className="text-muted-foreground">Counted By</span><span>{cc.countedBy}</span></div>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Serialized Items */}
      {tab === "serialized" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Item</th>
                  <th className="text-left p-3 font-medium">Serial Number</th>
                  <th className="text-left p-3 font-medium">Location</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Warranty</th>
                </tr>
              </thead>
              <tbody>
                {serials.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div className="font-medium">{s.itemName}</div>
                      <div className="text-xs text-muted-foreground">{s.sku}</div>
                    </td>
                    <td className="p-3 font-mono text-xs">{s.serialNumber}</td>
                    <td className="p-3 text-muted-foreground">{outlets.find((o) => o.id === s.outletId)?.name}</td>
                    <td className="p-3"><Badge variant="secondary" className={cn("text-xs", serialStatusConfig[s.status]?.color)}>{s.status.replace("_", " ")}</Badge></td>
                    <td className="p-3 text-muted-foreground">{s.warrantyExpiry ? format(s.warrantyExpiry, "MMM d, yyyy") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Valuation */}
      {tab === "valuation" && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Outlet</th>
                    <th className="text-right p-3 font-medium">Items</th>
                    <th className="text-right p-3 font-medium">Retail Value</th>
                    <th className="text-right p-3 font-medium">Cost Value</th>
                    <th className="text-right p-3 font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {valuationData.map((v) => {
                    const margin = v.value > 0 ? ((v.value - v.costValue) / v.value * 100) : 0;
                    return (
                      <tr key={v.outlet} className="border-b hover:bg-muted/30">
                        <td className="p-3 font-medium">{v.outlet}</td>
                        <td className="p-3 text-right">{v.items}</td>
                        <td className="p-3 text-right">{fmt(v.value)}</td>
                        <td className="p-3 text-right">{fmt(v.costValue)}</td>
                        <td className="p-3 text-right"><Badge variant="secondary" className="text-xs bg-success/15 text-success">{margin.toFixed(1)}%</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t bg-muted/30">
                  <tr>
                    <td className="p-3 font-bold">Total</td>
                    <td className="p-3 text-right font-bold">{valuationData.reduce((s, v) => s + v.items, 0)}</td>
                    <td className="p-3 text-right font-bold">{fmt(totalValue)}</td>
                    <td className="p-3 text-right font-bold">{fmt(valuationData.reduce((s, v) => s + v.costValue, 0))}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      )}

      <TransferFormDialog open={transferFormOpen} onOpenChange={setTransferFormOpen} onCreate={(t) => setTransfers((prev) => [t, ...prev])} />
    </div>
  );
}
