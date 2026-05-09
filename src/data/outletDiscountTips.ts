/**
 * Per-outlet default discount and tip preset configuration.
 * Persisted in localStorage so the cashier POS reads what admin sets.
 */
import type { POSDiscount } from "./posData";

export interface OutletTipPreset {
  id: string;
  /** Percentage of subtotal (0-100) */
  value: number;
}

export interface OutletDiscountTipConfig {
  discounts: POSDiscount[];
  tips: OutletTipPreset[];
}

const STORAGE_KEY = "smapps_outlet_discount_tips";

const DEFAULT_DISCOUNTS: POSDiscount[] = [
  { id: "disc-1", name: "Manager's Discount", type: "percentage", value: 10 },
  { id: "disc-2", name: "Staff Discount", type: "percentage", value: 15 },
  { id: "disc-3", name: "VIP Customer", type: "percentage", value: 20 },
  { id: "disc-4", name: "₦500 Off", type: "fixed", value: 500 },
];

const DEFAULT_TIPS: OutletTipPreset[] = [
  { id: "tip-5", value: 5 },
  { id: "tip-10", value: 10 },
  { id: "tip-15", value: 15 },
  { id: "tip-20", value: 20 },
];

type Store = Record<string, OutletDiscountTipConfig>;

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
    window.dispatchEvent(new CustomEvent("outlet-discount-tips-updated"));
  } catch {}
}

export function getOutletDiscountTipConfig(outletId: string | number): OutletDiscountTipConfig {
  const key = String(outletId);
  const store = loadAll();
  return {
    discounts: store[key]?.discounts ?? DEFAULT_DISCOUNTS,
    tips: store[key]?.tips ?? DEFAULT_TIPS,
  };
}

export function setOutletDiscountTipConfig(
  outletId: string | number,
  config: OutletDiscountTipConfig,
) {
  const store = loadAll();
  store[String(outletId)] = config;
  saveAll(store);
}

export function getDefaultDiscounts() { return DEFAULT_DISCOUNTS; }
export function getDefaultTips() { return DEFAULT_TIPS; }
