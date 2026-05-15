import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, TrendingDown, TrendingUp, Check, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/currency";
import type { SubstituteApprovalRequest } from "@/hooks/use-substitution-gate";
import type { ViableSubstitute } from "@/lib/composite-substitution";

interface Props {
  open: boolean;
  request: SubstituteApprovalRequest | null;
  /** Called with the chosen substitute (defaults to currently-selected one). */
  onApprove: (picked?: ViableSubstitute) => void;
  onReject: () => void;
}

/**
 * MANUAL_APPROVAL flow modal. Shown to the cashier when a composite item's
 * primary ingredient is short. Cashier sees:
 *   - The unavailable original ingredient
 *   - The proposed substitute with stock remaining + cost variance
 *   - A list of alternative substitutes they can switch to before approving
 */
export default function SubstituteApprovalDialog({ open, request, onApprove, onReject }: Props) {
  const [pickedId, setPickedId] = useState<string | null>(null);

  useEffect(() => {
    if (request) setPickedId(request.proposed.inventoryItemId);
  }, [request]);

  if (!request) return null;

  const picked =
    request.alternatives.find((a) => a.inventoryItemId === pickedId) ?? request.proposed;
  const ratio = picked.conversionRatio || 1;
  const qty = request.shortfallBaseQty / ratio;
  const variance = picked.unitCost * qty - request.originalUnitCost * qty * ratio;
  const cheaper = variance < 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onReject()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-warning/15 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
            <DialogTitle>Substitute required</DialogTitle>
          </div>
          <DialogDescription>
            <span className="font-medium text-foreground">{request.originalItemName}</span> is
            unavailable for <span className="font-medium text-foreground">{request.compositeName}</span>.
            Pick a substitute to continue.
          </DialogDescription>
        </DialogHeader>

        {/* Original → Picked summary */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-1">
          <div className="space-y-1 text-center p-3 rounded-lg border bg-muted/30">
            <Badge variant="outline" className="text-[10px]">Unavailable</Badge>
            <p className="text-sm font-semibold truncate">{request.originalItemName}</p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {formatNaira(request.originalUnitCost)}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="space-y-1 text-center p-3 rounded-lg border border-primary/40 bg-primary/5">
            <Badge className="text-[10px]">Substitute</Badge>
            <p className="text-sm font-semibold truncate">{picked.itemName}</p>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {formatNaira(picked.unitCost)}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-muted-foreground flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span className="tabular-nums">{picked.stock}</span> in stock · qty{" "}
            <span className="tabular-nums">{qty.toFixed(2)}</span> · ×{ratio}
          </span>
          <span
            className={cn(
              "flex items-center gap-1 font-medium tabular-nums",
              cheaper ? "text-success" : variance > 0 ? "text-warning" : "text-muted-foreground"
            )}
          >
            {cheaper ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {variance >= 0 ? "+" : ""}
            {formatNaira(variance)}
          </span>
        </div>

        {/* Alternatives chooser (only when more than one option exists) */}
        {request.alternatives.length > 1 && (
          <div className="space-y-1 max-h-40 overflow-y-auto -mx-1 px-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide pt-1">
              Choose substitute
            </p>
            {request.alternatives.map((alt) => {
              const selected = alt.inventoryItemId === picked.inventoryItemId;
              return (
                <button
                  key={alt.inventoryItemId}
                  onClick={() => setPickedId(alt.inventoryItemId)}
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded-md border text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border flex items-center justify-center shrink-0",
                      selected ? "border-primary bg-primary" : "border-muted-foreground/40"
                    )}
                  >
                    {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{alt.itemName}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {alt.stock} in stock · {formatNaira(alt.unitCost)} · ×{alt.conversionRatio}
                    </p>
                  </div>
                  {!alt.coversShortfall && (
                    <Badge variant="outline" className="text-[10px] text-warning border-warning/40">
                      Partial
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onReject}>Reject</Button>
          <Button onClick={() => onApprove(picked)}>Approve substitute</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
