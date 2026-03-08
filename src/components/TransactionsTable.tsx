import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export interface PaymentSplit {
  method: string;
  amount: string;
}

export interface Transaction {
  orderId: string;
  date: string;
  customerPhone: string;
  amount: string;
  cashier: string;
  location: string;
  paymentStatus: "Paid" | "Pending" | "Failed" | "Refunded";
  payments: PaymentSplit[];
  orderStatus: "Completed" | "Processing" | "Cancelled" | "On Hold";
}

interface TransactionsTableProps {
  transactions: Transaction[];
}

const paymentStatusStyles: Record<string, string> = {
  Paid: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Failed: "bg-destructive/10 text-destructive",
  Refunded: "bg-info/10 text-info",
};

const orderStatusStyles: Record<string, string> = {
  Completed: "bg-success/10 text-success",
  Processing: "bg-info/10 text-info",
  Cancelled: "bg-destructive/10 text-destructive",
  "On Hold": "bg-warning/10 text-warning",
};

const rowsPerPageOptions = ["5", "10", "20", "50"];

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("10");

  const perPage = parseInt(rowsPerPage);

  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (t) =>
        t.orderId.toLowerCase().includes(q) ||
        t.customerPhone.toLowerCase().includes(q) ||
        t.cashier.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.paymentMethod.toLowerCase().includes(q) ||
        t.orderStatus.toLowerCase().includes(q) ||
        t.paymentStatus.toLowerCase().includes(q)
    );
  }, [transactions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * perPage;
  const pageData = filtered.slice(startIdx, startIdx + perPage);

  // Reset to page 1 when search or rowsPerPage changes
  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };
  const handleRowsChange = (val: string) => {
    setRowsPerPage(val);
    setPage(1);
  };

  return (
    <Card className="p-4 lg:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="font-heading font-semibold">Transactions</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Rows</span>
            <Select value={rowsPerPage} onValueChange={handleRowsChange}>
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rowsPerPageOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 h-9 w-full sm:w-[240px]"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 font-medium text-muted-foreground">Order ID</th>
              <th className="pb-3 font-medium text-muted-foreground">Date</th>
              <th className="pb-3 font-medium text-muted-foreground">Phone</th>
              <th className="pb-3 font-medium text-muted-foreground">Amount</th>
              <th className="pb-3 font-medium text-muted-foreground">Cashier</th>
              <th className="pb-3 font-medium text-muted-foreground">Location</th>
              <th className="pb-3 font-medium text-muted-foreground">Payment</th>
              <th className="pb-3 font-medium text-muted-foreground">Method</th>
              <th className="pb-3 font-medium text-muted-foreground">Order Status</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground">
                  No transactions found
                </td>
              </tr>
            ) : (
              pageData.map((txn) => (
                <tr key={txn.orderId} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3 font-mono text-xs">{txn.orderId}</td>
                  <td className="py-3 text-muted-foreground text-xs">{txn.date}</td>
                  <td className="py-3">{txn.customerPhone}</td>
                  <td className="py-3 font-semibold">{txn.amount}</td>
                  <td className="py-3">{txn.cashier}</td>
                  <td className="py-3 text-xs">{txn.location}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${paymentStatusStyles[txn.paymentStatus] ?? ""}`}>
                      {txn.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 text-xs">{txn.paymentMethod}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${orderStatusStyles[txn.orderStatus] ?? ""}`}>
                      {txn.orderStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-border">
        <div className="text-sm text-muted-foreground">
          {filtered.length === 0 ? "0" : `${startIdx + 1}–${Math.min(startIdx + perPage, filtered.length)}`} of {filtered.length}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "ellipsis" ? (
                <span key={`e-${i}`} className="px-1 text-muted-foreground">…</span>
              ) : (
                <Button
                  key={p}
                  variant={p === currentPage ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              )
            )}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
