/**
 * Seeds mock substitute groups + composite items used by the cashier POS to
 * exercise every substitution mode (STRICT, AUTO, MANUAL_APPROVAL).
 *
 * Idempotent: only writes once per browser. If the user has manually edited
 * either store via the admin UI, we leave their data alone — we just append
 * any of our test entries that are missing (matched by id).
 *
 * Test scenarios (outlet-1, paired with Test * Burger products in posData):
 *
 *   1. "Test AUTO Burger"     — Classic Bun (0) → AUTO sub to Sesame Bun.
 *                               Cashier sees no modal; cart line shows SUB chip.
 *   2. "Test MANUAL Burger"   — Chicken Patty (0) → MANUAL_APPROVAL with
 *                               Spicy Patty + Veggie Patty alternatives.
 *   3. "Test STRICT Burger"   — Classic Bun (0), STRICT mode → blocked toast.
 *   4. "Test In-Stock Burger" — Sesame Bun in stock, no substitution needed
 *                               (control case).
 */

import type { CompositeItem } from "@/components/inventory/CompositeItemForm";
import type { SubstituteGroup } from "@/data/substituteGroups";

const COMPOSITES_KEY = "composites_store_v1";
const GROUPS_KEY = "substitute_groups_v1";
const SEED_FLAG = "substitution_mocks_seeded_v3";

const SEED_GROUPS: SubstituteGroup[] = [
  {
    id: "grp-burger-buns",
    name: "Burger Buns",
    outletId: "outlet-1",
    items: [
      { inventoryItemId: "sub-bun-sesame",  priority: 1, conversionRatio: 1 },
      { inventoryItemId: "sub-bun-brioche", priority: 2, conversionRatio: 1 },
    ],
  },
];

const SEED_COMPOSITES: CompositeItem[] = [
  // 1) AUTO — silent substitution. Direct substitute on the bun.
  {
    id: "comp-test-auto",
    name: "Test AUTO Burger",
    description: "Demo composite — primary bun out of stock, auto-swaps to Sesame Bun silently.",
    outletId: "outlet-1",
    sellPrice: 4500,
    components: [
      {
        inventoryItemId: "sub-bun-classic",
        quantity: 1,
        role: "primary",
        allowSubstitute: true,
        substituteMode: "auto",
        substitutes: [
          { inventoryItemId: "sub-bun-sesame",  priority: 1, conversionRatio: 1 },
          { inventoryItemId: "sub-bun-brioche", priority: 2, conversionRatio: 1 },
        ],
      },
      { inventoryItemId: "sub-patty-spicy", quantity: 1, role: "primary" },
      { inventoryItemId: "sub-cheese",      quantity: 1, role: "primary" },
    ],
  },
  // 2) MANUAL_APPROVAL — cashier picks from alternatives.
  {
    id: "comp-test-manual",
    name: "Test MANUAL Burger",
    description: "Demo composite — Chicken Patty out, prompts cashier to approve a substitute patty.",
    outletId: "outlet-1",
    sellPrice: 5200,
    components: [
      { inventoryItemId: "sub-bun-sesame", quantity: 1, role: "primary" },
      {
        inventoryItemId: "sub-patty-chicken",
        quantity: 1,
        role: "primary",
        allowSubstitute: true,
        substituteMode: "manual_approval",
        substitutes: [
          { inventoryItemId: "sub-patty-spicy",  priority: 1, conversionRatio: 1 },
          { inventoryItemId: "sub-patty-veggie", priority: 2, conversionRatio: 1 },
        ],
      },
      { inventoryItemId: "sub-cheese", quantity: 1, role: "primary" },
    ],
  },
  // 3) STRICT — sale blocked when primary unavailable.
  {
    id: "comp-test-strict",
    name: "Test STRICT Burger",
    description: "Demo composite — strict mode, no substitution allowed; primary bun is out so add-to-cart is blocked.",
    outletId: "outlet-1",
    sellPrice: 4800,
    components: [
      {
        inventoryItemId: "sub-bun-classic",
        quantity: 1,
        role: "primary",
        allowSubstitute: false,
        substituteMode: "strict",
      },
      { inventoryItemId: "sub-patty-spicy", quantity: 1, role: "primary" },
    ],
  },
  // 4) Control — primary in stock, passes through.
  {
    id: "comp-test-ok",
    name: "Test In-Stock Burger",
    description: "Control composite — all ingredients in stock, no substitution should fire.",
    outletId: "outlet-1",
    sellPrice: 4200,
    components: [
      { inventoryItemId: "sub-bun-sesame",  quantity: 1, role: "primary" },
      { inventoryItemId: "sub-patty-spicy", quantity: 1, role: "primary" },
      { inventoryItemId: "sub-cheese",      quantity: 1, role: "primary" },
    ],
  },
];

function readJSON<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeJSON(key: string, value: unknown, eventName: string) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(eventName));
  } catch {}
}

/** Call once at app startup. Safe to call repeatedly — guarded by SEED_FLAG. */
export function seedSubstitutionMocks() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_FLAG)) return;

  // Merge groups
  const existingGroups = readJSON<SubstituteGroup>(GROUPS_KEY);
  const groupIds = new Set(existingGroups.map((g) => g.id));
  const mergedGroups = [...existingGroups];
  for (const g of SEED_GROUPS) if (!groupIds.has(g.id)) mergedGroups.push(g);
  if (mergedGroups.length !== existingGroups.length) {
    writeJSON(GROUPS_KEY, mergedGroups, "substitute-groups-update");
  }

  // Merge composites
  const existingComposites = readJSON<CompositeItem>(COMPOSITES_KEY);
  const compIds = new Set(existingComposites.map((c) => c.id));
  const mergedComposites = [...existingComposites];
  for (const c of SEED_COMPOSITES) if (!compIds.has(c.id)) mergedComposites.push(c);
  if (mergedComposites.length !== existingComposites.length) {
    writeJSON(COMPOSITES_KEY, mergedComposites, "composites-store-update");
  }

  localStorage.setItem(SEED_FLAG, "1");
}
