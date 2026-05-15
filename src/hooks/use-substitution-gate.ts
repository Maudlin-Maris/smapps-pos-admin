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
 * Downstream kitchen tickets and inventory deduction read from this array
 * (NOT the original recipe) so the actual substitute ingredients are used.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { defaultInventoryItems } from "@/data/inventoryItems";
import type { InventoryItem } from "@/components/inventory/InventoryItemForm";
import type { CompositeItem } from "@/components/inventory/CompositeItemForm";
import { useCompositesStore } from "@/hooks/use-composites-store";
import { useSubstituteGroups } from "@/data/substituteGroups";
import {
  resolveComponent,
  getViableSubstitutes,
  type ViableSubstitute,
} from "@/lib/composite-substitution";
import { logSubstitution } from "@/data/substitutionLogs";
import type { CartSubstitutionRecord } from "@/data/posData";

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
  /** Default selected substitute (highest-priority viable one). */
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
  const [groups] = useSubstituteGroups([]);
  const inventory: InventoryItem[] = defaultInventoryItems;

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
      // Collected manual-approval decisions to consolidate into ONE modal.
      const pendingDecisions: SubstitutionDecision[] = [];
      // Original item lookup for cost calc when building records post-modal.
      const originalsByKey = new Map<string, InventoryItem | undefined>();

      // ---- Pass 1: resolve every component without prompting. ----
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

        const buildRecord = (
          chosen: ViableSubstitute,
          reason: CartSubstitutionRecord["reason"],
          approver?: string
        ): CartSubstitutionRecord => {
          const ratio = chosen.conversionRatio || 1;
          const qty = shortfall / ratio;
          const variance =
            chosen.unitCost * qty - (original?.costPrice ?? 0) * qty * ratio;
          return {
            originalItemId: comp.inventoryItemId,
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
        };

        const writeLog = (rec: CartSubstitutionRecord, mode: "auto" | "manual_approval") =>
          logSubstitution({
            outletId: composite.outletId || outletId || "",
            orderRef,
            cashier,
            compositeName: composite.name,
            originalItemId: rec.originalItemId,
            originalItemName: rec.originalItemName,
            substituteItemId: rec.substituteItemId,
            substituteItemName: rec.substituteItemName,
            quantityUsed: rec.quantityUsed,
            originalUnitCost: original?.costPrice ?? 0,
            substituteUnitCost: rec.costVariance / Math.max(rec.quantityUsed, 1e-9)
              + (original?.costPrice ?? 0) * (rec.conversionRatio || 1),
            costVariance: rec.costVariance,
            mode,
          });

        if (res.mode === "auto") {
          // SILENT path — record + log immediately, no UI interruption.
          const rec = buildRecord(proposed, "auto");
          substitutions.push(rec);
          writeLog(rec, "auto");
          continue;
        }

        if (res.mode === "manual_approval") {
          // Defer to the consolidated modal.
          originalsByKey.set(comp.inventoryItemId, original);
          pendingDecisions.push({
            key: comp.inventoryItemId,
            originalItemId: comp.inventoryItemId,
            originalItemName: originalName,
            originalUnitCost: original?.costPrice ?? 0,
            proposed,
            alternatives,
            shortfallBaseQty: shortfall,
          });
          // Stash the buildRecord/writeLog closures via the decision key.
          deferredBuilders.set(comp.inventoryItemId, { buildRecord, writeLog });
        }
      }

      // ---- Pass 2: if any manual decisions, ask in a SINGLE modal. ----
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
          const builder = deferredBuilders.get(decision.key);
          if (!builder) continue;
          const rec = builder.buildRecord(chosen, "manual_approval", cashier);
          substitutions.push(rec);
          builder.writeLog(rec, "manual_approval");
        }
        deferredBuilders.clear();
      }

      return { allowed: true, substitutions };
    },
    [findComposite, inventory, groups, askForApproval]
  );

  // Per-call scratch map of record-builders, keyed by originalItemId. Cleared
  // after each gate() invocation. Lives outside React state because it holds
  // closures and isn't UI-relevant.
  // (Declared here so it shares lexical scope with `gate` above.)
  const deferredBuilders = useMemo(
    () =>
      new Map<
        string,
        {
          buildRecord: (
            chosen: ViableSubstitute,
            reason: CartSubstitutionRecord["reason"],
            approver?: string
          ) => CartSubstitutionRecord;
          writeLog: (rec: CartSubstitutionRecord, mode: "auto" | "manual_approval") => void;
        }
      >(),
    []
  );

  const approve = useCallback(
    (picks: Map<string, ViableSubstitute>) => {
      resolveRef.current?.(picks);
    },
    []
  );

  const reject = useCallback(() => {
    resolveRef.current?.(null);
  }, []);

  return useMemo(
    () => ({ gate, pendingRequest, approve, reject }),
    [gate, pendingRequest, approve, reject]
  );
}
