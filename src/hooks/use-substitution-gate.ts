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
 *  - MANUAL_APPROVAL:  opens an approval dialog showing the unavailable
 *                      ingredient, the proposed substitute, stock remaining,
 *                      cost variance, AND any alternative substitutes the
 *                      cashier can switch to before approving.
 *
 * Returns: { allowed, substitutions } — substitutions array is attached to
 * the cart line by the caller (POSCartItem.substitutions) for audit trail.
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

export interface SubstituteApprovalRequest {
  compositeName: string;
  originalItemName: string;
  originalUnitCost: number;
  /** Currently proposed substitute (cashier may pick another from alternatives). */
  proposed: ViableSubstitute;
  /** All in-stock candidates (including the proposed one), in priority order. */
  alternatives: ViableSubstitute[];
  /** Base-unit shortfall that must be covered. */
  shortfallBaseQty: number;
}

export interface GateResult {
  allowed: boolean;
  substitutions: CartSubstitutionRecord[];
}

export function useSubstitutionGate() {
  const [composites] = useCompositesStore([]);
  const [groups] = useSubstituteGroups([]);
  const inventory: InventoryItem[] = defaultInventoryItems;

  const [pendingRequest, setPendingRequest] = useState<SubstituteApprovalRequest | null>(null);
  const resolveRef = useRef<((picked: ViableSubstitute | null) => void) | null>(null);

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
    (req: SubstituteApprovalRequest): Promise<ViableSubstitute | null> =>
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

        // Compute viable alternatives the cashier can switch to.
        const primaryStock = original?.stock ?? 0;
        const shortfall = Math.max(0, requiredBaseQty - primaryStock);
        const alternatives = getViableSubstitutes(comp, shortfall, inventory, groups);
        const proposed =
          alternatives.find((a) => a.inventoryItemId === sub.inventoryItemId) ?? alternatives[0];

        const buildRecord = (
          chosen: ViableSubstitute,
          reason: CartSubstitutionRecord["reason"]
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
            approvedBy: reason === "manual_approval" ? cashier : undefined,
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
            substituteUnitCost: alternatives.find(
              (a) => a.inventoryItemId === rec.substituteItemId
            )?.unitCost ?? 0,
            costVariance: rec.costVariance,
            mode,
          });

        if (res.mode === "auto") {
          // SILENT: no toast, no modal — just record + log.
          if (proposed) {
            const rec = buildRecord(proposed, "auto");
            substitutions.push(rec);
            writeLog(rec, "auto");
          }
          continue;
        }

        if (res.mode === "manual_approval" && proposed) {
          const picked = await askForApproval({
            compositeName: composite.name,
            originalItemName: originalName,
            originalUnitCost: original?.costPrice ?? 0,
            proposed,
            alternatives,
            shortfallBaseQty: shortfall,
          });
          setPendingRequest(null);
          resolveRef.current = null;
          if (!picked) {
            toast.error("Substitution rejected. Item not added.");
            return { allowed: false, substitutions: [] };
          }
          const rec = buildRecord(picked, "manual_approval");
          substitutions.push(rec);
          writeLog(rec, "manual_approval");
        }
      }

      return { allowed: true, substitutions };
    },
    [findComposite, inventory, groups, askForApproval]
  );

  const approve = useCallback((picked?: ViableSubstitute) => {
    resolveRef.current?.(picked ?? pendingRequest?.proposed ?? null);
  }, [pendingRequest]);

  const reject = useCallback(() => {
    resolveRef.current?.(null);
  }, []);

  return useMemo(
    () => ({ gate, pendingRequest, approve, reject }),
    [gate, pendingRequest, approve, reject]
  );
}
