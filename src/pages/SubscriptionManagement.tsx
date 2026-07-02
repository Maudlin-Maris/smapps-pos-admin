import { Fragment, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  X,
  CreditCard,
  Calendar,
  Zap,
  Shield,
  Users,
  Store,
  Package,
  HardDrive,
  Receipt,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Ban,
  Plus,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  XCircle,
  Sparkles,
  TrendingUp,
  FileText,
  Truck,
  ChefHat,
  MessageSquare,
  Code2,
  Heart,
  Activity,
  AlertCircle,
  Info,
  QrCode,
  MoreVertical,
  Star,
  Trash2,
  Copy,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { posOutlets } from "@/data/posData";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                       Click-to-reveal feature tooltip                      */
/* -------------------------------------------------------------------------- */
function FeatureInfo({ title, description }: { title: string; description: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label={`What is ${title}?`}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          <Info className="h-3 w-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-64 p-3">
        <p className="text-xs font-semibold mb-1">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/*                                   Data                                     */
/* -------------------------------------------------------------------------- */

const subscription = {
  plan: "Business Pro",
  status: "active" as "active" | "trial" | "grace" | "past_due" | "suspended",
  renewalDate: "March 15, 2026",
  billingCycle: "Monthly",
  monthlyCost: "₦79,000",
  autoRenew: true,
  daysLeft: 18,
};

const usage = [
  { key: "outlets", label: "Outlets", icon: Store, used: 4, limit: 10, unit: "" },
  { key: "staff", label: "Staff", icon: Users, used: 32, limit: 50, unit: "" },
  { key: "cashiers", label: "Cashiers", icon: Receipt, used: 18, limit: 25, unit: "" },
  { key: "registers", label: "Registers", icon: Monitor, used: 9, limit: 15, unit: "" },
  { key: "transactions", label: "Transactions", icon: Activity, used: 42300, limit: 50000, unit: "/mo" },
  { key: "storage", label: "Storage", icon: HardDrive, used: 84, limit: 100, unit: " GB" },
];

/**
 * Master feature catalog — derived from the actual application modules
 * (POS, Menu, Inventory, Reports, Outlets, Loyalty, Bookings, KDS, etc.).
 *
 * tier: 0=Starter (Core), 1=Business Pro (Advanced), 2=Enterprise.
 * addon: true means the feature can also be purchased à la carte
 *        below the tier where it becomes included.
 */
interface FeatureDef {
  name: string;
  desc: string;
  category: string;
  tier: 0 | 1 | 2;
  addon?: boolean;
}

const featureCatalog: FeatureDef[] = [
  // ───── POS & Checkout (Core) ─────
  { category: "POS & Checkout", tier: 0, name: "Core POS & Catalog",       desc: "Cart, checkout, item search, variants" },
  { category: "POS & Checkout", tier: 0, name: "Cashier PIN & Lock Screen",desc: "Multi-session sign-in, fast switching" },
  { category: "POS & Checkout", tier: 0, name: "Receipt Printing",         desc: "Thermal & A4 receipt printing" },
  { category: "POS & Checkout", tier: 0, name: "Shift Management",         desc: "Open / close shifts, cash drawer reconciliation" },
  { category: "POS & Checkout", tier: 1, name: "Split Payments & Tips",    desc: "Multi-tender, tip pooling & payouts" },
  { category: "POS & Checkout", tier: 1, name: "Order Merging & Modifiers",desc: "Combine tickets, auth-protected edits" },
  { category: "POS & Checkout", tier: 1, name: "Barcode Scan & Print",     desc: "Camera + hardware scanners, bulk label printing" },

  // ───── Menu & Catalog ─────
  { category: "Menu & Catalog", tier: 0, name: "Menu Management",          desc: "Items, categories, basic variants" },
  { category: "Menu & Catalog", tier: 1, name: "Modifier Groups",          desc: "Reusable add-ons & forced choices" },
  { category: "Menu & Catalog", tier: 1, name: "Composite Items & Recipes",desc: "BOM, unit mappings, substitutions" },
  { category: "Menu & Catalog", tier: 1, name: "Promo Bundles",            desc: "Locked groups, Toast-style upcharges" },

  // ───── Inventory ─────
  { category: "Inventory",      tier: 0, name: "Stock Tracking",           desc: "On-hand quantities & low-stock alerts" },
  { category: "Inventory",      tier: 1, name: "WAC Valuation",            desc: "Weighted-average cost, live recalc" },
  { category: "Inventory",      tier: 1, name: "Batch & FEFO Tracking",    desc: "Lot IDs, expiry-first depletion" },
  { category: "Inventory",      tier: 1, name: "Inventory History & Audit",desc: "Full adjustment log with reasons" },
  { category: "Inventory",      tier: 1, name: "Stock Transfers",          desc: "Inter-outlet transfers & approvals" },
  { category: "Inventory",      tier: 1, name: "Bulk Import / Receive",    desc: "CSV import, bulk receive workflows" },

  // ───── Outlets & Operations ─────
  { category: "Outlets",        tier: 0, name: "Single Outlet",            desc: "One location, one terminal pool" },
  { category: "Outlets",        tier: 1, name: "Multi-Outlet Management",  desc: "Centralised admin across locations" },
  { category: "Outlets",        tier: 1, name: "Departments & Routing",    desc: "Kitchen / bar / counter routing" },
  { category: "Outlets",        tier: 1, name: "Fees, Taxes & Discounts",  desc: "Location-specific charges & rules" },
  { category: "Outlets",        tier: 1, name: "Terminal Management",      desc: "Device linking IDs, per-outlet binding" },
  { category: "Outlets",        tier: 2, name: "Multi-Business Groups",    desc: "Parent-child org hierarchy" },

  // ───── Customers & Loyalty ─────
  { category: "Customers",      tier: 0, name: "Customer Database",        desc: "Profiles, contact info, order history" },
  { category: "Customers",      tier: 1, name: "Loyalty Program",          desc: "Points, tiers, location overrides", addon: true },
  { category: "Customers",      tier: 1, name: "Service Bookings",         desc: "Appointments, duration & status",   addon: true },

  // ───── Reports & Analytics ─────
  { category: "Reports",        tier: 0, name: "Basic Sales Reports",      desc: "Daily totals, by item, by cashier" },
  { category: "Reports",        tier: 1, name: "Advanced Reports",         desc: "P&L, COGS, raw-material contribution" },
  { category: "Reports",        tier: 1, name: "Profitability Analytics",  desc: "Margin by item, category, department" },
  { category: "Reports",        tier: 1, name: "Report Exports",           desc: "Excel / CSV / PDF export bundles" },
  { category: "Reports",        tier: 2, name: "Custom Reports & BI Feed", desc: "Custom dashboards & data warehouse sync", addon: true },

  // ───── Finance ─────
  { category: "Finance",        tier: 1, name: "Expense Management",       desc: "Track outlet expenses & categories" },
  { category: "Finance",        tier: 1, name: "Tips Management",          desc: "Pooling rules & cashier payouts" },

  // ───── Kitchen & Fulfillment ─────
  { category: "Kitchen",        tier: 1, name: "Kitchen Display (KDS)",    desc: "Live tickets, station routing",       addon: true },
  { category: "Kitchen",        tier: 2, name: "Delivery & Dispatch",      desc: "Rider assignment & tracking",         addon: true },
  { category: "Kitchen",        tier: 2, name: "Online Ordering",          desc: "Branded order-ahead web storefront",  addon: true },

  // ───── Users & Security ─────
  { category: "Users & Security", tier: 0, name: "Staff Roles & PINs",     desc: "Basic role assignment" },
  { category: "Users & Security", tier: 1, name: "Granular RBAC",          desc: "Permission matrix per role" },
  { category: "Users & Security", tier: 2, name: "SSO / SAML",             desc: "Enterprise identity provider login" },
  { category: "Users & Security", tier: 2, name: "Advanced Audit Logs",    desc: "Tamper-evident activity trail" },

  // ───── Platform & Extensibility ─────
  { category: "Platform",       tier: 2, name: "API Access & Webhooks",    desc: "REST endpoints & event webhooks",     addon: true },
  { category: "Platform",       tier: 2, name: "White Label",              desc: "Custom branding & domain" },
  { category: "Platform",       tier: 2, name: "WhatsApp Receipts",        desc: "Auto-send digital receipts",          addon: true },

  // ───── Support & SLA ─────
  { category: "Support",        tier: 0, name: "Email Support",            desc: "Standard email response" },
  { category: "Support",        tier: 1, name: "Priority Support",         desc: "Faster response, in-app chat" },
  { category: "Support",        tier: 2, name: "Dedicated CSM & 99.9% SLA",desc: "Named success manager, uptime SLA" },
];

const planByTier: Record<0 | 1 | 2, string> = {
  0: "Starter",
  1: "Business Pro",
  2: "Enterprise",
};

/** Plan name → set of feature names included by that tier (cumulative). */
const planFeatures: Record<string, string[]> = {
  Starter:        featureCatalog.filter((f) => f.tier <= 0).map((f) => f.name),
  "Business Pro": featureCatalog.filter((f) => f.tier <= 1).map((f) => f.name),
  Enterprise:     featureCatalog.filter((f) => f.tier <= 2).map((f) => f.name),
};

const CURRENT_PLAN = subscription.plan;
const enabledFeatures = featureCatalog.filter((f) => planFeatures[CURRENT_PLAN].includes(f.name));
const disabledFeatures = featureCatalog.filter((f) => !planFeatures[CURRENT_PLAN].includes(f.name));

/** Icon resolution for add-on cards. */
const addonIcons: Record<string, LucideIcon> = {
  loyalty: Heart,
  kds: ChefHat,
  bookings: Calendar,
  delivery: Truck,
  online: Store,
  whatsapp: MessageSquare,
  api: Code2,
  bi: TrendingUp,
  qrmenu: QrCode,
};

interface AddonDef {
  key: string;
  name: string;
  icon: LucideIcon;
  price: string;
  active: boolean;
  desc: string;
  /** Tier at which the add-on is bundled for free (no longer billable). */
  includedFromTier: 0 | 1 | 2;
  /** Feature not yet shipped — card shown but not purchasable. */
  comingSoon?: boolean;
}

const addons: AddonDef[] = [
  { key: "loyalty",  name: "Loyalty Engine",     icon: addonIcons.loyalty,  price: "₦12,000/mo", active: true,  includedFromTier: 1, desc: "Points, tiers & redemption rules" },
  { key: "kds",      name: "Kitchen Display",    icon: addonIcons.kds,      price: "₦9,000/mo",  active: true,  includedFromTier: 1, desc: "Real-time kitchen station tickets" },
  { key: "bookings", name: "Service Bookings",   icon: addonIcons.bookings, price: "₦8,000/mo",  active: false, includedFromTier: 1, desc: "Appointments for salons & services" },
  { key: "qrmenu",   name: "QR Code Menu",       icon: addonIcons.qrmenu,   price: "₦5,000/mo",  active: false, includedFromTier: 1, desc: "Customers scan a QR to view your catalog on their phone" },
  { key: "delivery", name: "Delivery & Dispatch",icon: addonIcons.delivery, price: "₦18,000/mo", active: false, includedFromTier: 2, desc: "Rider assignment & live tracking", comingSoon: true },
  { key: "online",   name: "Online Ordering",    icon: addonIcons.online,   price: "₦22,000/mo", active: false, includedFromTier: 2, desc: "Branded order-ahead storefront", comingSoon: true },
  { key: "whatsapp", name: "WhatsApp Receipts",  icon: addonIcons.whatsapp, price: "₦6,000/mo",  active: false, includedFromTier: 2, desc: "Auto-send digital receipts", comingSoon: true },
  { key: "api",      name: "API Access",         icon: addonIcons.api,      price: "₦25,000/mo", active: false, includedFromTier: 2, desc: "REST endpoints & webhooks", comingSoon: true },
  { key: "bi",       name: "BI Data Feed",       icon: addonIcons.bi,       price: "₦30,000/mo", active: false, includedFromTier: 2, desc: "Warehouse sync for Looker / Power BI", comingSoon: true },
];

const comparisonPlans = [
  {
    name: "Starter",
    price: "₦29,000",
    priceValue: 29000,
    tier: 0,
    tagline: "Single outlet essentials",
    outlets: 1,
    staff: 10,
    transactions: "5,000",
    reports: "Basic",
    support: "Email",
  },
  {
    name: "Business Pro",
    price: "₦79,000",
    priceValue: 79000,
    tier: 1,
    tagline: "Multi-outlet growth",
    outlets: 10,
    staff: 50,
    transactions: "50,000",
    reports: "Advanced",
    support: "Priority",
    current: true,
  },
  {
    name: "Enterprise",
    price: "₦199,000",
    priceValue: 199000,
    tier: 2,
    tagline: "Scale, security & API",
    outlets: "Unlimited",
    staff: "Unlimited",
    transactions: "Unlimited",
    reports: "Custom + BI",
    support: "Dedicated CSM",
  },
];
interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp: string;
  default: boolean;
}
const initialPaymentMethods: PaymentMethod[] = [
  { id: "pm_1", brand: "Visa", last4: "4242", exp: "08/27", default: true },
  { id: "pm_2", brand: "Mastercard", last4: "8801", exp: "12/26", default: false },
];

const upcomingInvoice = {
  number: "INV-2026-003",
  date: "March 15, 2026",
  amount: "₦118,000",
  items: [
    { label: "Business Pro — Monthly", amount: "₦79,000" },
    { label: "Loyalty Engine add-on", amount: "₦12,000" },
    { label: "Delivery & Dispatch add-on", amount: "₦18,000" },
    { label: "Kitchen Display add-on", amount: "₦9,000" },
  ],
};

const invoiceHistory = [
  { id: "INV-2026-002", date: "Feb 15, 2026", amount: "₦118,000", status: "Paid", method: "Visa •••• 4242" },
  { id: "INV-2026-001", date: "Jan 15, 2026", amount: "₦118,000", status: "Paid", method: "Visa •••• 4242" },
  { id: "INV-2025-012", date: "Dec 15, 2025", amount: "₦100,000", status: "Paid", method: "Visa •••• 4242" },
  { id: "INV-2025-011", date: "Nov 15, 2025", amount: "₦100,000", status: "Paid", method: "Visa •••• 4242" },
  { id: "INV-2025-010", date: "Oct 15, 2025", amount: "₦79,000", status: "Paid", method: "Visa •••• 4242" },
];



/** Numeric entitlement limits per plan (Infinity = unlimited). */
const planLimits: Record<string, Record<string, number>> = {
  Starter: { outlets: 1, staff: 10, cashiers: 5, registers: 3, transactions: 5000, storage: 20 },
  "Business Pro": { outlets: 10, staff: 50, cashiers: 25, registers: 15, transactions: 50000, storage: 100 },
  Enterprise: {
    outlets: Infinity, staff: Infinity, cashiers: Infinity,
    registers: Infinity, transactions: Infinity, storage: 1000,
  },
};

const auditLog = [
  { date: "Feb 15, 2026", type: "renewal", title: "Subscription renewed", desc: "Business Pro — ₦118,000 charged to Visa •••• 4242" },
  { date: "Feb 02, 2026", type: "addon", title: "Add-on activated", desc: "Kitchen Display add-on added (₦9,000/mo)" },
  { date: "Jan 18, 2026", type: "upgrade", title: "Plan upgraded", desc: "Starter → Business Pro" },
  { date: "Dec 22, 2025", type: "failed", title: "Payment failed", desc: "Visa •••• 1212 declined — retried successfully" },
  { date: "Dec 15, 2025", type: "renewal", title: "Subscription renewed", desc: "Starter — ₦29,000 charged" },
  { date: "Nov 30, 2025", type: "downgrade", title: "Plan downgraded", desc: "Business Pro → Starter (cost optimisation)" },
  { date: "Oct 15, 2025", type: "renewal", title: "Subscription renewed", desc: "Business Pro — ₦79,000 charged" },
];

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function pct(used: number, limit: number) {
  return Math.min(100, Math.round((used / limit) * 100));
}

function usageTone(p: number): { bar: string; tone: "ok" | "warn" | "crit" } {
  if (p >= 95) return { bar: "bg-destructive", tone: "crit" };
  if (p >= 80) return { bar: "bg-warning", tone: "warn" };
  return { bar: "bg-success", tone: "ok" };
}

const healthMap: Record<
  typeof subscription.status,
  { label: string; icon: LucideIcon; cls: string; dot: string; msg: string }
> = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    cls: "bg-success/10 text-success border-success/20",
    dot: "bg-success",
    msg: "All systems operational. Next renewal in 18 days.",
  },
  trial: {
    label: "Trial",
    icon: Sparkles,
    cls: "bg-info/10 text-info border-info/20",
    dot: "bg-info",
    msg: "Trial ends in 7 days. Add a payment method to continue.",
  },
  grace: {
    label: "Grace Period",
    icon: Clock,
    cls: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
    msg: "Payment failed. Resolve within 5 days to avoid suspension.",
  },
  past_due: {
    label: "Past Due",
    icon: AlertTriangle,
    cls: "bg-warning/10 text-warning border-warning/20",
    dot: "bg-warning",
    msg: "Invoice overdue. Update payment method now.",
  },
  suspended: {
    label: "Suspended",
    icon: Ban,
    cls: "bg-destructive/10 text-destructive border-destructive/20",
    dot: "bg-destructive",
    msg: "Service suspended. Reactivate to restore access.",
  },
};

