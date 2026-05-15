/**
 * useSubstitutionGate — wraps a cart-add action with composite substitution
 * gating. Resolves the composite for the product being added, applies the
 * configured substitute mode, and:
 *
 *  - STRICT:           blocks add if primary unavailable (toast)
 *  - AUTO:             proceeds + logs the substitution
 *  - MANUAL_APPROVAL:  opens a dialog; cashier approves -> proceed + log,
 *                      rejects -> abort
 *
 * Inventory state is read from the in-session composites/inventory pools.
 * Stock-mutating sales are out of scope here; this hook only handles the
 * decision flow + audit log so admins can see substitutions taking place.
 */

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { defaultInventoryItems } from "@/data/inventoryItems";
import type { InventoryItem } from "@/components/inventory/InventoryItemForm";
import type { CompositeItem } from "@/components/inventory/CompositeItemForm";
import { useCompositesStore } from "@/hooks/use-composites-store";
import { useSubstituteGroups } from "@/data/substituteGroups";
import { resolveComponent } from "@/lib/composite-substitution";
import { logSubstitution } from "@/data/substitutionLogs";
import type { SubstituteApprovalRequest } from "@/components/pos/SubstituteApprovalDialog";

interface GateInput {
  productName: string;
  outletId?: string;
  cashier?: string;
  orderRef?: string;
}

export function useSubstitutionGate() {
  const [composites] = useCompositesStore([]);
  const [groups] = useSubstituteGroups([]);
  const inventory: InventoryItem[] = defaultInventoryItems;

  const [pendingRequest, setPendingRequest] = useState<SubstituteApprovalRequest | null>(null);
  const pendingResolveRef = useState<{ resolve?: (ok: boolean) => void }>({ })[0] as any;

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

  /**
   * Returns true when the cart action may proceed. Returns false to abort.
   * `proceed` is invoked synchronously for STRICT/AUTO and after user
   * approval for MANUAL_APPROVAL.
   */
  const gate = useCallback(
    async ({ productName, outletId, cashier, orderRef }: GateInput): Promise<boolean> => {
      const composite = findComposite(productName, outletId);
      if (!composite) return true; // not a tracked composite — pass through

      for (const comp of composite.components) {
        if (!comp.inventoryItemId) continue;
        const requiredBaseQty = comp.quantity || 0;
        if (requiredBaseQty <= 0) continue;
        const res = resolveComponent({
          component: comp,
          requiredBaseQty,
          inventory,
          groups,
        });
        if (res.available && !res.primaryShort) continue;

        const original = inventory.find((i) => i.id === comp.inventoryItemId);
        const originalName = original?.name ?? "Component";

        // No availability anywhere -> hard block
        if (!res.available) {
          toast.error(
            `${composite.name} unavailable — ${originalName} out of stock and no substitute has enough.`
          );
          return false;
        }

        const sub = res.substituteUsed;
        if (!sub) continue;
        const subItem = inventory.find((i) => i.id === sub.inventoryItemId);
        const subName = subItem?.name ?? "Substitute";

        const logEntry = (mode: "auto" | "manual_approval") =>
          logSubstitution({
            outletId: composite.outletId || outletId || "",
            orderRef,
            cashier,
            compositeName: composite.name,
            originalItemId: comp.inventoryItemId,
            originalItemName: originalName,
            substituteItemId: sub.inventoryItemId,
            substituteItemName: subName,
            quantityUsed: sub.qtyBase,
            originalUnitCost: original?.costPrice ?? 0,
            substituteUnitCost: sub.unitCost,
            costVariance:
              sub.unitCost * sub.qtyBase -
              (original?.costPrice ?? 0) * sub.qtyBase * sub.conversionRatio,
            mode,
          });

        if (res.mode === "auto") {
          logEntry("auto");
          toast.info(`Auto-substituted ${originalName} → ${subName}`);
          continue;
        }

        if (res.mode === "manual_approval") {
          // Pause the gate, open the approval dialog, await decision.
          const approved = await new Promise<boolean>((resolve) => {
            pendingResolveRef.resolve = resolve;
            setPendingRequest({
              compositeName: composite.name,
              originalItemName: originalName,
              originalUnitCost: original?.costPrice ?? 0,
              substituteItemName: subName,
              substituteUnitCost: sub.unitCost,
              substituteQty: sub.qtyBase,
              conversionRatio: sub.conversionRatio,
            });
          });
          setPendingRequest(null);
          if (!approved) {
            toast.error("Substitution rejected. Item not added.");
            return false;
          }
          logEntry("manual_approval");
        }
      }

      return true;
    },
    [findComposite, inventory, groups, pendingResolveRef]
  );

  const approve = useCallback(() => {
    pendingResolveRef.resolve?.(true);
  }, [pendingResolveRef]);

  const reject = useCallback(() => {
    pendingResolveRef.resolve?.(false);
  }, [pendingResolveRef]);

  return useMemo(
    () => ({ gate, pendingRequest, approve, reject }),
    [gate, pendingRequest, approve, reject]
  );
}
