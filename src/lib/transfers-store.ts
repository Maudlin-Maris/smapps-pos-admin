// localStorage-backed mock store for the inventory-transfer module.
// Maintains: transfers list, inventory-movement ledger, and a stock-overlay
// (deltas applied on top of seed inventory) that simulates DB-side balances
// without mutating the seed data file.

import { defaultInventoryItems } from "@/data/inventoryItems";
import { outlets } from "@/data/outlets";
import {
  type StockTransferV2,
  type TransferItem,
  type TransferStatus,
  type InventoryMovement,
  type TransferAuditEntry,
  type TransferLocation,
  ACTIVE_STATUSES,
} from "@/data/transferTypes";

const KEY_TRANSFERS = "smapps_transfers_v2";
const KEY_MOVEMENTS = "smapps_inventory_movements_v1";
const KEY_OVERLAY   = "smapps_inventory_stock_overlay_v1";
const KEY_COUNTER   = "smapps_transfers_counter_v1";

// ── Utilities ──
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch { return fallback; }
}
function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("transfers:changed"));
}

export function nextReference(): string {
  const n = (read<number>(KEY_COUNTER, 0) || 0) + 1;
  localStorage.setItem(KEY_COUNTER, String(n));
  const yr = new Date().getFullYear();
  return `TRF-${yr}-${String(n).padStart(6, "0")}`;
}

// ── Stock overlay ──
type Overlay = Record<string, number>; // key: `${outletId}::${itemId}` → delta
function overlayKey(outletId: string, itemId: string) { return `${outletId}::${itemId}`; }
function loadOverlay(): Overlay { return read<Overlay>(KEY_OVERLAY, {}); }
function saveOverlay(o: Overlay) { write(KEY_OVERLAY, o); }

export function applyDelta(outletId: string, itemId: string, delta: number) {
  const o = loadOverlay();
  o[overlayKey(outletId, itemId)] = (o[overlayKey(outletId, itemId)] || 0) + delta;
  saveOverlay(o);
}

export function getEffectiveStock(outletId: string, itemId: string): number {
  const seed = defaultInventoryItems.find(
    (i) => i.id === itemId && i.outletId === outletId
  );
  const seedQty = seed ? seed.stock : 0;
  const o = loadOverlay();
  return seedQty + (o[overlayKey(outletId, itemId)] || 0);
}

// All items at a given location (seeded items at that outlet, with overlay applied)
export function listLocationInventory(outletId: string) {
  return defaultInventoryItems
    .filter((i) => i.outletId === outletId)
    .map((i) => ({
      id: i.id,
      name: i.name,
      sku: i.sku,
      unit: "unit",
      unitCost: i.costPrice,
      stock: getEffectiveStock(outletId, i.id),
      minStock: i.minStock,
    }));
}

// Compute reserved qty for an item at a source: open transfers (not yet
// dispatched/received/cancelled) where this item appears.
export function getReservedQty(outletId: string, itemId: string): number {
  const transfers = listTransfers();
  let reserved = 0;
  for (const t of transfers) {
    if (t.source.id !== outletId) continue;
    if (!ACTIVE_STATUSES.includes(t.status)) continue;
    for (const it of t.items) {
      if (it.inventoryItemId !== itemId) continue;
      // Reservation = approvedQty (or requestedQty if pending) minus already dispatched
      const planned = t.status === "PENDING_APPROVAL" ? it.requestedQty : it.approvedQty;
      const remaining = Math.max(0, planned - it.dispatchedQty);
      reserved += remaining;
    }
  }
  return reserved;
}

// ── Locations (outlets + virtual warehouses) ──
export const VIRTUAL_WAREHOUSES: TransferLocation[] = [
  { id: "wh-central", name: "Central Warehouse", kind: "warehouse" },
  { id: "wh-regional-north", name: "Regional WH — North", kind: "warehouse" },
];

export function listLocations(): TransferLocation[] {
  return [
    ...outlets.map((o) => ({ id: o.id, name: o.name, kind: "outlet" as const })),
    ...VIRTUAL_WAREHOUSES,
  ];
}

export function findLocation(id: string): TransferLocation | undefined {
  return listLocations().find((l) => l.id === id);
}

// ── Transfers CRUD ──
export function listTransfers(): StockTransferV2[] {
  return read<StockTransferV2[]>(KEY_TRANSFERS, seedTransfers());
}
export function saveTransfers(list: StockTransferV2[]) {
  write(KEY_TRANSFERS, list);
}
export function getTransfer(id: string): StockTransferV2 | undefined {
  return listTransfers().find((t) => t.id === id);
}
export function upsertTransfer(t: StockTransferV2) {
  const list = listTransfers();
  const idx = list.findIndex((x) => x.id === t.id);
  if (idx >= 0) list[idx] = t; else list.unshift(t);
  saveTransfers(list);
}
export function deleteTransfer(id: string) {
  const list = listTransfers().filter((t) => t.id !== id);
  saveTransfers(list);
}

