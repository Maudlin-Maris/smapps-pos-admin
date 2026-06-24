/**
 * useSubstitutionGate — wraps a cart-add action with composite substitution
 * gating. Resolves the composite for the product being added, applies the
 * configured substitute mode, and:
 *
 *  - STRICT:           blocks add if primary unavailable (toast)
 *  - AUTO:             proceeds silently + logs the substitution. NO toast,
 *                      NO modal — cashier flow is uninterrupted. Substitution
 *                      data is returned so the caller can attach it to the
 *                      cart line for a subtle in-cart indicator.
 *  - MANUAL_APPROVAL:  collects ALL components needing approval first, then
 *                      opens ONE consolidated approval modal. The cashier
 *                      can change the picked substitute per row, then either
 *                      "Approve all" or "Reject item". This avoids stacking
 *                      sequential pop-ups when several ingredients are out at
 *                      the same time — critical for fast restaurant ops.
 *
 * Returns: { allowed, substitutions } — substitutions array is attached to
 * the cart line by the caller (POSCartItem.substitutions) for audit trail.
 * Downstream kitchen tickets and inventory deduction MUST read from this
 * array (not the original recipe) so the actual substitute ingredients flow
 * through to the docket and stock counts.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { InventoryItem } from "@/components/inventory/InventoryItemForm";
import type { CompositeItem } from "@/components/inventory/CompositeItemForm";
import { useCompositesStore } from "@/hooks/use-composites-store";
import { useGetInventoryItems } from "@/services/api/inventory/item";
import { useGetSubstituteGroups } from "@/services/api/inventory/substitute-group";
import {
  resolveComponent,
  getViableSubstitutes,
  type ViableSubstitute,
} from "@/lib/composite-substitution";
import type { CartSubstitutionRecord } from "@/lib/types/substitution-logs-response";

const logSubstitution = (entry: any) => {
  try {
    const raw = localStorage.getItem("substitution_logs_v1");
    const current = raw ? JSON.parse(raw) : [];
    const full = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("substitution_logs_v1", JSON.stringify([...current, full].slice(-1000)));
    window.dispatchEvent(new CustomEvent("substitution-logs-update"));
  } catch {}
};

interface GateInput {
  productName: string;
  outletId?: string;
  cashier?: string;
  orderRef?: string;
}

/** A single component that needs cashier approval. The consolidated modal
 *  renders one row per decision. */
export interface SubstitutionDecision {
  /** Stable id derived from originalItemId for keying. */
  key: string;
  originalItemId: string;
  originalItemName: string;
  originalUnitCost: number;
  /** Default selected substitute (highest-priority viable in-stock one). */
  proposed: ViableSubstitute;
  /** All in-stock candidates (already filtered: NEVER includes out-of-stock). */
  alternatives: ViableSubstitute[];
  /** Base-unit shortfall this substitute must cover. */
  shortfallBaseQty: number;
}

/** Payload passed to the consolidated approval modal. */
export interface ConsolidatedApprovalRequest {
  compositeName: string;
  decisions: SubstitutionDecision[];
}

export interface GateResult {
  allowed: boolean;
  substitutions: CartSubstitutionRecord[];
}

