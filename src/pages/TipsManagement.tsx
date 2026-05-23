import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { outlets } from "@/data/outlets";
import {
  TIP_STAFF,
  computeDashboardTotals,
  computeOutletSummaries,
  computeStaffSummaries,
  getTips,
  getPayouts,
  getAuditLog,
  getUnpaidTipsForStaff,
  createPayout,
  approvePayout,
  markPayoutPaid,
  cancelPayout,
  reversePayout,
} from "@/lib/tips-store";
import {
  TipEntry,
  TipPayout,
  TIP_STATUS_LABELS,
  PAYOUT_STATUS_LABELS,
  PAYOUT_METHOD_LABELS,
  PayoutMethod,
  PayoutStatus,
  TipStatus,
} from "@/data/tipsTypes";
import { formatNaira } from "@/lib/currency";
import { KpiCard } from "@/components/KpiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  Wallet,
  Hourglass,
  CircleCheck,
  AlertTriangle,
  Printer,
  Plus,
  RotateCcw,
  Ban,
  Stamp,
  ShieldCheck,
  Lock,
} from "lucide-react";

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function fmtDateTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TIP_STATUS_VARIANT: Record<TipStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  partially_paid: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  reversed: "bg-muted text-muted-foreground",
};
const PAYOUT_STATUS_VARIANT: Record<PayoutStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300",
  reversed: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300",
};

