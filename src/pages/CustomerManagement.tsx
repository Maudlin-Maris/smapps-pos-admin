import { useState, useMemo } from "react";
import { usePagination } from "@/hooks/use-pagination";
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
  Plus, Search, Users, Star, Gift, TrendingUp, Award, Heart,
} from "lucide-react";
import { format } from "date-fns";
import CustomerDetailPanel from "@/components/customers/CustomerDetailPanel";

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

const defaultCustomers: Customer[] = [
  { id: "c1", firstName: "Adebayo", lastName: "Johnson", email: "adebayo@email.com", phone: "+234 801 111 2222", loyaltyTier: "gold", points: 2450, totalSpent: 185000, visitCount: 47, lastVisit: new Date("2024-06-12"), notes: "Prefers organic coffee", createdAt: new Date("2023-06-01") },
  { id: "c2", firstName: "Chioma", lastName: "Okafor", email: "chioma@email.com", phone: "+234 802 333 4444", loyaltyTier: "platinum", points: 6200, totalSpent: 340000, visitCount: 102, lastVisit: new Date("2024-06-14"), notes: "Loves croissants", createdAt: new Date("2023-03-15") },
  { id: "c3", firstName: "Musa", lastName: "Abdullahi", email: "musa@email.com", phone: "+234 803 555 6666", loyaltyTier: "silver", points: 820, totalSpent: 65000, visitCount: 18, lastVisit: new Date("2024-06-08"), notes: "", createdAt: new Date("2024-01-10") },
  { id: "c4", firstName: "Ngozi", lastName: "Eze", email: "ngozi@email.com", phone: "+234 804 777 8888", loyaltyTier: "bronze", points: 150, totalSpent: 12500, visitCount: 5, lastVisit: new Date("2024-05-20"), notes: "Walk-in customer", createdAt: new Date("2024-04-20") },
  { id: "c5", firstName: "Tunde", lastName: "Bakare", email: "tunde@email.com", phone: "+234 805 999 0000", loyaltyTier: "gold", points: 3100, totalSpent: 220000, visitCount: 64, lastVisit: new Date("2024-06-13"), notes: "Corporate account", createdAt: new Date("2023-09-01") },
];

const defaultRewards: LoyaltyReward[] = [
  { id: "r1", name: "Free Coffee", pointsCost: 100, description: "Any regular sized coffee", isActive: true },
  { id: "r2", name: "10% Discount", pointsCost: 250, description: "10% off entire purchase", isActive: true },
  { id: "r3", name: "Free Pastry", pointsCost: 150, description: "Any pastry from the menu", isActive: true },
  { id: "r4", name: "25% Discount", pointsCost: 500, description: "25% off entire purchase", isActive: true },
  { id: "r5", name: "VIP Experience", pointsCost: 1000, description: "Complimentary meal for two", isActive: false },
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

type Tab = "customers" | "loyalty" | "rewards";

// ── Customer Form ──
function CustomerFormDialog({
  open, onOpenChange, customer, onSave,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; customer: Customer | null; onSave: (c: Customer) => void;
}) {
  const [firstName, setFirstName] = useState(customer?.firstName ?? "");
  const [lastName, setLastName] = useState(customer?.lastName ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [notes, setNotes] = useState(customer?.notes ?? "");

  const handleSave = () => {
    if (!firstName.trim()) { toast.error("First name is required"); return; }
    if (!lastName.trim()) { toast.error("Last name is required"); return; }
    onSave({
      id: customer?.id ?? crypto.randomUUID(),
      firstName: firstName.trim(), lastName: lastName.trim(),
      email: email.trim(), phone: phone.trim(),
      loyaltyTier: customer?.loyaltyTier ?? "bronze",
      points: customer?.points ?? 0, totalSpent: customer?.totalSpent ?? 0,
      visitCount: customer?.visitCount ?? 0, lastVisit: customer?.lastVisit ?? null,
      notes: notes.trim(),
      createdAt: customer?.createdAt ?? new Date(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{customer ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>First Name *</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
            <div><Label>Last Name *</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{customer ? "Update" : "Add Customer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>(defaultCustomers);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = customers;
    if (tierFilter !== "all") list = list.filter((c) => c.loyaltyTier === tierFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q));
    }
    return list;
  }, [customers, tierFilter, search]);

  const { page, setPage, perPage, setPerPage, totalPages, paginatedItems: paginatedCustomers, totalItems, pageSizeOptions } = usePagination(filtered, 10);

  const stats = useMemo(() => ({
    total: customers.length,
    totalPoints: customers.reduce((s, c) => s + c.points, 0),
    avgSpend: customers.length > 0 ? customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length : 0,
    vipCount: customers.filter((c) => c.loyaltyTier === "gold" || c.loyaltyTier === "platinum").length,
  }), [customers]);

  const handleSave = (c: Customer) => {
    setCustomers((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = c; return n; }
      return [...prev, c];
    });
    toast.success(editCustomer ? "Customer updated" : "Customer added");
    setEditCustomer(null);
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
            <div><p className="text-xs text-muted-foreground">Total Customers</p><p className="text-2xl font-heading font-bold">{stats.total}</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><Star className="h-5 w-5 text-warning" /></div>
            <div><p className="text-xs text-muted-foreground">Total Points</p><p className="text-2xl font-heading font-bold">{stats.totalPoints.toLocaleString()}</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-success" /></div>
            <div><p className="text-xs text-muted-foreground">Avg. Spend</p><p className="text-2xl font-heading font-bold">{fmt(stats.avgSpend)}</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center"><Heart className="h-5 w-5 text-purple-600" /></div>
            <div><p className="text-xs text-muted-foreground">VIP Customers</p><p className="text-2xl font-heading font-bold">{stats.vipCount}</p></div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
        onPerPageChange={setPerPage}
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
              {paginatedCustomers.map((c) => {
                const tc = tierConfig[c.loyaltyTier];
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
              })}
            </tbody>
          </table>
        </div>
      </Card>


      <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editCustomer} onSave={handleSave} />
      <CustomerDetailPanel
        customer={detailCustomer}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={(c) => { setDetailOpen(false); setEditCustomer(c); setFormOpen(true); }}
      />
    </div>
  );
}