// ── Movements ledger ──
export function listMovements(): InventoryMovement[] {
  return read<InventoryMovement[]>(KEY_MOVEMENTS, []);
}
export function appendMovement(m: InventoryMovement) {
  const list = listMovements();
  list.unshift(m);
  write(KEY_MOVEMENTS, list);
}

// ── Audit helper ──
export function audit(t: StockTransferV2, entry: Omit<TransferAuditEntry, "id" | "ts">) {
  t.audit.unshift({
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    ...entry,
  });
}

// ── Lifecycle transitions ──
const ACTOR = "Current User"; // placeholder — would come from auth in real impl

export function submitForApproval(id: string) {
  const t = getTransfer(id); if (!t) return;
  if (t.status !== "DRAFT") throw new Error("Only DRAFT can be submitted");
  t.status = "PENDING_APPROVAL";
  t.submittedAt = new Date().toISOString();
  audit(t, { actor: ACTOR, action: "SUBMITTED" });
  upsertTransfer(t);
}

export function approveTransfer(id: string, lineApprovals: Record<string, number>) {
  const t = getTransfer(id); if (!t) return;
  if (t.status !== "PENDING_APPROVAL") throw new Error("Only PENDING_APPROVAL can be approved");
  for (const it of t.items) {
    const approved = Math.max(0, Math.min(lineApprovals[it.id] ?? it.requestedQty, it.requestedQty));
    // Validate against currently-transferable qty at source (live)
    const live = getEffectiveStock(t.source.id, it.inventoryItemId)
               - getReservedQty(t.source.id, it.inventoryItemId)
               + (it.approvedQty); // exclude self
    it.approvedQty = Math.max(0, Math.min(approved, Math.max(0, live)));
  }
  t.status = "APPROVED";
  t.approvedAt = new Date().toISOString();
  t.approvedBy = ACTOR;
  audit(t, { actor: ACTOR, action: "APPROVED" });
  upsertTransfer(t);
}

export function rejectTransfer(id: string, reason: string) {
  const t = getTransfer(id); if (!t) return;
  if (t.status !== "PENDING_APPROVAL") throw new Error("Only PENDING_APPROVAL can be rejected");
  t.status = "REJECTED";
  t.rejectedAt = new Date().toISOString();
  t.rejectedReason = reason;
  audit(t, { actor: ACTOR, action: "REJECTED", notes: reason });
  upsertTransfer(t);
}

export function cancelTransfer(id: string, reason: string) {
  const t = getTransfer(id); if (!t) return;
  if (["RECEIVED", "CANCELLED", "REJECTED"].includes(t.status))
    throw new Error("Cannot cancel from this status");
  // Reverse any out movements if dispatched
  if (t.dispatchedAt) {
    for (const it of t.items) {
      if (it.dispatchedQty > 0 && it.receivedQty === 0) {
        // restore source stock (dispatched but never received)
        applyDelta(t.source.id, it.inventoryItemId, +it.dispatchedQty);
        appendMovement(buildMovement(t, it, "TRANSFER_IN", t.source.id, +it.dispatchedQty, "Cancellation reversal"));
        it.dispatchedQty = 0;
      }
    }
  }
  t.status = "CANCELLED";
  t.cancelledAt = new Date().toISOString();
  t.cancelledReason = reason;
  audit(t, { actor: ACTOR, action: "CANCELLED", notes: reason });
  upsertTransfer(t);
}

export function dispatchTransfer(id: string, dispatchQtys: Record<string, number>, opts: { carrier?: string; tracking?: string } = {}) {
  const t = getTransfer(id); if (!t) return;
  if (t.status !== "APPROVED") throw new Error("Only APPROVED can be dispatched");

  // Validate stock for every line
  for (const it of t.items) {
    const wanted = dispatchQtys[it.id] ?? it.approvedQty;
    if (wanted < 0 || wanted > it.approvedQty)
      throw new Error(`Invalid dispatch qty for ${it.itemName}`);
    const live = getEffectiveStock(t.source.id, it.inventoryItemId);
    if (live < wanted) throw new Error(`Insufficient stock for ${it.itemName} at source`);
  }

  for (const it of t.items) {
    const wanted = dispatchQtys[it.id] ?? it.approvedQty;
    if (wanted <= 0) continue;
    applyDelta(t.source.id, it.inventoryItemId, -wanted);
    it.dispatchedQty = wanted;
    appendMovement(buildMovement(t, it, "TRANSFER_OUT", t.source.id, -wanted));
  }

  t.status = "IN_TRANSIT";
  t.dispatchedAt = new Date().toISOString();
  t.dispatchedBy = ACTOR;
  t.carrier = opts.carrier;
  t.trackingNumber = opts.tracking;
  audit(t, { actor: ACTOR, action: "DISPATCHED", meta: { carrier: opts.carrier, tracking: opts.tracking } });
  upsertTransfer(t);
}

