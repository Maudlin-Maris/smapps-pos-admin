import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { outlets } from "@/data/outlets";
import { TIP_STAFF, getTips, getPayouts } from "@/lib/tips-store";
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
import { usePagination } from "@/hooks/use-pagination";
import ProcessPayoutDialog from "@/components/tips/ProcessPayoutDialog";
import { Wallet, CircleCheck, Hourglass, Lock, BadgeDollarSign } from "lucide-react";

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
  const [payoutCtx, setPayoutCtx] = useState<{
    staffId: string;
    staffName: string;
    outletId: string;
    outletName: string;
    outstanding: number;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  const tips = useMemo(() => {
    let list = getTips().filter((t) => t.status !== "reversed");
    if (outletId !== "all") list = list.filter((t) => t.outletId === outletId);
    if (staffId !== "all") list = list.filter((t) => t.staffId === staffId);
    return list;
  }, [outletId, staffId, refreshKey]);

  const payouts = useMemo(() => {
    let list = getPayouts().filter((p) => p.status === "paid");
    if (outletId !== "all") list = list.filter((p) => p.outletId === outletId);
    if (staffId !== "all") list = list.filter((p) => p.staffId === staffId);
    return list.sort((a, b) =>
      (b.paidAt || b.createdAt).localeCompare(a.paidAt || a.createdAt),
    );
  }, [outletId, staffId, refreshKey]);

  const totalTips = tips.reduce((s, t) => s + t.amount, 0);
  const paidTips = tips.reduce((s, t) => s + t.paidAmount, 0);
  const awaitingTips = totalTips - paidTips;

  // Tips ordered table (orders with tips)
  const orderRows = useMemo(
    () => [...tips].sort((a, b) => b.earnedAt.localeCompare(a.earnedAt)),
    [tips],
  );

  // Awaiting-payment groups, only meaningful when a specific cashier is selected.
  const awaitingGroups = useMemo(() => {
    if (staffId === "all") return [];
    const unpaid = tips.filter((t) => t.status !== "paid" && t.amount - t.paidAmount > 0);
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
  }, [tips, staffId]);

  const selectedStaffName =
    TIP_STAFF.find((s) => s.id === staffId)?.name || "";

  const ordersPg = usePagination(orderRows, 10);
  const payoutsPg = usePagination(payouts, 10);

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
            <Label className="text-xs">Cashier</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cashiers</SelectItem>
                {TIP_STAFF.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Total tips" value={formatNaira(totalTips)} icon={Wallet} />
        <KpiCard title="Paid tips" value={formatNaira(paidTips)} icon={CircleCheck} />
        <KpiCard
          title="Awaiting payment"
          value={formatNaira(awaitingTips)}
          icon={Hourglass}
        />
      </div>

      {/* Orders with tips */}
      <Card className="p-4 lg:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold">Orders with tips</h3>
          <span className="text-xs text-muted-foreground">
            {orderRows.length} {orderRows.length === 1 ? "order" : "orders"}
          </span>
        </div>
        <PaginationControls
          page={ordersPg.page}
          totalPages={ordersPg.totalPages}
          perPage={ordersPg.perPage}
          totalItems={ordersPg.totalItems}
          pageSizeOptions={ordersPg.pageSizeOptions}
          onPageChange={ordersPg.setPage}
          onPerPageChange={ordersPg.setPerPage}
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordersPg.paginatedItems.map((t) => (
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
              </TableRow>
            ))}
            {orderRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No orders with tips for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Paid tips */}
      <Card className="p-4 lg:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold">Paid tips</h3>
          <span className="text-xs text-muted-foreground">
            {payouts.length} {payouts.length === 1 ? "payout" : "payouts"}
          </span>
        </div>
        <PaginationControls
          page={payoutsPg.page}
          totalPages={payoutsPg.totalPages}
          perPage={payoutsPg.perPage}
          totalItems={payoutsPg.totalItems}
          pageSizeOptions={payoutsPg.pageSizeOptions}
          onPageChange={payoutsPg.setPage}
          onPerPageChange={payoutsPg.setPerPage}
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
            {payoutsPg.paginatedItems.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs">{fmtDateTime(p.paidAt)}</TableCell>
                <TableCell className="font-medium">{p.staffName}</TableCell>
                <TableCell className="text-xs">{p.outletName}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {p.reference || p.id}
                </TableCell>
                <TableCell className="text-right">{formatNaira(p.amount)}</TableCell>
              </TableRow>
            ))}
            {payouts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No paid tips for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
