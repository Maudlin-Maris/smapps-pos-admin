import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CalendarRange, Crown, TrendingUp, Trophy } from "lucide-react";
import {
  useGetSalesByDepartmentReport,
  useGetSalesByDepartmentDepartments,
  useGetSalesByDepartmentDaily,
} from "@/services/api/reports-api";
import { ResuablePagination } from "@/components/ui/reusable-pagination";
import { formatCurrency } from "./salesData";

interface Props {
  sales?: any[]; // For props compatibility
  selectedOutlets: string[];
  dateRange: { from: Date; to: Date };
  cashierFilter?: string;
  outlets?: any[];
}

export default function SalesByDepartment({
  selectedOutlets,
  dateRange,
  cashierFilter,
}: Props) {
  const [dailyOpen, setDailyOpen] = useState<{
    department: string;
    outletId: string;
    outletName: string;
    orders: number;
    revenue: number;
  } | null>(null);

  // Pagination states
  const [deptPage, setDeptPage] = useState(1);
  const [deptPerPage, setDeptPerPage] = useState(10);

  const formattedFrom = dateRange.from.toISOString().split("T")[0];
  const formattedTo = dateRange.to.toISOString().split("T")[0];
  const outletIdParam =
    selectedOutlets.length === 1 && selectedOutlets[0] !== "all"
      ? selectedOutlets[0]
      : undefined;
  const cashierIdParam = cashierFilter === "all" ? undefined : cashierFilter;

  // 1. Summary details
  const { data: reportResponse, isLoading: isReportLoading } =
    useGetSalesByDepartmentReport({
      dateFrom: formattedFrom,
      dateTo: formattedTo,
      outletId: outletIdParam,
      cashierId: cashierIdParam,
    });

  const report = reportResponse?.data || {
    departments: 0,
    totalOrders: 0,
    totalRevenue: 0,
    topSellingDepartment: {
      department: "",
      outletId: "",
      outletName: "",
      orders: 0,
      revenue: 0,
      pct: "0",
      pctNum: 0,
    },
    topSellingDepartments: [],
  };

  // 2. Paginated departments table list
  const { data: departmentsResponse, isLoading: isDepartmentsLoading } =
    useGetSalesByDepartmentDepartments({
      dateFrom: formattedFrom,
      dateTo: formattedTo,
      outletId: outletIdParam,
      cashierId: cashierIdParam,
      page: deptPage,
      perPage: deptPerPage,
    });

  const paginatedDepartments = departmentsResponse?.data.items || [];
  const departmentsPagination = departmentsResponse?.data.pagination || {
    total: 0,
    lastPage: 1,
  };

  const topDepartment = report.topSellingDepartment;
  const topDepartments = report.topSellingDepartments.slice(0, 5);

  if (isReportLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-xs text-muted-foreground">
          Loading department summary...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Departments</p>
          <p className="text-lg sm:text-2xl font-bold">{report.departments}</p>
        </Card>
        <Card className="p-3 sm:p-4">
          <p className="text-xs text-muted-foreground">Total Orders</p>
          <p className="text-lg sm:text-2xl font-bold">{report.totalOrders}</p>
        </Card>
        <Card className="p-3 sm:p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-lg sm:text-2xl font-bold">
            {formatCurrency(report.totalRevenue)}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Top Selling Department (highlight) */}
        <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                <Crown className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm sm:text-base">
                Top Selling Department
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {topDepartment && topDepartment.department ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold truncate">
                      {topDepartment.department}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {topDepartment.outletName} · Leader by revenue this period
                    </p>
                  </div>
                  <Badge variant="secondary" className="gap-1 shrink-0">
                    <Trophy className="h-3 w-3" /> #1
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Revenue
                    </p>
                    <p className="text-sm sm:text-base font-semibold">
                      {formatCurrency(topDepartment.revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Orders
                    </p>
                    <p className="text-sm sm:text-base font-semibold">
                      {topDepartment.orders}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Share
                    </p>
                    <p className="text-sm sm:text-base font-semibold">
                      {topDepartment.pct}%
                    </p>
                  </div>
                </div>

                <div>
                  <Progress value={topDepartment.pctNum} className="h-2" />
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    {topDepartment.pct}% of total department revenue
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-[180px] items-center justify-center text-muted-foreground text-sm">
                No data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Departments by Revenue */}
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                <TrendingUp className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm sm:text-base">
                Top Departments by Revenue
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
            {topDepartments.length > 0 ? (
              topDepartments.map((d, idx) => (
                <div
                  key={`${d.outletId}-${d.department}`}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium truncate">
                        {d.department}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate">
                        · {d.outletName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-muted-foreground">
                        {d.orders} orders
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(d.revenue)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={d.pctNum} className="h-1.5 flex-1" />
                    <span className="text-[11px] text-muted-foreground w-10 text-right">
                      {d.pct}%
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-[180px] items-center justify-center text-muted-foreground text-sm">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base">
            Sales by Department
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 space-y-2">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Department</TableHead>
                  <TableHead className="text-xs">Outlet</TableHead>
                  <TableHead className="text-right text-xs">Orders</TableHead>
                  <TableHead className="text-right text-xs">Revenue</TableHead>
                  <TableHead className="text-right text-xs">%</TableHead>
                  <TableHead className="text-right text-xs w-[80px]">
                    Daily
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDepartmentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : paginatedDepartments.length > 0 ? (
                  paginatedDepartments.map((d) => (
                    <TableRow key={`${d.outletId}-${d.department}`}>
                      <TableCell className="font-medium text-xs sm:text-sm">
                        {d.department}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs sm:text-sm">
                        {d.outletName}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">
                        {d.orders}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm">
                        {formatCurrency(d.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs sm:text-sm">
                        {d.pct}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() =>
                            setDailyOpen({
                              department: d.department,
                              outletId: d.outletId,
                              outletName: d.outletName,
                              orders: d.orders,
                              revenue: d.revenue,
                            })
                          }
                        >
                          <CalendarRange className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground text-xs"
                    >
                      No department data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <ResuablePagination
            currentPage={deptPage}
            totalPages={departmentsPagination.lastPage}
            totalItems={departmentsPagination.total}
            rowsPerPage={deptPerPage}
            onPageChange={setDeptPage}
            onRowsPerPageChange={setDeptPerPage}
            isLoading={isDepartmentsLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={!!dailyOpen} onOpenChange={(o) => !o && setDailyOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {dailyOpen?.department} ({dailyOpen?.outletName})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Daily department sales breakdown for the selected period
            </DialogDescription>
          </DialogHeader>
          {dailyOpen && (
            <DailyDepartmentBreakdownWrapper
              department={dailyOpen.department}
              outletId={dailyOpen.outletId}
              totalOrders={dailyOpen.orders}
              totalRevenue={dailyOpen.revenue}
              cashierId={cashierIdParam}
              dateFrom={formattedFrom}
              dateTo={formattedTo}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DailyDepartmentBreakdownWrapper({
  department,
  outletId,
  totalOrders,
  totalRevenue,
  cashierId,
  dateFrom,
  dateTo,
}: {
  department: string;
  outletId: string;
  totalOrders: number;
  totalRevenue: number;
  cashierId?: string;
  dateFrom: string;
  dateTo: string;
}) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const { data: dailyResponse, isLoading } = useGetSalesByDepartmentDaily({
    dateFrom,
    dateTo,
    outletId,
    cashierId,
    department,
    page,
    perPage,
  });

  const dailyItems = dailyResponse?.data.items || [];
  const pagination = dailyResponse?.data.pagination || {
    total: 0,
    lastPage: 1,
  };
  const totals = dailyResponse?.data.totals || {
    orders: totalOrders,
    revenue: totalRevenue,
  };

  return (
    <div className="space-y-2">
      <div className="max-h-[50vh] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-right text-xs">Orders</TableHead>
              <TableHead className="text-right text-xs">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto" />
                </TableCell>
              </TableRow>
            ) : dailyItems.length > 0 ? (
              dailyItems.map((d) => (
                <TableRow key={d.date}>
                  <TableCell className="text-xs">{d.displayDate}</TableCell>
                  <TableCell className="text-right text-xs">
                    {d.orders}
                  </TableCell>
                  <TableCell className="text-right text-xs font-semibold">
                    {formatCurrency(d.revenue)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground text-xs"
                >
                  No daily breakdown data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="border-t pt-2">
        <Table>
          <TableBody>
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell className="text-xs">Total</TableCell>
              <TableCell className="text-right text-xs">
                {totals.orders}
              </TableCell>
              <TableCell className="text-right text-xs">
                {formatCurrency(totals.revenue)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <ResuablePagination
        currentPage={page}
        totalPages={pagination.lastPage}
        totalItems={pagination.total}
        rowsPerPage={perPage}
        onPageChange={setPage}
        onRowsPerPageChange={setPerPage}
        isLoading={isLoading}
      />
    </div>
  );
}