const auditIconMap: Record<string, { icon: LucideIcon; cls: string }> = {
  renewal: { icon: RefreshCw, cls: "text-success bg-success/10" },
  upgrade: { icon: ArrowUpRight, cls: "text-info bg-info/10" },
  downgrade: { icon: ArrowDownRight, cls: "text-muted-foreground bg-muted" },
  failed: { icon: XCircle, cls: "text-destructive bg-destructive/10" },
  addon: { icon: Plus, cls: "text-accent bg-accent/10" },
  suspension: { icon: Ban, cls: "text-destructive bg-destructive/10" },
};

/* -------------------------------------------------------------------------- */
/*               Plan-change workflow: eligibility + preview                  */
/* -------------------------------------------------------------------------- */

const fmtNaira = (n: number) =>
  "₦" + Math.round(n).toLocaleString("en-NG");
const fmtLimit = (n: number) => (n === Infinity ? "Unlimited" : n.toLocaleString());

interface PlanChangePreview {
  kind: "upgrade" | "downgrade" | "same";
  current: typeof comparisonPlans[number];
  target: typeof comparisonPlans[number];
  /** Blocking issues that must be resolved before the change is allowed. */
  blockers: { resource: string; used: number; newLimit: number }[];
  /** Non-blocking warnings (e.g. features the user will lose). */
  warnings: string[];
  /** Entitlement diffs displayed in the dialog. */
  limitDiff: { label: string; from: string; to: string; tone: "up" | "down" | "same" }[];
  featureDiff: { gained: string[]; lost: string[] };
  /** Proration math + next invoice preview line items. */
  proration: number; // credit (negative on downgrade, positive on upgrade)
  invoiceItems: { label: string; amount: number }[];
  invoiceTotal: number;
  /** Days remaining in the current billing cycle. */
  daysLeft: number;
  cycleDays: number;
}

