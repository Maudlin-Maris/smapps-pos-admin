export interface OutletLocation {
  id: string;
  outletId: number | string;
  name: string;
  description?: string;
  createdAt: string;
}

const STORAGE_KEY = "smapps_outlet_locations";

const seed: OutletLocation[] = [
  { id: "loc-1", outletId: 1, name: "Table 1", description: "Window seat", createdAt: new Date().toISOString() },
  { id: "loc-2", outletId: 1, name: "Table 2", description: "Window seat", createdAt: new Date().toISOString() },
  { id: "loc-3", outletId: 1, name: "Patio A", description: "Outdoor", createdAt: new Date().toISOString() },
  { id: "loc-4", outletId: 3, name: "Counter 1", description: "Quick pickup", createdAt: new Date().toISOString() },
];

export function loadOutletLocations(): OutletLocation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

export function saveOutletLocations(list: OutletLocation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function buildLocationMenuUrl(outletId: number | string, locationId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/menu/${outletId}/${locationId}`;
}
