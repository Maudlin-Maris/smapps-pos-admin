import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  User, Phone, Mail, Calendar, Star, Award, TrendingUp,
  ShoppingBag, Tag, StickyNote, Pencil, Receipt, CheckCircle2,
  Clock, XCircle, CreditCard, ChevronLeft, ChevronRight,
} from "lucide-react";

type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyTier: LoyaltyTier;
  points: number;
  totalSpent: number;
  visitCount: number;
  lastVisit: Date | null;
  notes: string;
  tags: string[];
  createdAt: Date;
}

export interface CustomerTransaction {
  id: string;
  date: string;
  amount: number;
  items: { name: string; qty: number; unitPrice: number }[];
  paymentMethod: string;
  paymentStatus: "Paid" | "Pending" | "Refunded";
  orderStatus: "Completed" | "Processing" | "Cancelled";
  location: string;
}

const tierConfig: Record<LoyaltyTier, { label: string; color: string }> = {
  bronze: { label: "Bronze", color: "bg-orange-100 text-orange-700" },
  silver: { label: "Silver", color: "bg-gray-100 text-gray-700" },
  gold: { label: "Gold", color: "bg-yellow-100 text-yellow-700" },
  platinum: { label: "Platinum", color: "bg-purple-100 text-purple-700" },
};

const paymentStatusStyles: Record<string, { class: string; icon: React.ElementType }> = {
  Paid: { class: "bg-success/10 text-success", icon: CheckCircle2 },
  Pending: { class: "bg-warning/10 text-warning", icon: Clock },
  Refunded: { class: "bg-info/10 text-info", icon: CreditCard },
};

const orderStatusStyles: Record<string, { class: string; icon: React.ElementType }> = {
  Completed: { class: "bg-success/10 text-success", icon: CheckCircle2 },
  Processing: { class: "bg-info/10 text-info", icon: Clock },
  Cancelled: { class: "bg-destructive/10 text-destructive", icon: XCircle },
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

// Generate deterministic mock transactions per customer
function generateMockTransactions(customer: Customer): CustomerTransaction[] {
  const locations = ["Main Branch", "Lekki Outlet", "VI Branch"];
  const methods = ["Cash", "Card", "Transfer", "Mobile Money"];
  const itemNames = [
    "Cappuccino", "Latte", "Croissant", "Grilled Chicken", "Jollof Rice",
    "Smoothie", "Pancakes", "Espresso", "Sandwich", "Cake Slice",
  ];

  const txns: CustomerTransaction[] = [];
  const count = Math.min(customer.visitCount, 15); // Show up to 15 recent transactions
  const baseDate = new Date("2024-06-14");

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - i * 2 - Math.floor(i / 3));

    const itemCount = 1 + (i % 3);
    const items = Array.from({ length: itemCount }, (_, j) => {
      const idx = (i * 3 + j) % itemNames.length;
      const qty = 1 + (j % 2);
      const unitPrice = [1500, 2000, 800, 4500, 3500, 2500, 1800, 1200, 3000, 1000][idx];
      return { name: itemNames[idx], qty, unitPrice };
    });

    const amount = items.reduce((s, item) => s + item.qty * item.unitPrice, 0);
    const statuses: ("Paid" | "Pending" | "Refunded")[] = ["Paid", "Paid", "Paid", "Paid", "Pending"];
    const orderStatuses: ("Completed" | "Processing" | "Cancelled")[] = ["Completed", "Completed", "Completed", "Completed", "Processing"];

    txns.push({
      id: `ORD-${customer.id.slice(0, 2).toUpperCase()}${(1000 + i).toString()}`,
      date: format(date, "MMM d, yyyy · h:mm a"),
      amount,
      items,
      paymentMethod: methods[i % methods.length],
      paymentStatus: statuses[i % statuses.length],
      orderStatus: orderStatuses[i % orderStatuses.length],
      location: locations[i % locations.length],
    });
  }

  return txns;
}

interface CustomerDetailPanelProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (customer: Customer) => void;
}

const TXN_PER_PAGE = 5;

