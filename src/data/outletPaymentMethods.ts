/**
 * Per-outlet payment method configuration.
 * Admin creates payment methods from the admin portal — there are no presets.
 * Each entry has a unique id and a `kind` that classifies it as one of the
 * underlying tender types the POS supports (used for icons & reporting).
 * Persisted in localStorage so the cashier POS reads what admin sets.
 */
import type { PaymentMethod } from "./posData";

export interface OutletPaymentMethod {
  /** Unique id for this payment method entry */
  id: string;
  /** Display label shown to cashier (e.g. "POS Terminal", "Opay Transfer") */
  label: string;
  /** Underlying tender kind — drives icon and reporting bucket */
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
  // Old shape: { id: PaymentMethod, label, enabled } — promote to new shape.
  return (list || []).map((m, idx) => {
    if (m && typeof m === "object" && "kind" in m && typeof m.id === "string" && m.id.length > 4) {
      return m as OutletPaymentMethod;
    }
    const kind: PaymentMethod = (m?.kind ?? m?.id ?? "cash") as PaymentMethod;
    return {
      id: `${kind}-${idx}-${Date.now()}`,
      label: m?.label || kind,
      kind,
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

function genId(kind: PaymentMethod) {
  return `${kind}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export function addOutletPaymentMethod(
  outletId: string | number,
  data: { label: string; kind: PaymentMethod; enabled?: boolean },
): OutletPaymentMethod {
  const list = getOutletPaymentMethods(outletId);
  const next: OutletPaymentMethod = {
    id: genId(data.kind),
    label: data.label.trim() || data.kind,
    kind: data.kind,
    enabled: data.enabled ?? true,
  };
  setOutletPaymentMethods(outletId, [...list, next]);
  return next;
}

export function updateOutletPaymentMethod(
  outletId: string | number,
  id: string,
  patch: Partial<Pick<OutletPaymentMethod, "label" | "kind" | "enabled">>,
) {
  const list = getOutletPaymentMethods(outletId);
  setOutletPaymentMethods(
    outletId,
    list.map((m) => (m.id === id ? { ...m, ...patch, label: (patch.label ?? m.label).trim() || m.kind } : m)),
  );
}

export function deleteOutletPaymentMethod(outletId: string | number, id: string) {
  const list = getOutletPaymentMethods(outletId);
  setOutletPaymentMethods(outletId, list.filter((m) => m.id !== id));
}
