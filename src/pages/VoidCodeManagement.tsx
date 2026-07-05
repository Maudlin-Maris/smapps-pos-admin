import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert, KeyRound, Save, Eye, EyeOff, Globe2, Store, Undo2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useGetOutlets } from "@/services/api/outlets";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  useGetVoidCodes,
  useUpdateVoidCode,
  useDeleteVoidCodeOverride,
} from "@/services/api/inventory/void-codes";
import type { VoidCodeType } from "@/lib/types/void-codes";

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
  isSaving?: boolean;
  isResetting?: boolean;
}

function CodeCard({
  type,
  title,
  description,
  effective,
  override,
  scope,
  outletId,
  onSave,
  onResetToGlobal,
  isSaving = false,
  isResetting = false,
}: CodeCardProps) {
  const [draft, setDraft] = useState("");
  const [reveal, setReveal] = useState(false);

  const dirty = draft.length === 4 && draft !== effective;
  const hasOverride = scope === "outlet" && !!override;

  const handleSaveClick = () => {
    onSave(draft);
    setDraft("");
  };

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
          <InputOTP maxLength={4} value={draft} onChange={setDraft} disabled={isSaving || isResetting}>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetToGlobal}
              disabled={isSaving || isResetting}
              className="text-muted-foreground"
            >
              {isResetting ? (
                <>
                  <Spinner className="mr-2" />
                  Resetting...
                </>
              ) : (
                <>
                  <Undo2 className="w-4 h-4 mr-1" />
                  Reset to global
                </>
              )}
            </Button>
          ) : <span />}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDraft("")}
              disabled={!draft || isSaving || isResetting}
            >
              Clear
            </Button>
            <Button
              size="sm"
              disabled={!dirty || isSaving || isResetting}
              onClick={handleSaveClick}
            >
              {isSaving ? (
                <>
                  <Spinner className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save code
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VoidCodeManagement() {
  const { data: outletsData, isLoading: isLoadingOutlets } = useGetOutlets();
  const outlets = useMemo(() => outletsData || [], [outletsData]);

  const { data: voidCodesData, isLoading: isLoadingVoidCodes, mutate: mutateVoidCodes } = useGetVoidCodes();

  const [scope, setScope] = useState<"global" | string>("global");
  const [loadingState, setLoadingState] = useState<{
    cardType: VoidCodeType;
    action: "save" | "reset";
  } | null>(null);

  const { trigger: updateVoidCode, isMutating: isUpdating } = useUpdateVoidCode({
    onSuccess: () => {
      mutateVoidCodes();
    },
  });

  const { trigger: deleteOverride, isMutating: isDeleting } = useDeleteVoidCodeOverride({
    onSuccess: () => {
      mutateVoidCodes();
    },
  });

  const activeOutletId = scope === "global" ? null : scope;
  const outletInfo = useMemo(
    () => outlets.find((o) => o.id === activeOutletId) || null,
    [activeOutletId, outlets],
  );

  const override = activeOutletId && voidCodesData?.byOutlet?.[activeOutletId]
    ? voidCodesData.byOutlet[activeOutletId]
    : {};

  const getEffectiveCode = (type: VoidCodeType) => {
    if (activeOutletId) {
      const ov = voidCodesData?.byOutlet?.[activeOutletId]?.[type];
      if (ov) return ov;
    }
    return voidCodesData?.global?.[type] || "";
  };

  const overrideCounts = useMemo(() => {
    return voidCodesData?.overrideCounts || {};
  }, [voidCodesData]);

  const handleSave = (type: VoidCodeType, label: string) => async (code: string) => {
    setLoadingState({ cardType: type, action: "save" });
    try {
      await updateVoidCode({
        type,
        code,
        outletId: activeOutletId,
      });
      const where = activeOutletId ? outletInfo?.name || "Outlet" : "All outlets";
      toast({
        title: `${label} updated`,
        description: `${where}: cashiers must use the new code immediately.`,
      });
    } catch (e) {
      // Handled in trigger's onError toast
    } finally {
      setLoadingState(null);
    }
  };

  const handleReset = (type: VoidCodeType, label: string) => async () => {
    if (!activeOutletId) return;
    setLoadingState({ cardType: type, action: "reset" });
    try {
      await deleteOverride({
        outletId: activeOutletId,
        type,
      });
      toast({
        title: `${label} reverted to global`,
        description: `${outletInfo?.name} will use the global default.`,
      });
    } catch (e) {
      // Handled in trigger's onError toast
    } finally {
      setLoadingState(null);
    }
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
          {isLoadingOutlets ? (
            <Skeleton className="w-full sm:w-[320px] h-10" />
          ) : (
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
          )}
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
        {isLoadingVoidCodes ? (
          Array.from({ length: 2 }).map((_, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <Skeleton className="h-16 w-full rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-10 rounded" />
                    <Skeleton className="h-10 w-10 rounded" />
                    <Skeleton className="h-10 w-10 rounded" />
                    <Skeleton className="h-10 w-10 rounded" />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <CodeCard
              type="item"
              title="Remove Item Code"
              description="Required to remove a single item from an existing order."
              effective={getEffectiveCode("item")}
              override={activeOutletId ? override.item : undefined}
              scope={activeOutletId ? "outlet" : "global"}
              outletId={activeOutletId}
              onSave={handleSave("item", "Item removal code")}
              onResetToGlobal={activeOutletId ? handleReset("item", "Item removal code") : undefined}
              isSaving={isUpdating && loadingState?.cardType === "item" && loadingState?.action === "save"}
              isResetting={isDeleting && loadingState?.cardType === "item" && loadingState?.action === "reset"}
            />
            <CodeCard
              type="order"
              title="Void Order Code"
              description="Required to void an entire unpaid order. Cannot be undone."
              effective={getEffectiveCode("order")}
              override={activeOutletId ? override.order : undefined}
              scope={activeOutletId ? "outlet" : "global"}
              outletId={activeOutletId}
              onSave={handleSave("order", "Order void code")}
              onResetToGlobal={activeOutletId ? handleReset("order", "Order void code") : undefined}
              isSaving={isUpdating && loadingState?.cardType === "order" && loadingState?.action === "save"}
              isResetting={isDeleting && loadingState?.cardType === "order" && loadingState?.action === "reset"}
            />
          </>
        )}
      </div>
    </div>
  );
}

