import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, KeyRound, Save, RotateCcw, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  getAllVoidCodes,
  setVoidCode,
  subscribeVoidCodes,
  type VoidCodeType,
} from "@/lib/void-codes-store";

interface CodeCardProps {
  type: VoidCodeType;
  title: string;
  description: string;
  current: string;
  onSave: (code: string) => void;
}

function CodeCard({ type, title, description, current, onSave }: CodeCardProps) {
  const [draft, setDraft] = useState("");
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    setDraft("");
  }, [current]);

  const dirty = draft.length === 4 && draft !== current;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current code</p>
            <p className="text-xl font-bold font-mono tracking-[0.4em]">
              {reveal ? current : "••••"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReveal((r) => !r)}
            className="gap-1"
          >
            {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {reveal ? "Hide" : "Show"}
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">New 4-digit code</Label>
          <InputOTP maxLength={4} value={draft} onChange={setDraft}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDraft("")}
            disabled={!draft}
          >
            <RotateCcw className="w-4 h-4 mr-1" /> Clear
          </Button>
          <Button
            size="sm"
            disabled={!dirty}
            onClick={() => {
              onSave(draft);
              setDraft("");
            }}
          >
            <Save className="w-4 h-4 mr-1" /> Save code
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VoidCodeManagement() {
  const [codes, setCodes] = useState(() => getAllVoidCodes());

  useEffect(() => {
    return subscribeVoidCodes(() => setCodes(getAllVoidCodes()));
  }, []);

  const handleSave = (type: VoidCodeType, label: string) => (code: string) => {
    try {
      setVoidCode(type, code);
      toast({ title: `${label} updated`, description: "Cashiers will need to use the new code immediately." });
    } catch (e: any) {
      toast({ title: "Could not save code", description: e?.message || "Code must be exactly 4 digits", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Void Authorization Codes</h1>
          <Badge variant="outline" className="gap-1">
            <ShieldAlert className="w-3 h-3" /> Admin
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Manage the 4-digit codes cashiers must enter at the POS before removing items or voiding entire orders.
          Treat these as a shared secret with supervisors only.
        </p>
      </div>

      <div className="rounded-lg border border-warning/40 bg-warning/5 px-4 py-3 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Security tip</p>
          <p className="text-muted-foreground">
            Use different codes for item removal and order void so junior staff with the item-removal code can't void full orders. Rotate codes whenever a supervisor leaves.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CodeCard
          type="item"
          title="Remove Item Code"
          description="Required to remove a single item from an existing order."
          current={codes.item}
          onSave={handleSave("item", "Item removal code")}
        />
        <CodeCard
          type="order"
          title="Void Order Code"
          description="Required to void an entire unpaid order. Cannot be undone."
          current={codes.order}
          onSave={handleSave("order", "Order void code")}
        />
      </div>
    </div>
  );
}
