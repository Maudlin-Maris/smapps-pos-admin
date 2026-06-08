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
import { createPayout, markPayoutPaid } from "@/lib/tips-store";
import type { PayoutMethod } from "@/data/tipsTypes";
import { useToast } from "@/hooks/use-toast";
import { Mail, ShieldCheck, ArrowLeft } from "lucide-react";

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
}: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState<string>(outstandingAmount.toString());
  const [method, setMethod] = useState<PayoutMethod>("transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [otp, setOtp] = useState("");
  const [expectedOtp, setExpectedOtp] = useState("");
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("amount");
      setAmount(outstandingAmount.toString());
      setMethod("transfer");
      setReference("");
      setNotes("");
      setOtp("");
      setExpectedOtp("");
      setOtpSentAt(null);
    }
  }, [open, outstandingAmount]);

  const numericAmount = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  const amountValid =
    numericAmount > 0 && numericAmount <= outstandingAmount + 0.0001;

  function sendOtp() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedOtp(code);
    setOtp("");
    setOtpSentAt(Date.now());
    setStep("otp");
    toast({
      title: "Verification code sent",
      description: `A 6-digit code was sent to ${maskEmail(businessEmail)}. For this demo, the code is ${code}.`,
    });
  }

  function confirmPayout() {
    if (otp !== expectedOtp) {
      toast({
        title: "Invalid code",
        description: "The verification code is incorrect.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const payout = createPayout({
        staffId,
        outletId,
        periodStart: new Date(0).toISOString(),
        periodEnd: now,
        amount: numericAmount,
        method,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        actor,
      });
      if (!payout || payout.amount <= 0) {
        toast({
          title: "Nothing to pay",
          description: "No outstanding tips were available to allocate.",
          variant: "destructive",
        });
        return;
      }
      markPayoutPaid(payout.id, actor);
      toast({
        title: "Payout recorded",
        description: `${formatNaira(payout.amount)} paid to ${staffName}.`,
      });
      onConfirmed();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
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
                <strong>{outletName}</strong>. Outstanding:{" "}
                {formatNaira(outstandingAmount)}.
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
              <Button disabled={!amountValid} onClick={sendOtp}>
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
                className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                onClick={sendOtp}
              >
                Resend code
              </button>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("amount")}
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                disabled={otp.length !== 6 || submitting}
                onClick={confirmPayout}
              >
                Confirm payout
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
