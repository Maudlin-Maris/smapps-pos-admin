/**
 * Composite substitution resolver.
 *
 * Given a single composite component and current inventory state, decide
 * whether the component can be fulfilled — first from its own stock, then
 * from configured direct substitutes (in priority order), then from any
 * referenced substitute groups.
 *
 * Designed to be a pure utility used by both:
 *   - Admin inventory UI (preview producible quantity / show which substitute
 *     would be used).
 *   - Cashier POS flow (gating add-to-cart, driving the manual approval modal).
 *
 * Backward compatible: components without `allowSubstitute` or substitute
 * config behave exactly as before — only the original item is checked.
 */

import type { InventoryItem } from "@/components/inventory/InventoryItemForm";
import type { CompositeComponent } from "@/components/inventory/CompositeItemForm";
import type { SubstituteGroup } from "@/data/substituteGroups";

export type SubstituteMode = "strict" | "auto" | "manual_approval";

export interface ComponentSubstitute {
  inventoryItemId: string;
  /** Lower = higher priority. */
  priority: number;
  /** How many base units of the substitute equal 1 base unit of the original.
   *  e.g. 1 Spicy Patty = 1 Chicken Patty -> 1.0; 1L Coke replaced by 500ml -> 0.5. */
  conversionRatio: number;
}

/** Optional fields appended to CompositeComponent. All optional for back-compat. */
export interface ComponentSubstituteConfig {
  allowSubstitute?: boolean;
  substituteMode?: SubstituteMode;
  substitutes?: ComponentSubstitute[];
  substituteGroupIds?: string[];
}

export interface ResolvedSource {
  inventoryItemId: string;
  /** Quantity in the source item's BASE units. */
  qtyBase: number;
  isSubstitute: boolean;
  /** If isSubstitute, this is the original component's inventory item id. */
  originalItemId?: string;
  conversionRatio: number;
  unitCost: number;
}

export interface ComponentResolution {
  /** True if the component can be fulfilled from primary or any substitute. */
  available: boolean;
  /** Ordered list of inventory draws that fulfil the requested quantity. */
  plan: ResolvedSource[];
  /** True if primary stock alone could not cover required qty. */
  primaryShort: boolean;
  /** Substitute that will (or did) cover the gap, if any. */
  substituteUsed?: ResolvedSource;
  /** Mode that drove the decision. */
  mode: SubstituteMode;
  /** Cost variance vs. fulfilling fully from the original. Negative = saved. */
  costVariance: number;
}

interface ResolveOpts {
  component: CompositeComponent & ComponentSubstituteConfig;
  /** Required quantity expressed in the COMPONENT'S base units (i.e. already
   *  converted from any unit override on the component). */
  requiredBaseQty: number;
  inventory: InventoryItem[];
  groups: SubstituteGroup[];
}

function findItem(inv: InventoryItem[], id: string) {
  return inv.find((i) => i.id === id);
}

function unitCost(item: InventoryItem | undefined): number {
  return item?.costPrice ?? 0;
}

/** Build the prioritized list of substitute candidates: direct substitutes
 *  first, then group items, dedup'd by inventoryItemId. */
export function buildCandidates(
  config: ComponentSubstituteConfig,
  groups: SubstituteGroup[],
): ComponentSubstitute[] {
  const seen = new Set<string>();
  const out: ComponentSubstitute[] = [];
  const direct = [...(config.substitutes ?? [])].sort((a, b) => a.priority - b.priority);
  for (const s of direct) {
    if (seen.has(s.inventoryItemId)) continue;
    seen.add(s.inventoryItemId);
    out.push(s);
  }
  for (const gid of config.substituteGroupIds ?? []) {
    const grp = groups.find((g) => g.id === gid);
    if (!grp) continue;
    const sorted = [...grp.items].sort((a, b) => a.priority - b.priority);
    for (const it of sorted) {
      if (seen.has(it.inventoryItemId)) continue;
      seen.add(it.inventoryItemId);
      out.push({ ...it });
    }
  }
  return out;
}

/** Returns all in-stock substitute candidates (with their stock) the cashier
 *  may pick from in the manual approval flow. Ordered by configured priority. */
export interface ViableSubstitute extends ComponentSubstitute {
  itemName: string;
  stock: number;
  unitCost: number;
  /** True if this candidate alone can cover the remaining shortfall. */
  coversShortfall: boolean;
}

