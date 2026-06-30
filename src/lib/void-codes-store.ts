/**
 * Void Codes Store
 * Manages the 4-digit authorization codes required at the POS to:
 *  - remove items from an existing order ("item")
 *  - void an entire unpaid order ("order")
 *
 * Codes are persisted in localStorage so admin changes survive reloads.
 */

export type VoidCodeType = "item" | "order";

const STORAGE_KEY = "smapps.void-codes.v1";
const DEFAULTS: Record<VoidCodeType, string> = {
  item: "1234",
  order: "1234",
};

type Store = Record<VoidCodeType, string>;

function read(): Store {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      item: isValid(parsed.item) ? (parsed.item as string) : DEFAULTS.item,
      order: isValid(parsed.order) ? (parsed.order as string) : DEFAULTS.order,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function write(store: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent("void-codes:updated"));
}

function isValid(code: unknown): boolean {
  return typeof code === "string" && /^\d{4}$/.test(code);
}

export function getVoidCode(type: VoidCodeType): string {
  return read()[type];
}

export function getAllVoidCodes(): Store {
  return read();
}

export function setVoidCode(type: VoidCodeType, code: string) {
  if (!isValid(code)) throw new Error("Code must be exactly 4 digits");
  const store = read();
  store[type] = code;
  write(store);
}

export function validateVoidCode(type: VoidCodeType, code: string): boolean {
  return read()[type] === code;
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
