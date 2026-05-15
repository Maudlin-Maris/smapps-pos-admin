import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Check,
  Package,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/currency";
import type {
  ConsolidatedApprovalRequest,
  SubstitutionDecision,
} from "@/hooks/use-substitution-gate";
import type { ViableSubstitute } from "@/lib/composite-substitution";

interface Props {
  open: boolean;
  request: ConsolidatedApprovalRequest | null;
  /** Called with the cashier's picks keyed by originalItemId. */
  onApprove: (picks: Map<string, ViableSubstitute>) => void;
  /** Reject the whole item — no substitutions, item is not added. */
  onReject: () => void;
}

/**
 * CONSOLIDATED MANUAL_APPROVAL flow modal.
 *
 * When multiple composite components are simultaneously unavailable, we
 * collect ALL of them and surface them in one dialog instead of stacking
 * sequential pop-ups. Cashier can:
 *   - swap to a different in-stock substitute per row,
 *   - approve all at once, or
 *   - reject the item entirely.
 *
 * Out-of-stock substitutes are filtered upstream — they NEVER appear here.
 */
export default function SubstituteApprovalDialog({
  open,
  request,
  onApprove,
  onReject,
}: Props) {
  // Map<originalItemId, picked-substitute-id>
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!request) return;
    const initial: Record<string, string> = {};
    for (const d of request.decisions) initial[d.key] = d.proposed.inventoryItemId;
    setPicks(initial);
    setExpanded({});
  }, [request]);

  const totalVariance = useMemo(() => {
    if (!request) return 0;
    return request.decisions.reduce((sum, d) => {
      const chosen =
        d.alternatives.find((a) => a.inventoryItemId === picks[d.key]) ?? d.proposed;
      const ratio = chosen.conversionRatio || 1;
      const qty = d.shortfallBaseQty / ratio;
      return sum + (chosen.unitCost * qty - d.originalUnitCost * qty * ratio);
    }, 0);
  }, [request, picks]);

  if (!request) return null;

  const handleApproveAll = () => {
    const out = new Map<string, ViableSubstitute>();
    for (const d of request.decisions) {
      const chosen =
        d.alternatives.find((a) => a.inventoryItemId === picks[d.key]) ?? d.proposed;
      out.set(d.key, chosen);
    }
    onApprove(out);
  };

  const multi = request.decisions.length > 1;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onReject()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-warning/15 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-warning" />
            </div>
            <DialogTitle>
              {multi
                ? `${request.decisions.length} substitutes required`
                : "Substitute required"}
            </DialogTitle>
          </div>
          <DialogDescription>
            <span className="font-medium text-foreground">{request.compositeName}</span> has{" "}
            {multi ? "ingredients that are" : "an ingredient that is"} unavailable. Review and
            approve the {multi ? "substitutes" : "substitute"} to continue.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[55vh] pr-3">
          <div className="space-y-2">
            {request.decisions.map((d) => (
              <DecisionRow
                key={d.key}
                decision={d}
                pickedId={picks[d.key]}
                expanded={!!expanded[d.key]}
                onPick={(id) => setPicks((p) => ({ ...p, [d.key]: id }))}
                onToggleExpand={() =>
                  setExpanded((e) => ({ ...e, [d.key]: !e[d.key] }))
                }
              />
            ))}
          </div>
        </ScrollArea>

        {multi && (
          <div className="flex items-center justify-between text-xs px-1 pt-1 border-t">
            <span className="text-muted-foreground">Total cost variance</span>
            <span
              className={cn(
                "font-semibold tabular-nums flex items-center gap-1",
                totalVariance < 0
                  ? "text-success"
                  : totalVariance > 0
                  ? "text-warning"
                  : "text-muted-foreground"
              )}
            >
              {totalVariance < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <TrendingUp className="h-3 w-3" />
              )}
              {totalVariance >= 0 ? "+" : ""}
              {formatNaira(totalVariance)}
            </span>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onReject}>
            Reject item
          </Button>
          <Button onClick={handleApproveAll}>
            {multi ? "Approve all" : "Approve substitute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------------------------------------------------------- */

interface RowProps {
  decision: SubstitutionDecision;
  pickedId: string | undefined;
  expanded: boolean;
  onPick: (id: string) => void;
  onToggleExpand: () => void;
}

/** Single decision row — original → picked substitute, with optional
 *  inline alternatives chooser when multiple in-stock options exist. */
function DecisionRow({ decision, pickedId, expanded, onPick, onToggleExpand }: RowProps) {
  const picked =
    decision.alternatives.find((a) => a.inventoryItemId === pickedId) ?? decision.proposed;
  const ratio = picked.conversionRatio || 1;
  const qty = decision.shortfallBaseQty / ratio;
  const variance = picked.unitCost * qty - decision.originalUnitCost * qty * ratio;
  const cheaper = variance < 0;
  const hasMultiple = decision.alternatives.length > 1;

  return (
    <div className="border rounded-lg p-2.5 bg-card">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="space-y-0.5 text-center p-2 rounded-md border bg-muted/30 min-w-0">
          <Badge variant="outline" className="text-[10px]">
            Unavailable
          </Badge>
          <p className="text-xs font-semibold truncate">{decision.originalItemName}</p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {formatNaira(decision.originalUnitCost)}
          </p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="space-y-0.5 text-center p-2 rounded-md border border-primary/40 bg-primary/5 min-w-0">
          <Badge className="text-[10px]">Substitute</Badge>
          <p className="text-xs font-semibold truncate">{picked.itemName}</p>
          <p className="text-[10px] text-muted-foreground tabular-nums">
            {formatNaira(picked.unitCost)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] mt-2 px-0.5">
        <span className="text-muted-foreground flex items-center gap-1">
          <Package className="h-3 w-3" />
          <span className="tabular-nums">{picked.stock}</span> in stock · qty{" "}
          <span className="tabular-nums">{qty.toFixed(2)}</span>
          {ratio !== 1 && <> · ×{ratio}</>}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 font-medium tabular-nums",
            cheaper ? "text-success" : variance > 0 ? "text-warning" : "text-muted-foreground"
          )}
        >
          {cheaper ? (
            <TrendingDown className="h-3 w-3" />
          ) : (
            <TrendingUp className="h-3 w-3" />
          )}
          {variance >= 0 ? "+" : ""}
          {formatNaira(variance)}
        </span>
      </div>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={onToggleExpand}
            className="mt-2 w-full flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3" /> Hide alternatives
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" /> Choose another (
                {decision.alternatives.length})
              </>
            )}
          </button>
          {expanded && (
            <div className="mt-1 space-y-1">
              {decision.alternatives.map((alt) => {
                const selected = alt.inventoryItemId === picked.inventoryItemId;
                return (
                  <button
                    key={alt.inventoryItemId}
                    onClick={() => onPick(alt.inventoryItemId)}
                    className={cn(
                      "w-full flex items-center gap-2 p-1.5 rounded-md border text-left transition-colors",
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
                      <p className="text-xs font-medium truncate">{alt.itemName}</p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {alt.stock} in stock · {formatNaira(alt.unitCost)}
                        {alt.conversionRatio !== 1 && <> · ×{alt.conversionRatio}</>}
                      </p>
                    </div>
                    {!alt.coversShortfall && (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-warning border-warning/40"
                      >
                        Partial
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
