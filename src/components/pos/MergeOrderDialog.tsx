import { usePOS } from "@/contexts/POSContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Merge } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  sourceOrderId: string | null;
}

export default function MergeOrderDialog({ open, onClose, sourceOrderId }: Props) {
  const { orders, mergeOrders } = usePOS();

  const sourceOrder = orders.find(o => o.id === sourceOrderId);
  const eligibleOrders = orders.filter(o =>
    o.id !== sourceOrderId &&
    !["paid", "voided"].includes(o.status)
  );

  const handleMerge = (targetId: string) => {
    if (sourceOrderId) {
      mergeOrders(sourceOrderId, targetId);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Merge {sourceOrder?.orderNumber} into...</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Select the order to merge into. Items from {sourceOrder?.orderNumber} will be added to the target order.
        </p>
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2">
            {eligibleOrders.map(order => (
              <button
                key={order.id}
                onClick={() => handleMerge(order.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 transition-all text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{order.orderNumber}</span>
                    {order.tableNumber && <Badge variant="secondary" className="text-[10px]">{order.tableNumber}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {order.items.length} items · ${order.totalAmount.toFixed(2)}
                  </p>
                </div>
                <Merge className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
            {eligibleOrders.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No eligible orders to merge with</p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
