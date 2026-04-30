import { useEffect, useState } from "react";
import type { CompositeItem } from "@/components/inventory/CompositeItemForm";

const STORAGE_KEY = "composites_store_v1";
const EVENT = "composites-store-update";

let memory: CompositeItem[] | null = null;

function read(): CompositeItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CompositeItem[];
  } catch {
    return null;
  }
}

function write(items: CompositeItem[]) {
  memory = items;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT));
}

/**
 * Shared composites store backed by localStorage. Used by both Inventory
 * (composite items section) and Menu (catalog items) so saving a composite
 * catalog item automatically registers it in inventory composites.
 */
export function useCompositesStore(initial: CompositeItem[]) {
  const [composites, setComposites] = useState<CompositeItem[]>(() => {
    if (memory) return memory;
    const stored = read();
    if (stored) {
      memory = stored;
      return stored;
    }
    memory = initial;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch {}
    return initial;
  });

  useEffect(() => {
    const handler = () => {
      const next = read();
      if (next) setComposites(next);
    };
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const update: React.Dispatch<React.SetStateAction<CompositeItem[]>> = (value) => {
    setComposites((prev) => {
      const next = typeof value === "function" ? (value as (p: CompositeItem[]) => CompositeItem[])(prev) : value;
      write(next);
      return next;
    });
  };

  return [composites, update] as const;
}

/** Imperative helper to upsert a composite from outside React (e.g. on menu save). */
export function upsertCompositeFromMenu(composite: CompositeItem) {
  const current = memory ?? read() ?? [];
  const idx = current.findIndex((c) => c.menuItemId === composite.menuItemId && c.outletId === composite.outletId);
  let next: CompositeItem[];
  if (idx >= 0) {
    next = [...current];
    next[idx] = { ...current[idx], ...composite, id: current[idx].id };
  } else {
    next = [...current, composite];
  }
  write(next);
}

/** Remove composites linked to a menu item (all outlets or specific). */
export function removeCompositesForMenu(menuItemId: string, outletId?: string) {
  const current = memory ?? read() ?? [];
  const next = current.filter((c) =>
    c.menuItemId !== menuItemId || (outletId !== undefined && c.outletId !== outletId)
  );
  if (next.length !== current.length) write(next);
}
