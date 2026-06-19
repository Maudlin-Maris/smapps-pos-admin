import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatNaira } from "@/lib/currency";
import type { PayoutMethod } from "@/data/tipsTypes";
import { useToast } from "@/hooks/use-toast";
import { Mail, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { useSendTipsPayoutOtp, useConfirmTipsPayout } from "@/services/api/tips";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  staffId: string;
  staffName: string;
  outletId: string;
  outletName: string;
  outstandingAmount: number;
  businessEmail: string;
  actor: string;
  onConfirmed: () => void;
  /** Optional: restrict allocation to specific tip entries. */
  tipIds?: string[];
  /** Optional: customise the dialog title/description for single-tip flows. */
  contextLabel?: string;
}

type Step = "amount" | "otp";

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const visible = user.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

export default function ProcessPayoutDialog({
  open,
  onOpenChange,
  staffId,
  staffName,
  outletId,
  outletName,
  outstandingAmount,
  businessEmail,
  actor,
  onConfirmed,
  tipIds,
  contextLabel,
}: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState<string>(outstandingAmount.toString());
  const [method, setMethod] = useState<PayoutMethod>("transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [otp, setOtp] = useState("");

  const { trigger: triggerSendOtp, isMutating: isSendingOtp } = useSendTipsPayoutOtp();
  const { trigger: triggerConfirm, isMutating: isConfirming } = useConfirmTipsPayout();

  useEffect(() => {
    if (open) {
      setStep("amount");
      setAmount(outstandingAmount.toString());
      setMethod("transfer");
      setReference("");
      setNotes("");
      setOtp("");
    }
  }, [open, outstandingAmount]);

  const numericAmount = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  const amountValid =
    numericAmount > 0 && numericAmount <= outstandingAmount + 0.0001;

  async function sendOtp() {
    try {
      await triggerSendOtp({
        email: businessEmail,
        staffId,
        outletId,
        amount: numericAmount,
        method,
        reference: reference.trim() || "transfer",
        notes: notes.trim() || undefined,
      });
      setOtp("");
      setStep("otp");
      toast({
        title: "Verification code sent",
        description: `A verification code was sent to ${maskEmail(businessEmail)}.`,
      });
    } catch (e) {
      // Handled by SWR onError toast
    }
  }

  async function confirmPayout() {
    try {
      await triggerConfirm({
        email: businessEmail,
        otp,
        staffId,
        outletId,
        amount: numericAmount,
        method,
        reference: reference.trim() || "transfer",
      });
      toast({
        title: "Payout recorded",
        description: `${formatNaira(numericAmount)} paid to ${staffName}.`,
      });
      onConfirmed();
      onOpenChange(false);
    } catch (e) {
      // Handled by SWR onError toast
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "amount" ? "Process tip payout" : "Verify payout"}
          </DialogTitle>
          <DialogDescription>
            {step === "amount" ? (
              <>
                Confirm the amount you've paid <strong>{staffName}</strong> at{" "}
                <strong>{outletName}</strong>
                {contextLabel ? <> for <strong>{contextLabel}</strong></> : null}.{" "}
                Outstanding: {formatNaira(outstandingAmount)}.
              </>
            ) : (
              <>Enter the 6-digit code we sent for authorisation.</>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === "amount" && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Amount paid</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  max={outstandingAmount}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(outstandingAmount.toString())}
                >
                  Full
                </Button>
              </div>
              {!amountValid && (
                <p className="text-xs text-destructive mt-1">
                  Enter an amount between ₦1 and {formatNaira(outstandingAmount)}.
                </p>
              )}
            </div>

            <div>
              <Label className="text-xs">Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PayoutMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="transfer">Bank transfer</SelectItem>
                  <SelectItem value="payroll">Payroll inclusion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Reference (optional)</Label>
              <Input
                placeholder="Transfer ref, receipt no."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-xs">
                A verification code will be sent to{" "}
                <strong>{maskEmail(businessEmail)}</strong> to authorise this
                payout.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button disabled={!amountValid || isSendingOtp} onClick={sendOtp}>
                {isSendingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send verification code
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Confirming payout of <strong>{formatNaira(numericAmount)}</strong> to{" "}
                <strong>{staffName}</strong>.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col items-center gap-2">
              <Label className="text-xs">6-digit code</Label>
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <button
                type="button"
                className="text-xs text-muted-foreground underline-offset-2 hover:underline animate-pulse"
                onClick={sendOtp}
                disabled={isSendingOtp}
              >
                {isSendingOtp ? "Resending..." : "Resend code"}
              </button>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("amount")}
                disabled={isConfirming}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                disabled={otp.length !== 6 || isConfirming}
                onClick={confirmPayout}
              >
                {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm payout
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
