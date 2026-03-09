import { useState, useMemo, useCallback } from "react";
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
import { Search, ChevronLeft, ChevronRight, Download, FileSpreadsheet, Eye } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { Transaction } from "@/components/TransactionsTable";
import TransactionDetailDialog from "./TransactionDetailDialog";

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

const initialTransactions: Transaction[] = [
  { orderId: "ORD-1001", date: "2026-03-08 09:12", customerPhone: "+233 24 111 2233", amount: "₦42.50", cashier: "Ama K.", location: "Downtown Supermarket", paymentStatus: "Paid", payments: [{ method: "Cash", amount: "₦20.00" }, { method: "Card", amount: "₦22.50" }], orderStatus: "Completed", items: [{ name: "Rice 5kg", qty: 1, unitPrice: "₦25.00", total: "₦25.00" }, { name: "Cooking Oil 1L", qty: 1, unitPrice: "₦17.50", total: "₦17.50" }] },
  { orderId: "ORD-1002", date: "2026-03-08 09:28", customerPhone: "+233 20 555 7788", amount: "₦128.00", cashier: "Kofi B.", location: "Mall Food Court", paymentStatus: "Paid", payments: [{ method: "Card", amount: "₦128.00" }], orderStatus: "Completed", items: [{ name: "Grilled Chicken Combo", qty: 2, unitPrice: "₦45.00", total: "₦90.00" }, { name: "Fresh Juice", qty: 2, unitPrice: "₦12.00", total: "₦24.00" }, { name: "Side Salad", qty: 2, unitPrice: "₦7.00", total: "₦14.00" }] },
  { orderId: "ORD-1003", date: "2026-03-08 09:45", customerPhone: "+233 27 333 4455", amount: "₦35.75", cashier: "Ama K.", location: "Downtown Supermarket", paymentStatus: "Refunded", payments: [{ method: "Mobile Money", amount: "₦35.75" }], orderStatus: "Cancelled", items: [{ name: "Shampoo 500ml", qty: 1, unitPrice: "₦18.75", total: "₦18.75" }, { name: "Conditioner 500ml", qty: 1, unitPrice: "₦17.00", total: "₦17.00" }] },
  { orderId: "ORD-1004", date: "2026-03-08 10:02", customerPhone: "+233 55 222 9900", amount: "₦67.20", cashier: "Yaw M.", location: "Westside Salon", paymentStatus: "Paid", payments: [{ method: "Card", amount: "₦50.00" }, { method: "Cash", amount: "₦17.20" }], orderStatus: "Completed", items: [{ name: "Haircut - Men", qty: 1, unitPrice: "₦35.00", total: "₦35.00" }, { name: "Beard Trim", qty: 1, unitPrice: "₦15.00", total: "₦15.00" }, { name: "Hair Gel", qty: 1, unitPrice: "₦17.20", total: "₦17.20" }] },
  { orderId: "ORD-1005", date: "2026-03-08 10:18", customerPhone: "+233 24 888 1122", amount: "₦215.00", cashier: "Kofi B.", location: "Mall Food Court", paymentStatus: "Paid", payments: [{ method: "Cash", amount: "₦100.00" }, { method: "Mobile Money", amount: "₦115.00" }], orderStatus: "Completed", items: [{ name: "Family Platter", qty: 1, unitPrice: "₦150.00", total: "₦150.00" }, { name: "Soft Drinks Pack", qty: 1, unitPrice: "₦35.00", total: "₦35.00" }, { name: "Dessert Bowl", qty: 2, unitPrice: "₦15.00", total: "₦30.00" }] },
  { orderId: "ORD-1006", date: "2026-03-08 10:35", customerPhone: "+233 50 666 3344", amount: "₦19.99", cashier: "Esi D.", location: "Airport Kiosk", paymentStatus: "Paid", payments: [{ method: "Mobile Money", amount: "₦19.99" }], orderStatus: "Completed", items: [{ name: "Bottled Water", qty: 2, unitPrice: "₦3.00", total: "₦6.00" }, { name: "Sandwich", qty: 1, unitPrice: "₦13.99", total: "₦13.99" }] },
  { orderId: "ORD-1007", date: "2026-03-08 10:50", customerPhone: "+233 26 444 5566", amount: "₦88.00", cashier: "Ama K.", location: "Downtown Supermarket", paymentStatus: "Pending", payments: [{ method: "Bank Transfer", amount: "₦88.00" }], orderStatus: "Processing", items: [{ name: "Milk 2L", qty: 2, unitPrice: "₦12.00", total: "₦24.00" }, { name: "Bread Loaf", qty: 3, unitPrice: "₦8.00", total: "₦24.00" }, { name: "Eggs (Crate)", qty: 1, unitPrice: "₦40.00", total: "₦40.00" }] },
  { orderId: "ORD-1008", date: "2026-03-08 11:05", customerPhone: "+233 24 777 8899", amount: "₦54.30", cashier: "Yaw M.", location: "Westside Salon", paymentStatus: "Paid", payments: [{ method: "Card", amount: "₦54.30" }], orderStatus: "Completed", items: [{ name: "Manicure", qty: 1, unitPrice: "₦30.00", total: "₦30.00" }, { name: "Nail Polish", qty: 1, unitPrice: "₦24.30", total: "₦24.30" }] },
  { orderId: "ORD-1009", date: "2026-03-08 11:22", customerPhone: "+233 20 999 0011", amount: "₦32.00", cashier: "Esi D.", location: "Airport Kiosk", paymentStatus: "Failed", payments: [{ method: "Card", amount: "₦32.00" }], orderStatus: "On Hold", items: [{ name: "Magazine", qty: 1, unitPrice: "₦12.00", total: "₦12.00" }, { name: "Snack Box", qty: 1, unitPrice: "₦20.00", total: "₦20.00" }] },
  { orderId: "ORD-1010", date: "2026-03-08 11:40", customerPhone: "+233 55 111 4455", amount: "₦76.50", cashier: "Kofi B.", location: "Mall Food Court", paymentStatus: "Paid", payments: [{ method: "Cash", amount: "₦76.50" }], orderStatus: "Completed", items: [{ name: "Burger Meal", qty: 1, unitPrice: "₦42.00", total: "₦42.00" }, { name: "Fries - Large", qty: 1, unitPrice: "₦18.50", total: "₦18.50" }, { name: "Milkshake", qty: 1, unitPrice: "₦16.00", total: "₦16.00" }] },
  { orderId: "ORD-1011", date: "2026-03-08 11:55", customerPhone: "+233 27 222 6677", amount: "₦145.00", cashier: "Ama K.", location: "Downtown Supermarket", paymentStatus: "Paid", payments: [{ method: "Mobile Money", amount: "₦45.00" }, { method: "Card", amount: "₦100.00" }], orderStatus: "Completed", items: [{ name: "Detergent 3kg", qty: 1, unitPrice: "₦45.00", total: "₦45.00" }, { name: "Toilet Paper (12-pack)", qty: 2, unitPrice: "₦25.00", total: "₦50.00" }, { name: "Bleach 2L", qty: 2, unitPrice: "₦25.00", total: "₦50.00" }] },
  { orderId: "ORD-1012", date: "2026-03-08 12:10", customerPhone: "+233 24 333 8899", amount: "₦28.75", cashier: "Yaw M.", location: "Westside Salon", paymentStatus: "Paid", payments: [{ method: "Cash", amount: "₦28.75" }], orderStatus: "Completed", items: [{ name: "Eyebrow Threading", qty: 1, unitPrice: "₦15.00", total: "₦15.00" }, { name: "Face Cream", qty: 1, unitPrice: "₦13.75", total: "₦13.75" }] },
];

