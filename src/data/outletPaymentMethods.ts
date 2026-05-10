/**
 * Per-outlet payment method configuration.
 * Persisted in localStorage so the cashier POS reads what admin sets.
 */
import type { PaymentMethod } from "./posData";

export interface OutletPaymentMethod {
  /** Underlying payment method type (fixed set the system supports) */
  id: PaymentMethod;
  /** Custom display label, e.g. "POS Terminal" instead of "Card" */
  label: string;
  /** Whether this method is enabled for the outlet */
  enabled: boolean;
}

const STORAGE_KEY = "smapps_outlet_payment_methods";

export const DEFAULT_PAYMENT_METHODS: OutletPaymentMethod[] = [
  { id: "cash", label: "Cash", enabled: true },
  { id: "card", label: "Card", enabled: true },
  { id: "mobile", label: "Mobile", enabled: true },
  { id: "transfer", label: "Transfer", enabled: true },
];

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

export function getOutletPaymentMethods(outletId: string | number): OutletPaymentMethod[] {
  const key = String(outletId);
  const store = loadAll();
  return store[key] ?? DEFAULT_PAYMENT_METHODS.map((m) => ({ ...m }));
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
