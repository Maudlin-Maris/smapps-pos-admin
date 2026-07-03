import { useMemo, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { formatNaira } from "@/lib/currency";
import { KpiCard } from "@/components/KpiCard";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import PaginationControls from "@/components/inventory/PaginationControls";
import ProcessPayoutDialog from "@/components/tips/ProcessPayoutDialog";
import { Wallet, CircleCheck, Hourglass, Lock, BadgeDollarSign, Loader2 } from "lucide-react";
import { useGetTips, useGetTipsPayouts } from "@/services/api/tips";
import { useGetOutlets } from "@/services/api/outlets";

function fmtDateTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TipsManagement() {
  const { hasPermission, user } = useAuth();
  const [outletId, setOutletId] = useState<string>("all");
  const [staffId, setStaffId] = useState<string>("all");

  const [tipsPage, setTipsPage] = useState(1);
  const [tipsPerPage, setTipsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [payoutsPerPage, setPayoutsPerPage] = useState(DEFAULT_PAGE_SIZE);

  const [payoutCtx, setPayoutCtx] = useState<{
    staffId: string;
    staffName: string;
    outletId: string;
    outletName: string;
    outstanding: number;
    tipIds?: string[];
    contextLabel?: string;
  } | null>(null);

  const { data: outletsRes, isLoading: isLoadingOutlets } = useGetOutlets();
  const outlets = outletsRes || [];

  const { data: tipsData, isLoading: isLoadingTips, mutate: mutateTips } = useGetTips({
    outletId: outletId === "all" ? undefined : outletId,
    page: tipsPage,
    per_page: tipsPerPage,
  });

  const { data: payoutsData, isLoading: isLoadingPayouts, mutate: mutatePayouts } = useGetTipsPayouts({
    outletId: outletId === "all" ? undefined : outletId,
    page: payoutsPage,
    per_page: payoutsPerPage,
  });

  const staffList = tipsData?.staff || [];
  const orderRows = tipsData?.data || [];
  const payouts = payoutsData?.data || [];

  const totalTips = tipsData?.totals?.totalEarned || 0;
  const paidTips = tipsData?.totals?.totalPaid || 0;
  const awaitingTips = tipsData?.totals?.totalOutstanding || 0;

  // Awaiting-payment groups, only meaningful when a specific cashier is selected.
  const awaitingGroups = useMemo(() => {
    if (staffId === "all") return [];
    // Awaiting payment filters from the active loaded tips page
    const unpaid = orderRows.filter(
      (t) => t.staffId === staffId && t.status !== "paid" && t.amount - t.paidAmount > 0
    );
    const byOutlet = new Map<
      string,
      { outletId: string; outletName: string; outstanding: number; count: number }
    >();
    for (const t of unpaid) {
      const cur =
        byOutlet.get(t.outletId) || {
          outletId: t.outletId,
          outletName: t.outletName,
          outstanding: 0,
          count: 0,
        };
      cur.outstanding += t.amount - t.paidAmount;
      cur.count += 1;
      byOutlet.set(t.outletId, cur);
    }
    return Array.from(byOutlet.values()).sort((a, b) => b.outstanding - a.outstanding);
  }, [orderRows, staffId]);

  const selectedStaffName =
    staffList.find((s) => s.id === staffId)?.name || "";

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">
          Tips & Payouts
        </h1>
        <p className="text-sm text-muted-foreground">
          Track tips collected at the POS and payouts to staff.
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Outlet</Label>
            <Select value={outletId} onValueChange={(v) => { setOutletId(v); setTipsPage(1); setPayoutsPage(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All outlets</SelectItem>
                {isLoadingOutlets ? (
                  <SelectItem value="loading" disabled>Loading outlets...</SelectItem>
                ) : (
                  outlets.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Cashier</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cashiers</SelectItem>
                {staffList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoadingTips ? (
          <>
            <div className="h-24 bg-muted animate-pulse rounded-lg border" />
            <div className="h-24 bg-muted animate-pulse rounded-lg border" />
            <div className="h-24 bg-muted animate-pulse rounded-lg border" />
          </>
        ) : (
          <>
            <KpiCard title="Total tips" value={formatNaira(totalTips)} icon={Wallet} />
            <KpiCard title="Paid tips" value={formatNaira(paidTips)} icon={CircleCheck} />
            <KpiCard
              title="Awaiting payment"
              value={formatNaira(awaitingTips)}
              icon={Hourglass}
            />
          </>
        )}
      </div>

      {/* Awaiting payment per cashier */}
      {staffId !== "all" && (
        <Card className="p-4 lg:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-heading font-semibold">
                Awaiting payment — {selectedStaffName}
              </h3>
              <p className="text-xs text-muted-foreground">
                Tips collected at the POS that still need to be paid out.
              </p>
            </div>
            <Badge variant="secondary">{formatNaira(awaitingTips)} outstanding</Badge>
          </div>
          {awaitingGroups.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-6">
              All tips for this cashier on this page are fully paid.
            </div>
          ) : (
            <div className="space-y-2">
              {awaitingGroups.map((g) => (
                <div
                  key={g.outletId}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{g.outletName}</div>
                    <div className="text-xs text-muted-foreground">
                      {g.count} unpaid {g.count === 1 ? "tip" : "tips"} ·{" "}
                      <span className="font-medium text-foreground">
                        {formatNaira(g.outstanding)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={!hasPermission("tips.payout.process")}
                    onClick={() =>
                      setPayoutCtx({
                        staffId,
                        staffName: selectedStaffName,
                        outletId: g.outletId,
                        outletName: g.outletName,
                        outstanding: g.outstanding,
                      })
                    }
                  >
                    <BadgeDollarSign className="h-4 w-4" />
                    Process payout
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}


      {/* Orders with tips */}
      <Card className="p-4 lg:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold">Orders with tips</h3>
          <span className="text-xs text-muted-foreground">
            {tipsData?.meta?.total || 0} order{tipsData?.meta?.total === 1 ? "" : "s"}
          </span>
        </div>
        <PaginationControls
          page={tipsPage}
          totalPages={tipsData?.meta?.last_page || 1}
          perPage={tipsPerPage}
          totalItems={tipsData?.meta?.total || 0}
          pageSizeOptions={[10, 20, 50]}
          onPageChange={setTipsPage}
          onPerPageChange={setTipsPerPage}
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead>Outlet</TableHead>
              <TableHead className="text-right">Order amount</TableHead>
              <TableHead className="text-right">Amount paid</TableHead>
              <TableHead className="text-right">Tip</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingTips ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading orders...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : orderRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No orders with tips for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              orderRows.map((t) => {
                const outstanding = Math.max(0, t.amount - t.paidAmount);
                const isPaid = t.status === "paid";
                const isPartial = t.status === "partially_paid";
                return (
                  <TableRow key={t.id}>
                    <TableCell>{new Date(t.earnedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono text-xs">{t.orderId || "—"}</TableCell>
                    <TableCell>{t.staffName}</TableCell>
                    <TableCell>{t.outletName}</TableCell>
                    <TableCell className="text-right">
                      {t.orderAmount ? formatNaira(t.orderAmount) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {t.orderPaidAmount != null ? formatNaira(t.orderPaidAmount) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatNaira(t.amount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={isPaid ? "default" : isPartial ? "secondary" : "outline"}
                        className={
                          isPaid
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                            : isPartial
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                              : ""
                        }
                      >
                        {isPaid
                          ? "Paid"
                          : isPartial
                            ? `Partial · ${formatNaira(outstanding)} left`
                            : "Unpaid"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isPaid ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!hasPermission("tips.payout.process")}
                          onClick={() =>
                            setPayoutCtx({
                              staffId: t.staffId,
                              staffName: t.staffName,
                              outletId: t.outletId,
                              outletName: t.outletName,
                              outstanding,
                              tipIds: [t.id],
                              contextLabel: t.orderId
                                ? `order ${t.orderId}`
                                : "this tip",
                            })
                          }
                        >
                          <BadgeDollarSign className="h-4 w-4" />
                          Mark as paid
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Paid tips */}
      <Card className="p-4 lg:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold">Paid tips</h3>
          <span className="text-xs text-muted-foreground">
            {payoutsData?.meta?.total || 0} payout{payoutsData?.meta?.total === 1 ? "" : "s"}
          </span>
        </div>
        <PaginationControls
          page={payoutsPage}
          totalPages={payoutsData?.meta?.last_page || 1}
          perPage={payoutsPerPage}
          totalItems={payoutsData?.meta?.total || 0}
          pageSizeOptions={[10, 20, 50]}
          onPageChange={setPayoutsPage}
          onPerPageChange={setPayoutsPerPage}
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paid on</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead>Outlet</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingPayouts ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading payouts...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : payouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No paid tips for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              payouts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs">{fmtDateTime(p.createdAt)}</TableCell>
                  <TableCell className="font-medium">{p.staffName}</TableCell>
                  <TableCell className="text-xs">{p.outletId}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.reference || p.id}
                  </TableCell>
                  <TableCell className="text-right">{formatNaira(p.amount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {payoutCtx && (
        <ProcessPayoutDialog
          open={!!payoutCtx}
          onOpenChange={(o) => !o && setPayoutCtx(null)}
          staffId={payoutCtx.staffId}
          staffName={payoutCtx.staffName}
          outletId={payoutCtx.outletId}
          outletName={payoutCtx.outletName}
          outstandingAmount={payoutCtx.outstanding}
          businessEmail={user?.email || "business@smapps.com"}
          actor={user?.display_name || user?.email || "system"}
          tipIds={payoutCtx.tipIds}
          contextLabel={payoutCtx.contextLabel}
          onConfirmed={() => {
            mutateTips();
            mutatePayouts();
          }}
        />
      )}
    </div>
  );
}
