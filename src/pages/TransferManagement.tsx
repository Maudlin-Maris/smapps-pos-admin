import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft, ArrowLeftRight, ArrowRight, Plus, Search, Trash2, Truck,
  PackageCheck, Send, ShieldCheck, ShieldX, X, Eye, History, AlertTriangle,
  Warehouse, Store as StoreIcon, ScanBarcode, Pencil,
} from "lucide-react";
import {
  listTransfers, listLocations, listLocationInventory, getEffectiveStock,
  getReservedQty, nextReference, upsertTransfer, getTransfer,
  submitForApproval, approveTransfer, rejectTransfer, dispatchTransfer,
  receiveTransfer, cancelTransfer, listMovements, deleteTransfer, audit,
} from "@/lib/transfers-store";
import {
  type StockTransferV2, type TransferStatus, type TransferItem,
  type TransferLocation, type TransferReason,
  TRANSFER_STATUS_META, REASON_LABELS, ACTIVE_STATUSES,
} from "@/data/transferTypes";

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────
function useTransfers() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const h = () => setV((x) => x + 1);
    window.addEventListener("transfers:changed", h);
    return () => window.removeEventListener("transfers:changed", h);
  }, []);
  return useMemo(() => listTransfers(), [v]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: TransferStatus }) {
  const m = TRANSFER_STATUS_META[status];
  return <Badge variant="secondary" className={cn("text-xs", m.tone)}>{m.label}</Badge>;
}
function LocationChip({ loc }: { loc: TransferLocation }) {
  const Icon = loc.kind === "warehouse" ? Warehouse : StoreIcon;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="truncate">{loc.name}</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST screen
// ─────────────────────────────────────────────────────────────────────────────
function TransferList() {
  const transfers = useTransfers();
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TransferStatus>("all");

  const filtered = transfers.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.reference.toLowerCase().includes(q) ||
      t.source.name.toLowerCase().includes(q) ||
      t.destination.name.toLowerCase().includes(q) ||
      t.items.some((i) => i.itemName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
    );
  });

  const counts = {
    active: transfers.filter((t) => ACTIVE_STATUSES.includes(t.status)).length,
    drafts: transfers.filter((t) => t.status === "DRAFT").length,
    received: transfers.filter((t) => t.status === "RECEIVED").length,
    pendingMine: transfers.filter((t) => t.status === "PENDING_APPROVAL").length,
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Stock Transfers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Move inventory between outlets, warehouses & branches with full audit
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => nav("/inventory/transfers/new")}>
          <Plus className="h-4 w-4" /> New Transfer
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Active</p>
          <p className="text-2xl font-heading font-bold">{counts.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pending Approval</p>
          <p className="text-2xl font-heading font-bold text-warning">{counts.pendingMine}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Drafts</p>
          <p className="text-2xl font-heading font-bold">{counts.drafts}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Received (all-time)</p>
          <p className="text-2xl font-heading font-bold text-success">{counts.received}</p>
        </Card>
      </div>

      <Card className="p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, location, item, SKU…"
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(TRANSFER_STATUS_META).map(([k, m]) => (
              <SelectItem key={k} value={k}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Reference</th>
                <th className="text-left p-3 font-medium">Route</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Lines</th>
                <th className="text-right p-3 font-medium">Total Qty</th>
                <th className="text-left p-3 font-medium">Created</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No transfers found.</td></tr>
              )}
              {filtered.map((t) => (
                <tr key={t.id} className="border-b hover:bg-muted/30 cursor-pointer"
                    onClick={() => nav(`/inventory/transfers/${t.id}`)}>
                  <td className="p-3 font-mono text-xs">{t.reference}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <LocationChip loc={t.source} />
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <LocationChip loc={t.destination} />
                    </div>
                  </td>
                  <td className="p-3"><StatusBadge status={t.status} /></td>
                  <td className="p-3 text-right">{t.items.length}</td>
                  <td className="p-3 text-right">
                    {t.items.reduce((s, i) => s + (i.dispatchedQty || i.approvedQty || i.requestedQty), 0)}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {format(new Date(t.createdAt), "MMM d, HH:mm")}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" className="gap-1 text-xs"
                            onClick={(e) => { e.stopPropagation(); nav(`/inventory/transfers/${t.id}`); }}>
                      <Eye className="h-3 w-3" /> Open
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATE screen
// ─────────────────────────────────────────────────────────────────────────────
function TransferCreate() {
  const nav = useNavigate();
  const { id: editId } = useParams();
  const locations = listLocations();

  // Load existing draft if editing
  const existing = useMemo(() => (editId ? getTransfer(editId) : undefined), [editId]);
  const isEditing = Boolean(editId);

  const [sourceId, setSourceId] = useState(existing?.source.id ?? "");
  const [destId, setDestId]     = useState(existing?.destination.id ?? "");
  const [reason, setReason]     = useState<TransferReason>(existing?.reason ?? "replenishment");
  const [notes, setNotes]       = useState(existing?.notes ?? "");
  const [carrier, setCarrier]   = useState(existing?.carrier ?? "");
  const [search, setSearch]     = useState("");
  const [lines, setLines]       = useState<{ itemId: string; qty: number }[]>(
    existing?.items.map((it) => ({ itemId: it.inventoryItemId, qty: it.requestedQty })) ?? []
  );
  const [discardOpen, setDiscardOpen] = useState(false);

  // Guard: can only edit DRAFT transfers via this screen
  useEffect(() => {
    if (isEditing && existing && existing.status !== "DRAFT") {
      toast.error("Only draft transfers can be edited");
      nav(`/inventory/transfers/${existing.id}`, { replace: true });
    }
    if (isEditing && !existing) {
      toast.error("Draft not found");
      nav("/inventory/transfers", { replace: true });
    }
  }, [isEditing, existing, nav]);

  // If source changes, drop lines that no longer exist at the new source
  useEffect(() => {
    if (!sourceId) return;
    const inv = listLocationInventory(sourceId);
    setLines((prev) => prev.filter((l) => inv.some((i) => i.id === l.itemId)));
  }, [sourceId]);

  const sourceItems = sourceId
    ? listLocationInventory(sourceId).filter((i) =>
        !search.trim() ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.sku.toLowerCase().includes(search.toLowerCase()))
    : [];

  const addLine = (itemId: string) => {
    setLines((prev) => prev.find((l) => l.itemId === itemId) ? prev : [...prev, { itemId, qty: 1 }]);
  };
  const updateQty = (itemId: string, qty: number) =>
    setLines((prev) => prev.map((l) => l.itemId === itemId ? { ...l, qty } : l));
  const removeLine = (itemId: string) =>
    setLines((prev) => prev.filter((l) => l.itemId !== itemId));

  const onDiscard = () => {
    if (!existing) { nav("/inventory/transfers"); return; }
    setDiscardOpen(true);
  };
  const confirmDiscard = () => {
    if (!existing) return;
    deleteTransfer(existing.id);
    toast.success("Draft discarded");
    nav("/inventory/transfers");
  };

  const onSave = (submit: boolean) => {
    if (!sourceId || !destId) return toast.error("Select source and destination");
    if (sourceId === destId) return toast.error("Source and destination must differ");
    if (submit && lines.length === 0) return toast.error("Add at least one item");

    const src = locations.find((l) => l.id === sourceId)!;
    const dst = locations.find((l) => l.id === destId)!;
    const inv = listLocationInventory(sourceId);

    // Validate stock & build TransferItems
    const items: TransferItem[] = [];
    for (const l of lines) {
      const i = inv.find((x) => x.id === l.itemId);
      if (!i) continue;
      const reserved = getReservedQty(sourceId, i.id);
      const transferable = Math.max(0, i.stock - reserved);
      if (submit) {
        if (l.qty <= 0) return toast.error(`Quantity for ${i.name} must be > 0`);
        if (l.qty > transferable) return toast.error(`${i.name}: only ${transferable} transferable`);
      }
      // Preserve existing line id if editing
      const prior = existing?.items.find((it) => it.inventoryItemId === i.id);
      items.push({
        id: prior?.id ?? crypto.randomUUID(),
        inventoryItemId: i.id,
        itemName: i.name,
        sku: i.sku,
        unit: i.unit,
        unitCost: i.unitCost,
        availableQty: i.stock,
        reservedQty: reserved,
        transferableQty: transferable,
        requestedQty: Math.max(0, l.qty || 0),
        approvedQty: 0,
        dispatchedQty: 0,
        receivedQty: 0,
        damagedQty: 0,
        varianceQty: 0,
      });
    }

    const t: StockTransferV2 = existing
      ? {
          ...existing,
          source: src,
          destination: dst,
          reason,
          notes: notes.trim(),
          carrier: carrier.trim() || undefined,
          items,
        }
      : {
          id: crypto.randomUUID(),
          reference: nextReference(),
          source: src,
          destination: dst,
          status: "DRAFT",
          reason,
          items,
          notes: notes.trim(),
          carrier: carrier.trim() || undefined,
          createdAt: new Date().toISOString(),
          createdBy: "Current User",
          audit: [{
            id: crypto.randomUUID(),
            ts: new Date().toISOString(),
            actor: "Current User",
            action: "CREATED",
          }],
        };

    if (existing) {
      audit(t, { actor: "Current User", action: "EDITED" });
    }
    upsertTransfer(t);

    if (submit) {
      try { submitForApproval(t.id); } catch (e: any) { toast.error(e.message); return; }
      toast.success("Transfer submitted for approval");
      nav(`/inventory/transfers/${t.id}`);
    } else {
      toast.success(isEditing ? "Draft updated" : "Draft saved");
      nav(`/inventory/transfers/${t.id}`);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl pb-20 lg:pb-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => nav("/inventory/transfers")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-heading font-bold">
            {isEditing ? "Edit Draft Transfer" : "New Stock Transfer"}
          </h1>
          {isEditing && existing && (
            <span className="font-mono text-xs text-muted-foreground">{existing.reference}</span>
          )}
        </div>
        {isEditing && (
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive" onClick={onDiscard}>
            <Trash2 className="h-4 w-4" /> Discard Draft
          </Button>
        )}
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Source *</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.kind === "warehouse" ? "🏭 " : "🏬 "}{l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Destination *</Label>
            <Select value={destId} onValueChange={setDestId}>
              <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
              <SelectContent>
                {locations.filter((l) => l.id !== sourceId).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.kind === "warehouse" ? "🏭 " : "🏬 "}{l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as TransferReason)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(REASON_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Carrier / Driver (optional)</Label>
            <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. In-house van" />
          </div>
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">Items</h3>
          <div className="text-xs text-muted-foreground">
            {lines.length} line{lines.length === 1 ? "" : "s"}
          </div>
        </div>

        {!sourceId ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Select a source to load inventory.</p>
        ) : (
          <>
            <div className="relative">
              <ScanBarcode className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, SKU or scan barcode…"
                className="pl-8"
              />
            </div>

            {/* Picker */}
            <div className="border rounded-lg max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 font-medium">Item</th>
                    <th className="text-left p-2 font-medium">SKU</th>
                    <th className="text-right p-2 font-medium">Stock</th>
                    <th className="text-right p-2 font-medium">Reserved</th>
                    <th className="text-right p-2 font-medium">Transferable</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {sourceItems.length === 0 && (
                    <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No items.</td></tr>
                  )}
                  {sourceItems.map((i) => {
                    const reserved = getReservedQty(sourceId, i.id);
                    const transferable = Math.max(0, i.stock - reserved);
                    const low = i.stock <= i.minStock;
                    const inLines = lines.some((l) => l.itemId === i.id);
                    return (
                      <tr key={i.id} className="border-t hover:bg-muted/30">
                        <td className="p-2">
                          <div className="font-medium">{i.name}</div>
                          {low && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-warning">
                              <AlertTriangle className="h-3 w-3" /> Low stock
                            </span>
                          )}
                        </td>
                        <td className="p-2 font-mono text-xs">{i.sku}</td>
                        <td className="p-2 text-right">{i.stock}</td>
                        <td className="p-2 text-right text-muted-foreground">{reserved}</td>
                        <td className={cn("p-2 text-right font-medium", transferable === 0 && "text-destructive")}>
                          {transferable}
                        </td>
                        <td className="p-2 text-right">
                          <Button size="sm" variant={inLines ? "secondary" : "outline"}
                                  disabled={transferable === 0}
                                  onClick={() => addLine(i.id)}
                                  className="h-7 text-xs">
                            {inLines ? "Added" : "Add"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Selected lines */}
            {lines.length > 0 && (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-2 font-medium">Selected Item</th>
                      <th className="text-right p-2 font-medium">Transferable</th>
                      <th className="text-right p-2 font-medium">Requested Qty</th>
                      <th className="p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => {
                      const i = listLocationInventory(sourceId).find((x) => x.id === l.itemId);
                      if (!i) return null;
                      const reserved = getReservedQty(sourceId, i.id);
                      const transferable = Math.max(0, i.stock - reserved);
                      return (
                        <tr key={l.itemId} className="border-t">
                          <td className="p-2">
                            <div className="font-medium">{i.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{i.sku}</div>
                          </td>
                          <td className="p-2 text-right">{transferable}</td>
                          <td className="p-2 text-right">
                            <Input type="number" min={1} max={transferable} value={l.qty}
                                   onChange={(e) => updateQty(l.itemId, parseInt(e.target.value) || 0)}
                                   className="h-8 w-24 ml-auto text-right" />
                          </td>
                          <td className="p-2 text-right">
                            <Button size="icon" variant="ghost" onClick={() => removeLine(l.itemId)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Card>

      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <Button variant="outline" onClick={() => onSave(false)}>{isEditing ? "Save Draft" : "Save as Draft"}</Button>
        <Button onClick={() => onSave(true)} className="gap-1.5">
          <Send className="h-4 w-4" /> Submit for Approval
        </Button>
      </div>

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the draft transfer. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDiscardOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAILS screen (covers approval/dispatch/receive workflows)
// ─────────────────────────────────────────────────────────────────────────────
function TransferDetails() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const transfers = useTransfers();
  const t = transfers.find((x) => x.id === id);
  const [actionDialog, setActionDialog] = useState<null | "approve" | "reject" | "dispatch" | "receive" | "cancel">(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  if (!t) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => nav("/inventory/transfers")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Card className="p-8 text-center text-muted-foreground">Transfer not found.</Card>
      </div>
    );
  }

  const can = {
    submit: t.status === "DRAFT",
    approve: t.status === "PENDING_APPROVAL",
    dispatch: t.status === "APPROVED",
    receive: t.status === "IN_TRANSIT" || t.status === "PARTIALLY_RECEIVED",
    cancel: !["RECEIVED", "CANCELLED", "REJECTED"].includes(t.status),
  };

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => nav("/inventory/transfers")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-heading font-bold font-mono">{t.reference}</h1>
              <StatusBadge status={t.status} />
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <LocationChip loc={t.source} /> <ArrowRight className="h-3 w-3" /> <LocationChip loc={t.destination} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {can.submit && (
            <>
              <Button size="sm" variant="outline" className="gap-1.5"
                      onClick={() => nav(`/inventory/transfers/${t.id}/edit`)}>
                <Pencil className="h-4 w-4" /> Edit Draft
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-destructive"
                      onClick={() => setDiscardOpen(true)}>
                <Trash2 className="h-4 w-4" /> Discard
              </Button>
              <Button size="sm" className="gap-1.5"
                      onClick={() => { try { submitForApproval(t.id); toast.success("Submitted"); } catch (e: any) { toast.error(e.message); } }}>
                <Send className="h-4 w-4" /> Submit
              </Button>
            </>
          )}
          {can.approve && (
            <>
              <Button size="sm" className="gap-1.5" onClick={() => setActionDialog("approve")}>
                <ShieldCheck className="h-4 w-4" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setActionDialog("reject")}>
                <ShieldX className="h-4 w-4" /> Reject
              </Button>
            </>
          )}
          {can.dispatch && (
            <Button size="sm" className="gap-1.5" onClick={() => setActionDialog("dispatch")}>
              <Truck className="h-4 w-4" /> Dispatch
            </Button>
          )}
          {can.receive && (
            <Button size="sm" className="gap-1.5" onClick={() => setActionDialog("receive")}>
              <PackageCheck className="h-4 w-4" /> Receive
            </Button>
          )}
          {can.cancel && (
            <Button size="sm" variant="outline" className="gap-1.5 text-destructive"
                    onClick={() => setActionDialog("cancel")}>
              <X className="h-4 w-4" /> Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Reason</p>
          <p className="font-medium">{REASON_LABELS[t.reason]}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Created</p>
          <p className="font-medium">{format(new Date(t.createdAt), "MMM d, HH:mm")}</p>
          <p className="text-xs text-muted-foreground">by {t.createdBy}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Approved</p>
          <p className="font-medium">{t.approvedAt ? format(new Date(t.approvedAt), "MMM d, HH:mm") : "—"}</p>
          {t.approvedBy && <p className="text-xs text-muted-foreground">by {t.approvedBy}</p>}
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Dispatched</p>
          <p className="font-medium">{t.dispatchedAt ? format(new Date(t.dispatchedAt), "MMM d, HH:mm") : "—"}</p>
          {t.carrier && <p className="text-xs text-muted-foreground">{t.carrier}</p>}
        </Card>
      </div>

      {/* Items */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold text-sm">Items</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Item</th>
                <th className="text-right p-3 font-medium">Requested</th>
                <th className="text-right p-3 font-medium">Approved</th>
                <th className="text-right p-3 font-medium">Dispatched</th>
                <th className="text-right p-3 font-medium">Received</th>
                <th className="text-right p-3 font-medium">Damaged</th>
                <th className="text-right p-3 font-medium">Variance</th>
                <th className="text-right p-3 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {t.items.map((it) => (
                <tr key={it.id} className="border-b">
                  <td className="p-3">
                    <div className="font-medium">{it.itemName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{it.sku} · {it.unit}</div>
                  </td>
                  <td className="p-3 text-right">{it.requestedQty}</td>
                  <td className="p-3 text-right">{it.approvedQty}</td>
                  <td className="p-3 text-right">{it.dispatchedQty}</td>
                  <td className="p-3 text-right text-success">{it.receivedQty}</td>
                  <td className="p-3 text-right text-destructive">{it.damagedQty}</td>
                  <td className={cn("p-3 text-right", it.varianceQty !== 0 && "text-warning font-medium")}>
                    {it.varianceQty}
                  </td>
                  <td className="p-3 text-right text-muted-foreground">
                    ₦{(it.unitCost * (it.dispatchedQty || it.approvedQty || it.requestedQty)).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {t.notes && (
        <Card className="p-3 text-sm"><span className="text-muted-foreground">Notes: </span>{t.notes}</Card>
      )}

      {/* Audit trail + movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold text-sm flex items-center gap-2">
            <History className="h-4 w-4" /> Audit Trail
          </div>
          <ul className="divide-y">
            {t.audit.map((a) => (
              <li key={a.id} className="p-3 text-sm flex justify-between gap-3">
                <div>
                  <p className="font-medium">{a.action.replace(/_/g, " ")}</p>
                  {a.notes && <p className="text-xs text-muted-foreground">{a.notes}</p>}
                  <p className="text-xs text-muted-foreground">by {a.actor}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(a.ts), "MMM d, HH:mm")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b font-semibold text-sm">Inventory Movements</div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Item</th>
                  <th className="text-right p-2">Qty</th>
                  <th className="text-right p-2">Bal After</th>
                </tr>
              </thead>
              <tbody>
                {listMovements().filter((m) => m.transferId === t.id).map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="p-2">
                      <Badge variant="secondary" className={cn("text-[10px]",
                        m.type === "TRANSFER_IN" ? "bg-success/15 text-success" :
                        m.type === "TRANSFER_OUT" ? "bg-info/15 text-info" :
                        "bg-destructive/15 text-destructive")}>
                        {m.type.replace("TRANSFER_", "")}
                      </Badge>
                    </td>
                    <td className="p-2">{m.itemName}</td>
                    <td className={cn("p-2 text-right font-medium",
                      m.quantity > 0 ? "text-success" : "text-destructive")}>
                      {m.quantity > 0 ? "+" : ""}{m.quantity}
                    </td>
                    <td className="p-2 text-right">{m.balanceAfter}</td>
                  </tr>
                ))}
                {listMovements().filter((m) => m.transferId === t.id).length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No movements yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <ActionDialog
        kind={actionDialog}
        transfer={t}
        onClose={() => setActionDialog(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Action dialogs (approve / reject / dispatch / receive / cancel)
// ─────────────────────────────────────────────────────────────────────────────
function ActionDialog({
  kind, transfer, onClose,
}: {
  kind: null | "approve" | "reject" | "dispatch" | "receive" | "cancel";
  transfer: StockTransferV2;
  onClose: () => void;
}) {
  const [approvals, setApprovals] = useState<Record<string, number>>({});
  const [dispatches, setDispatches] = useState<Record<string, number>>({});
  const [receipts, setReceipts] = useState<Record<string, { received: number; damaged: number }>>({});
  const [reason, setReason] = useState("");
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");

  useEffect(() => {
    if (!kind) return;
    setApprovals(Object.fromEntries(transfer.items.map((i) => [i.id, i.requestedQty])));
    setDispatches(Object.fromEntries(transfer.items.map((i) => [i.id, i.approvedQty])));
    setReceipts(Object.fromEntries(transfer.items.map((i) =>
      [i.id, { received: Math.max(0, i.dispatchedQty - i.receivedQty - i.damagedQty), damaged: 0 }])));
    setReason("");
    setCarrier(transfer.carrier || "");
    setTracking(transfer.trackingNumber || "");
  }, [kind, transfer]);

  if (!kind) return null;

  const titles: Record<typeof kind & string, string> = {
    approve: "Approve Transfer",
    reject: "Reject Transfer",
    dispatch: "Dispatch Transfer",
    receive: "Receive Transfer",
    cancel: "Cancel Transfer",
  };

  const submit = () => {
    try {
      if (kind === "approve") approveTransfer(transfer.id, approvals);
      if (kind === "reject")  { if (!reason.trim()) return toast.error("Reason required"); rejectTransfer(transfer.id, reason); }
      if (kind === "dispatch") dispatchTransfer(transfer.id, dispatches, { carrier, tracking });
      if (kind === "receive")  receiveTransfer(transfer.id, receipts);
      if (kind === "cancel")   { if (!reason.trim()) return toast.error("Reason required"); cancelTransfer(transfer.id, reason); }
      toast.success(`Transfer ${kind}d`);
      onClose();
    } catch (e: any) { toast.error(e.message || "Action failed"); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{titles[kind]}</DialogTitle></DialogHeader>

        {(kind === "approve" || kind === "dispatch" || kind === "receive") && (
          <div className="border rounded-lg overflow-x-auto max-h-[50vh]">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-2 font-medium">Item</th>
                  {kind === "approve" && <>
                    <th className="text-right p-2 font-medium">Requested</th>
                    <th className="text-right p-2 font-medium">Approve Qty</th>
                  </>}
                  {kind === "dispatch" && <>
                    <th className="text-right p-2 font-medium">Approved</th>
                    <th className="text-right p-2 font-medium">Source Stock</th>
                    <th className="text-right p-2 font-medium">Dispatch Qty</th>
                  </>}
                  {kind === "receive" && <>
                    <th className="text-right p-2 font-medium">Dispatched</th>
                    <th className="text-right p-2 font-medium">Received Qty</th>
                    <th className="text-right p-2 font-medium">Damaged</th>
                  </>}
                </tr>
              </thead>
              <tbody>
                {transfer.items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="p-2">
                      <div className="font-medium">{it.itemName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{it.sku}</div>
                    </td>
                    {kind === "approve" && <>
                      <td className="p-2 text-right">{it.requestedQty}</td>
                      <td className="p-2 text-right">
                        <Input type="number" min={0} max={it.requestedQty}
                          value={approvals[it.id] ?? 0}
                          onChange={(e) => setApprovals((p) => ({ ...p, [it.id]: parseInt(e.target.value) || 0 }))}
                          className="h-8 w-24 ml-auto text-right" />
                      </td>
                    </>}
                    {kind === "dispatch" && <>
                      <td className="p-2 text-right">{it.approvedQty}</td>
                      <td className="p-2 text-right">{getEffectiveStock(transfer.source.id, it.inventoryItemId)}</td>
                      <td className="p-2 text-right">
                        <Input type="number" min={0} max={it.approvedQty}
                          value={dispatches[it.id] ?? 0}
                          onChange={(e) => setDispatches((p) => ({ ...p, [it.id]: parseInt(e.target.value) || 0 }))}
                          className="h-8 w-24 ml-auto text-right" />
                      </td>
                    </>}
                    {kind === "receive" && <>
                      <td className="p-2 text-right">{it.dispatchedQty}</td>
                      <td className="p-2 text-right">
                        <Input type="number" min={0} max={it.dispatchedQty - it.receivedQty - it.damagedQty}
                          value={receipts[it.id]?.received ?? 0}
                          onChange={(e) => setReceipts((p) => ({ ...p, [it.id]: { ...p[it.id], received: parseInt(e.target.value) || 0 } }))}
                          className="h-8 w-24 ml-auto text-right" />
                      </td>
                      <td className="p-2 text-right">
                        <Input type="number" min={0}
                          value={receipts[it.id]?.damaged ?? 0}
                          onChange={(e) => setReceipts((p) => ({ ...p, [it.id]: { ...p[it.id], damaged: parseInt(e.target.value) || 0 } }))}
                          className="h-8 w-24 ml-auto text-right" />
                      </td>
                    </>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {kind === "dispatch" && (
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Carrier</Label><Input value={carrier} onChange={(e) => setCarrier(e.target.value)} /></div>
            <div><Label>Tracking #</Label><Input value={tracking} onChange={(e) => setTracking(e.target.value)} /></div>
          </div>
        )}

        {(kind === "reject" || kind === "cancel") && (
          <div>
            <Label>Reason *</Label>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page entry
// ─────────────────────────────────────────────────────────────────────────────
export default function TransferManagement() {
  return <TransferList />;
}
export function TransferManagementCreate() { return <TransferCreate />; }
export function TransferManagementDetails() { return <TransferDetails />; }
