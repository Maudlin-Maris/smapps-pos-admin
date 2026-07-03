/**
 * Void Codes Store
 *
 * Persists the 4-digit authorization codes cashiers must enter at the POS to:
 *  - remove items from an existing order ("item")
 *  - void an entire unpaid order ("order")
 *
 * Codes are stored globally with optional per-outlet overrides. If an outlet
 * has no override set for a given code type, the global default is used.
 */

export type VoidCodeType = "item" | "order";

const STORAGE_KEY = "smapps.void-codes.v2";

const DEFAULT_GLOBAL: Record<VoidCodeType, string> = {
  item: "1234",
  order: "1234",
};

type GlobalCodes = Record<VoidCodeType, string>;
type OutletOverride = Partial<Record<VoidCodeType, string>>;

interface Store {
  global: GlobalCodes;
  byOutlet: Record<string, OutletOverride>;
}

function isValid(code: unknown): code is string {
  return typeof code === "string" && /^\d{4}$/.test(code);
}

function emptyStore(): Store {
  return { global: { ...DEFAULT_GLOBAL }, byOutlet: {} };
}

function read(): Store {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Best-effort migration from v1 (flat {item, order})
      const legacy = window.localStorage.getItem("smapps.void-codes.v1");
      if (legacy) {
        const parsed = JSON.parse(legacy) as Partial<GlobalCodes>;
        return {
          global: {
            item: isValid(parsed.item) ? parsed.item! : DEFAULT_GLOBAL.item,
            order: isValid(parsed.order) ? parsed.order! : DEFAULT_GLOBAL.order,
          },
          byOutlet: {},
        };
      }
      return emptyStore();
    }
    const parsed = JSON.parse(raw) as Partial<Store>;
    const global: GlobalCodes = {
      item: isValid(parsed.global?.item) ? parsed.global!.item! : DEFAULT_GLOBAL.item,
      order: isValid(parsed.global?.order) ? parsed.global!.order! : DEFAULT_GLOBAL.order,
    };
    const byOutlet: Record<string, OutletOverride> = {};
    if (parsed.byOutlet && typeof parsed.byOutlet === "object") {
      for (const [outletId, ov] of Object.entries(parsed.byOutlet)) {
        const clean: OutletOverride = {};
        if (isValid((ov as any)?.item)) clean.item = (ov as any).item;
        if (isValid((ov as any)?.order)) clean.order = (ov as any).order;
        if (clean.item || clean.order) byOutlet[outletId] = clean;
      }
    }
    return { global, byOutlet };
  } catch {
    return emptyStore();
  }
}

function write(store: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent("void-codes:updated"));
}

/** Get the effective code for an outlet (override → global). */
export function getVoidCode(type: VoidCodeType, outletId?: string | null): string {
  const store = read();
  if (outletId) {
    const override = store.byOutlet[outletId]?.[type];
    if (override) return override;
  }
  return store.global[type];
}

export function getGlobalVoidCodes(): GlobalCodes {
  return read().global;
}

export function getOutletOverride(outletId: string): OutletOverride {
  return read().byOutlet[outletId] || {};
}

export function getAllOutletOverrides(): Record<string, OutletOverride> {
  return read().byOutlet;
}

/** Set or update a code. Omit outletId to set the global default. */
export function setVoidCode(type: VoidCodeType, code: string, outletId?: string | null) {
  if (!isValid(code)) throw new Error("Code must be exactly 4 digits");
  const store = read();
  if (outletId) {
    const existing = store.byOutlet[outletId] || {};
    store.byOutlet[outletId] = { ...existing, [type]: code };
  } else {
    store.global[type] = code;
  }
  write(store);
}

/** Remove an outlet-specific override so the outlet falls back to the global code. */
export function clearOutletOverride(type: VoidCodeType, outletId: string) {
  const store = read();
  const existing = store.byOutlet[outletId];
  if (!existing) return;
  const { [type]: _removed, ...rest } = existing;
  if (Object.keys(rest).length === 0) {
    delete store.byOutlet[outletId];
  } else {
    store.byOutlet[outletId] = rest;
  }
  write(store);
}

export function validateVoidCode(
  type: VoidCodeType,
  code: string,
  outletId?: string | null,
): boolean {
  return getVoidCode(type, outletId) === code;
}

export function subscribeVoidCodes(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("void-codes:updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("void-codes:updated", handler);
    window.removeEventListener("storage", handler);
  };
}