export function getViableSubstitutes(
  component: CompositeComponent & ComponentSubstituteConfig,
  shortfallBaseQty: number,
  inventory: InventoryItem[],
  groups: SubstituteGroup[],
): ViableSubstitute[] {
  const candidates = buildCandidates(component, groups);
  const out: ViableSubstitute[] = [];
  for (const c of candidates) {
    const item = inventory.find((i) => i.id === c.inventoryItemId);
    if (!item) continue;
    const stock = item.stock ?? 0;
    if (stock <= 0) continue;
    const ratio = c.conversionRatio > 0 ? c.conversionRatio : 1;
    out.push({
      ...c,
      itemName: item.name,
      stock,
      unitCost: item.costPrice ?? 0,
      coversShortfall: stock * ratio + 1e-9 >= shortfallBaseQty,
    });
  }
  return out;
}

export function resolveComponent({ component, requiredBaseQty, inventory, groups }: ResolveOpts): ComponentResolution {
  const mode: SubstituteMode = component.substituteMode ?? "strict";
  const allowSubs = !!component.allowSubstitute && mode !== "strict";

  const primary = findItem(inventory, component.inventoryItemId);
  const primaryStock = primary?.stock ?? 0;
  const primaryCost = unitCost(primary);

  const plan: ResolvedSource[] = [];
  let remaining = requiredBaseQty;
  let primaryShort = false;
  let costFromOriginal = primaryCost * requiredBaseQty;
  let actualCost = 0;

  // Draw from primary first.
  if (primaryStock > 0 && remaining > 0) {
    const used = Math.min(primaryStock, remaining);
    plan.push({
      inventoryItemId: component.inventoryItemId,
      qtyBase: used,
      isSubstitute: false,
      conversionRatio: 1,
      unitCost: primaryCost,
    });
    actualCost += used * primaryCost;
    remaining -= used;
  }
  if (remaining > 0) primaryShort = true;

  let substituteUsed: ResolvedSource | undefined;

  if (remaining > 0 && allowSubs) {
    const candidates = buildCandidates(component, groups);
    for (const cand of candidates) {
      if (remaining <= 0) break;
      const subItem = findItem(inventory, cand.inventoryItemId);
      if (!subItem) continue;
      const ratio = cand.conversionRatio > 0 ? cand.conversionRatio : 1;
      // Substitute base qty needed to cover `remaining` original base units.
      const needSubBase = remaining / ratio;
      const subStock = subItem.stock ?? 0;
      if (subStock <= 0) continue;
      const useSub = Math.min(subStock, needSubBase);
      const coversOriginal = useSub * ratio;
      const subCost = unitCost(subItem);
      const draw: ResolvedSource = {
        inventoryItemId: cand.inventoryItemId,
        qtyBase: useSub,
        isSubstitute: true,
        originalItemId: component.inventoryItemId,
        conversionRatio: ratio,
        unitCost: subCost,
      };
      plan.push(draw);
      if (!substituteUsed) substituteUsed = draw;
      actualCost += useSub * subCost;
      remaining -= coversOriginal;
    }
  }

  const available = remaining <= 1e-9;
  const costVariance = available ? actualCost - costFromOriginal : 0;

  return {
    available,
    plan,
    primaryShort,
    substituteUsed,
    mode,
    costVariance,
  };
}

/** Convenience: max producible composite units given current inventory and
 *  per-component substitute config. */
export function getProducibleWithSubstitutes(
  components: (CompositeComponent & ComponentSubstituteConfig)[],
  perComponentBaseQty: (c: CompositeComponent) => number,
  inventory: InventoryItem[],
  groups: SubstituteGroup[],
): { producible: number; limitingId?: string; substituteHint?: { componentId: string; subItemId: string } } {
  let min = Infinity;
  let limitingId: string | undefined;
  let substituteHint: { componentId: string; subItemId: string } | undefined;

  for (const c of components) {
    if (!c.inventoryItemId) continue;
    const perUnit = perComponentBaseQty(c);
    if (perUnit <= 0) continue;

    // Total fulfillable base units = primary stock + Σ(substitute stock * ratio)
    const primary = findItem(inventory, c.inventoryItemId);
    let totalBase = primary?.stock ?? 0;

    if (c.allowSubstitute && (c.substituteMode ?? "strict") !== "strict") {
      const candidates = buildCandidates(c, groups);
      for (const cand of candidates) {
        const subItem = findItem(inventory, cand.inventoryItemId);
        if (!subItem) continue;
        const ratio = cand.conversionRatio > 0 ? cand.conversionRatio : 1;
        totalBase += (subItem.stock ?? 0) * ratio;
        if (!substituteHint && (primary?.stock ?? 0) <= 0 && (subItem.stock ?? 0) > 0) {
          substituteHint = { componentId: c.inventoryItemId, subItemId: cand.inventoryItemId };
        }
      }
    }

    const possible = Math.floor(totalBase / perUnit);
    if (possible < min) {
      min = possible;
      limitingId = c.inventoryItemId;
    }
  }

  return {
    producible: min === Infinity ? 0 : min,
    limitingId,
    substituteHint,
  };
}
