import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/currency";

export interface SubstituteApprovalRequest {
  compositeName: string;
  originalItemName: string;
  originalUnitCost: number;
  substituteItemName: string;
  substituteUnitCost: number;
  /** Substitute base-unit qty that will be drawn. */
  substituteQty: number;
  /** Conversion ratio: subBase units replace this many original base units. */
  conversionRatio: number;
}

interface Props {
  open: boolean;
  request: SubstituteApprovalRequest | null;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * MANUAL_APPROVAL flow modal. Shown to cashier when a composite item's
 * primary ingredient is short and a substitute is queued. Cashier can
 * approve (continue with substitute, log entry) or reject (block sale).
 */
export default function SubstituteApprovalDialog({ open, request, onApprove, onReject }: Props) {
  if (!request) return null;
  const variance = request.substituteUnitCost * request.substituteQty -
    request.originalUnitCost * (request.substituteQty * request.conversionRatio);
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
            Use the substitute below?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2">
          <div className="space-y-1 text-center p-3 rounded-lg border bg-muted/30">
            <Badge variant="outline" className="text-[10px]">Original</Badge>
            <p className="text-sm font-semibold truncate">{request.originalItemName}</p>
            <p className="text-[11px] text-muted-foreground tabular-nums">{formatNaira(request.originalUnitCost)}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="space-y-1 text-center p-3 rounded-lg border border-primary/40 bg-primary/5">
            <Badge className="text-[10px]">Substitute</Badge>
            <p className="text-sm font-semibold truncate">{request.substituteItemName}</p>
            <p className="text-[11px] text-muted-foreground tabular-nums">{formatNaira(request.substituteUnitCost)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-muted-foreground">
            Qty drawn: <span className="font-medium text-foreground tabular-nums">{request.substituteQty}</span>
            {" "}· Ratio <span className="tabular-nums">×{request.conversionRatio}</span>
          </span>
          <span
            className={cn(
              "flex items-center gap-1 font-medium tabular-nums",
              cheaper ? "text-success" : variance > 0 ? "text-warning" : "text-muted-foreground"
            )}
          >
            {cheaper ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {variance >= 0 ? "+" : ""}{formatNaira(variance)} cost variance
          </span>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onReject}>Reject</Button>
          <Button onClick={onApprove}>Approve substitute</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
