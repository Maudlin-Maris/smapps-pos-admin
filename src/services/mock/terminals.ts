/**
 * Mock Terminals Service
 */

import { ok, err, type ServiceResult } from "../types";
import type { TerminalRecord, TerminalsService } from "./terminals.types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const STORAGE_KEY = "smapps_terminals";

function generateLinkingId(): string {
  return `SMAPPS-${Math.floor(100 + Math.random() * 900)}`;
}

function load(): TerminalRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function save(data: TerminalRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const mockTerminalsService: TerminalsService = {
  async list() {
    await delay(200);
    return ok(load());
  },
  async register(data) {
    await delay(300);
    const list = load();
    const record: TerminalRecord = {
      id: `term_${Date.now()}`,
      name: data.name,
      linkingId: generateLinkingId(),
      outletId: data.outletId,
      outletName: data.outletName,
      status: "offline",
      lastSeen: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    list.push(record);
    save(list);
    return ok(record);
  },
  async revoke(id) {
    await delay(200);
    save(load().filter((t) => t.id !== id));
    return ok(undefined);
  },
};
