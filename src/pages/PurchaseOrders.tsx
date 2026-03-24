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
  Plus, Search, Truck, Package, CheckCircle2, Clock, AlertTriangle,
  FileText, Send, Eye, MoreHorizontal, Building2, Filter,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

// ── Types ──
interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: Date;
}

interface POLineItem {
  id: string;
  itemName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  receivedQty: number;
}

type POStatus = "draft" | "sent" | "partial" | "received" | "cancelled";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  outletId: string;
  status: POStatus;
  items: POLineItem[];
  notes: string;
  createdAt: Date;
  expectedDate: Date | null;
  receivedAt: Date | null;
}

// ── Defaults ──
const defaultSuppliers: Supplier[] = [
  { id: "s1", name: "BestFoods Wholesale", contactPerson: "John Adebayo", email: "john@bestfoods.ng", phone: "+234 801 234 5678", address: "12 Marina Rd, Lagos", notes: "Premium food distributor", createdAt: new Date("2024-01-15") },
  { id: "s2", name: "MedPharma Distributors", contactPerson: "Fatima Ibrahim", email: "fatima@medpharma.ng", phone: "+234 802 345 6789", address: "45 Herbert Macaulay, Yaba", notes: "Licensed pharmaceutical supplier", createdAt: new Date("2024-02-20") },
  { id: "s3", name: "GlowBeauty Supply", contactPerson: "Chioma Eze", email: "chioma@glowbeauty.ng", phone: "+234 803 456 7890", address: "8 Allen Ave, Ikeja", notes: "Hair and beauty products", createdAt: new Date("2024-03-10") },
  { id: "s4", name: "TechWorld Imports", contactPerson: "Ahmed Bello", email: "ahmed@techworld.ng", phone: "+234 804 567 8901", address: "22 Computer Village, Ikeja", notes: "Electronics and accessories", createdAt: new Date("2024-04-05") },
];

const defaultPOs: PurchaseOrder[] = [
  {
    id: "po1", poNumber: "PO-2024-001", supplierId: "s1", outletId: "outlet-1", status: "received",
    items: [
      { id: "li1", itemName: "Coffee Beans (Arabica)", sku: "CB-001", quantity: 50, unitCost: 12.5, receivedQty: 50 },
      { id: "li2", itemName: "Whole Milk", sku: "ML-001", quantity: 30, unitCost: 1.2, receivedQty: 30 },
    ],
    notes: "Monthly restock", createdAt: new Date("2024-06-01"), expectedDate: new Date("2024-06-05"), receivedAt: new Date("2024-06-04"),
  },
  {
    id: "po2", poNumber: "PO-2024-002", supplierId: "s2", outletId: "outlet-4", status: "sent",
    items: [
      { id: "li3", itemName: "Paracetamol 500mg", sku: "PM-500", quantity: 200, unitCost: 0.15, receivedQty: 0 },
      { id: "li4", itemName: "Vitamin C Tablets", sku: "VC-100", quantity: 100, unitCost: 0.25, receivedQty: 0 },
    ],
    notes: "Urgent replenishment", createdAt: new Date("2024-06-10"), expectedDate: new Date("2024-06-15"), receivedAt: null,
  },
  {
    id: "po3", poNumber: "PO-2024-003", supplierId: "s1", outletId: "outlet-2", status: "partial",
    items: [
      { id: "li5", itemName: "Croissant Dough", sku: "CD-001", quantity: 20, unitCost: 3.0, receivedQty: 12 },
      { id: "li6", itemName: "Sugar", sku: "SG-001", quantity: 40, unitCost: 0.8, receivedQty: 40 },
    ],
    notes: "Partial delivery received", createdAt: new Date("2024-06-12"), expectedDate: new Date("2024-06-16"), receivedAt: null,
  },
  {
    id: "po4", poNumber: "PO-2024-004", supplierId: "s3", outletId: "outlet-3", status: "draft",
    items: [
      { id: "li7", itemName: "Shampoo (Professional)", sku: "SH-001", quantity: 10, unitCost: 8.0, receivedQty: 0 },
    ],
    notes: "", createdAt: new Date("2024-06-14"), expectedDate: null, receivedAt: null,
  },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

const statusConfig: Record<POStatus, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: FileText },
  sent: { label: "Sent", color: "bg-info/15 text-info", icon: Send },
  partial: { label: "Partial", color: "bg-warning/15 text-warning", icon: Clock },
  received: { label: "Received", color: "bg-success/15 text-success", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-destructive/15 text-destructive", icon: AlertTriangle },
};

