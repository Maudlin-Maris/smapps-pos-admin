import { Sheet, SheetContent } from "@/components/ui/sheet";
import PaymentContent from "./PaymentContent";

interface Props {
  open: boolean;
  onClose: () => void;
  existingOrderId?: string;
  onBackToOrder?: () => void;
}

export default function PaymentDialog({ open, onClose, existingOrderId, onBackToOrder }: Props) {
  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent side="right" className="!w-full !max-w-none lg:!max-w-md p-0 flex flex-col overflow-hidden [&>button]:z-10">
        <div className="flex-1 overflow-y-auto p-6">
          <PaymentContent
            existingOrderId={existingOrderId}
            onClose={onClose}
            onBackToOrder={onBackToOrder}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
