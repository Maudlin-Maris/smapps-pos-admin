/**
 * Per-outlet payment method configuration.
 * Admins create payment methods freely — no preset types.
 * Each entry is just a name (label) plus an enabled flag.
 * A `kind` field is retained internally for downstream POS/reporting
 * compatibility, but it is always set to "cash" and never exposed in the UI.
 * Persisted in localStorage so the cashier POS reads what admin sets.
 */
import type { PaymentMethod } from "./posData";

export const MAX_PAYMENT_METHODS_PER_OUTLET = 10;

export interface OutletPaymentMethod {
  /** Unique id for this payment method entry */
  id: string;
  /** Display label shown to cashier (e.g. "POS Terminal", "Opay Transfer") */
  label: string;
  /** Internal tender bucket — kept for compatibility, always "cash". */
  kind: PaymentMethod;
  /** Whether this method is currently accepted at this outlet */
  enabled: boolean;
}

const STORAGE_KEY = "smapps_outlet_payment_methods";

/** No presets — admin must create payment methods explicitly. */
export const DEFAULT_PAYMENT_METHODS: OutletPaymentMethod[] = [];

type Store = Record<string, OutletPaymentMethod[]>;

function loadAll(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveAll(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent("outlet-payment-methods-updated"));
  } catch {}
}

function migrate(list: any[]): OutletPaymentMethod[] {
  return (list || []).map((m, idx) => {
    if (m && typeof m === "object" && "kind" in m && typeof m.id === "string" && m.id.length > 4) {
      return { ...m, kind: "cash" } as OutletPaymentMethod;
    }
    const fallback = m?.label || m?.kind || m?.id || "Payment";
    return {
      id: `pm-${idx}-${Date.now()}`,
      label: String(fallback),
      kind: "cash",
      enabled: m?.enabled ?? true,
    };
  });
}

export function getOutletPaymentMethods(outletId: string | number): OutletPaymentMethod[] {
  const key = String(outletId);
  const store = loadAll();
  const raw = store[key];
  if (!raw) return [];
  return migrate(raw);
}

export function setOutletPaymentMethods(
  outletId: string | number,
  methods: OutletPaymentMethod[],
) {
  const store = loadAll();
  const key = String(outletId);
  store[key] = methods;
  // Mirror under "outlet-N" id used by POS mock data
  if (/^\d+$/.test(key)) store[`outlet-${key}`] = methods;
  saveAll(store);
}

function genId() {
  return `pm-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export function addOutletPaymentMethod(
  outletId: string | number,
  data: { label: string; enabled?: boolean },
): OutletPaymentMethod | null {
  const list = getOutletPaymentMethods(outletId);
  if (list.length >= MAX_PAYMENT_METHODS_PER_OUTLET) return null;
  const next: OutletPaymentMethod = {
    id: genId(),
    label: data.label.trim() || "Payment",
    kind: "cash",
    enabled: data.enabled ?? true,
  };
  setOutletPaymentMethods(outletId, [...list, next]);
  return next;
}

export function updateOutletPaymentMethod(
  outletId: string | number,
  id: string,
  patch: Partial<Pick<OutletPaymentMethod, "label" | "enabled">>,
) {
  const list = getOutletPaymentMethods(outletId);
  setOutletPaymentMethods(
    outletId,
    list.map((m) =>
      m.id === id
        ? { ...m, ...patch, label: (patch.label ?? m.label).trim() || m.label }
        : m,
    ),
  );
}

export function deleteOutletPaymentMethod(outletId: string | number, id: string) {
  const list = getOutletPaymentMethods(outletId);
  setOutletPaymentMethods(outletId, list.filter((m) => m.id !== id));
}