type Tab = "orders" | "suppliers";

// ── Supplier Form Dialog ──
function SupplierFormDialog({
  open, onOpenChange, supplier, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  supplier: Supplier | null;
  onSave: (s: Supplier) => void;
}) {
  const [name, setName] = useState(supplier?.name ?? "");
  const [contactPerson, setContactPerson] = useState(supplier?.contactPerson ?? "");
  const [email, setEmail] = useState(supplier?.email ?? "");
  const [phone, setPhone] = useState(supplier?.phone ?? "");
  const [address, setAddress] = useState(supplier?.address ?? "");
  const [notes, setNotes] = useState(supplier?.notes ?? "");

  const handleSave = () => {
    if (!name.trim()) { toast.error("Supplier name is required"); return; }
    onSave({
      id: supplier?.id ?? crypto.randomUUID(),
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim(),
      createdAt: supplier?.createdAt ?? new Date(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Supplier Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ABC Distributors" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Contact Person</Label><Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{supplier ? "Update" : "Add Supplier"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── PO Detail Dialog ──
function PODetailDialog({
  open, onOpenChange, po, suppliers, onReceive, onSend,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  po: PurchaseOrder | null;
  suppliers: Supplier[];
  onReceive: (poId: string, itemId: string, qty: number) => void;
  onSend: (poId: string) => void;
}) {
  if (!po) return null;
  const supplier = suppliers.find((s) => s.id === po.supplierId);
  const total = po.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const receivedTotal = po.items.reduce((s, i) => s + i.receivedQty * i.unitCost, 0);
  const sc = statusConfig[po.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {po.poNumber}
            <Badge variant="secondary" className={cn("text-xs", sc.color)}>{sc.label}</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><span className="text-muted-foreground">Supplier:</span> <span className="font-medium">{supplier?.name ?? "Unknown"}</span></div>
            <div><span className="text-muted-foreground">Created:</span> {format(po.createdAt, "MMM d, yyyy")}</div>
            <div><span className="text-muted-foreground">Expected:</span> {po.expectedDate ? format(po.expectedDate, "MMM d, yyyy") : "—"}</div>
            <div><span className="text-muted-foreground">Total:</span> <span className="font-medium">{fmt(total)}</span></div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Item</th>
                  <th className="text-right p-2 font-medium">Ordered</th>
                  <th className="text-right p-2 font-medium">Received</th>
                  <th className="text-right p-2 font-medium">Cost</th>
                  {(po.status === "sent" || po.status === "partial") && <th className="p-2 w-20"></th>}
                </tr>
              </thead>
              <tbody>
                {po.items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">
                      <div className="font-medium">{item.itemName}</div>
                      <div className="text-xs text-muted-foreground">{item.sku}</div>
                    </td>
                    <td className="text-right p-2">{item.quantity}</td>
                    <td className="text-right p-2">
                      <span className={cn(item.receivedQty < item.quantity && "text-warning")}>{item.receivedQty}</span>
                    </td>
                    <td className="text-right p-2">{fmt(item.quantity * item.unitCost)}</td>
                    {(po.status === "sent" || po.status === "partial") && (
                      <td className="p-2 text-right">
                        {item.receivedQty < item.quantity && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => onReceive(po.id, item.id, item.quantity - item.receivedQty)}
                          >
                            Receive
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t bg-muted/30">
                <tr>
                  <td className="p-2 font-medium">Total</td>
                  <td className="text-right p-2 font-medium">{po.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className="text-right p-2 font-medium">{po.items.reduce((s, i) => s + i.receivedQty, 0)}</td>
                  <td className="text-right p-2 font-medium">{fmt(total)}</td>
                  {(po.status === "sent" || po.status === "partial") && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>

          {po.notes && <p className="text-sm text-muted-foreground">Notes: {po.notes}</p>}
        </div>
        <DialogFooter>
          {po.status === "draft" && (
            <Button onClick={() => { onSend(po.id); onOpenChange(false); }} className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> Send to Supplier
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Create PO Dialog ──
function CreatePODialog({
  open, onOpenChange, suppliers, onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  suppliers: Supplier[];
  onCreate: (po: PurchaseOrder) => void;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [outletId, setOutletId] = useState(outlets[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<POLineItem[]>([
    { id: crypto.randomUUID(), itemName: "", sku: "", quantity: 1, unitCost: 0, receivedQty: 0 },
  ]);

  const addLine = () => setLineItems((prev) => [...prev, { id: crypto.randomUUID(), itemName: "", sku: "", quantity: 1, unitCost: 0, receivedQty: 0 }]);
  const updateLine = (id: string, field: keyof POLineItem, value: string | number) => {
    setLineItems((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l));
  };
  const removeLine = (id: string) => setLineItems((prev) => prev.filter((l) => l.id !== id));

  const total = lineItems.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  const handleCreate = () => {
    if (!supplierId) { toast.error("Select a supplier"); return; }
    const validItems = lineItems.filter((l) => l.itemName.trim());
    if (validItems.length === 0) { toast.error("Add at least one item"); return; }
    const poNum = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900 + 100))}`;
    onCreate({
      id: crypto.randomUUID(),
      poNumber: poNum,
      supplierId,
      outletId,
      status: "draft",
      items: validItems,
      notes: notes.trim(),
      createdAt: new Date(),
      expectedDate: null,
      receivedAt: null,
    });
    onOpenChange(false);
    toast.success(`Purchase order ${poNum} created`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Destination Outlet</Label>
              <Select value={outletId} onValueChange={setOutletId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Line Items</Label>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={addLine}>
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-1.5 items-end">
                  <div className="col-span-4">
                    {idx === 0 && <Label className="text-xs">Item Name</Label>}
                    <Input className="h-8 text-xs" value={item.itemName} onChange={(e) => updateLine(item.id, "itemName", e.target.value)} placeholder="Item name" />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <Label className="text-xs">SKU</Label>}
                    <Input className="h-8 text-xs" value={item.sku} onChange={(e) => updateLine(item.id, "sku", e.target.value)} placeholder="SKU" />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <Label className="text-xs">Qty</Label>}
                    <Input className="h-8 text-xs" type="number" min={1} value={item.quantity} onChange={(e) => updateLine(item.id, "quantity", parseInt(e.target.value) || 1)} />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <Label className="text-xs">Unit Cost</Label>}
                    <Input className="h-8 text-xs" type="number" min={0} step={0.01} value={item.unitCost} onChange={(e) => updateLine(item.id, "unitCost", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="col-span-2 flex items-center gap-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{fmt(item.quantity * item.unitCost)}</span>
                    {lineItems.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeLine(item.id)}>×</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-2 text-sm font-medium">Total: {fmt(total)}</div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional notes..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create PO</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──
export default function PurchaseOrders() {
  const [tab, setTab] = useState<Tab>("orders");
  const [suppliers, setSuppliers] = useState<Supplier[]>(defaultSuppliers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(defaultPOs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOutlet, setSelectedOutlet] = useState("all");

  // Dialogs
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [createPOOpen, setCreatePOOpen] = useState(false);
  const [viewPO, setViewPO] = useState<PurchaseOrder | null>(null);

  const filteredPOs = useMemo(() => {
    let list = purchaseOrders;
    if (selectedOutlet !== "all") list = list.filter((p) => p.outletId === selectedOutlet);
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.poNumber.toLowerCase().includes(q) ||
        suppliers.find((s) => s.id === p.supplierId)?.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [purchaseOrders, selectedOutlet, statusFilter, search, suppliers]);

  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.contactPerson.toLowerCase().includes(q));
  }, [suppliers, search]);

  const handleSaveSupplier = (s: Supplier) => {
    setSuppliers((prev) => {
      const idx = prev.findIndex((x) => x.id === s.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = s; return n; }
      return [...prev, s];
    });
    toast.success(editSupplier ? "Supplier updated" : "Supplier added");
    setEditSupplier(null);
  };

  const handleReceive = (poId: string, itemId: string, qty: number) => {
    setPurchaseOrders((prev) => prev.map((po) => {
      if (po.id !== poId) return po;
      const items = po.items.map((i) => i.id === itemId ? { ...i, receivedQty: i.receivedQty + qty } : i);
      const allReceived = items.every((i) => i.receivedQty >= i.quantity);
      const someReceived = items.some((i) => i.receivedQty > 0);
      return { ...po, items, status: allReceived ? "received" : someReceived ? "partial" : po.status, receivedAt: allReceived ? new Date() : null };
    }));
    toast.success("Items received and stock updated");
  };

  const handleSend = (poId: string) => {
    setPurchaseOrders((prev) => prev.map((po) => po.id === poId ? { ...po, status: "sent" as POStatus } : po));
    toast.success("Purchase order sent to supplier");
  };

  const handleCreatePO = (po: PurchaseOrder) => {
    setPurchaseOrders((prev) => [po, ...prev]);
  };

  const poStats = useMemo(() => ({
    total: purchaseOrders.length,
    draft: purchaseOrders.filter((p) => p.status === "draft").length,
    pending: purchaseOrders.filter((p) => p.status === "sent" || p.status === "partial").length,
    totalValue: purchaseOrders.reduce((s, p) => s + p.items.reduce((t, i) => t + i.quantity * i.unitCost, 0), 0),
  }), [purchaseOrders]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "orders", label: `Purchase Orders (${purchaseOrders.length})` },
    { key: "suppliers", label: `Suppliers (${suppliers.length})` },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage suppliers and purchase orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5" onClick={() => { setEditSupplier(null); setSupplierDialogOpen(true); setTab("suppliers"); }}>
            <Building2 className="h-4 w-4" /> Add Supplier
          </Button>
          <Button className="gap-1.5" onClick={() => setCreatePOOpen(true)}>
            <Plus className="h-4 w-4" /> New PO
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-heading font-bold">{poStats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Drafts</p>
          <p className="text-2xl font-heading font-bold text-muted-foreground">{poStats.draft}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pending Receipt</p>
          <p className="text-2xl font-heading font-bold text-warning">{poStats.pending}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Value</p>
          <p className="text-2xl font-heading font-bold">{fmt(poStats.totalValue)}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
              tab === t.key ? "bg-card shadow-sm" : "text-muted-foreground"
            )}
          >{t.label}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder={tab === "orders" ? "Search PO number or supplier..." : "Search suppliers..."} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {tab === "orders" && (
          <>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
              <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outlets</SelectItem>
                {outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Orders Table */}
      {tab === "orders" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">PO Number</th>
                  <th className="text-left p-3 font-medium">Supplier</th>
                  <th className="text-left p-3 font-medium">Outlet</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Items</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="w-10 p-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.length === 0 ? (
                  <tr><td colSpan={8} className="text-center p-8 text-muted-foreground">No purchase orders found</td></tr>
                ) : filteredPOs.map((po) => {
                  const supplier = suppliers.find((s) => s.id === po.supplierId);
                  const outlet = outlets.find((o) => o.id === po.outletId);
                  const sc = statusConfig[po.status];
                  const total = po.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
                  return (
                    <tr key={po.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => setViewPO(po)}>
                      <td className="p-3 font-medium">{po.poNumber}</td>
                      <td className="p-3">{supplier?.name ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{outlet?.name ?? "—"}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className={cn("text-xs gap-1", sc.color)}>
                          <sc.icon className="h-3 w-3" />{sc.label}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">{po.items.length}</td>
                      <td className="p-3 text-right font-medium">{fmt(total)}</td>
                      <td className="p-3 text-muted-foreground">{format(po.createdAt, "MMM d, yyyy")}</td>
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setViewPO(po); }}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            {po.status === "draft" && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSend(po.id); }}>
                                <Send className="h-4 w-4 mr-2" /> Send to Supplier
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Suppliers Grid */}
      {tab === "suppliers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((s) => {
            const poCount = purchaseOrders.filter((p) => p.supplierId === s.id).length;
            return (
              <Card key={s.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setEditSupplier(s); setSupplierDialogOpen(true); }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-medium">{s.name}</h3>
                      <p className="text-xs text-muted-foreground">{s.contactPerson}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">{poCount} POs</Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {s.email && <p>✉ {s.email}</p>}
                  {s.phone && <p>☎ {s.phone}</p>}
                  {s.address && <p>📍 {s.address}</p>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <SupplierFormDialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen} supplier={editSupplier} onSave={handleSaveSupplier} />
      <CreatePODialog open={createPOOpen} onOpenChange={setCreatePOOpen} suppliers={suppliers} onCreate={handleCreatePO} />
      <PODetailDialog open={!!viewPO} onOpenChange={() => setViewPO(null)} po={viewPO} suppliers={suppliers} onReceive={handleReceive} onSend={handleSend} />
    </div>
  );
}