export function receiveTransfer(
  id: string,
  receipts: Record<string, { received: number; damaged: number; notes?: string }>
) {
  const t = getTransfer(id); if (!t) return;
  if (!["IN_TRANSIT", "PARTIALLY_RECEIVED"].includes(t.status))
    throw new Error("Only IN_TRANSIT/PARTIALLY_RECEIVED can be received");

  let allComplete = true;
  for (const it of t.items) {
    const r = receipts[it.id] ?? { received: 0, damaged: 0 };
    const recvDelta = Math.max(0, Math.min(r.received, it.dispatchedQty - it.receivedQty));
    const dmgDelta  = Math.max(0, Math.min(r.damaged,  it.dispatchedQty - it.receivedQty - recvDelta));

    if (recvDelta > 0) {
      applyDelta(t.destination.id, it.inventoryItemId, +recvDelta);
      appendMovement(buildMovement(t, it, "TRANSFER_IN", t.destination.id, +recvDelta, r.notes));
      it.receivedQty += recvDelta;
    }
    if (dmgDelta > 0) {
      appendMovement(buildMovement(t, it, "TRANSFER_DAMAGE", t.destination.id, -dmgDelta, "Damaged on receipt"));
      it.damagedQty += dmgDelta;
    }
    it.varianceQty = it.dispatchedQty - it.receivedQty - it.damagedQty;
    if (it.receivedQty + it.damagedQty < it.dispatchedQty) allComplete = false;
  }

  if (allComplete) {
    t.status = "RECEIVED";
    t.receivedAt = new Date().toISOString();
    t.receivedBy = ACTOR;
    audit(t, { actor: ACTOR, action: "RECEIVED_FULL" });
  } else {
    t.status = "PARTIALLY_RECEIVED";
    audit(t, { actor: ACTOR, action: "RECEIVED_PARTIAL" });
  }
  upsertTransfer(t);
}

// ── Movement helper ──
function buildMovement(
  t: StockTransferV2,
  it: TransferItem,
  type: InventoryMovement["type"],
  locationId: string,
  signedQty: number,
  notes?: string
): InventoryMovement {
  const before = getEffectiveStock(locationId, it.inventoryItemId) - signedQty;
  const after  = before + signedQty;
  return {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    type,
    locationId,
    inventoryItemId: it.inventoryItemId,
    itemName: it.itemName,
    sku: it.sku,
    unit: it.unit,
    quantity: signedQty,
    balanceBefore: before,
    balanceAfter: after,
    unitCost: it.unitCost,
    performedBy: ACTOR,
    transferId: t.id,
    transferReference: t.reference,
    metadata: { sourceId: t.source.id, destinationId: t.destination.id, notes },
  };
}

// ── Seed data (only used the first time) ──
function seedTransfers(): StockTransferV2[] {
  const o1 = outlets[0]; const o2 = outlets[1]; const o3 = outlets[2];
  if (!o1 || !o2 || !o3) return [];
  const now = Date.now();
  const mk = (
    overrides: Partial<StockTransferV2> & {
      reference: string;
      source: TransferLocation;
      destination: TransferLocation;
      items: TransferItem[];
      status: TransferStatus;
    }
  ): StockTransferV2 => ({
    id: crypto.randomUUID(),
    reason: "replenishment",
    notes: "",
    createdAt: new Date(now).toISOString(),
    createdBy: "System Seed",
    audit: [{
      id: crypto.randomUUID(),
      ts: new Date(now).toISOString(),
      actor: "System Seed",
      action: "CREATED",
    }],
    ...overrides,
  });

  const buildItem = (it: { id: string; name: string; sku: string; costPrice: number }, qty: number): TransferItem => ({
    id: crypto.randomUUID(),
    inventoryItemId: it.id,
    itemName: it.name,
    sku: it.sku,
    unit: "unit",
    unitCost: it.costPrice,
    availableQty: 100,
    reservedQty: 0,
    transferableQty: 100,
    requestedQty: qty,
    approvedQty: qty,
    dispatchedQty: 0,
    receivedQty: 0,
    damagedQty: 0,
    varianceQty: 0,
  });

  const o1Items = defaultInventoryItems.filter((i) => i.outletId === o1.id).slice(0, 3);
  if (o1Items.length < 2) return [];

  return [
    mk({
      reference: "TRF-2026-000003",
      source: { id: o1.id, name: o1.name, kind: "outlet" },
      destination: { id: o2.id, name: o2.name, kind: "outlet" },
      items: [buildItem(o1Items[0], 5), buildItem(o1Items[1], 3)],
      status: "PENDING_APPROVAL",
      submittedAt: new Date(now - 1000 * 60 * 30).toISOString(),
    }),
    mk({
      reference: "TRF-2026-000002",
      source: { id: "wh-central", name: "Central Warehouse", kind: "warehouse" },
      destination: { id: o3.id, name: o3.name, kind: "outlet" },
      items: [buildItem(o1Items[0], 20)],
      status: "DRAFT",
    }),
  ];
}
