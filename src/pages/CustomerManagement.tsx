import { useState, useMemo } from "react";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import PaginationControls from "@/components/inventory/PaginationControls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Plus, Search, Users, Star, Gift, TrendingUp, Award, Heart, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import CustomerDetailPanel from "@/components/customers/CustomerDetailPanel";
import { Skeleton } from "@/components/ui/skeleton";

// API
import { useGetCustomers, useCreateCustomer, useUpdateCustomer } from "@/services/api/customers";

// ── Types ──
type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  loyaltyTier: LoyaltyTier;
  points: number;
  totalSpent: number;
  visitCount: number;
  lastVisit: Date | null;
  notes: string;
  createdAt: Date;
}

interface LoyaltyReward {
  id: string;
  name: string;
  pointsCost: number;
  description: string;
  isActive: boolean;
}

// ── Defaults ──
const tierConfig: Record<LoyaltyTier, { label: string; color: string; minPoints: number; icon: React.ElementType }> = {
  bronze: { label: "Bronze", color: "bg-orange-100 text-orange-700", minPoints: 0, icon: Award },
  silver: { label: "Silver", color: "bg-gray-100 text-gray-700", minPoints: 500, icon: Award },
  gold: { label: "Gold", color: "bg-yellow-100 text-yellow-700", minPoints: 2000, icon: Star },
  platinum: { label: "Platinum", color: "bg-purple-100 text-purple-700", minPoints: 5000, icon: Star },
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

// ── Customer Form ──
function CustomerFormDialog({
  open, onOpenChange, customer, onSave, isSaving,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customer: Customer | null;
  onSave: (c: any) => void;
  isSaving: boolean;
}) {
  const [firstName, setFirstName] = useState(customer?.firstName ?? "");
  const [lastName, setLastName] = useState(customer?.lastName ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [notes, setNotes] = useState(customer?.notes ?? "");

  const handleSave = () => {
    if (!firstName.trim()) { toast.error("First name is required"); return; }
    if (!lastName.trim()) { toast.error("Last name is required"); return; }
    if (phone.trim() && !/^\d{11}$/.test(phone.trim())) {
      toast.error("Phone number must be an 11-digit number (e.g., 08012345678)");
      return;
    }
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{customer ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First Name *</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isSaving} /></div>
            <div><Label>Last Name *</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isSaving} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSaving} /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isSaving} placeholder="08012345678" /></div>
          </div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} disabled={isSaving} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {customer ? "Update" : "Add Customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomerManagement() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PAGE_SIZE);

  // API query
  const { data: customersResponse, isLoading: isCustomersLoading, mutate: mutateCustomers } = useGetCustomers({
    page,
    per_page: perPage,
    search: search.trim() || undefined,
  });

  const rawCustomers = customersResponse?.data || [];
  const totalItems = customersResponse?.meta?.total ?? 0;
  const totalPages = customersResponse?.meta?.last_page ?? 1;
  const pageSizeOptions = [5, 10, 20, 50];

  const stats = useMemo(() => {
    const s = customersResponse?.stats;
    return {
      total: s?.total ?? 0,
      totalPoints: s?.totalPoints ?? 0,
      avgSpend: s?.avgSpend ?? 0,
      vipCount: s?.vipCount ?? 0,
    };
  }, [customersResponse]);

  const customers = useMemo(() => {
    return rawCustomers.map((c) => ({
      ...c,
      lastVisit: c.lastVisitAt ? new Date(c.lastVisitAt) : null,
      createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      notes: c.notes || "",
    }));
  }, [rawCustomers]);

  const filtered = useMemo(() => {
    let list = customers;
    if (tierFilter !== "all") list = list.filter((c) => c.loyaltyTier === tierFilter);
    return list;
  }, [customers, tierFilter]);

  // Mutations
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer(editCustomer?.id);

  const isSaving = createCustomerMutation.isMutating || updateCustomerMutation.isMutating;

  const handleSave = async (c: any) => {
    try {
      if (editCustomer) {
        await updateCustomerMutation.trigger(c);
        toast.success("Customer updated");
      } else {
        await createCustomerMutation.trigger(c);
        toast.success("Customer added");
      }
      mutateCustomers();
      setFormOpen(false);
      setEditCustomer(null);
    } catch (err) {
      // toast shown by useApiMutation onError
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage customer relationships</p>
        </div>
        <Button className="gap-1.5" onClick={() => { setEditCustomer(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center"><Users className="h-5 w-5 text-accent" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Customers</p>
              {isCustomersLoading ? <Skeleton className="h-7 w-16 mt-0.5" /> : <p className="text-2xl font-heading font-bold">{stats.total}</p>}
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><Star className="h-5 w-5 text-warning" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Points</p>
              {isCustomersLoading ? <Skeleton className="h-7 w-20 mt-0.5" /> : <p className="text-2xl font-heading font-bold">{stats.totalPoints.toLocaleString()}</p>}
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Avg. Spend</p>
              {isCustomersLoading ? <Skeleton className="h-7 w-24 mt-0.5" /> : <p className="text-2xl font-heading font-bold">{fmt(stats.avgSpend)}</p>}
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center"><Heart className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">VIP Customers</p>
              {isCustomersLoading ? <Skeleton className="h-7 w-12 mt-0.5" /> : <p className="text-2xl font-heading font-bold">{stats.vipCount}</p>}
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search customers..." value={search} onChange={(e) => handleSearchChange(e.target.value)} />
        </div>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {Object.entries(tierConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        perPage={perPage}
        totalItems={totalItems}
        pageSizeOptions={pageSizeOptions}
        onPageChange={setPage}
        onPerPageChange={(val) => { setPerPage(val); setPage(1); }}
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-left p-3 font-medium">Tier</th>
                <th className="text-right p-3 font-medium">Points</th>
                <th className="text-right p-3 font-medium">Total Spent</th>
                <th className="text-right p-3 font-medium">Visits</th>
                <th className="text-left p-3 font-medium">Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {isCustomersLoading ? (
                Array.from({ length: perPage }).map((_, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-3">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </td>
                    <td className="p-3"><Skeleton className="h-6 w-16" /></td>
                    <td className="p-3 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                    <td className="p-3 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    <td className="p-3 text-right"><Skeleton className="h-4 w-8 ml-auto" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No customers found
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const tc = tierConfig[c.loyaltyTier] || tierConfig.bronze;
                  return (
                    <tr key={c.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => { setDetailCustomer(c); setDetailOpen(true); }}>
                      <td className="p-3">
                        <div className="font-medium">{c.firstName} {c.lastName}</div>
                        <div className="text-xs text-muted-foreground">{c.email || c.phone}</div>
                      </td>
                      <td className="p-3"><Badge variant="secondary" className={cn("text-xs", tc.color)}>{tc.label}</Badge></td>
                      <td className="p-3 text-right font-medium">{c.points.toLocaleString()}</td>
                      <td className="p-3 text-right">{fmt(c.totalSpent)}</td>
                      <td className="p-3 text-right">{c.visitCount}</td>
                      <td className="p-3 text-muted-foreground">{c.lastVisit ? format(c.lastVisit, "MMM d, yyyy") : "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {formOpen && (
        <CustomerFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          customer={editCustomer}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
      <CustomerDetailPanel
        customer={detailCustomer}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={(c) => { setDetailOpen(false); setEditCustomer(c); setFormOpen(true); }}
        onMutate={mutateCustomers}
      />
    </div>
  );
}
