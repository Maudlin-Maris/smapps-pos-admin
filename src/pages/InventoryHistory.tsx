import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ClipboardCheck, Search, RefreshCw, FileBarChart, AlertTriangle,
  CheckCircle2, Clock, Layers, History, ArrowDownUp, MapPin, HelpCircle,
} from "lucide-react";

import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "@/components/inventory/PaginationControls";

import { outlets } from "@/data/outlets";
import {
  type DailyInventorySnapshot,
  type InventoryReconciliation,
  type ReconciliationReason,
  type SnapshotFilter,
  RECONCILIATION_REASON_LABELS,
} from "@/data/snapshotTypes";
import {
  approveReconciliation,
  computeVarianceSummary,
  createReconciliation,
  generateSnapshotsForDay,
  isoDate,
  listMovementsForSnapshot,
  listReconciliations,
  querySnapshots,
  rejectReconciliation,
  seedSnapshotsIfEmpty,
  submitReconciliation,
} from "@/lib/inventory-snapshots-store";
import { formatNaira } from "@/lib/currency";

// Inline category list (mirrors InventoryCategoryManager seed)
const CATEGORIES = [
  { id: "1", name: "Beverages" }, { id: "2", name: "Food Supplies" },
  { id: "3", name: "Packaging" }, { id: "4", name: "Salon & Barber" },
  { id: "5", name: "Pharmaceuticals" }, { id: "6", name: "Fresh Produce" },
  { id: "7", name: "Dairy & Frozen" }, { id: "8", name: "Wines & Spirits" },
  { id: "9", name: "Apparel" }, { id: "10", name: "Electronics" },
  { id: "11", name: "Hair & Wigs" }, { id: "12", name: "Grocery Staples" },
];

type Tab = "history" | "reconciliation" | "variance";

const reconStatusColor: Record<InventoryReconciliation["status"], string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SUBMITTED: "bg-warning/15 text-warning",
  APPROVED: "bg-success/15 text-success",
  REJECTED: "bg-destructive/15 text-destructive",
};

