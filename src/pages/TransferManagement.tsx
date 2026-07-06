import { useEffect, useMemo, useState, useRef } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";;
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
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
import {
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ResuablePagination } from "@/components/ui/reusable-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, ArrowLeftRight, ArrowRight, Plus, Search, Trash2, Truck,
  PackageCheck, Send, ShieldCheck, ShieldX, X, Eye, History, AlertTriangle,
  Warehouse, Store as StoreIcon, ScanBarcode, Pencil, Info, Loader2,
} from "lucide-react";
import { useGetOutlets } from "@/services/api/outlets";
import { useGetInventoryItems } from "@/services/api/inventory/item";
import { api } from "@/services/api/base";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { useGetInventoryLocations, useGetInventoryMovements } from "@/services/api/inventory/live-inventory";
import {
  useGetTransfers,
  useGetTransfer,
  useCreateTransfer,
  useUpdateTransfer,
  useApproveTransfer,
  useCancelTransfer,
  useDispatchTransfer,
  useReceiveTransfer,
  useRejectTransfer,
  useSubmitTransfer,
  useDeleteTransfer,
} from "@/services/api/inventory/transfers";
import {
  type StockTransferV2, type TransferStatus, type TransferItem,
  type TransferLocation, type TransferReason, type ValuationStrategy,
  TRANSFER_STATUS_META, REASON_LABELS, ACTIVE_STATUSES,
} from "@/data/transferTypes";

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────
function useTransfers(params?: { status?: TransferStatus; page?: number; per_page?: number; search?: string }) {
  const { data: response, isLoading, mutate } = useGetTransfers(params);
  const transfers = useMemo(() => response?.data || [], [response]);
  const meta = response?.meta;
  return { transfers, meta, isLoading, mutate };
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
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState<"all" | TransferStatus>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);

  const { transfers: countTransfers } = useTransfers();
  const { transfers, meta, isLoading } = useTransfers({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: debouncedSearch.trim() || undefined,
    page,
    per_page: perPage,
  });
  const nav = useNavigate();

  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  const filtered = transfers;

  const counts = {
    active: countTransfers.filter((t) => ACTIVE_STATUSES.includes(t.status)).length,
    drafts: countTransfers.filter((t) => t.status === "DRAFT").length,
    received: countTransfers.filter((t) => t.status === "RECEIVED").length,
    pendingMine: countTransfers.filter((t) => t.status === "PENDING_APPROVAL").length,
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20 lg:pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">Stock Transfers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Move inventory between outlets, warehouses & branches with full audit
            </p>
          </div>
        </div>
        <Card className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading transfers...
        </Card>
      </div>
    );
  }

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
        <ResuablePagination
          currentPage={page}
          totalPages={meta?.last_page || 1}
          totalItems={meta?.total || 0}
          rowsPerPage={perPage}
          onPageChange={setPage}
          onRowsPerPageChange={(v) => {
            setPerPage(v);
            setPage(1);
          }}
          isLoading={isLoading}
          className="border-t border-border bg-card/20 rounded-b-lg"
        />
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
  const { data: outlets = [] } = useGetOutlets();
  const { data: warehouses } = useGetInventoryLocations();
  const locations = useMemo(() => {
    const outletLocs = outlets.map((o) => ({
      id: o.id,
      name: o.name,
      kind: "outlet" as const,
    }));

    const warehouseLocs =
      warehouses?.data?.map((w) => ({
        id: w.id,
        name: w.name,
        kind: w.kind as "warehouse",
      })) ?? [];

    return Array.from(
      new Map(
        [...outletLocs, ...warehouseLocs].map((location) => [
          location.id,
          location,
        ])
      ).values()
    );
  }, [outlets, warehouses]);

  const { data: existing, isLoading: isExistingLoading } = useGetTransfer(editId);
  const isEditing = Boolean(editId);

  const { trigger: triggerCreateTransfer, isMutating: isCreatingTransfer } = useCreateTransfer();
  const { trigger: triggerUpdateTransfer, isMutating: isUpdatingTransfer } = useUpdateTransfer();
  const { trigger: triggerSubmitTransfer, isMutating: isSubmittingTransfer } = useSubmitTransfer();
  const { trigger: triggerDeleteTransfer, isMutating: isDeletingTransfer } = useDeleteTransfer();

  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
  const [reason, setReason] = useState<TransferReason>("replenishment");
  const [notes, setNotes] = useState("");
  const [carrier, setCarrier] = useState("");
  const [search, setSearch] = useState("");
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerPerPage, setPickerPerPage] = useState(DEFAULT_PAGE_SIZE);

  type LineDraft = {
    itemId: string;
    qty: number;
    strategy: ValuationStrategy;
    customCost?: number;
    name: string;
    sku: string;
    stock: number;
    unitCost: number;
    unit: string;
  };
  const [lines, setLines] = useState<LineDraft[]>([]);

  // Fetch live inventory items for source outlet
  const { data: sourceInventoryRes, isLoading: isSourceInventoryLoading } = useGetInventoryItems(
    sourceId ? {
      outletId: sourceId,
      page: pickerPage,
      per_page: pickerPerPage,
      search: search.trim() || undefined
    } : undefined
  );

  // Fetch live inventory items for destination outlet
  const { data: destInventoryRes } = useGetInventoryItems(
    destId ? { outletId: destId, per_page: DEFAULT_PAGE_SIZE } : undefined
  );

  const allSourceItems = useMemo(() => {
    if (!sourceInventoryRes?.data) return [];
    return sourceInventoryRes.data.map((i) => ({
      id: i.id,
      name: i.name,
      sku: i.sku,
      stock: i.quantity,
      unitCost: i.costPrice,
      minStock: 0,
      unit: "unit",
    }));
  }, [sourceInventoryRes]);

  // Reset page to 1 when search query, source, or items per page change
  useEffect(() => {
    setPickerPage(1);
  }, [search, sourceId, pickerPerPage]);

  // Handle manual sourceId change (reset lines and pagination)
  const prevSourceIdRef = useRef("");
  useEffect(() => {
    const prevSourceId = prevSourceIdRef.current;
    if (sourceId && prevSourceId && sourceId !== prevSourceId) {
      setLines([]);
    }
    prevSourceIdRef.current = sourceId;
  }, [sourceId]);

  useEffect(() => {
    if (existing) {
      setSourceId(existing.source.id);
      setDestId(existing.destination.id);
      setReason(existing.reason);
      setNotes(existing.notes ?? "");
      setCarrier(existing.carrier ?? "");

      setLines(
        existing.items.map((it) => ({
          itemId: it.inventoryItemId,
          qty: it.requestedQty,
          strategy: it.valuationStrategy ?? "source",
          customCost: it.customUnitCost,
          name: it.itemName,
          sku: it.sku,
          stock: it.availableQty,
          unitCost: it.unitCost,
          unit: it.unit || "unit",
        }))
      );
    }
  }, [existing]);
  // Fetch transfers to compute live reserved quantities
  const { transfers: allTransfers } = useTransfers();

  const getLiveReservedQty = (outletId: string, itemId: string) => {
    let reserved = 0;
    for (const t of allTransfers) {
      if (t.source.id !== outletId) continue;
      if (!ACTIVE_STATUSES.includes(t.status)) continue;
      if (existing && t.id === existing.id) continue;
      for (const it of t.items) {
        if (it.inventoryItemId !== itemId) continue;
        const planned = t.status === "PENDING_APPROVAL" ? it.requestedQty : it.approvedQty;
        const remaining = Math.max(0, planned - it.dispatchedQty);
        reserved += remaining;
      }
    }
    return reserved;
  };

  const [discardOpen, setDiscardOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | "draft" | "submit">(null);

  // Guard: can only edit DRAFT transfers via this screen
  useEffect(() => {
    if (isEditing && !isExistingLoading) {
      if (!existing) {
        toast.error("Draft not found");
        nav("/inventory/transfers", { replace: true });
      } else if (existing.status !== "DRAFT") {
        toast.error("Only draft transfers can be edited");
        nav(`/inventory/transfers/${existing.id}`, { replace: true });
      }
    }
  }, [isEditing, existing, isExistingLoading, nav]);

  if (editId && isExistingLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => nav("/inventory/transfers")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Card className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading draft transfer...
        </Card>
      </div>
    );
  }

  const sourceItems = sourceId ? allSourceItems : [];

  const addLine = (itemId: string) => {
    const item = allSourceItems.find((x) => x.id === itemId);
    if (!item) return;
    setLines((prev) =>
      prev.find((l) => l.itemId === itemId)
        ? prev
        : [
            ...prev,
            {
              itemId,
              qty: 1,
              strategy: "source",
              name: item.name,
              sku: item.sku,
              stock: item.stock,
              unitCost: item.unitCost,
              unit: item.unit || "unit",
            },
          ]
    );
  };
  const updateQty = (itemId: string, qty: number) =>
    setLines((prev) => prev.map((l) => l.itemId === itemId ? { ...l, qty } : l));
  const updateStrategy = (itemId: string, strategy: ValuationStrategy) =>
    setLines((prev) => prev.map((l) => l.itemId === itemId ? { ...l, strategy } : l));
  const updateCustomCost = (itemId: string, customCost: number) =>
    setLines((prev) => prev.map((l) => l.itemId === itemId ? { ...l, customCost } : l));
  const removeLine = (itemId: string) =>
    setLines((prev) => prev.filter((l) => l.itemId !== itemId));

  const onDiscard = () => {
    if (!existing) { nav("/inventory/transfers"); return; }
    setDiscardOpen(true);
  };
  const confirmDiscard = async () => {
    if (!existing) return;
    try {
      await triggerDeleteTransfer(existing.id);
      toast.success("Draft discarded");
      nav("/inventory/transfers");
    } catch (e) {
      // Handled
    }
  };

  const onSave = async (submit: boolean) => {
    if (!sourceId || !destId) return toast.error("Select source and destination");
    if (sourceId === destId) return toast.error("Source and destination must differ");
    if (submit && lines.length === 0) return toast.error("Add at least one item");

    const src = locations.find((l) => l.id === sourceId)!;
    const dst = locations.find((l) => l.id === destId)!;

    // Validate stock
    const items = [];
    for (const l of lines) {
      const reserved = getLiveReservedQty(sourceId, l.itemId);
      const transferable = Math.max(0, l.stock - reserved);
      if (submit) {
        if (l.qty <= 0) return toast.error(`Quantity for ${l.name} must be > 0`);
        if (l.qty > transferable) return toast.error(`${l.name}: only ${transferable} transferable`);
        if (l.strategy === "custom" && (!l.customCost || l.customCost <= 0)) {
          return toast.error(`${l.name}: enter a valid custom unit cost`);
        }
      }
      items.push({
        inventoryItemId: l.itemId,
        requestedQty: Math.max(0, l.qty || 0),
        unit: l.unit || "unit",
      });
    }

    if (isEditing && existing) {
      try {
        await triggerUpdateTransfer({ id: existing.id, payload: { notes: notes.trim() } });
        if (submit) {
          await triggerSubmitTransfer(existing.id);
          toast.success("Transfer submitted for approval");
        } else {
          toast.success("Draft updated");
        }
        nav(`/inventory/transfers/${existing.id}`);
      } catch (e) {
        // Handled
      }
    } else {
      try {
        const payload = {
          source: src,
          destination: dst,
          reason,
          notes: notes.trim(),
          items,
          submit,
        };
        const created = await triggerCreateTransfer(payload);
        toast.success(submit ? "Transfer submitted for approval" : "Draft saved");
        nav(`/inventory/transfers/${created.id}`);
      } catch (e) {
        // Handled
      }
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
                  <SelectItem key={`source-${l.id}`} value={l.id}>
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
                  <SelectItem key={`dest-${l.id}`} value={l.id}>
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
            <div className="border rounded-lg flex flex-col overflow-hidden">
              <div className="max-h-64 overflow-auto">
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
                    {isSourceInventoryLoading ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={`skeleton-${idx}`} className="border-t animate-pulse">
                          <td className="p-2">
                            <Skeleton className="h-4 w-2/3 mb-1" />
                            <Skeleton className="h-3 w-1/3" />
                          </td>
                          <td className="p-2"><Skeleton className="h-4 w-20" /></td>
                          <td className="p-2 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                          <td className="p-2 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                          <td className="p-2 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                          <td className="p-2 text-right"><Skeleton className="h-7 w-16 ml-auto" /></td>
                        </tr>
                      ))
                    ) : sourceItems.length === 0 ? (
                      <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">No items.</td></tr>
                    ) : (
                      sourceItems.map((i) => {
                        const reserved = getLiveReservedQty(sourceId, i.id);
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
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <ResuablePagination
                currentPage={pickerPage}
                totalPages={sourceInventoryRes?.meta?.last_page || 1}
                onPageChange={setPickerPage}
                totalItems={sourceInventoryRes?.meta?.total || 0}
                rowsPerPage={pickerPerPage}
                onRowsPerPageChange={setPickerPerPage}
                rowsPerPageOptions={[5, 10, 20]}
                className="border-t border-border bg-card/20 rounded-b-lg"
              />
            </div>

            {/* Selected lines */}
            {lines.length > 0 && (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <TooltipProvider>
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 font-medium">Selected Item</th>
                        <th className="text-right p-2 font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-help">
                                Transferable <Info className="h-3 w-3 text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Quantity available to transfer after accounting for reservations.</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-right p-2 font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-help">
                                Qty <Info className="h-3 w-3 text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Quantity you want to transfer.</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-right p-2 font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-help">
                                Dest. Qty <Info className="h-3 w-3 text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Current available quantity of this item at the destination outlet.</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-right p-2 font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-help">
                                Source Cost <Info className="h-3 w-3 text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Current weighted average cost (WAC) of this item at the source outlet.</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-left p-2 font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-help">
                                Valuation <Info className="h-3 w-3 text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Choose whether to use the source WAC or a custom cost for this transfer.</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-right p-2 font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-help">
                                Incoming Cost <Info className="h-3 w-3 text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Unit cost that will be applied to this incoming stock at the destination.</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-right p-2 font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-help">
                                Expected Dest. Cost <Info className="h-3 w-3 text-muted-foreground" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Projected destination WAC after receiving this transfer.</TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="p-2" />
                      </tr>
                    </thead>
                  </TooltipProvider>
                  <tbody>
                    {lines.map((l) => {
                      const reserved = getLiveReservedQty(sourceId, l.itemId);
                      const transferable = Math.max(0, l.stock - reserved);
                      const destItem = destId ? destInventoryRes?.data?.find((x) => x.id === l.itemId || x.sku === l.sku) : null;
                      const destQty = destItem ? (destItem.quantity ?? destItem.stock ?? 0) : 0;
                      const destWac = destItem ? (destItem.costPrice ?? 0) : 0;
                      const incomingCost = l.strategy === "custom" && l.customCost ? l.customCost : l.unitCost;
                      const totalQty = destQty + Math.max(0, l.qty || 0);
                      const projected = totalQty > 0
                        ? ((destQty * destWac) + (Math.max(0, l.qty || 0) * incomingCost)) / totalQty
                        : incomingCost;
                      return (
                        <tr key={l.itemId} className="border-t align-top">
                          <td className="p-2">
                            <div className="font-medium">{l.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{l.sku}</div>
                          </td>
                          <td className="p-2 text-right">{transferable}</td>
                          <td className="p-2 text-right">
                            <NumericInput min={0.1} max={transferable} value={l.qty}
                              onChange={(val) => updateQty(l.itemId, val || 0)}
                              className="h-8 w-20 ml-auto text-right" />
                          </td>
                          <td className="p-2 text-right">
                            {destId ? destQty : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="p-2 text-right">₦{l.unitCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                          <td className="p-2">
                            <Select value={l.strategy} onValueChange={(v) => updateStrategy(l.itemId, v as ValuationStrategy)}>
                              <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="source">Source WAC</SelectItem>
                                <SelectItem value="custom">Custom Cost</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2 text-right">
                            {l.strategy === "custom" ? (
                              <NumericInput min={0} step={0.01} precision={2} value={l.customCost ?? 0}
                                placeholder="Cost"
                                onChange={(val) => updateCustomCost(l.itemId, val || 0)}
                                className="h-8 w-28 ml-auto text-right" />
                            ) : (
                              <span className="text-muted-foreground">₦{l.unitCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            )}
                          </td>
                          <td className="p-2 text-right font-medium text-info">
                            {destId ? `₦${projected.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : <span className="text-muted-foreground">—</span>}
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
        <Button
          variant="outline"
          onClick={() => setConfirmAction("draft")}
          disabled={isCreatingTransfer || isUpdatingTransfer || isSubmittingTransfer || isDeletingTransfer}
        >
          {isEditing ? "Save Draft" : "Save as Draft"}
        </Button>
        <Button
          onClick={() => setConfirmAction("submit")}
          className="gap-1.5"
          disabled={isCreatingTransfer || isUpdatingTransfer || isSubmittingTransfer || isDeletingTransfer}
        >
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
            <AlertDialogCancel onClick={() => setDiscardOpen(false)} disabled={isDeletingTransfer}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeletingTransfer}
            >
              {isDeletingTransfer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Draft / Submit */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "draft" ? (isEditing ? "Update Draft?" : "Save as Draft?") : "Submit for Approval?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "draft"
                ? (isEditing ? "This will overwrite the existing draft with your changes." : "This will save the transfer as a draft you can edit later.")
                : "This will submit the transfer for approval. You won't be able to edit it afterwards."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAction(null)} disabled={isCreatingTransfer || isUpdatingTransfer || isSubmittingTransfer}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onSave(confirmAction === "submit"); setConfirmAction(null); }}
              disabled={isCreatingTransfer || isUpdatingTransfer || isSubmittingTransfer}
            >
              {(isCreatingTransfer || isUpdatingTransfer || isSubmittingTransfer) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmAction === "draft" ? "Save Draft" : "Submit"}
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
  const { data: t, isLoading, mutate } = useGetTransfer(id);
  const [actionDialog, setActionDialog] = useState<null | "approve" | "reject" | "dispatch" | "receive" | "cancel">(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const { data: movementsResponse } = useGetInventoryMovements();
  const movements = useMemo(() => {
    if (!movementsResponse?.data) return [];
    return movementsResponse.data.map((m: any) => {
      const transferItem = t?.items?.find((ti: any) => ti.inventoryItemId === m.inventoryItemId);
      return {
        id: m.id,
        transferId: m.transferId || id,
        type: m.type || "TRANSFER_OUT",
        itemName: m.itemName || transferItem?.itemName || "Unknown Item",
        quantity: m.quantity || 0,
        balanceAfter: m.balanceAfter || 0,
      };
    });
  }, [movementsResponse, t, id]);

  const { trigger: triggerSubmitTransfer, isMutating: isSubmitting } = useSubmitTransfer();
  const { trigger: triggerDeleteTransfer, isMutating: isDeleting } = useDeleteTransfer();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => nav("/inventory/transfers")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <Card className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading transfer details...
        </Card>
      </div>
    );
  }

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
    cancel: t.status !== "DRAFT" && !["RECEIVED", "CANCELLED", "REJECTED"].includes(t.status),
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
              <h1 className="text-xl font-bold font-mono">{t.reference}</h1>
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
                onClick={() => setConfirmSubmit(true)}>
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
                <th className="text-right p-3 font-medium" title="Cost used to recompute destination WAC">Incoming Cost</th>
                <th className="text-right p-3 font-medium" title="Destination WAC before this transfer">Dest. WAC (before)</th>
                <th className="text-right p-3 font-medium" title="Destination WAC after this transfer">Dest. WAC (after)</th>
                <th className="text-right p-3 font-medium">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {t.items.map((it) => {
                const incoming = typeof it.incomingUnitCost === "number"
                  ? it.incomingUnitCost
                  : (it.valuationStrategy === "custom" && it.customUnitCost ? it.customUnitCost : it.unitCost);
                const strategyLabel = it.valuationStrategy === "custom" ? "Custom" : "Source WAC";
                return (
                  <tr key={it.id} className="border-b">
                    <td className="p-3">
                      <div className="font-medium">{it.itemName}</div>
                      <div className="text-xs text-muted-foreground font-mono">{it.sku} · {it.unit}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Valuation: {strategyLabel}</div>
                    </td>
                    <td className="p-3 text-right">{it.requestedQty}</td>
                    <td className="p-3 text-right">{it.approvedQty}</td>
                    <td className="p-3 text-right">{it.dispatchedQty}</td>
                    <td className="p-3 text-right text-success">{it.receivedQty}</td>
                    <td className="p-3 text-right text-destructive">{it.damagedQty}</td>
                    <td className={cn("p-3 text-right", it.varianceQty !== 0 && "text-warning font-medium")}>
                      {it.varianceQty}
                    </td>
                    <td className="p-3 text-right">₦{incoming.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right text-muted-foreground">
                      {typeof it.destWacBefore === "number" ? `₦${it.destWacBefore.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                    </td>
                    <td className="p-3 text-right font-medium text-info">
                      {typeof it.destWacAfter === "number" ? `₦${it.destWacAfter.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
                    </td>
                    <td className="p-3 text-right text-muted-foreground">
                      ₦{(incoming * (it.dispatchedQty || it.approvedQty || it.requestedQty)).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
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
                {movements.filter((m) => m.transferId === t.id).map((m) => (
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
                {movements.filter((m) => m.transferId === t.id).length === 0 && (
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
        onChanged={mutate}
      />

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the draft transfer. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDiscardOpen(false)} disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await triggerDeleteTransfer(t.id);
                  toast.success("Draft discarded");
                  nav("/inventory/transfers");
                } catch (e) {
                  // Handled
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Submit from details page */}
      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit for Approval?</AlertDialogTitle>
            <AlertDialogDescription>
              This will submit the transfer for approval. You won't be able to edit it afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmSubmit(false)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                try {
                  await triggerSubmitTransfer(t.id);
                  toast.success("Submitted");
                  setConfirmSubmit(false);
                  mutate();
                } catch (e) {
                  // Handled
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Action dialogs (approve / reject / dispatch / receive / cancel)
// ─────────────────────────────────────────────────────────────────────────────
function ActionDialog({
  kind, transfer, onClose, onChanged,
}: {
  kind: null | "approve" | "reject" | "dispatch" | "receive" | "cancel";
  transfer: StockTransferV2;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [approvals, setApprovals] = useState<Record<string, number>>({});
  const [dispatches, setDispatches] = useState<Record<string, number>>({});
  const [receipts, setReceipts] = useState<Record<string, { received: number; damaged: number; notes?: string }>>({});
  const [reason, setReason] = useState("");
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const { trigger: triggerApprove, isMutating: isApproving } = useApproveTransfer();
  const { trigger: triggerReject, isMutating: isRejecting } = useRejectTransfer();
  const { trigger: triggerDispatch, isMutating: isDispatching } = useDispatchTransfer();
  const { trigger: triggerReceive, isMutating: isReceiving } = useReceiveTransfer();
  const { trigger: triggerCancel, isMutating: isCancelling } = useCancelTransfer();

  const isMutating = isApproving || isRejecting || isDispatching || isReceiving || isCancelling;
  useEffect(() => {
    if (!kind) return;
    setApprovals(Object.fromEntries(transfer.items.map((i) => [i.id, i.requestedQty])));
    setDispatches(Object.fromEntries(transfer.items.map((i) => [i.id, i.approvedQty])));
    setReceipts(Object.fromEntries(transfer.items.map((i) =>
      [i.id, { received: Math.max(0, i.dispatchedQty - i.receivedQty - i.damagedQty), damaged: 0, notes: "" }])));
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

  const submit = async () => {
    try {
      if (kind === "approve") {
        await triggerApprove({ id: transfer.id, payload: { lineApprovals: approvals } });
      }
      if (kind === "reject") {
        if (!reason.trim()) return toast.error("Reason required");
        await triggerReject({ id: transfer.id, payload: { reason: reason.trim() } });
      }
      if (kind === "dispatch") {
        await triggerDispatch({
          id: transfer.id,
          payload: { dispatchQtys: dispatches, carrier: carrier.trim(), trackingNumber: tracking.trim() }
        });
      }
      if (kind === "receive") {
        await triggerReceive({ id: transfer.id, payload: { receipts } });
      }
      if (kind === "cancel") {
        if (!reason.trim()) return toast.error("Reason required");
        await triggerCancel({ id: transfer.id, payload: { reason: reason.trim() } });
      }
      toast.success(`Transfer ${kind}d`);
      onClose();
      onChanged?.();
    } catch (e: any) {
      // Handled
    }
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
                        <NumericInput min={0} max={it.requestedQty}
                          value={approvals[it.id] ?? 0}
                          onChange={(val) => setApprovals((p) => ({ ...p, [it.id]: val || 0 }))}
                          className="h-8 w-24 ml-auto text-right" />
                      </td>
                    </>}
                    {kind === "dispatch" && <>
                      <td className="p-2 text-right">{it.approvedQty}</td>
                      <td className="p-2 text-right">
                        {it.availableQty}
                      </td>
                      <td className="p-2 text-right">
                        <NumericInput min={0} max={it.approvedQty} precision={0}
                          value={dispatches[it.id] ?? 0}
                          onChange={(val) => setDispatches((p) => ({ ...p, [it.id]: val || 0 }))}
                          className="h-8 w-24 ml-auto text-right" />
                      </td>
                    </>}
                    {kind === "receive" && <>
                      <td className="p-2 text-right">{it.dispatchedQty}</td>
                      <td className="p-2 text-right">
                        <NumericInput min={0} max={it.dispatchedQty - it.receivedQty - it.damagedQty} precision={0}
                          value={receipts[it.id]?.received ?? 0}
                          onChange={(val) => setReceipts((p) => ({ ...p, [it.id]: { ...p[it.id], received: val || 0 } }))}
                          className="h-8 w-24 ml-auto text-right" />
                      </td>
                      <td className="p-2 text-right">
                        <NumericInput min={0} precision={0}
                          value={receipts[it.id]?.damaged ?? 0}
                          onChange={(val) => setReceipts((p) => ({ ...p, [it.id]: { ...p[it.id], damaged: val || 0 } }))}
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
          <Button variant="outline" onClick={onClose} disabled={isMutating}>Cancel</Button>
          <Button onClick={submit} isLoading={isMutating}>Confirm</Button>
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
