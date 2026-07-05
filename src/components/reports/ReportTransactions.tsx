import { useState, useCallback } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  useGetReportsTransactions,
  useGetReportsTransactionsPaymentMethods,
  useGetCashiersReport,
} from "@/services/api/reports-api";
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
import { Search, Download, FileSpreadsheet, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "@/lib/xlsx-compat";
import type { Transaction } from "@/components/TransactionsTable";
import TransactionDetailDialog from "./TransactionDetailDialog";
import { ResuablePagination } from "@/components/ui/reusable-pagination";

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

interface ReportTransactionsProps {
  selectedOutlets: string[];
  dateRange: { from: Date; to: Date };
  /** When provided, controls cashier filter externally and hides the internal selector. */
  cashierFilter?: string;
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
    "Payment Methods": txn.payments
      .map((p) => `${p.method}: ${p.amount}`)
      .join(", "),
    "Order Status": txn.orderStatus,
  };
}

export default function ReportTransactions({
  selectedOutlets,
  dateRange,
  cashierFilter,
}: ReportTransactionsProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [internalCashier, setInternalCashier] = useState("all");
  const isCashierControlled = cashierFilter !== undefined;
  const selectedCashier = isCashierControlled
    ? (cashierFilter as string)
    : internalCashier;
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("all");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const formattedFrom = dateRange.from.toISOString().split("T")[0];
  const formattedTo = dateRange.to.toISOString().split("T")[0];
  const outletIdParam =
    selectedOutlets.length === 1 && selectedOutlets[0] !== "all"
      ? selectedOutlets[0]
      : undefined;

  // 1. Fetch cashiers list
  const { data: cashiersResponse } = useGetCashiersReport({
    outletId: outletIdParam,
  });
  const availableCashiers = cashiersResponse?.data || [];

  // 2. Fetch payment methods list
  const { data: paymentMethodsResponse } =
    useGetReportsTransactionsPaymentMethods({
      dateFrom: formattedFrom,
      dateTo: formattedTo,
      outletId: outletIdParam,
    });
  const availablePaymentMethods = paymentMethodsResponse?.data || [];

  // 3. Fetch transactions list
  const {
    data: apiResponse,
    isLoading: isListLoading,
    mutate,
  } = useGetReportsTransactions({
    dateFrom: formattedFrom,
    dateTo: formattedTo,
    outletId: outletIdParam,
    cashierId: selectedCashier !== "all" ? selectedCashier : undefined,
    paymentMethod:
      selectedPaymentMethod !== "all" ? selectedPaymentMethod : undefined,
    search: debouncedSearch.trim() || undefined,
    page,
    per_page: parseInt(rowsPerPage),
  });

  const pageData = apiResponse?.data || [];
  const meta = apiResponse?.meta || {
    current_page: 1,
    per_page: 10,
    last_page: 1,
    total: 0,
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };
  const handleRowsChange = (val: string) => {
    setRowsPerPage(val);
    setPage(1);
  };
  const handleCashierChange = (val: string) => {
    setInternalCashier(val);
    setPage(1);
  };
  const handlePaymentMethodChange = (val: string) => {
    setSelectedPaymentMethod(val);
    setPage(1);
  };

  const handleExportCSV = useCallback(() => {
    if (pageData.length === 0) {
      toast.error("No data to export");
      return;
    }
    const rows = pageData.map(flattenForExport);
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => `"${(r as any)[h]}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${pageData.length} transactions as CSV`);
  }, [pageData]);

  const handleExportExcel = useCallback(() => {
    if (pageData.length === 0) {
      toast.error("No data to export");
      return;
    }
    const rows = pageData.map(flattenForExport);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    ws["!cols"] = Object.keys(rows[0]).map(() => ({ wch: 20 }));
    XLSX.writeFile(wb, "transactions.xlsx");
    toast.success(`Exported ${pageData.length} transactions as Excel`);
  }, [pageData]);

  const handleTransactionUpdate = useCallback(
    (updated: Transaction) => {
      setSelectedTxn(updated);
      mutate(); // Refresh the list from the server
    },
    [mutate],
  );

  const openDetail = (txn: Transaction) => {
    setSelectedTxn(txn);
    setDetailOpen(true);
  };

  return (
    <>
      <Card className="p-3 sm:p-4 lg:p-5">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm sm:text-base">
              Transactions
            </h3>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 h-7 sm:h-8 text-xs"
                onClick={handleExportCSV}
              >
                <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 h-7 sm:h-8 text-xs"
                onClick={handleExportExcel}
              >
                <FileSpreadsheet className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!isCashierControlled && (
              <Select
                value={selectedCashier}
                onValueChange={handleCashierChange}
              >
                <SelectTrigger className="h-8 w-[140px] sm:w-[160px] text-xs sm:text-sm">
                  <SelectValue placeholder="All Cashiers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cashiers</SelectItem>
                  {availableCashiers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={selectedPaymentMethod}
              onValueChange={handlePaymentMethodChange}
            >
              <SelectTrigger className="h-8 w-[150px] sm:w-[170px] text-xs sm:text-sm">
                <SelectValue placeholder="All Payment Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Methods</SelectItem>
                {availablePaymentMethods.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
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
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
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
                  <th className="pb-3 font-medium text-muted-foreground">
                    Order ID
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground">
                    Date
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground">
                    Phone
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground">
                    Cashier
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground">
                    Location
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground">
                    Payment
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground">
                    Method / Amount
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground">
                    Order Status
                  </th>
                  <th className="pb-3 font-medium text-muted-foreground w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {isListLoading ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                    </td>
                  </tr>
                ) : pageData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="py-8 text-center text-muted-foreground"
                    >
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
                      <td className="py-3 text-muted-foreground text-xs">
                        {txn.date}
                      </td>
                      <td className="py-3">{txn.customerPhone}</td>
                      <td className="py-3 font-semibold">{txn.amount}</td>
                      <td className="py-3">{txn.cashier}</td>
                      <td className="py-3 text-xs">{txn.location}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${paymentStatusStyles[txn.paymentStatus] ?? ""}`}
                        >
                          {txn.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="space-y-0.5">
                          {txn.payments.map((p, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1.5 text-xs group/pay"
                            >
                              <span className="text-muted-foreground">
                                {p.method}:
                              </span>
                              <span className="font-medium">{p.amount}</span>
                              <button
                                className="opacity-0 group-hover/pay:opacity-100 transition-opacity text-muted-foreground hover:text-foreground ml-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetail(txn);
                                }}
                                title="Edit payment"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${orderStatusStyles[txn.orderStatus] ?? ""}`}
                        >
                          {txn.orderStatus}
                        </span>
                      </td>
                      <td className="py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(txn);
                          }}
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

        <ResuablePagination
          currentPage={page}
          totalPages={meta.last_page}
          totalItems={meta.total}
          rowsPerPage={parseInt(rowsPerPage)}
          onPageChange={setPage}
          onRowsPerPageChange={handleRowsChange}
          isLoading={isListLoading}
        />
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
