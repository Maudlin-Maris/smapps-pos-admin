/**
 * Substitution Logs — append-only audit trail capturing every time a
 * substitute inventory item was used in place of an original component.
 * Stored locally; entries can be exported by reports later.
 */

import { useEffect, useState } from "react";

export interface SubstitutionLogEntry {
  id: string;
  timestamp: string; // ISO
  outletId: string;
  orderRef?: string;
  cashier?: string;
  compositeName?: string;
  originalItemId: string;
  originalItemName: string;
  substituteItemId: string;
  substituteItemName: string;
  quantityUsed: number; // in substitute's base units
  originalUnitCost: number;
  substituteUnitCost: number;
  /** substituteUnitCost*qty - originalUnitCost*equivalentQty. Negative = saved. */
  costVariance: number;
  /** "auto" | "manual_approval" | "fallback" */
  mode: "auto" | "manual_approval" | "fallback";
}

const KEY = "substitution_logs_v1";
const EVENT = "substitution-logs-update";
const MAX_ENTRIES = 1000;

let memory: SubstitutionLogEntry[] | null = null;

function read(): SubstitutionLogEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function write(entries: SubstitutionLogEntry[]) {
  const trimmed = entries.slice(-MAX_ENTRIES);
  memory = trimmed;
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function logSubstitution(entry: Omit<SubstitutionLogEntry, "id" | "timestamp">) {
  const current = memory ?? read();
  const full: SubstitutionLogEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  write([...current, full]);
  return full;
}

export function useSubstitutionLogs(filterOutletId?: string) {
  const [logs, setLogs] = useState<SubstitutionLogEntry[]>(() => memory ?? read());
  useEffect(() => {
    const handler = () => setLogs(memory ?? read());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return filterOutletId ? logs.filter((l) => l.outletId === filterOutletId) : logs;
}