// -------------------------------------------------------------------
// Page
// -------------------------------------------------------------------
export default function TipsManagement() {
  const { hasPermission, user } = useAuth();
  const [tab, setTab] = useState("dashboard");
  // refresh trigger
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  if (!hasPermission("tips.view")) {
    return (
      <div className="p-8 text-center">
        <Lock className="w-10 h-10 mx-auto text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          You don't have permission to view Tips & Payouts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" key={version}>
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">
          Tips & Payouts
        </h1>
        <p className="text-sm text-muted-foreground">
          Administer staff tips collected at the POS and process payouts across outlets.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="pending">Pending Tips</TabsTrigger>
          <TabsTrigger value="ledger">Staff Ledger</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardView />
        </TabsContent>
        <TabsContent value="pending" className="mt-6">
          <PendingTipsView />
        </TabsContent>
        <TabsContent value="ledger" className="mt-6">
          <StaffLedgerView />
        </TabsContent>
        <TabsContent value="payouts" className="mt-6">
          <PayoutsView
            actor={user?.display_name || user?.email || "system"}
            onChange={refresh}
          />
        </TabsContent>
        <TabsContent value="audit" className="mt-6">
          <AuditLogView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// -------------------------------------------------------------------
// Dashboard
// -------------------------------------------------------------------
function DashboardView() {
  const totals = computeDashboardTotals();
  const outletSummaries = computeOutletSummaries();
  const staffSummaries = computeStaffSummaries();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total tips collected"
          value={formatNaira(totals.totalEarned)}
          icon={Wallet}
        />
        <KpiCard
          title="Pending tips"
          value={`${totals.pendingCount} entries`}
          change={formatNaira(totals.totalOutstanding)}
          changeType="neutral"
          icon={Hourglass}
        />
        <KpiCard
          title="Paid tips"
          value={formatNaira(totals.totalPaid)}
          change={`${totals.paidCount} settled`}
          changeType="positive"
          icon={CircleCheck}
        />
        <KpiCard
          title="Outstanding liability"
          value={formatNaira(totals.totalOutstanding)}
          change="Owed to staff"
          changeType="negative"
          icon={AlertTriangle}
        />
      </div>

      <Card className="p-4 lg:p-5">
        <h3 className="font-heading font-semibold mb-3">Outlet summary</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Outlet</TableHead>
              <TableHead className="text-right">Earned</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Staff</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {outletSummaries.map((o) => (
              <TableRow key={o.outletId}>
                <TableCell className="font-medium">{o.outletName}</TableCell>
                <TableCell className="text-right">{formatNaira(o.earned)}</TableCell>
                <TableCell className="text-right">{formatNaira(o.paid)}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatNaira(o.outstanding)}
                </TableCell>
                <TableCell className="text-right">{o.staffCount}</TableCell>
              </TableRow>
            ))}
            {outletSummaries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No tip activity yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Card className="p-4 lg:p-5">
        <h3 className="font-heading font-semibold mb-3">Staff summary</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff</TableHead>
              <TableHead>Outlets</TableHead>
              <TableHead className="text-right">Earned</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead className="text-right">Pending</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffSummaries.map((s) => (
              <TableRow key={s.staffId}>
                <TableCell className="font-medium">{s.staffName}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {s.outletIds
                    .map((id) => outlets.find((o) => o.id === id)?.name || id)
                    .join(", ")}
                </TableCell>
                <TableCell className="text-right">{formatNaira(s.earned)}</TableCell>
                <TableCell className="text-right">{formatNaira(s.paid)}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatNaira(s.outstanding)}
                </TableCell>
                <TableCell className="text-right">{s.pendingCount}</TableCell>
              </TableRow>
            ))}
            {staffSummaries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No staff with tips yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// -------------------------------------------------------------------
// Pending Tips
// -------------------------------------------------------------------
function PendingTipsView() {
  const [outletId, setOutletId] = useState<string>("all");
  const [staffId, setStaffId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const tips = useMemo(() => {
    let list = getTips();
    if (outletId !== "all") list = list.filter((t) => t.outletId === outletId);
    if (staffId !== "all") list = list.filter((t) => t.staffId === staffId);
    if (status !== "all") list = list.filter((t) => t.status === status);
    if (from) list = list.filter((t) => t.earnedAt >= from);
    if (to) list = list.filter((t) => t.earnedAt <= to + "T23:59:59");
    return list.sort((a, b) => b.earnedAt.localeCompare(a.earnedAt));
  }, [outletId, staffId, status, from, to]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <Label className="text-xs">Outlet</Label>
            <Select value={outletId} onValueChange={setOutletId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All outlets</SelectItem>
                {outlets.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Staff</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All staff</SelectItem>
                {TIP_STAFF.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(TIP_STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Earned</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Outlet</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tips.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="text-xs">{fmtDateTime(t.earnedAt)}</TableCell>
                <TableCell className="font-medium">{t.staffName}</TableCell>
                <TableCell className="text-xs">{t.outletName}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {t.orderId || "—"}
                </TableCell>
                <TableCell className="text-right">{formatNaira(t.amount)}</TableCell>
                <TableCell className="text-right">{formatNaira(t.paidAmount)}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatNaira(t.amount - t.paidAmount)}
                </TableCell>
                <TableCell>
                  <Badge className={TIP_STATUS_VARIANT[t.status]} variant="secondary">
                    {TIP_STATUS_LABELS[t.status]}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {tips.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No tips match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// -------------------------------------------------------------------
// Staff Ledger
// -------------------------------------------------------------------
function StaffLedgerView() {
  const [staffId, setStaffId] = useState<string>(TIP_STAFF[0]?.id ?? "");
  const tips = getTips().filter((t) => t.staffId === staffId);
  const payouts = getPayouts().filter(
    (p) => p.staffId === staffId && p.status !== "cancelled"
  );

  type Row =
    | { kind: "earn"; date: string; tip: TipEntry }
    | { kind: "payout"; date: string; payout: TipPayout };

  const rows: Row[] = [
    ...tips.map<Row>((t) => ({ kind: "earn", date: t.earnedAt, tip: t })),
    ...payouts.map<Row>((p) => ({ kind: "payout", date: p.paidAt || p.createdAt, payout: p })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  let balance = 0;
  const tipPaidApplied = new Map<string, number>();
  const ledger = rows.map((r) => {
    if (r.kind === "earn") {
      balance += r.tip.amount;
      return { ...r, balance, debit: 0, credit: r.tip.amount };
    } else {
      const applied =
        r.payout.status === "paid" || r.payout.status === "reversed"
          ? r.payout.amount
          : 0;
      const sign = r.payout.status === "reversed" ? -1 : 1;
      balance -= applied * sign;
      return {
        ...r,
        balance,
        debit: applied * sign,
        credit: 0,
      };
    }
  });

  const earned = tips.filter((t) => t.status !== "reversed").reduce((s, t) => s + t.amount, 0);
  const paid = tips.filter((t) => t.status !== "reversed").reduce((s, t) => s + t.paidAmount, 0);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs">Staff member</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIP_STAFF.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Earned</p>
              <p className="font-bold">{formatNaira(earned)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="font-bold">{formatNaira(paid)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="font-bold text-primary">{formatNaira(earned - paid)}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Outlet</TableHead>
              <TableHead className="text-right">Tip earned</TableHead>
              <TableHead className="text-right">Payout</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledger.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs">{fmtDateTime(r.date)}</TableCell>
                <TableCell>
                  {r.kind === "earn" ? (
                    <Badge variant="secondary">Tip earned</Badge>
                  ) : r.payout.status === "reversed" ? (
                    <Badge variant="secondary" className={PAYOUT_STATUS_VARIANT.reversed}>
                      Reversal
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className={PAYOUT_STATUS_VARIANT.paid}>
                      Payout
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {r.kind === "earn" ? r.tip.orderId || r.tip.id : r.payout.id}
                </TableCell>
                <TableCell className="text-xs">
                  {r.kind === "earn" ? r.tip.outletName : r.payout.outletName}
                </TableCell>
                <TableCell className="text-right">
                  {r.kind === "earn" ? formatNaira(r.tip.amount) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {r.kind === "payout" && r.debit !== 0 ? formatNaira(r.debit) : "—"}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatNaira(r.balance)}
                </TableCell>
                <TableCell>
                  {r.kind === "earn" ? (
                    <Badge className={TIP_STATUS_VARIANT[r.tip.status]} variant="secondary">
                      {TIP_STATUS_LABELS[r.tip.status]}
                    </Badge>
                  ) : (
                    <Badge className={PAYOUT_STATUS_VARIANT[r.payout.status]} variant="secondary">
                      {PAYOUT_STATUS_LABELS[r.payout.status]}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {ledger.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No ledger activity for this staff member.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// -------------------------------------------------------------------
// Payouts (list + create + lifecycle + receipt)
// -------------------------------------------------------------------
function PayoutsView({ actor, onChange }: { actor: string; onChange: () => void }) {
  const { hasPermission } = useAuth();
  const canProcess = hasPermission("tips.payout.process");
  const canApprove = hasPermission("tips.payout.approve");
  const canReverse = hasPermission("tips.payout.reverse");

  const payouts = getPayouts().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const [openCreate, setOpenCreate] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [reverseId, setReverseId] = useState<string | null>(null);
  const [reverseReason, setReverseReason] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const visible = statusFilter === "all"
    ? payouts
    : payouts.filter((p) => p.status === statusFilter);

  const handleApprove = (id: string) => {
    approvePayout(id, actor);
    toast({ title: "Payout approved" });
    onChange();
  };
  const handlePay = (id: string) => {
    markPayoutPaid(id, actor);
    toast({ title: "Payout marked as paid", description: "Tip liabilities reduced." });
    onChange();
  };
  const handleCancel = (id: string) => {
    cancelPayout(id, actor);
    toast({ title: "Payout cancelled" });
    onChange();
  };
  const submitReverse = () => {
    if (!reverseId || !reverseReason.trim()) {
      toast({ title: "Reason required", variant: "destructive" });
      return;
    }
    reversePayout(reverseId, actor, reverseReason.trim());
    toast({ title: "Payout reversed", description: "Tip liabilities restored." });
    setReverseId(null);
    setReverseReason("");
    onChange();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {Object.entries(PAYOUT_STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {canProcess && (
          <Button onClick={() => setOpenCreate(true)}>
            <Plus className="w-4 h-4 mr-2" /> New payout
          </Button>
        )}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Created</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead>Outlet</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs">{fmtDateTime(p.createdAt)}</TableCell>
                <TableCell className="font-medium">{p.staffName}</TableCell>
                <TableCell className="text-xs">{p.outletName}</TableCell>
                <TableCell className="text-xs">
                  {fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)}
                </TableCell>
                <TableCell className="text-xs">{PAYOUT_METHOD_LABELS[p.method]}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatNaira(p.amount)}
                </TableCell>
                <TableCell>
                  <Badge className={PAYOUT_STATUS_VARIANT[p.status]} variant="secondary">
                    {PAYOUT_STATUS_LABELS[p.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => setReceiptId(p.id)}>
                      <Printer className="w-3 h-3 mr-1" /> Receipt
                    </Button>
                    {p.status === "draft" && canApprove && (
                      <Button size="sm" variant="outline" onClick={() => handleApprove(p.id)}>
                        <Stamp className="w-3 h-3 mr-1" /> Approve
                      </Button>
                    )}
                    {(p.status === "draft" || p.status === "approved") && canApprove && (
                      <Button size="sm" onClick={() => handlePay(p.id)}>
                        <ShieldCheck className="w-3 h-3 mr-1" /> Mark paid
                      </Button>
                    )}
                    {(p.status === "draft" || p.status === "approved") && canProcess && (
                      <Button size="sm" variant="ghost" onClick={() => handleCancel(p.id)}>
                        <Ban className="w-3 h-3 mr-1" /> Cancel
                      </Button>
                    )}
                    {p.status === "paid" && canReverse && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReverseId(p.id)}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Reverse
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No payouts yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {openCreate && (
        <CreatePayoutDialog
          actor={actor}
          onClose={() => setOpenCreate(false)}
          onCreated={() => {
            setOpenCreate(false);
            onChange();
          }}
        />
      )}

      {receiptId && (
        <PayoutReceiptDialog
          payoutId={receiptId}
          onClose={() => setReceiptId(null)}
        />
      )}

      <AlertDialog open={!!reverseId} onOpenChange={(o) => !o && setReverseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverse payout?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore the tip liabilities to the staff ledger. Provide a reason for the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Reason for reversal"
            value={reverseReason}
            onChange={(e) => setReverseReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReverseReason("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitReverse}>Reverse</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// -------------------------------------------------------------------
// Create payout dialog
// -------------------------------------------------------------------
function CreatePayoutDialog({
  actor,
  onClose,
  onCreated,
}: {
  actor: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const ago = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [staffId, setStaffId] = useState<string>(TIP_STAFF[0]?.id ?? "");
  const [outletId, setOutletId] = useState<string>(TIP_STAFF[0]?.outletIds[0] ?? "");
  const [periodStart, setPeriodStart] = useState(ago);
  const [periodEnd, setPeriodEnd] = useState(today);
  const [method, setMethod] = useState<PayoutMethod>("transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<"full" | "partial">("full");
  const [partialAmount, setPartialAmount] = useState("");

  const eligible = useMemo(() => {
    if (!staffId || !outletId) return [];
    return getUnpaidTipsForStaff(
      staffId,
      outletId,
      periodStart,
      periodEnd + "T23:59:59"
    );
  }, [staffId, outletId, periodStart, periodEnd]);

  const unpaidTotal = eligible.reduce((s, t) => s + (t.amount - t.paidAmount), 0);
  const requested = mode === "full" ? unpaidTotal : Math.min(parseFloat(partialAmount) || 0, unpaidTotal);

  const staff = TIP_STAFF.find((s) => s.id === staffId);
  const validOutlets = staff?.outletIds || [];

  const submit = () => {
    if (!staffId || !outletId || requested <= 0) {
      toast({ title: "Nothing to pay out", variant: "destructive" });
      return;
    }
    createPayout({
      staffId,
      outletId,
      periodStart,
      periodEnd: periodEnd + "T23:59:59",
      amount: requested,
      method,
      reference: reference || undefined,
      notes: notes || undefined,
      actor,
    });
    toast({
      title: "Payout drafted",
      description: `${formatNaira(requested)} for ${staff?.name}.`,
    });
    onCreated();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New tip payout</DialogTitle>
          <DialogDescription>
            Select a staff member and period; unpaid balances are calculated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Staff</Label>
            <Select
              value={staffId}
              onValueChange={(v) => {
                setStaffId(v);
                const s = TIP_STAFF.find((x) => x.id === v);
                if (s && !s.outletIds.includes(outletId)) setOutletId(s.outletIds[0] || "");
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIP_STAFF.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Outlet</Label>
            <Select value={outletId} onValueChange={setOutletId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {validOutlets.map((id) => (
                  <SelectItem key={id} value={id}>
                    {outlets.find((o) => o.id === id)?.name || id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Period start</Label>
            <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </div>
          <div>
            <Label>Period end</Label>
            <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </div>
          <div>
            <Label>Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PayoutMethod)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PAYOUT_METHOD_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reference (optional)</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transfer ref / payroll batch" />
          </div>
        </div>

        <div className="rounded-md border p-3 bg-muted/30 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Unpaid in period</span>
            <span className="font-bold">{formatNaira(unpaidTotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{eligible.length} tip entr{eligible.length === 1 ? "y" : "ies"} eligible</span>
          </div>
          <div className="flex gap-2 items-center pt-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "full" ? "default" : "outline"}
              onClick={() => setMode("full")}
            >
              Full payout
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "partial" ? "default" : "outline"}
              onClick={() => setMode("partial")}
            >
              Partial
            </Button>
            {mode === "partial" && (
              <Input
                type="number"
                step="0.01"
                value={partialAmount}
                onChange={(e) => setPartialAmount(e.target.value)}
                placeholder="Amount"
                className="w-40"
              />
            )}
            <div className="ml-auto text-sm">
              Paying: <span className="font-bold text-primary">{formatNaira(requested)}</span>
            </div>
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={requested <= 0}>Create draft</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -------------------------------------------------------------------
// Receipt
// -------------------------------------------------------------------
function PayoutReceiptDialog({ payoutId, onClose }: { payoutId: string; onClose: () => void }) {
  const payout = getPayouts().find((p) => p.id === payoutId);
  if (!payout) return null;

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=420,height=640");
    if (!w) return;
    w.document.write(`
      <html><head><title>Tip Payout ${payout.id}</title>
      <style>
        body{font-family:ui-monospace,Menlo,monospace;padding:24px;font-size:12px;color:#111}
        h1{font-size:14px;margin:0 0 4px}
        .row{display:flex;justify-content:space-between;margin:2px 0}
        .hr{border-top:1px dashed #999;margin:8px 0}
        .total{font-size:14px;font-weight:bold}
      </style></head><body>
      <h1>TIP PAYOUT RECEIPT</h1>
      <div class="row"><span>${payout.id}</span><span>${fmtDateTime(payout.createdAt)}</span></div>
      <div class="hr"></div>
      <div class="row"><span>Staff</span><span>${payout.staffName}</span></div>
      <div class="row"><span>Outlet</span><span>${payout.outletName}</span></div>
      <div class="row"><span>Period</span><span>${fmtDate(payout.periodStart)} – ${fmtDate(payout.periodEnd)}</span></div>
      <div class="row"><span>Method</span><span>${PAYOUT_METHOD_LABELS[payout.method]}</span></div>
      <div class="row"><span>Status</span><span>${PAYOUT_STATUS_LABELS[payout.status]}</span></div>
      ${payout.reference ? `<div class="row"><span>Reference</span><span>${payout.reference}</span></div>` : ""}
      <div class="hr"></div>
      <div class="row"><span>Allocations</span><span>${payout.allocations.length}</span></div>
      ${payout.allocations.map((a) => `<div class="row"><span>${a.tipId.slice(-6)}</span><span>${formatNaira(a.amount)}</span></div>`).join("")}
      <div class="hr"></div>
      <div class="row total"><span>TOTAL</span><span>${formatNaira(payout.amount)}</span></div>
      <div class="hr"></div>
      <div class="row"><span>Created by</span><span>${payout.createdBy}</span></div>
      ${payout.approvedBy ? `<div class="row"><span>Approved by</span><span>${payout.approvedBy}</span></div>` : ""}
      ${payout.paidBy ? `<div class="row"><span>Paid by</span><span>${payout.paidBy} on ${fmtDateTime(payout.paidAt)}</span></div>` : ""}
      ${payout.reversedBy ? `<div class="row"><span>Reversed by</span><span>${payout.reversedBy}</span></div>` : ""}
      ${payout.reverseReason ? `<div class="row"><span>Reason</span><span>${payout.reverseReason}</span></div>` : ""}
      <script>window.print();</script>
      </body></html>
    `);
    w.document.close();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payout receipt</DialogTitle>
          <DialogDescription>{payout.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Staff</span><span className="font-medium">{payout.staffName}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Outlet</span><span>{payout.outletName}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Period</span><span>{fmtDate(payout.periodStart)} – {fmtDate(payout.periodEnd)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Method</span><span>{PAYOUT_METHOD_LABELS[payout.method]}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span>
            <Badge className={PAYOUT_STATUS_VARIANT[payout.status]} variant="secondary">
              {PAYOUT_STATUS_LABELS[payout.status]}
            </Badge>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2"><span>Total</span><span className="font-bold text-lg">{formatNaira(payout.amount)}</span></div>
          <div className="text-xs text-muted-foreground">{payout.allocations.length} tip allocation(s)</div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -------------------------------------------------------------------
// Audit Log
// -------------------------------------------------------------------
function AuditLogView() {
  const log = getAuditLog();
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {log.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="text-xs">{fmtDateTime(e.createdAt)}</TableCell>
              <TableCell><Badge variant="secondary">{e.action}</Badge></TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {e.targetType}: {e.targetId.slice(-8)}
              </TableCell>
              <TableCell className="text-xs">{e.actor}</TableCell>
              <TableCell className="text-right">{e.amount ? formatNaira(e.amount) : "—"}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{e.details || "—"}</TableCell>
            </TableRow>
          ))}
          {log.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No audit entries yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