export function useSubstitutionGate() {
  const [composites] = useCompositesStore([]);
  const { data: subGroupsResponse } = useGetSubstituteGroups({ per_page: 1000 });
  const groups = useMemo(() => subGroupsResponse?.data || [], [subGroupsResponse]);
  const { data: inventoryResponse } = useGetInventoryItems({ per_page: 1000 });
  const inventory = useMemo(() => {
    return (inventoryResponse?.data || []).map((item) => ({
      ...item,
      stock: item.quantity,
    })) as unknown as InventoryItem[];
  }, [inventoryResponse]);

  const [pendingRequest, setPendingRequest] = useState<ConsolidatedApprovalRequest | null>(null);
  // Resolver receives a Map<originalItemId, picked-substitute> or null = reject all.
  const resolveRef = useRef<((picks: Map<string, ViableSubstitute> | null) => void) | null>(null);

  const findComposite = useCallback(
    (productName: string, outletId?: string): CompositeItem | undefined => {
      const norm = productName.trim().toLowerCase();
      return composites.find(
        (c) =>
          c.name.trim().toLowerCase() === norm &&
          (!outletId || !c.outletId || c.outletId === outletId)
      );
    },
    [composites]
  );

  const askForApproval = useCallback(
    (req: ConsolidatedApprovalRequest): Promise<Map<string, ViableSubstitute> | null> =>
      new Promise((resolve) => {
        resolveRef.current = resolve;
        setPendingRequest(req);
      }),
    []
  );

  const gate = useCallback(
    async ({ productName, outletId, cashier, orderRef }: GateInput): Promise<GateResult> => {
      const composite = findComposite(productName, outletId);
      if (!composite) return { allowed: true, substitutions: [] };

      const substitutions: CartSubstitutionRecord[] = [];
      // Per-call scratch holding the manual decisions + their record builders.
      const pendingDecisions: SubstitutionDecision[] = [];
      const builders = new Map<
        string,
        (chosen: ViableSubstitute, approver?: string) => CartSubstitutionRecord
      >();

      // ---- Pass 1: silently resolve every component (no UI prompts). ----
      for (const comp of composite.components) {
        if (!comp.inventoryItemId) continue;
        const requiredBaseQty = comp.quantity || 0;
        if (requiredBaseQty <= 0) continue;

        const res = resolveComponent({ component: comp, requiredBaseQty, inventory, groups });
        if (res.available && !res.primaryShort) continue;

        const original = inventory.find((i) => i.id === comp.inventoryItemId);
        const originalName = original?.name ?? "Component";

        if (!res.available) {
          toast.error(
            `${composite.name} unavailable — ${originalName} out of stock and no substitute has enough.`
          );
          return { allowed: false, substitutions: [] };
        }

        const sub = res.substituteUsed;
        if (!sub) continue;

        // Filter to in-stock viable substitutes only — modal NEVER shows OOS items.
        const primaryStock = original?.stock ?? 0;
        const shortfall = Math.max(0, requiredBaseQty - primaryStock);
        const alternatives = getViableSubstitutes(comp, shortfall, inventory, groups);
        const proposed =
          alternatives.find((a) => a.inventoryItemId === sub.inventoryItemId) ?? alternatives[0];
        if (!proposed) continue;

        // Closure that builds the cart-attached audit record + writes a log.
        // Captures `original`, `shortfall`, `comp` so the post-modal pass can
        // produce a record from any cashier-chosen substitute.
        const compInventoryId = comp.inventoryItemId;
        const compositeOutletId = composite.outletId || outletId || "";
        const buildAndLog = (
          chosen: ViableSubstitute,
          reason: CartSubstitutionRecord["reason"],
          approver?: string
        ): CartSubstitutionRecord => {
          const ratio = chosen.conversionRatio || 1;
          const qty = shortfall / ratio;
          const variance =
            chosen.unitCost * qty - (original?.costPrice ?? 0) * qty * ratio;
          const rec: CartSubstitutionRecord = {
            originalItemId: compInventoryId,
            originalItemName: originalName,
            substituteItemId: chosen.inventoryItemId,
            substituteItemName: chosen.itemName,
            quantityUsed: qty,
            conversionRatio: ratio,
            costVariance: variance,
            reason,
            approvedBy: reason === "manual_approval" ? approver : undefined,
            timestamp: new Date().toISOString(),
          };
          logSubstitution({
            outletId: compositeOutletId,
            orderRef,
            cashier,
            compositeName: composite.name,
            originalItemId: rec.originalItemId,
            originalItemName: rec.originalItemName,
            substituteItemId: rec.substituteItemId,
            substituteItemName: rec.substituteItemName,
            quantityUsed: rec.quantityUsed,
            originalUnitCost: original?.costPrice ?? 0,
            substituteUnitCost: chosen.unitCost,
            costVariance: rec.costVariance,
            mode: reason === "auto" ? "auto" : "manual_approval",
          });
          return rec;
        };

        if (res.mode === "auto") {
          // SILENT path — record + log immediately, no UI interruption.
          substitutions.push(buildAndLog(proposed, "auto"));
          continue;
        }

        if (res.mode === "manual_approval") {
          pendingDecisions.push({
            key: compInventoryId,
            originalItemId: compInventoryId,
            originalItemName: originalName,
            originalUnitCost: original?.costPrice ?? 0,
            proposed,
            alternatives,
            shortfallBaseQty: shortfall,
          });
          builders.set(compInventoryId, (chosen, approver) =>
            buildAndLog(chosen, "manual_approval", approver)
          );
        }
      }

      // ---- Pass 2: if any manual decisions, ask in a SINGLE consolidated modal. ----
      if (pendingDecisions.length > 0) {
        const picks = await askForApproval({
          compositeName: composite.name,
          decisions: pendingDecisions,
        });
        setPendingRequest(null);
        resolveRef.current = null;

        if (!picks) {
          toast.error("Substitution rejected. Item not added.");
          return { allowed: false, substitutions: [] };
        }

        for (const decision of pendingDecisions) {
          const chosen = picks.get(decision.key) ?? decision.proposed;
          const make = builders.get(decision.key);
          if (!make) continue;
          substitutions.push(make(chosen, cashier));
        }
      }

      return { allowed: true, substitutions };
    },
    [findComposite, inventory, groups, askForApproval]
  );

  /** Approve all decisions with the cashier's chosen picks (per-row). */
  const approve = useCallback((picks: Map<string, ViableSubstitute>) => {
    resolveRef.current?.(picks);
  }, []);

  /** Reject the entire substitution — item is not added to cart. */
  const reject = useCallback(() => {
    resolveRef.current?.(null);
  }, []);

  return useMemo(
    () => ({ gate, pendingRequest, approve, reject }),
    [gate, pendingRequest, approve, reject]
  );
}
