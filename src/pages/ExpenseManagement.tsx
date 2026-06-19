import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Plus, Pencil, Trash2, Search, Receipt, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { outlets } from "@/data/outlets";
import { expenseCategories, type Expense, type ExpenseCategory } from "@/hooks/use-financial-data";
import PaginationControls from "@/components/inventory/PaginationControls";
import { Skeleton } from "@/components/ui/skeleton";

// API
import { useGetExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense } from "@/services/api/expenses";

interface ExpenseForm {
  outletId: string;
  category: ExpenseCategory;
  amount: number;
  date: Date;
  description: string;
  recurring: boolean;
  recurringPeriod: "weekly" | "monthly" | "quarterly" | "yearly";
}

const emptyForm = (outletId: string = ""): ExpenseForm => ({
  outletId,
  category: "other",
  amount: 0,
  date: new Date(),
  description: "",
  recurring: false,
  recurringPeriod: "monthly",
});

export default function ExpenseManagement() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm());
  const [search, setSearch] = useState("");
  const [filterOutlet, setFilterOutlet] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Pagination states
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // API query
  const { data: expensesResponse, isLoading: isExpensesLoading, mutate: mutateExpenses } = useGetExpenses({
    outletId: filterOutlet === "all" ? undefined : filterOutlet,
    category: filterCategory === "all" ? undefined : filterCategory,
    search: search.trim() || undefined,
    page,
    per_page: perPage,
  });

  const expenses = expensesResponse?.data || [];
  const totalItems = expensesResponse?.meta?.total ?? 0;
  const totalPages = expensesResponse?.meta?.last_page ?? 1;
  const pageSizeOptions = [5, 10, 20, 50];

  const totalFiltered = expensesResponse?.summary?.totalAmount ?? 0;

  // Mutations
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense(editingId || undefined);
  const deleteExpenseMutation = useDeleteExpense();

  const isSaving = createExpenseMutation.isMutating || updateExpenseMutation.isMutating;

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm(filterOutlet === "all" ? "" : filterOutlet));
    setOpen(true);
  };

  const openEdit = (expense: any) => {
    setEditingId(expense.id);
    setForm({
      outletId: expense.outletId,
      category: expense.category,
      amount: expense.amount,
      date: new Date(expense.date),
      description: expense.description,
      recurring: expense.recurring,
      recurringPeriod: expense.recurringPeriod || "monthly",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.outletId) {
      toast.error("Please select an outlet");
      return;
    }
    if (form.amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }

    const payload = {
      outletId: form.outletId,
      category: form.category,
      amount: form.amount,
      date: format(form.date, "yyyy-MM-dd"),
      description: form.description.trim(),
      recurring: form.recurring,
      recurringPeriod: form.recurring ? form.recurringPeriod : undefined,
    };

    try {
      if (editingId) {
        await updateExpenseMutation.trigger(payload);
        toast.success("Expense updated");
      } else {
        await createExpenseMutation.trigger(payload);
        toast.success("Expense recorded");
      }
      mutateExpenses();
      setOpen(false);
    } catch (err) {
      // handled
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExpenseMutation.trigger(id);
      toast.success("Expense deleted");
      mutateExpenses();
    } catch (err) {
      // handled
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleOutletChange = (val: string) => {
    setFilterOutlet(val);
    setPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setFilterCategory(val);
    setPage(1);
  };

  const getOutletName = (id: string) => outlets.find((o) => o.id === id)?.name || id;
  const getCategoryLabel = (cat: string) => expenseCategories.find((c) => c.value === cat)?.label || cat;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Record and manage business expenses by outlet</p>
        </div>
        <Button size="sm" onClick={openNew} className="w-fit">
          <Plus className="h-4 w-4 mr-1" /> Record Expense
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." value={search} onChange={(e) => handleSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterOutlet} onValueChange={handleOutletChange}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outlets</SelectItem>
            {outlets.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {expenseCategories.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Card */}
      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <Receipt className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total (filtered)</p>
            {isExpensesLoading ? <Skeleton className="h-6 w-24 mt-0.5" /> : <p className="text-lg font-heading font-bold">{fmt(totalFiltered)}</p>}
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">
          {totalItems} expenses
        </Badge>
      </Card>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        perPage={perPage}
        totalItems={totalItems}
        pageSizeOptions={pageSizeOptions}
        onPageChange={setPage}
        onPerPageChange={(val) => { setPerPage(val); setPage(1); }}
      />

      {/* Expense List */}
      <div className="grid gap-3">
        {isExpensesLoading ? (
          Array.from({ length: perPage }).map((_, idx) => (
            <Card key={idx} className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="text-right space-y-1.5">
                  <Skeleton className="h-4 w-16 ml-auto" />
                  <Skeleton className="h-3 w-12 ml-auto" />
                </div>
              </div>
            </Card>
          ))
        ) : expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No expenses found</p>
        ) : (
          expenses.map((expense) => (
            <Card key={expense.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                    expense.recurring ? "bg-accent/10" : "bg-muted"
                  )}>
                    {expense.recurring ? <RefreshCw className="h-4 w-4 text-accent" /> : <Receipt className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{expense.description}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{getCategoryLabel(expense.category)}</Badge>
                      <span className="text-[10px] text-muted-foreground">{getOutletName(expense.outletId)}</span>
                      {expense.recurring && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-accent/30 text-accent">
                          {expense.recurringPeriod}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-heading font-bold">{fmt(expense.amount)}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(expense.date), "MMM d, yyyy")}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(expense)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(expense.id)} disabled={deleteExpenseMutation.isMutating}>
                      {deleteExpenseMutation.isMutating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Expense" : "Record Expense"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Outlet *</label>
              <Select value={form.outletId} onValueChange={(v) => setForm({ ...form, outletId: v })} disabled={isSaving}>
                <SelectTrigger><SelectValue placeholder="Select outlet" /></SelectTrigger>
                <SelectContent>
                  {outlets.map((o) => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })} disabled={isSaving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount || ""}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  placeholder="0.00"
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date *</label>
              <Popover>
                <PopoverTrigger asChild disabled={isSaving}>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !form.date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(form.date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.date}
                    onSelect={(d) => d && setForm({ ...form, date: d })}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Monthly rent payment"
                disabled={isSaving}
              />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="text-sm font-medium">Recurring expense</p>
                <p className="text-xs text-muted-foreground">This expense repeats on a schedule</p>
              </div>
              <Switch checked={form.recurring} onCheckedChange={(v) => setForm({ ...form, recurring: v })} disabled={isSaving} />
            </div>
            {form.recurring && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Frequency</label>
                <Select value={form.recurringPeriod} onValueChange={(v) => setForm({ ...form, recurringPeriod: v as ExpenseForm["recurringPeriod"] })} disabled={isSaving}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? "Update" : "Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
