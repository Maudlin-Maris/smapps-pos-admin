import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, KeyRound, Save, Eye, EyeOff, Globe2, Store, Undo2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { outlets } from "@/data/outlets";
import {
  getGlobalVoidCodes,
  getOutletOverride,
  getVoidCode,
  setVoidCode,
  clearOutletOverride,
  subscribeVoidCodes,
  type VoidCodeType,
} from "@/lib/void-codes-store";

interface CodeCardProps {
  type: VoidCodeType;
  title: string;
  description: string;
  effective: string;
  override: string | undefined;
  scope: "global" | "outlet";
  outletId: string | null;
  onSave: (code: string) => void;
  onResetToGlobal?: () => void;
}

function CodeCard({ type, title, description, effective, override, scope, outletId, onSave, onResetToGlobal }: CodeCardProps) {
  const [draft, setDraft] = useState("");
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    setDraft("");
    setReveal(false);
  }, [effective, scope, outletId]);

  const dirty = draft.length === 4 && draft !== effective;
  const hasOverride = scope === "outlet" && !!override;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{title}</CardTitle>
              {scope === "outlet" && (
                hasOverride
                  ? <Badge variant="secondary" className="text-[10px]">Outlet override</Badge>
                  : <Badge variant="outline" className="text-[10px]">Using global</Badge>
              )}
            </div>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {scope === "global" ? "Current global code" : "Effective code at this outlet"}
            </p>
            <p className="text-xl font-bold font-mono tracking-[0.4em]">
              {reveal ? effective : "••••"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setReveal((r) => !r)} className="gap-1">
            {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {reveal ? "Hide" : "Show"}
          </Button>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">
            {scope === "global" ? "New global code" : hasOverride ? "New outlet code" : "Set outlet-specific code"}
          </Label>
          <InputOTP maxLength={4} value={draft} onChange={setDraft}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
          {scope === "outlet" && !hasOverride && (
            <p className="text-xs text-muted-foreground">
              Setting a code here overrides the global default for this outlet only.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          {scope === "outlet" && hasOverride && onResetToGlobal ? (
            <Button variant="ghost" size="sm" onClick={onResetToGlobal} className="text-muted-foreground">
              <Undo2 className="w-4 h-4 mr-1" /> Reset to global
            </Button>
          ) : <span />}
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm" onClick={() => setDraft("")} disabled={!draft}>Clear</Button>
            <Button size="sm" disabled={!dirty} onClick={() => { onSave(draft); setDraft(""); }}>
              <Save className="w-4 h-4 mr-1" /> Save code
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VoidCodeManagement() {
  const [globalCodes, setGlobalCodes] = useState(() => getGlobalVoidCodes());
  const [scope, setScope] = useState<"global" | string>("global");
  const [, forceRefresh] = useState(0);

  useEffect(() => {
    return subscribeVoidCodes(() => {
      setGlobalCodes(getGlobalVoidCodes());
      forceRefresh((n) => n + 1);
    });
  }, []);

  const activeOutletId = scope === "global" ? null : scope;
  const outletInfo = useMemo(
    () => outlets.find((o) => o.id === activeOutletId) || null,
    [activeOutletId],
  );
  const override = activeOutletId ? getOutletOverride(activeOutletId) : {};
  const overrideCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    outlets.forEach((o) => {
      const ov = getOutletOverride(o.id);
      counts[o.id] = (ov.item ? 1 : 0) + (ov.order ? 1 : 0);
    });
    return counts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalCodes]);

  const handleSave = (type: VoidCodeType, label: string) => (code: string) => {
    try {
      setVoidCode(type, code, activeOutletId);
      const where = activeOutletId ? outletInfo?.name || "Outlet" : "All outlets";
      toast({
        title: `${label} updated`,
        description: `${where}: cashiers must use the new code immediately.`,
      });
    } catch (e: any) {
      toast({
        title: "Could not save code",
        description: e?.message || "Code must be exactly 4 digits",
        variant: "destructive",
      });
    }
  };

  const handleReset = (type: VoidCodeType, label: string) => () => {
    if (!activeOutletId) return;
    clearOutletOverride(type, activeOutletId);
    toast({
      title: `${label} reverted to global`,
      description: `${outletInfo?.name} will use the global default.`,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">Void Authorization Codes</h1>
          <Badge variant="outline" className="gap-1">
            <ShieldAlert className="w-3 h-3" /> Admin
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Manage the 4-digit codes cashiers must enter at the POS before removing items or voiding entire orders.
          Set a global default, then override per outlet as needed.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 flex items-center gap-3 flex-wrap">
          <Label className="text-sm font-medium shrink-0">Manage codes for</Label>
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="w-full sm:w-[320px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4" />
                  <span>Global default (all outlets)</span>
                </div>
              </SelectItem>
              {outlets.map((o) => {
                const count = overrideCounts[o.id] || 0;
                return (
                  <SelectItem key={o.id} value={o.id}>
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4" />
                      <span>{o.name}</span>
                      {count > 0 && (
                        <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">
                          {count} override{count > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {activeOutletId && (
            <p className="text-xs text-muted-foreground">
              Outlet codes fall back to the global default when no override is set.
            </p>
          )}
        </CardContent>
      </Card>

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
          effective={getVoidCode("item", activeOutletId)}
          override={activeOutletId ? override.item : undefined}
          scope={activeOutletId ? "outlet" : "global"}
          outletId={activeOutletId}
          onSave={handleSave("item", "Item removal code")}
          onResetToGlobal={activeOutletId ? handleReset("item", "Item removal code") : undefined}
        />
        <CodeCard
          type="order"
          title="Void Order Code"
          description="Required to void an entire unpaid order. Cannot be undone."
          effective={getVoidCode("order", activeOutletId)}
          override={activeOutletId ? override.order : undefined}
          scope={activeOutletId ? "outlet" : "global"}
          outletId={activeOutletId}
          onSave={handleSave("order", "Order void code")}
          onResetToGlobal={activeOutletId ? handleReset("order", "Order void code") : undefined}
        />
      </div>
    </div>
  );
}