const outletLocationMap: Record<string, string> = {
  "outlet-1": "Downtown Supermarket",
  "outlet-2": "Mall Food Court",
  "outlet-3": "Westside Salon",
  "outlet-4": "Airport Kiosk",
};

const rowsPerPageOptions = ["5", "10", "20", "50"];

interface ReportTransactionsProps {
  selectedOutlets: string[];
  dateRange: { from: Date; to: Date };
}

function flattenForExport(txn: Transaction) {
  return {
    "Order ID": txn.orderId,
    Date: txn.date,
    Phone: txn.customerPhone,
    Amount: txn.amount,
    Cashier: txn.cashier,
    Location: txn.location,
    "Payment Status": txn.paymentStatus,
    "Payment Methods": txn.payments.map((p) => `${p.method}: ${p.amount}`).join(", "),
    "Order Status": txn.orderStatus,
  };
}

export default function ReportTransactions({ selectedOutlets, dateRange }: ReportTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [search, setSearch] = useState("");
  const [selectedCashier, setSelectedCashier] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const perPage = parseInt(rowsPerPage);

  const outletFiltered = useMemo(() => {
    const locationNames = selectedOutlets.map((id) => outletLocationMap[id]).filter(Boolean);
    if (locationNames.length === 0 || locationNames.length === Object.keys(outletLocationMap).length) {
      return transactions;
    }
    return transactions.filter((t) => locationNames.includes(t.location));
  }, [selectedOutlets, transactions]);

  const availableCashiers = useMemo(() => {
    return [...new Set(outletFiltered.map((t) => t.cashier))].sort();
  }, [outletFiltered]);

  const filtered = useMemo(() => {
    let result = outletFiltered;
    if (selectedCashier !== "all") {
      result = result.filter((t) => t.cashier === selectedCashier);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.orderId.toLowerCase().includes(q) ||
          t.customerPhone.toLowerCase().includes(q) ||
          t.cashier.toLowerCase().includes(q) ||
          t.location.toLowerCase().includes(q) ||
          t.payments.some((p) => p.method.toLowerCase().includes(q)) ||
          t.orderStatus.toLowerCase().includes(q) ||
          t.paymentStatus.toLowerCase().includes(q)
      );
    }
    return result;
  }, [outletFiltered, selectedCashier, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * perPage;
  const pageData = filtered.slice(startIdx, startIdx + perPage);

  const handleSearchChange = (val: string) => { setSearch(val); setPage(1); };
  const handleRowsChange = (val: string) => { setRowsPerPage(val); setPage(1); };
  const handleCashierChange = (val: string) => { setSelectedCashier(val); setPage(1); };

  const handleExportCSV = useCallback(() => {
    if (filtered.length === 0) { toast.error("No data to export"); return; }
    const rows = filtered.map(flattenForExport);
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${(r as any)[h]}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "transactions.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} transactions as CSV`);
  }, [filtered]);

  const handleExportExcel = useCallback(() => {
    if (filtered.length === 0) { toast.error("No data to export"); return; }
    const rows = filtered.map(flattenForExport);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    ws["!cols"] = Object.keys(rows[0]).map(() => ({ wch: 20 }));
    XLSX.writeFile(wb, "transactions.xlsx");
    toast.success(`Exported ${filtered.length} transactions as Excel`);
  }, [filtered]);

  const handleTransactionUpdate = useCallback((updated: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.orderId === updated.orderId ? updated : t)));
    setSelectedTxn(updated);
  }, []);

  const openDetail = (txn: Transaction) => {
    setSelectedTxn(txn);
    setDetailOpen(true);
  };

  return (
    <>
      <Card className="p-3 sm:p-4 lg:p-5">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm sm:text-base">Transactions</h3>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="gap-1 h-7 sm:h-8 text-xs" onClick={handleExportCSV}>
                <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1 h-7 sm:h-8 text-xs" onClick={handleExportExcel}>
                <FileSpreadsheet className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedCashier} onValueChange={handleCashierChange}>
              <SelectTrigger className="h-8 w-[140px] sm:w-[160px] text-xs sm:text-sm">
                <SelectValue placeholder="All Cashiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cashiers</SelectItem>
                {availableCashiers.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <span>Rows</span>
              <Select value={rowsPerPage} onValueChange={handleRowsChange}>
                <SelectTrigger className="h-8 w-[60px] sm:w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rowsPerPageOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 h-8 sm:h-9 text-xs sm:text-sm w-full"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-5">
          <div className="px-3 sm:px-4 lg:px-5 min-w-[850px]">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">Order ID</th>
                  <th className="pb-3 font-medium text-muted-foreground">Date</th>
                  <th className="pb-3 font-medium text-muted-foreground">Phone</th>
                  <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                  <th className="pb-3 font-medium text-muted-foreground">Cashier</th>
                  <th className="pb-3 font-medium text-muted-foreground">Location</th>
                  <th className="pb-3 font-medium text-muted-foreground">Payment</th>
                  <th className="pb-3 font-medium text-muted-foreground">Method / Amount</th>
                  <th className="pb-3 font-medium text-muted-foreground">Order Status</th>
                  <th className="pb-3 font-medium text-muted-foreground w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  pageData.map((txn) => (
                    <tr
                      key={txn.orderId}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => openDetail(txn)}
                    >
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
                      <td className="py-3">
                        <div className="space-y-0.5">
                          {txn.payments.map((p, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs">
                              <span className="text-muted-foreground">{p.method}:</span>
                              <span className="font-medium">{p.amount}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${orderStatusStyles[txn.orderStatus] ?? ""}`}>
                          {txn.orderStatus}
                        </span>
                      </td>
                      <td className="py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); openDetail(txn); }}
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-border">
          <div className="text-xs sm:text-sm text-muted-foreground">
            {filtered.length === 0 ? "0" : `${startIdx + 1}–${Math.min(startIdx + perPage, filtered.length)}`} of {filtered.length}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                  <Button key={p} variant={p === currentPage ? "default" : "outline"} size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-xs" onClick={() => setPage(p)}>
                    {p}
                  </Button>
                )
              )}
            <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <TransactionDetailDialog
        transaction={selectedTxn}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdate={handleTransactionUpdate}
      />
    </>
  );
}