function buildPlanChangePreview(targetName: string): PlanChangePreview | null {
  const current = comparisonPlans.find((p) => p.current);
  const target = comparisonPlans.find((p) => p.name === targetName);
  if (!current || !target) return null;

  const kind: PlanChangePreview["kind"] =
    target.tier === current.tier ? "same" : target.tier > current.tier ? "upgrade" : "downgrade";

  // Eligibility: downgrades blocked when current usage exceeds the target's limits.
  const targetLimits = planLimits[target.name] ?? {};
  const blockers = usage
    .map((u) => ({ resource: u.label, used: u.used, newLimit: targetLimits[u.key] ?? Infinity }))
    .filter((b) => b.used > b.newLimit);

  // Feature diff
  const cur = new Set(planFeatures[current.name] ?? []);
  const tgt = new Set(planFeatures[target.name] ?? []);
  const gained = [...tgt].filter((f) => !cur.has(f));
  const lost = [...cur].filter((f) => !tgt.has(f));

  // Limit diff
  const limitKeys: { key: string; label: string }[] = [
    { key: "outlets", label: "Outlets" },
    { key: "staff", label: "Staff seats" },
    { key: "cashiers", label: "Cashiers" },
    { key: "registers", label: "Registers" },
    { key: "transactions", label: "Transactions / mo" },
    { key: "storage", label: "Storage (GB)" },
  ];
  const limitDiff = limitKeys.map(({ key, label }) => {
    const from = planLimits[current.name]?.[key] ?? 0;
    const to = planLimits[target.name]?.[key] ?? 0;
    return {
      label,
      from: fmtLimit(from),
      to: fmtLimit(to),
      tone: (to > from ? "up" : to < from ? "down" : "same") as "up" | "down" | "same",
    };
  });

  // Proration: credit unused days of current plan, charge full target for next cycle.
  const cycleDays = 30;
  const daysLeft = subscription.daysLeft;
  const unusedRatio = daysLeft / cycleDays;
  const credit = Math.round(current.priceValue * unusedRatio);
  const proratedTarget = Math.round(target.priceValue * unusedRatio);

  const invoiceItems: { label: string; amount: number }[] = [];
  if (kind === "upgrade") {
    invoiceItems.push({
      label: `${target.name} — prorated (${daysLeft} of ${cycleDays} days)`,
      amount: proratedTarget,
    });
    invoiceItems.push({
      label: `Credit for unused ${current.name}`,
      amount: -credit,
    });
  } else if (kind === "downgrade") {
    invoiceItems.push({
      label: `${target.name} — applies at next renewal (${subscription.renewalDate})`,
      amount: 0,
    });
    invoiceItems.push({
      label: `Account credit (unused ${current.name})`,
      amount: -credit,
    });
  }
  const proration = invoiceItems.reduce((s, i) => s + i.amount, 0);
  const invoiceTotal = Math.max(0, proration);

  const warnings: string[] = [];
  if (lost.length) warnings.push(`You'll lose access to ${lost.length} feature${lost.length > 1 ? "s" : ""} on ${target.name}.`);
  if (kind === "downgrade" && blockers.length === 0) {
    warnings.push("Downgrade takes effect at the end of the current billing cycle.");
  }

  return {
    kind, current, target, blockers, warnings,
    limitDiff, featureDiff: { gained, lost },
    proration, invoiceItems, invoiceTotal, daysLeft, cycleDays,
  };
}

