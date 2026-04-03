import { Dialog, DialogContent } from "@/components/ui/dialog";
import PaymentContent from "./PaymentContent";

interface Props {
  open: boolean;
  onClose: () => void;
  existingOrderId?: string;
  onBackToOrder?: () => void;
}

export default function PaymentDialog({ open, onClose, existingOrderId, onBackToOrder }: Props) {
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <PaymentContent
          existingOrderId={existingOrderId}
          onClose={onClose}
          onBackToOrder={onBackToOrder}
        />
      </DialogContent>
    </Dialog>
  );
}
