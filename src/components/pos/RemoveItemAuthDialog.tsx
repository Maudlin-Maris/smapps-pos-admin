import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ShieldAlert } from "lucide-react";
import { useGetVoidCodes } from "@/services/api/inventory/void-codes";
import type { VoidCodeType } from "@/lib/types/void-codes";

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthorized: () => void;
  itemName?: string;
  title?: string;
  description?: React.ReactNode;
  codeType?: VoidCodeType;
  outletId?: string | null;
}

export default function RemoveItemAuthDialog({ open, onClose, onAuthorized, itemName, title, description, codeType = "item", outletId }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const { data: voidCodesData, isLoading } = useGetVoidCodes();

  const handleSubmit = () => {
    const effectiveCode = (outletId && voidCodesData?.byOutlet?.[outletId]?.[codeType])
      || voidCodesData?.global?.[codeType];

    if (code === effectiveCode) {
      setCode("");
      setError(false);
      onAuthorized();
    } else {
      setError(true);
    }
  };

  const handleClose = () => {
    setCode("");
    setError(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={o => !o && handleClose()}>
      <SheetContent side="right" className="!w-full !max-w-none lg:!max-w-xs p-0 flex flex-col overflow-hidden [&>button]:z-10">
        <SheetHeader className="items-center text-center px-6 pt-6 pb-4 border-b border-border">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <SheetTitle className="text-base">{title || "Authorization Required"}</SheetTitle>
          <SheetDescription className="text-xs">
            {description || (
              <>Enter 4-digit code to remove <span className="font-semibold text-foreground">{itemName}</span> from order.</>
            )}
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col items-center gap-4 px-6 py-6">
          <InputOTP
            maxLength={4}
            value={code}
            onChange={val => { setCode(val); setError(false); }}
            onComplete={() => handleSubmit()}
            disabled={isLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
          {error && <p className="text-xs text-destructive font-medium">Invalid authorization code</p>}
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" className="flex-1" onClick={handleClose}>Cancel</Button>
            <Button size="sm" className="flex-1" onClick={handleSubmit} disabled={code.length < 4 || isLoading}>Confirm</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