export default function CustomerDetailPanel({ customer, open, onOpenChange, onEdit }: CustomerDetailPanelProps) {
  const [txnPage, setTxnPage] = useState(1);

  const transactions = useMemo(() => {
    if (!customer) return [];
    setTxnPage(1);
    return generateMockTransactions(customer);
  }, [customer]);

  const txnTotalPages = Math.max(1, Math.ceil(transactions.length / TXN_PER_PAGE));
  const safeTxnPage = Math.min(txnPage, txnTotalPages);
  const paginatedTxns = transactions.slice((safeTxnPage - 1) * TXN_PER_PAGE, safeTxnPage * TXN_PER_PAGE);

  if (!customer) return null;

  const tc = tierConfig[customer.loyaltyTier];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!w-full !max-w-none lg:!max-w-2xl p-0 flex flex-col overflow-hidden [&>button]:z-10"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-lg font-heading">{customer.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={cn("text-xs", tc.color)}>{tc.label}</Badge>
                {customer.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { onOpenChange(false); onEdit(customer); }}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Customer Info */}
          <div className="px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {customer.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{customer.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>Joined {format(customer.createdAt, "MMM yyyy")}</span>
              </div>
              {customer.lastVisit && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span>Last visit {format(customer.lastVisit, "MMM d, yyyy")}</span>
                </div>
              )}
            </div>

            {customer.notes && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg p-2.5">
                <StickyNote className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{customer.notes}</span>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="px-5 pb-4">
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-xl bg-primary/10 p-3 text-center">
                <TrendingUp className="h-4 w-4 mx-auto text-primary mb-1" />
                <p className="text-lg font-bold text-primary">{fmt(customer.totalSpent)}</p>
                <p className="text-[10px] text-muted-foreground">Total Spent</p>
              </div>
              <div className="rounded-xl bg-muted p-3 text-center">
                <Star className="h-4 w-4 mx-auto text-warning mb-1" />
                <p className="text-lg font-bold">{customer.points.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Points</p>
              </div>
              <div className="rounded-xl bg-muted p-3 text-center">
                <ShoppingBag className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-bold">{customer.visitCount}</p>
                <p className="text-[10px] text-muted-foreground">Visits</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Transaction History */}
          <div className="px-5 py-4">
            <h3 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
              <Receipt className="h-4 w-4" /> Transaction History
              <span className="text-muted-foreground font-normal">({transactions.length})</span>
            </h3>

            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No transactions yet</p>
            ) : (
              <>
                {txnTotalPages > 1 && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      {(safeTxnPage - 1) * TXN_PER_PAGE + 1}–{Math.min(safeTxnPage * TXN_PER_PAGE, transactions.length)} of {transactions.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-7 w-7" disabled={safeTxnPage <= 1} onClick={() => setTxnPage(safeTxnPage - 1)}>
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-xs text-muted-foreground px-1">{safeTxnPage}/{txnTotalPages}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" disabled={safeTxnPage >= txnTotalPages} onClick={() => setTxnPage(safeTxnPage + 1)}>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {paginatedTxns.map((txn) => {
                    const ps = paymentStatusStyles[txn.paymentStatus];
                    const PIcon = ps?.icon ?? CheckCircle2;
                    return (
                      <details key={txn.id} className="group rounded-lg border border-border overflow-hidden">
                        <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors text-sm">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">{txn.id}</span>
                                <Badge variant="secondary" className={cn("text-[10px] gap-1 px-1.5 py-0", ps?.class)}>
                                  <PIcon className="h-2.5 w-2.5" />
                                  {txn.paymentStatus}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{txn.date} · {txn.location}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="font-semibold">{fmt(txn.amount)}</p>
                            <p className="text-[10px] text-muted-foreground">{txn.paymentMethod}</p>
                          </div>
                        </summary>
                        <div className="border-t border-border bg-muted/20 px-3 py-2">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-muted-foreground">
                                <th className="text-left py-1 font-medium">Item</th>
                                <th className="text-center py-1 font-medium">Qty</th>
                                <th className="text-right py-1 font-medium">Price</th>
                                <th className="text-right py-1 font-medium">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {txn.items.map((item, i) => (
                                <tr key={i} className="border-t border-border/30">
                                  <td className="py-1 font-medium">{item.name}</td>
                                  <td className="py-1 text-center text-muted-foreground">{item.qty}</td>
                                  <td className="py-1 text-right text-muted-foreground">{fmt(item.unitPrice)}</td>
                                  <td className="py-1 text-right font-medium">{fmt(item.qty * item.unitPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-border">
                                <td colSpan={3} className="py-1 text-right font-semibold">Total</td>
                                <td className="py-1 text-right font-semibold">{fmt(txn.amount)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </details>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
