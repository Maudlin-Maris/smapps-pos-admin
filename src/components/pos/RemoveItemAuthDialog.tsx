import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ShieldAlert } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthorized: () => void;
  itemName: string;
}

const AUTH_CODE = "1234";

export default function RemoveItemAuthDialog({ open, onClose, onAuthorized, itemName }: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (code === AUTH_CODE) {
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
    <Dialog open={open} onOpenChange={o => !o && handleClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader className="items-center text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
            <ShieldAlert className="w-6 h-6 text-destructive" />
          </div>
          <DialogTitle className="text-base">Authorization Required</DialogTitle>
          <DialogDescription className="text-xs">
            Enter 4-digit code to remove <span className="font-semibold text-foreground">{itemName}</span> from order.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 pt-2">
          <InputOTP
            maxLength={4}
            value={code}
            onChange={val => { setCode(val); setError(false); }}
            onComplete={() => handleSubmit()}
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
            <Button size="sm" className="flex-1" onClick={handleSubmit} disabled={code.length < 4}>Confirm</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
