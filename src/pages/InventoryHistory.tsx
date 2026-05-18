import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ClipboardCheck, Search, RefreshCw, FileBarChart, AlertTriangle,
  CheckCircle2, Clock, Layers, History, ArrowDownUp, MapPin, HelpCircle,
  Play, Trash2, SkipForward, X,
} from "lucide-react";

import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "@/components/inventory/PaginationControls";

import { outlets } from "@/data/outlets";
import {
  type DailyInventorySnapshot,
  type InventoryReconciliation,
  type ReconciliationLine,
  type ReconciliationReason,
  type ReconciliationStatus,
  type SnapshotFilter,
  RECONCILIATION_REASON_LABELS,
  RECONCILIATION_STATUS_LABELS,
} from "@/data/snapshotTypes";
import {
  approveReconciliation,
  computeVarianceSummary,
  createReconciliation,
  deleteReconciliation,
  generateSnapshotsForDay,
  isoDate,
  listMovementsForSnapshot,
  listReconciliations,
  querySnapshots,
  rejectReconciliation,
  saveReconciliationDraft,
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

const reconStatusColor: Record<ReconciliationStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  IN_REVIEW: "bg-warning/15 text-warning",
  APPROVED: "bg-info/15 text-info",
  REJECTED: "bg-destructive/15 text-destructive",
  POSTED: "bg-success/15 text-success",
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
  const [countSession, setCountSession] = useState<
    | { mode: "new"; outletId?: string; date: string }
    | { mode: "continue"; reconciliation: InventoryReconciliation }
    | null
  >(null);
  const [reviewRecon, setReviewRecon] = useState<InventoryReconciliation | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<InventoryReconciliation | null>(null);

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

  const handleDelete = (r: InventoryReconciliation) => {
    try {
      deleteReconciliation(r.id);
      toast.success(`Draft ${r.reference} deleted`);
      setConfirmDelete(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not delete");
    }
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
          <Button
            className="gap-1.5"
            onClick={() => setCountSession({
              mode: "new",
              outletId: locationId === "all" ? outlets[0]?.id : locationId,
              date: today,
            })}
          >
            <ClipboardCheck className="h-4 w-4" /> Start Stock Count
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiTile icon={<History className="h-5 w-5 text-accent" />} label="Snapshots in range" value={snapshots.length.toString()} tone="accent" />
        <KpiTile icon={<AlertTriangle className="h-5 w-5 text-warning" />} label="Items w/ variance" value={variance.countedSnapshots.toString()} tone="warning" />
        <KpiTile icon={<Clock className="h-5 w-5 text-info" />} label="Open counts" value={variance.pendingReconciliations.toString()} tone="info" />
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
          { key: "reconciliation", label: `Stock Counts (${reconciliations.length})` },
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
        <ReconciliationList
          items={reconciliations}
          onContinue={(r) => setCountSession({ mode: "continue", reconciliation: r })}
          onReview={setReviewRecon}
          onDelete={setConfirmDelete}
        />
      )}

      {tab === "variance" && (
        <VarianceReview snapshots={snapshots.filter((s) => s.varianceQty !== 0)} onDrill={setDrillSnap} />
      )}

      <MovementDrillDialog snap={drillSnap} onClose={() => setDrillSnap(null)} />
      <StockCountDialog
        session={countSession}
        onOpenChange={(o) => { if (!o) setCountSession(null); }}
        onChanged={refresh}
      />
      <ReconciliationReviewDialog
        recon={reviewRecon} onClose={() => setReviewRecon(null)}
        onContinue={(r) => { setReviewRecon(null); setCountSession({ mode: "continue", reconciliation: r }); }}
      />
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete draft count?</AlertDialogTitle>
            <AlertDialogDescription>
              Reference <b>{confirmDelete?.reference}</b> will be permanently removed.
              No inventory adjustments will be posted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

const HEADER_TOOLTIPS: Record<string, string> = {
  Date: "Business date for this stock snapshot.",
  Item: "Inventory item name and SKU.",
  Outlet: "Location where stock is held.",
  Open: "Stock quantity at the start of the business day.",
  "+Recv": "Quantity received from purchases or goods-received notes.",
  "−Sold": "Quantity sold through the POS during the day.",
  "+Ret": "Quantity returned by customers and added back to stock.",
  "−Wast": "Quantity wasted, spoiled, or damaged.",
  "±Adj": "Net quantity from manual stock adjustments.",
  "+T-In": "Quantity transferred in from other outlets or warehouses.",
  "−T-Out": "Quantity transferred out to other outlets or warehouses.",
  Expected: "Computed closing stock (Open + In − Out).",
  Actual: "Physically counted stock during reconciliation.",
  "Var Qty": "Difference between Actual and Expected quantity.",
  "Var Cost": "Monetary value of the variance at unit cost.",
};

function Th({ label }: { label: string }) {
  const tip = HEADER_TOOLTIPS[label];
  return (
    <th className="text-left p-2.5">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 cursor-help">
              {label}
              <HelpCircle className="h-3 w-3 text-muted-foreground opacity-60" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs">{tip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </th>
  );
}

function ThNum({ label }: { label: string }) {
  const tip = HEADER_TOOLTIPS[label];
  return (
    <th className="text-right p-2.5">
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 cursor-help justify-end">
              {label}
              <HelpCircle className="h-3 w-3 text-muted-foreground opacity-60" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-xs">{tip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </th>
  );
}

// ── History table ──
function HistoryTable({ snapshots, onDrill }:
  { snapshots: DailyInventorySnapshot[]; onDrill: (s: DailyInventorySnapshot) => void }) {
  const {
    page, setPage, perPage, setPerPage, totalPages,
    paginatedItems, totalItems, pageSizeOptions,
  } = usePagination(snapshots, 20);

  if (!snapshots.length) {
    return <Card className="p-8 text-center text-muted-foreground">No snapshots match these filters.</Card>;
  }

  return (
    <Card className="overflow-hidden space-y-0">
      <div className="p-3 border-b bg-muted/30">
        <PaginationControls
          page={page}
          totalPages={totalPages}
          perPage={perPage}
          totalItems={totalItems}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b text-xs uppercase tracking-wide">
            <tr>
              <Th label="Date" />
              <Th label="Item" />
              <Th label="Outlet" />
              <ThNum label="Open" />
              <ThNum label="+Recv" />
              <ThNum label="−Sold" />
              <ThNum label="+Ret" />
              <ThNum label="−Wast" />
              <ThNum label="±Adj" />
              <ThNum label="+T-In" />
              <ThNum label="−T-Out" />
              <ThNum label="Expected" />
              <ThNum label="Actual" />
              <ThNum label="Var Qty" />
              <ThNum label="Var Cost" />
              <th className="p-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((s) => {
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
      <div className="p-3 border-t bg-muted/30">
        <PaginationControls
          page={page}
          totalPages={totalPages}
          perPage={perPage}
          totalItems={totalItems}
          pageSizeOptions={pageSizeOptions}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
        />
      </div>
    </Card>
  );
}

// ── Stock count list ──
function ReconciliationList({ items, onContinue, onReview, onDelete }:
  {
    items: InventoryReconciliation[];
    onContinue: (r: InventoryReconciliation) => void;
    onReview: (r: InventoryReconciliation) => void;
    onDelete: (r: InventoryReconciliation) => void;
  }) {
  if (!items.length) {
    return <Card className="p-8 text-center text-muted-foreground">
      No stock counts yet. Click <b>Start Stock Count</b> to begin.
    </Card>;
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
              <th className="text-left p-3 min-w-[180px]">Progress</th>
              <th className="text-right p-3">Net Var Qty</th>
              <th className="text-right p-3">Net Var Cost</th>
              <th className="text-left p-3">Updated</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => {
              const editable = r.status === "DRAFT" || r.status === "REJECTED";
              const reviewable = r.status === "IN_REVIEW";
              const finalized = r.status === "APPROVED" || r.status === "POSTED";
              const ts = r.updatedAt ?? r.submittedAt ?? r.createdAt;
              return (
                <tr key={r.id} className="border-b hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{r.reference}</td>
                  <td className="p-3">{r.outletName}</td>
                  <td className="p-3">{r.date}</td>
                  <td className="p-3">
                    <Badge variant="secondary" className={cn("text-xs", reconStatusColor[r.status])}>
                      {RECONCILIATION_STATUS_LABELS[r.status]}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 min-w-[160px]">
                      <Progress value={r.progress.pct} className="h-2 flex-1" />
                      <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                        {r.progress.counted}/{r.progress.total}
                      </span>
                    </div>
                    {r.progress.skipped > 0 && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {r.progress.skipped} skipped · {r.progress.pending} pending
                      </div>
                    )}
                  </td>
                  <td className={cn("p-3 text-right font-medium", r.totals.varianceQty < 0 ? "text-destructive" : r.totals.varianceQty > 0 ? "text-warning" : "")}>
                    {r.totals.varianceQty > 0 ? "+" : ""}{r.totals.varianceQty}
                  </td>
                  <td className="p-3 text-right">{formatNaira(r.totals.varianceCost)}</td>
                  <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                    {format(new Date(ts), "MMM d, HH:mm")}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {editable && (
                        <Button variant="default" size="sm" className="h-7 text-xs gap-1" onClick={() => onContinue(r)}>
                          <Play className="h-3 w-3" /> Continue
                        </Button>
                      )}
                      {reviewable && (
                        <Button variant="default" size="sm" className="h-7 text-xs" onClick={() => onReview(r)}>
                          Review
                        </Button>
                      )}
                      {finalized && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onReview(r)}>
                          View
                        </Button>
                      )}
                      {editable && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive gap-1" onClick={() => onDelete(r)}>
                          <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
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

// ── Counting session dialog (new + continue) ──
type CountFilter = "all" | "pending" | "counted" | "skipped" | "variance";

interface LocalCount {
  actualQty: string;       // empty string when not counted
  skipped: boolean;
  reasonCode?: ReconciliationReason;
  reasonNote?: string;
}

function StockCountDialog({
  session, onOpenChange, onChanged,
}: {
  session:
    | { mode: "new"; outletId?: string; date: string }
    | { mode: "continue"; reconciliation: InventoryReconciliation }
    | null;
  onOpenChange: (o: boolean) => void;
  onChanged: () => void;
}) {
  const open = !!session;
  const isContinue = session?.mode === "continue";

  const [outletId, setOutletId] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [counts, setCounts] = useState<Record<string, LocalCount>>({});
  const [notes, setNotes] = useState("");
  const [reconciliationId, setReconciliationId] = useState<string | null>(null);
  const [filter, setFilter] = useState<CountFilter>("all");
  const [search, setSearch] = useState("");

  // Initialize when opened
  useEffect(() => {
    if (!session) return;
    if (session.mode === "continue") {
      const r = session.reconciliation;
      setOutletId(r.outletId);
      setDate(r.date);
      setNotes(r.notes ?? "");
      setReconciliationId(r.id);
      const map: Record<string, LocalCount> = {};
      for (const l of r.lines) {
        map[l.snapshotId] = {
          actualQty: l.counted ? String(l.actualQty) : "",
          skipped: l.skipped,
          reasonCode: l.reasonCode,
          reasonNote: l.reasonNote,
        };
      }
      setCounts(map);
    } else {
      setOutletId(session.outletId ?? outlets[0]?.id ?? "");
      setDate(session.date);
      setNotes("");
      setReconciliationId(null);
      setCounts({});
    }
    setFilter("all");
    setSearch("");
  }, [session]);

  // Available snapshots for new sessions; locked once draft exists
  const snapshots = useMemo(() => {
    if (!outletId || !date) return [] as DailyInventorySnapshot[];
    if (isContinue && session?.mode === "continue") {
      // Build snapshot list matching the recon's lines
      const r = session.reconciliation;
      const all = querySnapshots({ locationId: outletId, fromDate: date, toDate: date });
      const byId = new Map(all.map((s) => [s.id, s]));
      return r.lines
        .map((l) => byId.get(l.snapshotId))
        .filter((s): s is DailyInventorySnapshot => !!s)
        .sort((a, b) => a.itemName.localeCompare(b.itemName));
    }
    let snaps = querySnapshots({ locationId: outletId, fromDate: date, toDate: date });
    if (snaps.length === 0) snaps = generateSnapshotsForDay(date, outletId);
    return snaps.sort((a, b) => a.itemName.localeCompare(b.itemName));
  }, [outletId, date, isContinue, session]);

  const totals = useMemo(() => {
    let counted = 0, skipped = 0;
    for (const s of snapshots) {
      const e = counts[s.id];
      if (!e) continue;
      if (e.skipped) skipped += 1;
      else if (e.actualQty !== "" && !isNaN(Number(e.actualQty))) counted += 1;
    }
    const total = snapshots.length;
    const pending = Math.max(0, total - counted - skipped);
    const pct = total > 0 ? Math.round((counted / total) * 100) : 0;
    return { total, counted, skipped, pending, pct };
  }, [snapshots, counts]);

  const filteredSnapshots = useMemo(() => {
    const term = search.trim().toLowerCase();
    return snapshots.filter((s) => {
      if (term && !`${s.itemName} ${s.sku}`.toLowerCase().includes(term)) return false;
      const e = counts[s.id];
      const isCounted = !!e && !e.skipped && e.actualQty !== "" && !isNaN(Number(e.actualQty));
      const isSkipped = !!e?.skipped;
      const isPending = !isCounted && !isSkipped;
      const hasVariance = isCounted && Number(e!.actualQty) - s.expectedClosingQty !== 0;
      if (filter === "pending" && !isPending) return false;
      if (filter === "counted" && !isCounted) return false;
      if (filter === "skipped" && !isSkipped) return false;
      if (filter === "variance" && !hasVariance) return false;
      return true;
    });
  }, [snapshots, counts, filter, search]);

  const setCount = (snapshotId: string, patch: Partial<LocalCount>) => {
    setCounts((c) => ({ ...c, [snapshotId]: { actualQty: "", skipped: false, ...c[snapshotId], ...patch } }));
  };

  const collectCounts = () =>
    snapshots.map((s) => {
      const e = counts[s.id];
      if (!e) return { snapshotId: s.id, actualQty: undefined };
      if (e.skipped) return { snapshotId: s.id, skipped: true };
      if (e.actualQty === "" || isNaN(Number(e.actualQty))) {
        return { snapshotId: s.id, actualQty: undefined };
      }
      return {
        snapshotId: s.id,
        actualQty: Number(e.actualQty),
        reasonCode: e.reasonCode,
        reasonNote: e.reasonNote,
      };
    });

  const handleSaveDraft = () => {
    try {
      if (reconciliationId) {
        const r = saveReconciliationDraft({
          reconciliationId,
          counts: collectCounts(),
          notes,
        });
        toast.success(`Draft ${r.reference} saved (${r.progress.counted}/${r.progress.total} counted)`);
      } else {
        const r = createReconciliation({
          outletId, date,
          counts: collectCounts(),
          notes,
        });
        setReconciliationId(r.id);
        toast.success(`Draft ${r.reference} saved (${r.progress.counted}/${r.progress.total} counted)`);
      }
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save draft");
    }
  };

  const handleSubmit = () => {
    if (totals.counted === 0) { toast.error("Count at least one item before submitting"); return; }
    try {
      let id = reconciliationId;
      if (id) {
        saveReconciliationDraft({ reconciliationId: id, counts: collectCounts(), notes });
      } else {
        const r = createReconciliation({ outletId, date, counts: collectCounts(), notes });
        id = r.id;
      }
      submitReconciliation(id!);
      toast.success("Count submitted for review");
      onOpenChange(false);
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not submit");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 sm:p-6 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            {isContinue ? `Continue Count · ${session?.mode === "continue" ? session.reconciliation.reference : ""}` : "New Physical Stock Count"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 sm:px-6 py-3 border-b space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Outlet *</Label>
              <Select value={outletId} onValueChange={setOutletId} disabled={isContinue}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {outlets.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Business Date *</Label>
              <Input type="date" className="h-9" value={date} onChange={(e) => setDate(e.target.value)} disabled={isContinue} />
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Progress · <b className="text-foreground">{totals.counted}</b> counted ·{" "}
                <b className="text-foreground">{totals.skipped}</b> skipped ·{" "}
                <b className="text-foreground">{totals.pending}</b> pending
              </span>
              <span className="font-mono">{totals.pct}%</span>
            </div>
            <Progress value={totals.pct} className="h-2" />
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="h-9 pl-8" placeholder="Search item or scan barcode…"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 bg-muted p-1 rounded-md text-xs overflow-x-auto">
              {([
                { k: "all", l: `All (${snapshots.length})` },
                { k: "pending", l: `Pending (${totals.pending})` },
                { k: "counted", l: `Counted (${totals.counted})` },
                { k: "skipped", l: `Skipped (${totals.skipped})` },
                { k: "variance", l: "Variance" },
              ] as { k: CountFilter; l: string }[]).map((f) => (
                <button
                  key={f.k}
                  onClick={() => setFilter(f.k)}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs whitespace-nowrap font-medium transition-colors",
                    filter === f.k ? "bg-card shadow-sm" : "text-muted-foreground"
                  )}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lines */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b sticky top-0 z-10">
              <tr>
                <th className="text-left p-2">Item</th>
                <th className="text-right p-2 w-20">Expected</th>
                <th className="text-right p-2 w-28">Counted</th>
                <th className="text-right p-2 w-20">Variance</th>
                <th className="text-left p-2 w-40">Reason</th>
                <th className="text-center p-2 w-16">Status</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredSnapshots.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">
                  {snapshots.length === 0
                    ? "No items at this outlet for the selected date."
                    : "No items match this filter."}
                </td></tr>
              )}
              {filteredSnapshots.map((s) => {
                const entry = counts[s.id] ?? { actualQty: "", skipped: false } as LocalCount;
                const actual = Number(entry.actualQty);
                const hasVal = !entry.skipped && entry.actualQty !== "" && !isNaN(actual);
                const variance = hasVal ? actual - s.expectedClosingQty : 0;
                return (
                  <tr key={s.id} className={cn("border-b hover:bg-muted/30",
                    entry.skipped && "bg-muted/20",
                    hasVal && variance === 0 && "bg-success/5",
                    hasVal && variance !== 0 && "bg-warning/5",
                  )}>
                    <td className="p-2">
                      <div className="font-medium">{s.itemName}</div>
                      <div className="text-[10px] text-muted-foreground">{s.sku}</div>
                    </td>
                    <td className="p-2 text-right tabular-nums">{s.expectedClosingQty}</td>
                    <td className="p-2">
                      <Input
                        type="number" step="0.01" inputMode="decimal"
                        className="h-8 text-right tabular-nums"
                        value={entry.actualQty}
                        disabled={entry.skipped}
                        placeholder="—"
                        onChange={(e) => setCount(s.id, { actualQty: e.target.value, skipped: false })}
                      />
                    </td>
                    <td className={cn("p-2 text-right font-medium tabular-nums",
                      hasVal && variance !== 0 && (variance < 0 ? "text-destructive" : "text-warning"))}>
                      {hasVal && variance !== 0 ? (variance > 0 ? `+${variance}` : variance) : "—"}
                    </td>
                    <td className="p-2">
                      {hasVal && variance !== 0 ? (
                        <Select
                          value={entry.reasonCode ?? ""}
                          onValueChange={(v) => setCount(s.id, { reasonCode: v as ReconciliationReason })}
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
                    <td className="p-2 text-center">
                      {entry.skipped ? (
                        <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">Skipped</Badge>
                      ) : hasVal ? (
                        <Badge variant="secondary" className="text-[10px] bg-success/15 text-success">Counted</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                      )}
                    </td>
                    <td className="p-2">
                      {entry.skipped ? (
                        <Button
                          variant="ghost" size="sm" className="h-7 w-7 p-0"
                          title="Clear skip"
                          onClick={() => setCount(s.id, { skipped: false })}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground"
                          title="Skip item"
                          onClick={() => setCount(s.id, { skipped: true, actualQty: "" })}
                        >
                          <SkipForward className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-6 py-3 border-t">
          <Label className="text-xs">Notes</Label>
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes for the reviewer" />
        </div>

        <DialogFooter className="p-4 sm:p-6 pt-3 border-t gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="secondary" onClick={handleSaveDraft}>Save Draft</Button>
          <Button onClick={handleSubmit} disabled={totals.counted === 0}>
            Submit for Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Reconciliation review / approval dialog ──
function ReconciliationReviewDialog({ recon, onClose, onContinue }:
  {
    recon: InventoryReconciliation | null;
    onClose: () => void;
    onContinue: (r: InventoryReconciliation) => void;
  }) {
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => { if (!recon) setRejectReason(""); }, [recon]);

  if (!recon) return null;
  const inReview = recon.status === "IN_REVIEW";
  const editable = recon.status === "DRAFT" || recon.status === "REJECTED";

  return (
    <Dialog open={!!recon} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {recon.reference}
            <Badge variant="secondary" className={cn("text-xs", reconStatusColor[recon.status])}>
              {RECONCILIATION_STATUS_LABELS[recon.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-muted/30 rounded-lg p-3">
          <Metric label="Outlet" value={recon.outletName} />
          <Metric label="Business date" value={recon.date} />
          <Metric label="Lines counted" value={`${recon.progress.counted}/${recon.progress.total}`} />
          <Metric label="Net variance value" value={formatNaira(recon.totals.varianceCost)} />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Count progress</span>
            <span className="font-mono">{recon.progress.pct}%</span>
          </div>
          <Progress value={recon.progress.pct} className="h-2" />
        </div>

        <div className="max-h-[360px] overflow-auto border rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b sticky top-0">
              <tr>
                <th className="text-left p-2">Item</th>
                <th className="text-right p-2">Expected</th>
                <th className="text-right p-2">Counted</th>
                <th className="text-right p-2">Variance</th>
                <th className="text-right p-2">Cost Impact</th>
                <th className="text-left p-2">Reason / Status</th>
              </tr>
            </thead>
            <tbody>
              {recon.lines.map((l: ReconciliationLine) => (
                <tr key={l.id} className="border-b">
                  <td className="p-2">
                    <div className="font-medium">{l.itemName}</div>
                    <div className="text-[10px] text-muted-foreground">{l.sku}</div>
                  </td>
                  <td className="p-2 text-right">{l.expectedQty}</td>
                  <td className="p-2 text-right">{l.counted ? l.actualQty : "—"}</td>
                  <td className={cn("p-2 text-right font-medium", l.varianceQty < 0 ? "text-destructive" : l.varianceQty > 0 ? "text-warning" : "")}>
                    {l.counted ? (l.varianceQty > 0 ? `+${l.varianceQty}` : l.varianceQty) : "—"}
                  </td>
                  <td className="p-2 text-right">{l.counted ? formatNaira(l.varianceCost) : "—"}</td>
                  <td className="p-2 text-muted-foreground">
                    {l.skipped ? <Badge variant="secondary" className="text-[10px]">Skipped</Badge>
                      : !l.counted ? <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                      : l.reasonCode ? RECONCILIATION_REASON_LABELS[l.reasonCode] : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recon.notes && <p className="text-xs text-muted-foreground"><b>Notes:</b> {recon.notes}</p>}
        {recon.rejectedReason && <p className="text-xs text-destructive"><b>Rejected:</b> {recon.rejectedReason}</p>}

        {inReview && (
          <div>
            <Label className="text-xs">Reject reason (required if rejecting)</Label>
            <Input className="h-9" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why this count is rejected" />
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {editable && (
            <Button onClick={() => onContinue(recon)} className="gap-1">
              <Play className="h-3.5 w-3.5" /> Continue Count
            </Button>
          )}
          {inReview && (
            <>
              <Button variant="destructive" onClick={() => {
                if (!rejectReason.trim()) { toast.error("Provide a reject reason"); return; }
                rejectReconciliation(recon.id, rejectReason.trim());
                toast.success("Count rejected — returned to drafter");
                onClose();
              }}>Reject Count</Button>
              <Button onClick={() => {
                approveReconciliation(recon.id);
                toast.success("Approved — adjustments posted to inventory");
                onClose();
              }}>Approve &amp; Post</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