interface PlanChangeDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  targetPlan: string | null;
  onConfirm: (preview: PlanChangePreview) => void;
}

function PlanChangeDialog({ open, onOpenChange, targetPlan, onConfirm }: PlanChangeDialogProps) {
  const preview = useMemo(
    () => (targetPlan ? buildPlanChangePreview(targetPlan) : null),
    [targetPlan],
  );

  if (!preview) return null;
  const { kind, current, target, blockers, warnings, limitDiff, featureDiff, invoiceItems, invoiceTotal, daysLeft } = preview;
  const isBlocked = blockers.length > 0;
  const KindIcon = kind === "upgrade" ? ArrowUpRight : kind === "downgrade" ? ArrowDownRight : RefreshCw;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <KindIcon className={cn(
              "h-5 w-5",
              kind === "upgrade" && "text-info",
              kind === "downgrade" && "text-warning",
            )} />
            {kind === "upgrade" ? "Upgrade to" : kind === "downgrade" ? "Downgrade to" : "Switch to"} {target.name}
          </DialogTitle>
          <DialogDescription>
            {current.name} ({fmtNaira(current.priceValue)}/mo) → {target.name} ({fmtNaira(target.priceValue)}/mo)
          </DialogDescription>
        </DialogHeader>

        {/* Eligibility blockers */}
        {isBlocked && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-destructive font-medium text-sm">
              <AlertTriangle className="h-4 w-4" />
              Not eligible — usage exceeds {target.name} limits
            </div>
            <ul className="text-xs space-y-1 ml-6 list-disc text-foreground/80">
              {blockers.map((b) => (
                <li key={b.resource}>
                  <span className="font-medium">{b.resource}:</span> {b.used.toLocaleString()} in use, {target.name} allows {fmtLimit(b.newLimit)}.
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-muted-foreground ml-6">
              Reduce usage below the new plan's limits, then retry.
            </p>
          </div>
        )}

        {/* Non-blocking warnings */}
        {!isBlocked && warnings.length > 0 && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-1">
            {warnings.map((w) => (
              <div key={w} className="flex items-start gap-2 text-xs text-foreground/80">
                <AlertCircle className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}

        {/* Entitlements diff */}
        <div>
          <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">New entitlements</h4>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-9">Resource</TableHead>
                  <TableHead className="h-9">{current.name}</TableHead>
                  <TableHead className="h-9">{target.name}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {limitDiff.map((d) => (
                  <TableRow key={d.label}>
                    <TableCell className="text-xs font-medium py-2">{d.label}</TableCell>
                    <TableCell className="text-xs py-2 text-muted-foreground">{d.from}</TableCell>
                    <TableCell className={cn(
                      "text-xs py-2 font-medium flex items-center gap-1",
                      d.tone === "up" && "text-success",
                      d.tone === "down" && "text-destructive",
                    )}>
                      {d.tone === "up" && <ArrowUpRight className="h-3 w-3" />}
                      {d.tone === "down" && <ArrowDownRight className="h-3 w-3" />}
                      {d.to}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Feature gains / losses */}
        {(featureDiff.gained.length > 0 || featureDiff.lost.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-3">
            {featureDiff.gained.length > 0 && (
              <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                <p className="text-xs font-semibold text-success mb-1.5">You'll gain</p>
                <ul className="space-y-1">
                  {featureDiff.gained.map((f) => (
                    <li key={f} className="text-xs flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-success" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {featureDiff.lost.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-xs font-semibold text-destructive mb-1.5">You'll lose</p>
                <ul className="space-y-1">
                  {featureDiff.lost.map((f) => (
                    <li key={f} className="text-xs flex items-center gap-1.5">
                      <X className="h-3 w-3 text-destructive" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Next invoice preview */}
        {invoiceItems.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              {kind === "upgrade" ? "Today's prorated charge" : "Next invoice preview"}
            </h4>
            <div className="rounded-lg border border-border p-3 space-y-1.5">
              {invoiceItems.map((i) => (
                <div key={i.label} className="flex justify-between text-xs py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{i.label}</span>
                  <span className={cn("font-medium tabular-nums", i.amount < 0 && "text-success")}>
                    {i.amount < 0 ? `− ${fmtNaira(Math.abs(i.amount))}` : fmtNaira(i.amount)}
                  </span>
                </div>
              ))}
              <Separator className="my-1" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium">
                  {kind === "upgrade" ? "Due today" : "Due at next renewal"}
                </span>
                <span className="text-lg font-heading font-bold">{fmtNaira(invoiceTotal)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Based on {daysLeft} days remaining in the current billing cycle.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={isBlocked || kind === "same"}
            onClick={() => onConfirm(preview)}
            variant={kind === "downgrade" ? "outline" : "default"}
          >
            {isBlocked ? "Not eligible" : kind === "upgrade" ? "Confirm upgrade & pay" : "Schedule downgrade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export default function SubscriptionManagement() {
  const [autoRenew, setAutoRenew] = useState(subscription.autoRenew);
  const [activeAddons, setActiveAddons] = useState(
    Object.fromEntries(addons.map((a) => [a.key, a.active])),
  );
  const [planDialogTarget, setPlanDialogTarget] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [pmForm, setPmForm] = useState({ brand: "Visa", number: "", exp: "", cvc: "", name: "" });
  const [removeTarget, setRemoveTarget] = useState<PaymentMethod | null>(null);
  const [qrMenuOpen, setQrMenuOpen] = useState(false);
  const [qrOutletId, setQrOutletId] = useState<string>(posOutlets[0]?.id ?? "outlet-1");

  const detectBrand = (num: string): string => {
    const n = num.replace(/\s/g, "");
    if (/^4/.test(n)) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(n)) return "Mastercard";
    if (/^3[47]/.test(n)) return "Amex";
    if (/^6/.test(n)) return "Verve";
    return "Card";
  };

  const submitAddPayment = () => {
    const num = pmForm.number.replace(/\s/g, "");
    if (num.length < 12) { toast.error("Enter a valid card number"); return; }
    if (!/^\d{2}\/\d{2}$/.test(pmForm.exp)) { toast.error("Expiry must be MM/YY"); return; }
    if (pmForm.cvc.length < 3) { toast.error("Enter a valid CVC"); return; }
    const newPm: PaymentMethod = {
      id: `pm_${Date.now()}`,
      brand: detectBrand(num),
      last4: num.slice(-4),
      exp: pmForm.exp,
      default: paymentMethods.length === 0,
    };
    setPaymentMethods((prev) => [...prev, newPm]);
    toast.success(`${newPm.brand} •••• ${newPm.last4} added`);
    setPmForm({ brand: "Visa", number: "", exp: "", cvc: "", name: "" });
    setAddPaymentOpen(false);
  };

  const setDefaultPm = (id: string) => {
    setPaymentMethods((prev) => prev.map((p) => ({ ...p, default: p.id === id })));
    toast.success("Default payment method updated");
  };

  const confirmRemovePm = () => {
    if (!removeTarget) return;
    setPaymentMethods((prev) => {
      const next = prev.filter((p) => p.id !== removeTarget.id);
      // If we removed the default, promote the first remaining card.
      if (removeTarget.default && next.length > 0) next[0].default = true;
      return next;
    });
    toast.success(`${removeTarget.brand} •••• ${removeTarget.last4} removed`);
    setRemoveTarget(null);
  };

  const qrTargetUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/m/${qrOutletId}`;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(qrTargetUrl)}`;
  const health = healthMap[subscription.status];
  const HealthIcon = health.icon;

  const warnings = usage.filter((u) => pct(u.used, u.limit) >= 80);

  const openPlanChange = (planName: string) => setPlanDialogTarget(planName);
  const handlePlanChangeConfirm = (preview: PlanChangePreview) => {
    setPlanDialogTarget(null);
    if (preview.kind === "upgrade") {
      toast.success(`Upgraded to ${preview.target.name}`, {
        description: `${fmtNaira(preview.invoiceTotal)} charged. Entitlements updated immediately.`,
      });
    } else if (preview.kind === "downgrade") {
      toast.success(`Downgrade scheduled`, {
        description: `${preview.target.name} takes effect on ${subscription.renewalDate}.`,
      });
    }
  };

  // Default target for the "Upgrade" header button — first plan above current.
  const nextUpgrade = comparisonPlans.find(
    (p) => !p.current && p.tier > (comparisonPlans.find((c) => c.current)?.tier ?? 0),
  );


  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Subscription</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your plan, usage, add-ons and billing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4" />
            Billing Portal
          </Button>
          <Button size="sm" disabled={!nextUpgrade} onClick={() => nextUpgrade && openPlanChange(nextUpgrade.name)}>
            <TrendingUp className="h-4 w-4" />
            Upgrade
          </Button>
        </div>
      </div>

      {/* Health banner */}
      {warnings.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
          <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <div className="text-sm flex-1">
            <p className="font-medium text-foreground">
              {warnings.length} resource{warnings.length > 1 ? "s are" : " is"} above 80% utilisation
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {warnings.map((w) => w.label).join(", ")} — consider upgrading to avoid overage.
            </p>
          </div>
          <Button size="sm" variant="outline" disabled={!nextUpgrade} onClick={() => nextUpgrade && openPlanChange(nextUpgrade.name)}>Review</Button>
        </div>
      )}

      {/* Top: Current Plan + Health */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Current Plan */}
        <Card className="lg:col-span-2 p-5 border-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/[0.04] pointer-events-none" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-lg leading-none">{subscription.plan}</h3>
                      <Badge className={cn("text-[10px] uppercase tracking-wide border", health.cls)}>
                        {health.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Plan ID · sub_8K2J9F · since Oct 2025
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-heading font-bold tracking-tight">{subscription.monthlyCost}</p>
                <p className="text-xs text-muted-foreground">per month · {subscription.billingCycle.toLowerCase()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-border">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Renewal</p>
                <p className="text-sm font-semibold mt-1 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {subscription.renewalDate}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Cycle</p>
                <p className="text-sm font-semibold mt-1">{subscription.billingCycle}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Days Left</p>
                <p className="text-sm font-semibold mt-1">{subscription.daysLeft} days</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Auto-Renew</p>
                <div className="flex items-center gap-2 mt-1">
                  <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
                  <span className="text-sm font-semibold">{autoRenew ? "On" : "Off"}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              <Button size="sm" variant="outline" onClick={() => nextUpgrade && openPlanChange(nextUpgrade.name)}>Change Plan</Button>
              <Button size="sm" variant="ghost">Update Payment</Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">Cancel</Button>
            </div>
          </div>
        </Card>

        {/* Health Widget */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Subscription Health
            </h3>
            <span className={cn("h-2 w-2 rounded-full", health.dot)} />
          </div>

          <div className={cn("flex items-center gap-3 p-3 rounded-lg border", health.cls)}>
            <HealthIcon className="h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{health.label}</p>
              <p className="text-xs opacity-80">{health.msg}</p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            {(Object.keys(healthMap) as Array<keyof typeof healthMap>).map((k) => {
              const h = healthMap[k];
              const Icon = h.icon;
              const isCurrent = k === subscription.status;
              return (
                <div
                  key={k}
                  className={cn(
                    "flex items-center justify-between text-xs px-2 py-1.5 rounded-md",
                    isCurrent ? "bg-muted font-medium" : "text-muted-foreground",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    {h.label}
                  </span>
                  {isCurrent && <Badge variant="outline" className="text-[10px] h-4 px-1.5">Current</Badge>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50">
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* ============================ USAGE ============================ */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {usage.map((u) => {
              const p = pct(u.used, u.limit);
              const tone = usageTone(p);
              const Icon = u.icon;
              return (
                <Card key={u.key} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{u.label}</p>
                        <p className="text-sm font-semibold">
                          {u.used.toLocaleString()}
                          <span className="text-muted-foreground font-normal">
                            {" "}/ {u.limit.toLocaleString()}{u.unit}
                          </span>
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] h-5 px-1.5",
                        tone.tone === "ok" && "border-success/30 text-success",
                        tone.tone === "warn" && "border-warning/30 text-warning",
                        tone.tone === "crit" && "border-destructive/30 text-destructive",
                      )}
                    >
                      {p}%
                    </Badge>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full transition-all", tone.bar)}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                  {tone.tone !== "ok" && (
                    <p className={cn(
                      "text-[11px] mt-2 flex items-center gap-1",
                      tone.tone === "warn" ? "text-warning" : "text-destructive",
                    )}>
                      <AlertTriangle className="h-3 w-3" />
                      {tone.tone === "crit" ? "Limit nearly reached" : "Approaching limit"}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* =========================== FEATURES =========================== */}
        <TabsContent value="features" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Enabled Features
                </h3>
                <Badge variant="outline" className="text-[10px]">{enabledFeatures.length} active</Badge>
              </div>
              <div className="space-y-2">
                {enabledFeatures.map((f) => (
                  <div key={f.name} className="flex items-start gap-3 p-2.5 rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-success/10 shrink-0">
                      <Check className="h-3.5 w-3.5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        {f.name}
                        <FeatureInfo title={f.name} description={f.desc} />
                      </p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
                  <X className="h-4 w-4 text-muted-foreground" />
                  Not Available on this Plan
                </h3>
                <Badge variant="outline" className="text-[10px]">{disabledFeatures.length} locked</Badge>
              </div>
              <div className="space-y-2">
                {disabledFeatures.map((f) => (
                  <div key={f.name} className="flex items-start gap-3 p-2.5 rounded-md border border-dashed border-border">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted shrink-0">
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                        {f.name}
                        <FeatureInfo title={f.name} description={f.desc} />
                      </p>
                      <p className="text-xs text-muted-foreground/80">{f.desc}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs">
                      Unlock
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ============================ ADDONS ============================ */}
        <TabsContent value="addons" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {addons.map((a) => {
              const Icon = a.icon;
              const currentTier = comparisonPlans.find((c) => c.current)?.tier ?? 0;
              const isIncluded = currentTier >= a.includedFromTier;
              const isComingSoon = !!a.comingSoon;
              const isActive = !isComingSoon && (isIncluded || activeAddons[a.key]);
              return (
                <Card
                  key={a.key}
                  className={cn(
                    "p-4 transition-all",
                    isActive && "border-primary/30 bg-primary/[0.02]",
                    isComingSoon && "opacity-70",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg",
                        isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      )}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{a.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {isComingSoon ? "Not yet available" : isIncluded ? `Included in ${planByTier[a.includedFromTier]}` : a.price}
                        </p>
                      </div>
                    </div>
                    {isComingSoon ? (
                      <Badge className="text-[10px] h-5 bg-warning/10 text-warning border-warning/20 border" variant="outline">
                        Coming Soon
                      </Badge>
                    ) : isIncluded ? (
                      <Badge className="text-[10px] h-5 bg-info/10 text-info border-info/20 border" variant="outline">
                        Included
                      </Badge>
                    ) : isActive ? (
                      <Badge className="text-[10px] h-5 bg-success/10 text-success border-success/20 border" variant="outline">
                        Active
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 min-h-[2rem]">{a.desc}</p>
                  {a.key === "qrmenu" && isActive ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-3"
                      onClick={() => setQrMenuOpen(true)}
                    >
                      <QrCode className="h-3.5 w-3.5" /> View QR Codes
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant={isActive ? "outline" : "default"}
                      className="w-full mt-3"
                      disabled={isIncluded || isComingSoon}
                      onClick={() =>
                        setActiveAddons((s) => ({ ...s, [a.key]: !s[a.key] }))
                      }
                    >
                      {isComingSoon ? "Coming Soon" : isIncluded ? "Bundled" : isActive ? "Remove" : (<><Plus className="h-3.5 w-3.5" /> Add</>)}
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>

        </TabsContent>

        {/* ============================ BILLING ============================ */}
        <TabsContent value="billing" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Payment Methods */}
            <Card className="p-5 lg:col-span-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-sm">Payment Methods</h3>
                <Button size="sm" variant="ghost" className="h-7 text-xs">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      pm.default ? "border-primary/30 bg-primary/[0.02]" : "border-border",
                    )}
                  >
                    <div className="flex h-8 w-12 items-center justify-center rounded bg-muted">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{pm.brand} •••• {pm.last4}</p>
                      <p className="text-[11px] text-muted-foreground">Exp {pm.exp}</p>
                    </div>
                    {pm.default && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">Default</Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Upcoming Invoice */}
            <Card className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-semibold text-sm">Upcoming Invoice</h3>
                <Badge variant="outline" className="text-[10px]">
                  Due {upcomingInvoice.date}
                </Badge>
              </div>
              <div className="space-y-2">
                {upcomingInvoice.items.map((i) => (
                  <div key={i.label} className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground">{i.label}</span>
                    <span className="font-medium">{i.amount}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-medium">Total</span>
                <span className="text-xl font-heading font-bold">{upcomingInvoice.amount}</span>
              </div>
            </Card>
          </div>

          {/* Invoice History */}
          <Card className="p-0 overflow-hidden">
            <div className="p-5 pb-3 flex items-center justify-between">
              <h3 className="font-heading font-semibold text-sm">Invoice History</h3>
              <Button size="sm" variant="ghost" className="h-7 text-xs">
                <Download className="h-3.5 w-3.5" /> Export all
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoiceHistory.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                    <TableCell className="text-sm">{inv.date}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.method}</TableCell>
                    <TableCell className="text-sm font-medium">{inv.amount}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] border-success/30 text-success">
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ============================ PLANS ============================ */}
        <TabsContent value="plans" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {comparisonPlans.map((p) => {
              const current = p.current;
              const currentTier = comparisonPlans.find((c) => c.current)?.tier ?? 0;
              const isUpgrade = !current && p.tier > currentTier;
              return (
                <Card
                  key={p.name}
                  className={cn(
                    "p-5 relative",
                    current && "border-primary shadow-md ring-1 ring-primary/20",
                  )}
                >
                  {current && (
                    <Badge className="absolute -top-2.5 left-4 text-[10px]">Current Plan</Badge>
                  )}
                  <h4 className="font-heading font-bold">{p.name}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{p.tagline}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <p className="text-2xl font-heading font-bold">{p.price}</p>
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                  <Button
                    variant={current ? "outline" : isUpgrade ? "default" : "outline"}
                    size="sm"
                    className="w-full mt-4"
                    disabled={current}
                    onClick={() => !current && openPlanChange(p.name)}
                  >
                    {current ? "Current" : isUpgrade ? (<><ArrowUpRight className="h-3.5 w-3.5" /> Upgrade</>) : (<><ArrowDownRight className="h-3.5 w-3.5" /> Downgrade</>)}
                  </Button>
                  <ul className="mt-4 space-y-1.5 text-xs">
                    {featureCatalog
                      .filter((f) => f.tier === p.tier)
                      .slice(0, 6)
                      .map((f) => (
                        <li key={f.name} className="flex items-start gap-1.5">
                          <Check className="h-3 w-3 text-success mt-0.5 shrink-0" />
                          <span className="text-foreground/80 flex-1">{f.name}</span>
                          <FeatureInfo title={f.name} description={f.desc} />
                        </li>
                      ))}
                  </ul>
                </Card>
              );
            })}
          </div>

          {/* Comparison table — limits + capabilities grouped by category */}
          <Card className="p-0 overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="font-heading font-semibold text-sm">Side-by-Side Comparison</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Capabilities are cumulative — every plan includes everything from the plan below.
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  {comparisonPlans.map((p) => (
                    <TableHead key={p.name} className={cn(p.current && "text-primary")}>
                      {p.name}
                      {p.current && <span className="ml-1 text-[10px]">(Current)</span>}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Limits section */}
                <TableRow className="bg-muted/40">
                  <TableCell colSpan={1 + comparisonPlans.length} className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold py-1.5">
                    Limits
                  </TableCell>
                </TableRow>
                {[
                  { label: "Outlets", key: "outlets" },
                  { label: "Staff seats", key: "staff" },
                  { label: "Transactions / mo", key: "transactions" },
                  { label: "Reports", key: "reports" },
                  { label: "Support", key: "support" },
                ].map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="text-sm font-medium">{row.label}</TableCell>
                    {comparisonPlans.map((p) => (
                      <TableCell key={p.name} className={cn("text-sm", p.current && "bg-primary/[0.03]")}>
                        {String((p as any)[row.key])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                {/* Capability sections — grouped by feature category */}
                {Array.from(new Set(featureCatalog.map((f) => f.category))).map((category) => (
                  <Fragment key={category}>
                    <TableRow className="bg-muted/40">
                      <TableCell colSpan={1 + comparisonPlans.length} className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold py-1.5">
                        {category}
                      </TableCell>
                    </TableRow>
                    {featureCatalog
                      .filter((f) => f.category === category)
                      .map((f) => (
                        <TableRow key={f.name}>
                          <TableCell className="text-sm font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              {f.name}
                              <FeatureInfo title={f.name} description={f.desc} />
                              {f.addon && (
                                <Badge variant="outline" className="ml-1 text-[9px] h-4 px-1">Add-on</Badge>
                              )}
                            </span>
                          </TableCell>
                          {comparisonPlans.map((p) => (
                            <TableCell key={p.name} className={cn(p.current && "bg-primary/[0.03]")}>
                              {planFeatures[p.name].includes(f.name) ? (
                                <Check className="h-4 w-4 text-success" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground/40" />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>


        {/* =========================== ACTIVITY =========================== */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-sm">Audit Timeline</h3>
              <Button size="sm" variant="ghost" className="h-7 text-xs">
                <Download className="h-3.5 w-3.5" /> Export log
              </Button>
            </div>

            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
              <div className="space-y-4">
                {auditLog.map((e, i) => {
                  const meta = auditIconMap[e.type] ?? auditIconMap.renewal;
                  const Icon = meta.icon;
                  return (
                    <div key={i} className="flex gap-3 relative">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full shrink-0 relative z-10 border-2 border-background",
                        meta.cls,
                      )}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-medium">{e.title}</p>
                          <span className="text-[11px] text-muted-foreground shrink-0">{e.date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{e.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <PlanChangeDialog
        open={planDialogTarget !== null}
        onOpenChange={(o) => !o && setPlanDialogTarget(null)}
        targetPlan={planDialogTarget}
        onConfirm={handlePlanChangeConfirm}
      />
    </div>
  );
}