export default function InventoryHistory() {
  const [tab, setTab] = useState<Tab>("history");
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  // Filters (shared)
  const today = isoDate(new Date());
  const fourteenAgo = isoDate(new Date(Date.now() - 13 * 86400_000));
  const [locationId, setLocationId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState(fourteenAgo);
  const [toDate, setToDate] = useState(today);
  const [varianceOnly, setVarianceOnly] = useState(false);

  // Drill-down + counting modals
  const [drillSnap, setDrillSnap] = useState<DailyInventorySnapshot | null>(null);
  const [countOpen, setCountOpen] = useState(false);
  const [reviewRecon, setReviewRecon] = useState<InventoryReconciliation | null>(null);

  useEffect(() => {
    seedSnapshotsIfEmpty(14);
    const onChange = () => refresh();
    window.addEventListener("snapshots:changed", onChange);
    window.addEventListener("transfers:changed", onChange);
    return () => {
      window.removeEventListener("snapshots:changed", onChange);
      window.removeEventListener("transfers:changed", onChange);
    };
  }, []);

  const filter: SnapshotFilter = useMemo(() => ({
    locationId, categoryId, search, fromDate, toDate, varianceOnly,
  }), [locationId, categoryId, search, fromDate, toDate, varianceOnly]);

  const snapshots = useMemo(() => {
    void tick;
    return querySnapshots(filter)
      .sort((a, b) => b.date.localeCompare(a.date) || a.itemName.localeCompare(b.itemName));
  }, [filter, tick]);

  const reconciliations = useMemo(() => {
    void tick;
    return listReconciliations()
      .filter((r) => locationId === "all" || r.outletId === locationId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [locationId, tick]);

  const variance = useMemo(() => {
    void tick;
    return computeVarianceSummary(filter);
  }, [filter, tick]);

  const handleGenerateToday = () => {
    generateSnapshotsForDay(today, locationId === "all" ? undefined : locationId);
    toast.success("Snapshots regenerated for today");
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Inventory History &amp; Reconciliation</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Daily stock snapshots, physical counts, and variance review
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-1.5" onClick={handleGenerateToday}>
            <RefreshCw className="h-4 w-4" /> Regenerate Today
          </Button>
          <Button className="gap-1.5" onClick={() => setCountOpen(true)}>
            <ClipboardCheck className="h-4 w-4" /> Start Stock Count
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile icon={<History className="h-5 w-5 text-accent" />} label="Snapshots in range" value={snapshots.length.toString()} tone="accent" />
        <KpiTile icon={<AlertTriangle className="h-5 w-5 text-warning" />} label="Items w/ variance" value={variance.countedSnapshots.toString()} tone="warning" />
        <KpiTile icon={<Clock className="h-5 w-5 text-info" />} label="Pending reconciliations" value={variance.pendingReconciliations.toString()} tone="info" />
        <KpiTile icon={<FileBarChart className="h-5 w-5 text-destructive" />} label="Net variance value" value={formatNaira(variance.totalVarianceCost)} tone="destructive" />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <Label className="text-xs">Location</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outlets &amp; Warehouses</SelectItem>
                {outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" className="h-9" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" className="h-9" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Search item / SKU</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="h-9 pl-8" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={varianceOnly} onChange={(e) => setVarianceOnly(e.target.checked)} />
            Only items with variance
          </label>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit overflow-x-auto">
        {([
          { key: "history", label: "Daily Stock History" },
          { key: "reconciliation", label: `Reconciliations (${reconciliations.length})` },
          { key: "variance", label: "Variance Review" },
        ] as { key: Tab; label: string }[]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
              tab === t.key ? "bg-card shadow-sm" : "text-muted-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "history" && (
        <HistoryTable snapshots={snapshots} onDrill={setDrillSnap} />
      )}

      {tab === "reconciliation" && (
        <ReconciliationList items={reconciliations} onReview={setReviewRecon} />
      )}

      {tab === "variance" && (
        <VarianceReview snapshots={snapshots.filter((s) => s.varianceQty !== 0)} onDrill={setDrillSnap} />
      )}

      <MovementDrillDialog snap={drillSnap} onClose={() => setDrillSnap(null)} />
      <StockCountDialog
        open={countOpen} onOpenChange={setCountOpen}
        defaultLocation={locationId === "all" ? outlets[0]?.id : locationId}
        defaultDate={today}
        onCreated={refresh}
      />
      <ReconciliationReviewDialog
        recon={reviewRecon} onClose={() => setReviewRecon(null)}
      />
    </div>
  );
}

// ── KPI tile ──
function KpiTile({ icon, label, value, tone }:
  { icon: React.ReactNode; label: string; value: string; tone: "accent" | "warning" | "info" | "destructive" }) {
  const bg = { accent: "bg-accent/10", warning: "bg-warning/10", info: "bg-info/10", destructive: "bg-destructive/10" }[tone];
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", bg)}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-xl font-heading font-bold truncate">{value}</p>
        </div>
      </div>
    </Card>
  );
}

// ── History table ──
function HistoryTable({ snapshots, onDrill }:
  { snapshots: DailyInventorySnapshot[]; onDrill: (s: DailyInventorySnapshot) => void }) {
  if (!snapshots.length) {
    return <Card className="p-8 text-center text-muted-foreground">No snapshots match these filters.</Card>;
  }
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left p-2.5">Date</th>
              <th className="text-left p-2.5">Item</th>
              <th className="text-left p-2.5">Outlet</th>
              <th className="text-right p-2.5">Open</th>
              <th className="text-right p-2.5">+Recv</th>
              <th className="text-right p-2.5">−Sold</th>
              <th className="text-right p-2.5">+Ret</th>
              <th className="text-right p-2.5">−Wast</th>
              <th className="text-right p-2.5">±Adj</th>
              <th className="text-right p-2.5">+T-In</th>
              <th className="text-right p-2.5">−T-Out</th>
              <th className="text-right p-2.5">Expected</th>
              <th className="text-right p-2.5">Actual</th>
              <th className="text-right p-2.5">Var Qty</th>
              <th className="text-right p-2.5">Var Cost</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {snapshots.slice(0, 500).map((s) => {
              const outletName = outlets.find((o) => o.id === s.outletId)?.name ?? s.outletId;
              const hasVar = s.varianceQty !== 0;
              return (
                <tr key={s.id} className="border-b hover:bg-muted/30">
                  <td className="p-2.5 whitespace-nowrap">{s.date}</td>
                  <td className="p-2.5">
                    <div className="font-medium">{s.itemName}</div>
                    <div className="text-xs text-muted-foreground">{s.sku}</div>
                  </td>
                  <td className="p-2.5 text-muted-foreground">{outletName}</td>
                  <td className="p-2.5 text-right">{s.openingQty}</td>
                  <td className="p-2.5 text-right text-success">{s.receivedQty || ""}</td>
                  <td className="p-2.5 text-right">{s.soldQty || ""}</td>
                  <td className="p-2.5 text-right text-success">{s.returnedQty || ""}</td>
                  <td className="p-2.5 text-right text-destructive">{s.wastedQty || ""}</td>
                  <td className="p-2.5 text-right">{s.adjustedQty || ""}</td>
                  <td className="p-2.5 text-right text-success">{s.transferredInQty || ""}</td>
                  <td className="p-2.5 text-right text-warning">{s.transferredOutQty || ""}</td>
                  <td className="p-2.5 text-right font-semibold">{s.expectedClosingQty}</td>
                  <td className="p-2.5 text-right">{s.actualCountedQty ?? "—"}</td>
                  <td className={cn("p-2.5 text-right font-medium", hasVar && (s.varianceQty < 0 ? "text-destructive" : "text-warning"))}>
                    {hasVar ? (s.varianceQty > 0 ? `+${s.varianceQty}` : s.varianceQty) : "—"}
                  </td>
                  <td className={cn("p-2.5 text-right", hasVar && "font-medium")}>
                    {hasVar ? formatNaira(s.varianceCost) : "—"}
                  </td>
                  <td className="p-2.5">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onDrill(s)}>
                      <ArrowDownUp className="h-3 w-3 mr-1" /> Drill
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {snapshots.length > 500 && (
        <div className="p-2 text-center text-xs text-muted-foreground border-t">
          Showing first 500 of {snapshots.length}. Tighten filters to narrow results.
        </div>
      )}
    </Card>
  );
}

// ── Reconciliation list ──
function ReconciliationList({ items, onReview }:
  { items: InventoryReconciliation[]; onReview: (r: InventoryReconciliation) => void }) {
  if (!items.length) {
    return <Card className="p-8 text-center text-muted-foreground">No reconciliations yet. Click <b>Start Stock Count</b> to begin.</Card>;
  }
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left p-3">Reference</th>
              <th className="text-left p-3">Outlet</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Lines</th>
              <th className="text-right p-3">Net Var Qty</th>
              <th className="text-right p-3">Net Var Cost</th>
              <th className="text-left p-3">Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">{r.reference}</td>
                <td className="p-3">{r.outletName}</td>
                <td className="p-3">{r.date}</td>
                <td className="p-3">
                  <Badge variant="secondary" className={cn("text-xs", reconStatusColor[r.status])}>{r.status}</Badge>
                </td>
                <td className="p-3 text-right">{r.totals.linesCounted}</td>
                <td className={cn("p-3 text-right font-medium", r.totals.varianceQty < 0 ? "text-destructive" : r.totals.varianceQty > 0 ? "text-warning" : "")}>
                  {r.totals.varianceQty > 0 ? "+" : ""}{r.totals.varianceQty}
                </td>
                <td className="p-3 text-right">{formatNaira(r.totals.varianceCost)}</td>
                <td className="p-3 text-muted-foreground">{format(new Date(r.createdAt), "MMM d, HH:mm")}</td>
                <td className="p-3 text-right">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onReview(r)}>Review</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Variance review ──
function VarianceReview({ snapshots, onDrill }:
  { snapshots: DailyInventorySnapshot[]; onDrill: (s: DailyInventorySnapshot) => void }) {
  if (!snapshots.length) {
    return <Card className="p-8 text-center text-muted-foreground">
      <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-success" />
      No variances in the selected range.
    </Card>;
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {snapshots.map((s) => (
        <Card key={s.id} className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <p className="font-medium truncate">{s.itemName}</p>
              <p className="text-xs text-muted-foreground">{s.sku} · {s.date}</p>
            </div>
            <Badge variant="secondary" className={cn("text-xs", s.varianceQty < 0 ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning")}>
              {s.varianceQty > 0 ? `+${s.varianceQty}` : s.varianceQty}
            </Badge>
          </div>
          <div className="text-xs space-y-1 text-muted-foreground">
            <div className="flex justify-between"><span><MapPin className="inline h-3 w-3 mr-1" />{outlets.find((o) => o.id === s.outletId)?.name}</span></div>
            <div className="flex justify-between"><span>Expected</span><span>{s.expectedClosingQty}</span></div>
            <div className="flex justify-between"><span>Counted</span><span>{s.actualCountedQty ?? "—"}</span></div>
            <div className="flex justify-between font-medium text-foreground"><span>Variance value</span><span>{formatNaira(s.varianceCost)}</span></div>
            {s.reconciledBy && <div className="flex justify-between"><span>Reconciled by</span><span>{s.reconciledBy}</span></div>}
          </div>
          <Button variant="ghost" size="sm" className="mt-3 w-full text-xs" onClick={() => onDrill(s)}>
            View movements
          </Button>
        </Card>
      ))}
    </div>
  );
}

// ── Drill-down dialog ──
function MovementDrillDialog({ snap, onClose }:
  { snap: DailyInventorySnapshot | null; onClose: () => void }) {
  const movements = snap ? listMovementsForSnapshot(snap) : [];
  return (
    <Dialog open={!!snap} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            {snap?.itemName} <span className="text-xs text-muted-foreground">({snap?.sku})</span>
          </DialogTitle>
        </DialogHeader>
        {snap && (
          <>
            <div className="grid grid-cols-3 gap-3 text-xs bg-muted/30 rounded-lg p-3">
              <Metric label="Opening" value={snap.openingQty} />
              <Metric label="Expected closing" value={snap.expectedClosingQty} />
              <Metric label="Actual" value={snap.actualCountedQty ?? "—"} />
              <Metric label="Date" value={snap.date} />
              <Metric label="Outlet" value={outlets.find((o) => o.id === snap.outletId)?.name ?? snap.outletId} />
              <Metric label="Variance value" value={formatNaira(snap.varianceCost)} />
            </div>
            <div className="max-h-[420px] overflow-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-right p-2">Qty</th>
                    <th className="text-right p-2">Unit Cost</th>
                    <th className="text-left p-2">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No movements recorded for this day.</td></tr>
                  )}
                  {movements.map((m, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2 font-mono">{m.ts.slice(11, 16)}</td>
                      <td className="p-2"><Badge variant="secondary" className="text-[10px]">{m.type}</Badge></td>
                      <td className={cn("p-2 text-right font-medium", m.quantity < 0 ? "text-destructive" : "text-success")}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="p-2 text-right">{formatNaira(m.unitCost)}</td>
                      <td className="p-2 text-muted-foreground">{m.reference ?? (m.source === "synthetic" ? "—" : "")}{m.notes ? ` · ${m.notes}` : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}

// ── Stock count / reconciliation creation dialog ──
function StockCountDialog({
  open, onOpenChange, defaultLocation, defaultDate, onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultLocation?: string;
  defaultDate: string;
  onCreated: () => void;
}) {
  const [outletId, setOutletId] = useState(defaultLocation ?? outlets[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate);
  const [counts, setCounts] = useState<Record<string, { actualQty: string; reasonCode?: ReconciliationReason; reasonNote?: string }>>({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setOutletId(defaultLocation ?? outlets[0]?.id ?? "");
      setDate(defaultDate);
      setCounts({});
      setNotes("");
    }
  }, [open, defaultLocation, defaultDate]);

  const snapshots = useMemo(() => {
    if (!outletId || !date) return [];
    let snaps = querySnapshots({ locationId: outletId, fromDate: date, toDate: date });
    if (snaps.length === 0) {
      snaps = generateSnapshotsForDay(date, outletId);
    }
    return snaps.sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [outletId, date, open]);

  const handleSubmit = (mode: "draft" | "submit") => {
    const entries = Object.entries(counts)
      .filter(([, v]) => v.actualQty !== "" && !isNaN(Number(v.actualQty)))
      .map(([snapshotId, v]) => ({
        snapshotId,
        actualQty: Number(v.actualQty),
        reasonCode: v.reasonCode,
        reasonNote: v.reasonNote,
      }));
    if (!entries.length) { toast.error("Enter at least one counted quantity"); return; }
    const r = createReconciliation({ outletId, date, counts: entries, notes });
    if (mode === "submit") submitReconciliation(r.id);
    toast.success(`Reconciliation ${r.reference} ${mode === "submit" ? "submitted" : "saved as draft"}`);
    onOpenChange(false);
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Physical Stock Count</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Outlet *</Label>
            <Select value={outletId} onValueChange={setOutletId}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Business Date *</Label>
            <Input type="date" className="h-9" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="max-h-[420px] overflow-auto border rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b sticky top-0">
              <tr>
                <th className="text-left p-2">Item</th>
                <th className="text-right p-2">Expected</th>
                <th className="text-right p-2 w-24">Counted</th>
                <th className="text-right p-2">Variance</th>
                <th className="text-left p-2 w-40">Reason</th>
              </tr>
            </thead>
            <tbody>
              {snapshots.length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No items at this outlet for the selected date.</td></tr>
              )}
              {snapshots.map((s) => {
                const entry = counts[s.id] ?? { actualQty: "" };
                const actual = Number(entry.actualQty);
                const hasVal = entry.actualQty !== "" && !isNaN(actual);
                const variance = hasVal ? actual - s.expectedClosingQty : 0;
                return (
                  <tr key={s.id} className="border-b">
                    <td className="p-2">
                      <div className="font-medium">{s.itemName}</div>
                      <div className="text-[10px] text-muted-foreground">{s.sku}</div>
                    </td>
                    <td className="p-2 text-right">{s.expectedClosingQty}</td>
                    <td className="p-2">
                      <Input
                        type="number" step="0.01" className="h-8 text-right"
                        value={entry.actualQty}
                        onChange={(e) => setCounts((c) => ({ ...c, [s.id]: { ...c[s.id], actualQty: e.target.value } }))}
                      />
                    </td>
                    <td className={cn("p-2 text-right font-medium", hasVal && variance !== 0 && (variance < 0 ? "text-destructive" : "text-warning"))}>
                      {hasVal && variance !== 0 ? (variance > 0 ? `+${variance}` : variance) : "—"}
                    </td>
                    <td className="p-2">
                      {hasVal && variance !== 0 ? (
                        <Select
                          value={entry.reasonCode ?? ""}
                          onValueChange={(v) => setCounts((c) => ({ ...c, [s.id]: { ...c[s.id], reasonCode: v as ReconciliationReason } }))}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(RECONCILIATION_REASON_LABELS) as ReconciliationReason[]).map((r) => (
                              <SelectItem key={r} value={r}>{RECONCILIATION_REASON_LABELS[r]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for the reviewer" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSubmit("draft")}>Save Draft</Button>
          <Button onClick={() => handleSubmit("submit")}>Submit for Approval</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Reconciliation review / approval dialog ──
function ReconciliationReviewDialog({ recon, onClose }:
  { recon: InventoryReconciliation | null; onClose: () => void }) {
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => { if (!recon) setRejectReason(""); }, [recon]);

  if (!recon) return null;
  const isSubmitted = recon.status === "SUBMITTED";

  return (
    <Dialog open={!!recon} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {recon.reference}
            <Badge variant="secondary" className={cn("text-xs", reconStatusColor[recon.status])}>{recon.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-muted/30 rounded-lg p-3">
          <Metric label="Outlet" value={recon.outletName} />
          <Metric label="Business date" value={recon.date} />
          <Metric label="Lines counted" value={recon.totals.linesCounted} />
          <Metric label="Net variance value" value={formatNaira(recon.totals.varianceCost)} />
        </div>

        <div className="max-h-[360px] overflow-auto border rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-2">Item</th>
                <th className="text-right p-2">Expected</th>
                <th className="text-right p-2">Counted</th>
                <th className="text-right p-2">Variance</th>
                <th className="text-right p-2">Cost Impact</th>
                <th className="text-left p-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {recon.lines.map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="p-2">
                    <div className="font-medium">{l.itemName}</div>
                    <div className="text-[10px] text-muted-foreground">{l.sku}</div>
                  </td>
                  <td className="p-2 text-right">{l.expectedQty}</td>
                  <td className="p-2 text-right">{l.actualQty}</td>
                  <td className={cn("p-2 text-right font-medium", l.varianceQty < 0 ? "text-destructive" : l.varianceQty > 0 ? "text-warning" : "")}>
                    {l.varianceQty > 0 ? "+" : ""}{l.varianceQty}
                  </td>
                  <td className="p-2 text-right">{formatNaira(l.varianceCost)}</td>
                  <td className="p-2 text-muted-foreground">{l.reasonCode ? RECONCILIATION_REASON_LABELS[l.reasonCode] : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recon.notes && <p className="text-xs text-muted-foreground"><b>Notes:</b> {recon.notes}</p>}
        {recon.rejectedReason && <p className="text-xs text-destructive"><b>Rejected:</b> {recon.rejectedReason}</p>}

        {isSubmitted && (
          <div>
            <Label className="text-xs">Reject reason (optional)</Label>
            <Input className="h-9" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Required only if rejecting" />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {recon.status === "DRAFT" && (
            <Button onClick={() => { submitReconciliation(recon.id); toast.success("Submitted"); onClose(); }}>
              Submit for Approval
            </Button>
          )}
          {isSubmitted && (
            <>
              <Button variant="destructive" onClick={() => {
                if (!rejectReason.trim()) { toast.error("Provide a reject reason"); return; }
                rejectReconciliation(recon.id, rejectReason.trim());
                toast.success("Reconciliation rejected");
                onClose();
              }}>Reject</Button>
              <Button onClick={() => {
                approveReconciliation(recon.id);
                toast.success("Approved — adjustments posted");
                onClose();
              }}>Approve &amp; Post</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
