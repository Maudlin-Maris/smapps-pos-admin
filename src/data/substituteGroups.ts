/**
 * Substitute Groups — reusable groups of inventory items that can stand in for
 * each other inside a composite component. Each group is outlet-scoped and
 * keeps an explicit, ordered priority list. A composite component may
 * reference a group OR define its own ad-hoc substitutes; both paths are
 * combined at availability-check time (direct first, then groups).
 *
 * Storage: localStorage (mirrors how composites/payments are stored today).
 * No new APIs; backward-compatible — components that don't reference groups
 * are unaffected.
 */

import { useEffect, useState } from "react";

export interface SubstituteGroupItem {
  inventoryItemId: string;
  /** Lower = higher priority. */
  priority: number;
  /** How many base units of THIS item replace 1 base unit of the original.
   *  e.g. 1 Spicy Patty = 1 Chicken Patty -> 1.0; 2 x 500ml = 1L -> 0.5 (each
   *  500ml unit covers 0.5L of the 1L original). */
  conversionRatio: number;
}

export interface SubstituteGroup {
  id: string;
  name: string;
  outletId: string;
  items: SubstituteGroupItem[];
}

const KEY = "substitute_groups_v1";
const EVENT = "substitute-groups-update";

let memory: SubstituteGroup[] | null = null;

function read(): SubstituteGroup[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SubstituteGroup[];
  } catch {
    return [];
  }
}

function write(items: SubstituteGroup[]) {
  memory = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useSubstituteGroups(initial: SubstituteGroup[] = []) {
  const [groups, setGroups] = useState<SubstituteGroup[]>(() => {
    if (memory) return memory;
    const stored = read();
    if (stored.length) {
      memory = stored;
      return stored;
    }
    memory = initial;
    if (initial.length) write(initial);
    return initial;
  });

  useEffect(() => {
    const handler = () => {
      const next = read();
      setGroups(next);
    };
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const update: React.Dispatch<React.SetStateAction<SubstituteGroup[]>> = (value) => {
    setGroups((prev) => {
      const next = typeof value === "function" ? (value as (p: SubstituteGroup[]) => SubstituteGroup[])(prev) : value;
      write(next);
      return next;
    });
  };

  return [groups, update] as const;
}

export function getSubstituteGroups(): SubstituteGroup[] {
  return memory ?? read();
}
