import { useState, useMemo } from "react";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "@/components/inventory/PaginationControls";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/currency";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Gift, Star, Award, TrendingUp, Settings2, History, Plus, Pencil, Trash2,
  Percent, DollarSign, Coffee, Users, ArrowUpRight, Search,
  ToggleLeft, Zap, Crown, Shield, MapPin, Building2, Globe, HelpCircle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  type LoyaltyTier, type LoyaltyReward, type ActivityEntry,
  tierConfig, loyaltyCustomers, loyaltyRewards, POINTS_PER_NAIRA,
  mockActivity, outletEarnOverrides, type OutletEarnOverride,
} from "@/data/loyaltyData";
import { outlets } from "@/data/outlets";
import { Checkbox } from "@/components/ui/checkbox";
import { defaultInventoryItems } from "@/data/inventoryItems";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Package } from "lucide-react";

type Tab = "overview" | "rewards" | "settings" | "activity";

const rewardTypeIcons: Record<string, React.ElementType> = {
  discount_percentage: Percent,
  discount_fixed: DollarSign,
  free_item: Coffee,
};

const rewardTypeLabels: Record<string, string> = {
  discount_percentage: "% Discount",
  discount_fixed: "Fixed Discount",
  free_item: "Free Item",
};

// ── Reward Form Dialog (with outlet selection) ──
function RewardFormDialog({
  open, onOpenChange, reward, onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  reward: LoyaltyReward | null;
  onSave: (r: LoyaltyReward) => void;
}) {
  const [name, setName] = useState(reward?.name ?? "");
  const [description, setDescription] = useState(reward?.description ?? "");
  const [pointsCost, setPointsCost] = useState(reward?.pointsCost?.toString() ?? "");
  const [type, setType] = useState<LoyaltyReward["type"]>(reward?.type ?? "discount_percentage");
  const [value, setValue] = useState(reward?.value?.toString() ?? "");
  const [isActive, setIsActive] = useState(reward?.isActive ?? true);
  const [selectedOutletIds, setSelectedOutletIds] = useState<string[]>(reward?.outletIds ?? []);
  const [availabilityMode, setAvailabilityMode] = useState<"all" | "specific">(
    (reward?.outletIds?.length ?? 0) > 0 ? "specific" : "all"
  );
  const [freeItemId, setFreeItemId] = useState<string | undefined>(reward?.freeItemId);
  const [freeItemQuantity, setFreeItemQuantity] = useState<string>(
    reward?.freeItemQuantity?.toString() ?? "1"
  );
  const [itemPickerOpen, setItemPickerOpen] = useState(false);

  // Filter inventory by outlet availability scope
  const availableInventory = useMemo(() => {
    if (availabilityMode === "specific" && selectedOutletIds.length > 0) {
      return defaultInventoryItems.filter(i => selectedOutletIds.includes(i.outletId));
    }
    return defaultInventoryItems;
  }, [availabilityMode, selectedOutletIds]);

  const selectedItem = freeItemId ? defaultInventoryItems.find(i => i.id === freeItemId) : null;

  const toggleOutlet = (id: string) => {
    setSelectedOutletIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error("Reward name is required"); return; }
    if (!pointsCost || Number(pointsCost) <= 0) { toast.error("Points cost must be greater than 0"); return; }
    if (availabilityMode === "specific" && selectedOutletIds.length === 0) { toast.error("Select at least one outlet"); return; }
    onSave({
      id: reward?.id ?? `r${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      pointsCost: Number(pointsCost),
      type,
      value: type === "free_item" ? 0 : Number(value) || 0,
      isActive,
      outletIds: availabilityMode === "all" ? [] : selectedOutletIds,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reward ? "Edit Reward" : "Create Reward"}</DialogTitle>
          <DialogDescription>
            {reward ? "Update the reward details below." : "Set up a new reward that customers can redeem with their loyalty points."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Reward Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Free Coffee" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What the customer gets..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Reward Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as LoyaltyReward["type"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="discount_percentage">% Discount</SelectItem>
                  <SelectItem value="discount_fixed">Fixed Amount Off</SelectItem>
                  <SelectItem value="free_item">Free Item</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Points Cost *</Label>
              <Input type="number" min="1" value={pointsCost} onChange={(e) => setPointsCost(e.target.value)} placeholder="100" />
            </div>
          </div>
          {type !== "free_item" && (
            <div>
              <Label>{type === "discount_percentage" ? "Discount %" : "Discount Amount (₦)"}</Label>
              <Input type="number" min="1" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "discount_percentage" ? "10" : "1000"} />
            </div>
          )}

          {/* Outlet availability */}
          <div>
            <Label className="mb-2 block">Outlet Availability</Label>
            <div className="flex gap-2 mb-2">
              <Button type="button" variant={availabilityMode === "all" ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => setAvailabilityMode("all")}>
                <Globe className="h-3.5 w-3.5" /> All Outlets
              </Button>
              <Button type="button" variant={availabilityMode === "specific" ? "default" : "outline"} size="sm" className="gap-1.5" onClick={() => setAvailabilityMode("specific")}>
                <MapPin className="h-3.5 w-3.5" /> Specific Outlets
              </Button>
            </div>
            {availabilityMode === "specific" && (
              <div className="rounded-lg border p-2 space-y-1 max-h-32 overflow-y-auto">
                {outlets.map(o => (
                  <label key={o.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm">
                    <Checkbox checked={selectedOutletIds.includes(o.id)} onCheckedChange={() => toggleOutlet(o.id)} />
                    {o.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label>Available to Cashiers</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{reward ? "Save Changes" : "Create Reward"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ──
export default function LoyaltyManagement() {
  const [tab, setTab] = useState<Tab>("overview");
  const [rewards, setRewards] = useState<LoyaltyReward[]>([...loyaltyRewards]);
  const [activity] = useState<ActivityEntry[]>(mockActivity);
  const [programEnabled, setProgramEnabled] = useState(true);
  const [earnRate, setEarnRate] = useState((POINTS_PER_NAIRA * 100).toString());
  const [earnOverrides, setEarnOverrides] = useState<OutletEarnOverride[]>([...outletEarnOverrides]);
  const [tierThresholds, setTierThresholds] = useState<Record<LoyaltyTier, number>>(() => {
    const t = {} as Record<LoyaltyTier, number>;
    (Object.keys(tierConfig) as LoyaltyTier[]).forEach(k => { t[k] = tierConfig[k].minPoints; });
    return t;
  });
  const [tierMultipliers, setTierMultipliers] = useState<Record<LoyaltyTier, number>>(() => {
    const m = {} as Record<LoyaltyTier, number>;
    (Object.keys(tierConfig) as LoyaltyTier[]).forEach(k => { m[k] = tierConfig[k].earnMultiplier; });
    return m;
  });

  // Outlet filter (global across tabs)
  const [outletFilter, setOutletFilter] = useState("all");

  // Reward form
  const [rewardFormOpen, setRewardFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LoyaltyReward | null>(null);

  // Activity filter
  const [activitySearch, setActivitySearch] = useState("");
  const [activityType, setActivityType] = useState("all");

  const customers = loyaltyCustomers;

  // ── Stats (filtered by outlet where applicable) ──
  const stats = useMemo(() => {
    const totalMembers = customers.length; // members are global
    const totalPoints = customers.reduce((s, c) => s + c.points, 0);
    const filteredAct = outletFilter === "all" ? activity : activity.filter(a => a.outletId === outletFilter);
    const totalRedemptions = filteredAct.filter((a) => a.type === "redeem").length;
    const pointsEarned = filteredAct.filter(a => a.type === "earn").reduce((s, a) => s + a.points, 0);
    const activeRewards = rewards.filter((r) => r.isActive && (r.outletIds.length === 0 || outletFilter === "all" || r.outletIds.includes(outletFilter))).length;
    return { totalMembers, totalPoints, totalRedemptions, activeRewards, pointsEarned };
  }, [customers, activity, rewards, outletFilter]);

  const tierBreakdown = useMemo(() => {
    return (Object.keys(tierConfig) as LoyaltyTier[]).map((tier) => ({
      tier,
      ...tierConfig[tier],
      count: customers.filter((c) => c.loyaltyTier === tier).length,
    }));
  }, [customers]);

  // ── Outlet performance comparison ──
  const outletPerformance = useMemo(() => {
    const outletIds = [...new Set(activity.map(a => a.outletId))];
    return outletIds.map(oid => {
      const acts = activity.filter(a => a.outletId === oid);
      const earned = acts.filter(a => a.type === "earn").reduce((s, a) => s + a.points, 0);
      const redeemed = acts.filter(a => a.type === "redeem").reduce((s, a) => s + Math.abs(a.points), 0);
      const registrations = acts.filter(a => a.type === "register").length;
      const outletName = acts[0]?.outletName || oid;
      return { outletId: oid, outletName, earned, redeemed, registrations, transactions: acts.length };
    }).sort((a, b) => b.earned - a.earned);
  }, [activity]);

  // ── Reward handlers ──
  const handleSaveReward = (r: LoyaltyReward) => {
    setRewards((prev) => {
      const idx = prev.findIndex((x) => x.id === r.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = r; return n; }
      return [...prev, r];
    });
    toast.success(editingReward ? "Reward updated" : "Reward created");
    setEditingReward(null);
  };

  const handleDeleteReward = () => {
    if (!deleteTarget) return;
    setRewards((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    toast.success(`"${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
  };

  const toggleRewardActive = (id: string) => {
    setRewards((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const updated = { ...r, isActive: !r.isActive };
      toast.success(`"${r.name}" ${updated.isActive ? "enabled" : "disabled"}`);
      return updated;
    }));
  };

  // ── Filtered activity ──
  const filteredActivity = useMemo(() => {
    let list = activity;
    if (outletFilter !== "all") list = list.filter(a => a.outletId === outletFilter);
    if (activityType !== "all") list = list.filter((a) => a.type === activityType);
    if (activitySearch) {
      const q = activitySearch.toLowerCase();
      list = list.filter((a) => a.customerName.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
    }
    return list;
  }, [activity, activityType, activitySearch, outletFilter]);

  const activityPagination = usePagination(filteredActivity, 10);

  // ── Filtered rewards by outlet ──
  const filteredRewards = useMemo(() => {
    if (outletFilter === "all") return rewards;
    return rewards.filter(r => r.outletIds.length === 0 || r.outletIds.includes(outletFilter));
  }, [rewards, outletFilter]);

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: TrendingUp },
    { key: "rewards", label: "Rewards", icon: Gift },
    { key: "activity", label: "Activity", icon: History },
    { key: "settings", label: "Settings", icon: Settings2 },
  ];

  const outletLabel = (id: string) => outlets.find(o => o.id === id)?.name || id;

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Loyalty & Rewards</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Global loyalty program — customers earn & redeem at any outlet
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Outlet filter */}
          <Select value={outletFilter} onValueChange={setOutletFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outlets</SelectItem>
              {outlets.map(o => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch checked={programEnabled} onCheckedChange={(v) => { setProgramEnabled(v); toast.success(v ? "Loyalty program enabled" : "Loyalty program paused"); }} />
            <span className="text-sm font-medium">{programEnabled ? "Active" : "Paused"}</span>
          </div>
          {tab === "rewards" && (
            <Button size="sm" className="gap-1.5" onClick={() => { setEditingReward(null); setRewardFormOpen(true); }}>
              <Plus className="h-4 w-4" /> New Reward
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg max-w-full overflow-x-auto scrollbar-none" style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
              tab === t.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {!programEnabled && (
        <Card className="p-4 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-3">
            <ToggleLeft className="h-5 w-5 text-warning shrink-0" />
            <div>
              <p className="text-sm font-medium">Loyalty program is paused</p>
              <p className="text-xs text-muted-foreground">Cashiers won't be able to look up members or redeem rewards at checkout.</p>
            </div>
          </div>
        </Card>
      )}

      {/* ═══ OVERVIEW TAB ═══ */}
      {tab === "overview" && (
        <div className="space-y-6">
          {outletFilter !== "all" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Showing data for <span className="font-medium text-foreground">{outletLabel(outletFilter)}</span>
            </div>
          )}

          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Members", value: stats.totalMembers.toLocaleString(), icon: Users, accent: "text-accent", sub: "Shared across all outlets" },
              { label: "Points in Circulation", value: stats.totalPoints.toLocaleString(), icon: Star, accent: "text-warning", sub: "Global balance" },
              { label: outletFilter === "all" ? "Total Redemptions" : "Outlet Redemptions", value: stats.totalRedemptions.toLocaleString(), icon: Gift, accent: "text-primary", sub: undefined },
              { label: "Active Rewards", value: `${stats.activeRewards} / ${rewards.length}`, icon: Zap, accent: "text-success", sub: outletFilter !== "all" ? "Available here" : undefined },
            ].map((kpi) => (
              <Card key={kpi.label} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <kpi.icon className={cn("h-5 w-5", kpi.accent)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-heading font-bold">{kpi.value}</p>
                    {kpi.sub && <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Tier breakdown */}
          <div>
            <h2 className="text-lg font-heading font-semibold mb-3">Tier Breakdown</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {tierBreakdown.map((t) => {
                const TierIcon = t.tier === "platinum" ? Crown : t.tier === "gold" ? Star : t.tier === "silver" ? Shield : Award;
                return (
                  <Card key={t.tier} className="p-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10" style={{ backgroundColor: t.color }} />
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={cn("text-xs font-semibold", t.badgeClass)}>
                        <TierIcon className="h-3 w-3 mr-1" />
                        {t.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <p className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-foreground">{t.count}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.minPoints.toLocaleString()}+ pts &bull; {t.earnMultiplier}x earn rate
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Outlet Performance Comparison */}
          {outletFilter === "all" && outletPerformance.length > 1 && (
            <div>
              <h2 className="text-lg font-heading font-semibold mb-3">Outlet Performance</h2>
              <Card className="overflow-x-auto" style={{ touchAction: "pan-x" }}>
                <Table className="min-w-[500px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Outlet</TableHead>
                      <TableHead className="text-right">Points Earned</TableHead>
                      <TableHead className="text-right">Points Redeemed</TableHead>
                      <TableHead className="text-right">New Members</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outletPerformance.map(op => (
                      <TableRow key={op.outletId} className="cursor-pointer hover:bg-muted/50" onClick={() => setOutletFilter(op.outletId)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">{op.outletName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-success font-semibold">+{op.earned.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-destructive font-semibold">-{op.redeemed.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{op.registrations}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{op.transactions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {/* Recent activity preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-heading font-semibold">Recent Activity</h2>
              <Button variant="ghost" size="sm" onClick={() => setTab("activity")} className="text-xs gap-1">
                View All <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
            <Card className="divide-y">
              {(outletFilter === "all" ? activity : activity.filter(a => a.outletId === outletFilter)).slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-xs",
                      a.type === "earn" ? "bg-success/10 text-success" :
                      a.type === "redeem" ? "bg-primary/10 text-primary" :
                      a.type === "adjust" ? "bg-warning/10 text-warning" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {a.type === "earn" ? <ArrowUpRight className="h-3.5 w-3.5" /> :
                       a.type === "redeem" ? <Gift className="h-3.5 w-3.5" /> :
                       a.type === "adjust" ? <Settings2 className="h-3.5 w-3.5" /> :
                       <Users className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <p className="font-medium">{a.customerName}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{a.description}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{a.outletName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {a.points !== 0 && (
                      <p className={cn("font-semibold text-sm", a.points > 0 ? "text-success" : "text-destructive")}>
                        {a.points > 0 ? "+" : ""}{a.points} pts
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">{format(a.date, "MMM d, h:mm a")}</p>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}

      {/* ═══ REWARDS TAB ═══ */}
      {tab === "rewards" && (
        <div className="space-y-4">
          {outletFilter !== "all" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Showing rewards available at <span className="font-medium text-foreground">{outletLabel(outletFilter)}</span>
              <Badge variant="outline" className="text-[10px]">+ global rewards</Badge>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRewards.map((r) => {
              const TypeIcon = rewardTypeIcons[r.type] || Gift;
              return (
                <Card key={r.id} className={cn("p-5 transition-all", !r.isActive && "opacity-60 border-dashed")}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center",
                        r.isActive ? "bg-primary/10" : "bg-muted"
                      )}>
                        <TypeIcon className={cn("h-5 w-5", r.isActive ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold">{r.name}</h3>
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-sm mb-2">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-warning" />
                      <span className="font-semibold">{r.pointsCost.toLocaleString()} pts</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {rewardTypeLabels[r.type]}
                      {r.type === "discount_percentage" && ` (${r.value}%)`}
                      {r.type === "discount_fixed" && ` (${formatNaira(r.value)})`}
                    </Badge>
                  </div>

                  {/* Outlet availability badge */}
                  <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground">
                    {r.outletIds.length === 0 ? (
                      <Badge variant="secondary" className="text-[10px] gap-1"><Globe className="h-2.5 w-2.5" /> All Outlets</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] gap-1"><MapPin className="h-2.5 w-2.5" /> {r.outletIds.length} outlet{r.outletIds.length > 1 ? "s" : ""}</Badge>
                    )}
                  </div>

                  <Separator className="mb-3" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={r.isActive} onCheckedChange={() => toggleRewardActive(r.id)} />
                      <span className="text-xs text-muted-foreground">{r.isActive ? "Visible at POS" : "Hidden"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingReward(r); setRewardFormOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(r)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Add card */}
            <Card
              className="p-5 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors min-h-[180px]"
              onClick={() => { setEditingReward(null); setRewardFormOpen(true); }}
            >
              <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Add New Reward</p>
            </Card>
          </div>
        </div>
      )}

      {/* ═══ ACTIVITY TAB ═══ */}
      {tab === "activity" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9 h-9" placeholder="Search by customer or action..." value={activitySearch} onChange={(e) => setActivitySearch(e.target.value)} />
            </div>
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="earn">Points Earned</SelectItem>
                <SelectItem value="redeem">Redemptions</SelectItem>
                <SelectItem value="adjust">Adjustments</SelectItem>
                <SelectItem value="register">Registrations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <PaginationControls
            page={activityPagination.page}
            totalPages={activityPagination.totalPages}
            perPage={activityPagination.perPage}
            totalItems={activityPagination.totalItems}
            pageSizeOptions={activityPagination.pageSizeOptions}
            onPageChange={activityPagination.setPage}
            onPerPageChange={activityPagination.setPerPage}
          />

          <Card className="overflow-x-auto" style={{ touchAction: "pan-x" }}>
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityPagination.paginatedItems.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">{format(a.date, "MMM d, yyyy h:mm a")}</TableCell>
                    <TableCell className="font-medium">{a.customerName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {a.outletName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("text-xs capitalize",
                        a.type === "earn" ? "bg-success/10 text-success" :
                        a.type === "redeem" ? "bg-primary/10 text-primary" :
                        a.type === "adjust" ? "bg-warning/10 text-warning" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {a.type === "earn" ? "Earned" : a.type === "redeem" ? "Redeemed" : a.type === "adjust" ? "Adjusted" : "Registered"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{a.description}</TableCell>
                    <TableCell className="text-right">
                      {a.points !== 0 && (
                        <span className={cn("font-semibold", a.points > 0 ? "text-success" : "text-destructive")}>
                          {a.points > 0 ? "+" : ""}{a.points}
                        </span>
                      )}
                      {a.points === 0 && <span className="text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredActivity.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No activity matches your filter
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* ═══ SETTINGS TAB ═══ */}
      {tab === "settings" && (
        <div className="space-y-6 max-w-2xl">
          {/* Earning rules */}
          <Card className="p-6">
            <h2 className="text-lg font-heading font-semibold mb-1">Points Earning Rules</h2>
            <p className="text-sm text-muted-foreground mb-5">Global defaults apply to all outlets unless overridden below.</p>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Global Base Earn Rate</Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Input type="number" min="1" value={earnRate} onChange={(e) => setEarnRate(e.target.value)} className="w-24" />
                    <span className="text-sm text-muted-foreground">point(s) per ₦100 spent</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Label className="block">Tier Multipliers</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-sm">
                        Tier multipliers boost the points customers earn per purchase. For example, a 2× multiplier means Gold members earn double the base points on every order.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(Object.keys(tierConfig) as LoyaltyTier[]).map((tier) => (
                    <div key={tier} className="rounded-lg border p-3 text-center space-y-1">
                      <Badge className={cn("text-xs mb-1", tierConfig[tier].badgeClass)}>{tierConfig[tier].label}</Badge>
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={tierMultipliers[tier]}
                          onChange={e => setTierMultipliers(prev => ({ ...prev, [tier]: parseFloat(e.target.value) || 1 }))}
                          className="w-16 text-center h-8 text-sm font-bold"
                        />
                        <span className="text-sm text-muted-foreground">×</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{tierThresholds[tier].toLocaleString()}+ pts</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Per-outlet earn rate overrides */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-heading font-semibold">Per-Outlet Earn Overrides</h2>
              <Badge variant="outline" className="text-[10px]">Optional</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Boost earn rates at specific outlets for promotions. These multiply the global base rate.
            </p>

            <div className="space-y-3">
              {earnOverrides.map((ov, idx) => (
                <div key={ov.outletId} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{outletLabel(ov.outletId)}</p>
                    {ov.label && <p className="text-xs text-muted-foreground">{ov.label}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={ov.multiplier}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 1;
                        setEarnOverrides(prev => prev.map((o, i) => i === idx ? { ...o, multiplier: val } : o));
                      }}
                      className="w-20 text-center"
                    />
                    <span className="text-sm text-muted-foreground">×</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEarnOverrides(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}

              {earnOverrides.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No outlet overrides — all outlets use the global rate</p>
              )}

              <Select onValueChange={id => {
                if (!earnOverrides.find(o => o.outletId === id)) {
                  setEarnOverrides(prev => [...prev, { outletId: id, multiplier: 1.5 }]);
                }
              }}>
                <SelectTrigger className="w-full h-9 border-dashed">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-muted-foreground">Add outlet override</span>
                </SelectTrigger>
                <SelectContent>
                  {outlets.filter(o => !earnOverrides.find(ov => ov.outletId === o.id)).map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Tier thresholds */}
          <Card className="p-6">
            <h2 className="text-lg font-heading font-semibold mb-1">Tier Thresholds</h2>
            <p className="text-sm text-muted-foreground mb-5">Points required to reach each loyalty tier. Applied globally across all outlets.</p>

            <div className="space-y-3">
              {(Object.keys(tierConfig) as LoyaltyTier[]).map((tier, idx, arr) => {
                const tierOrder: LoyaltyTier[] = ["bronze", "silver", "gold", "platinum"];
                const tierIdx = tierOrder.indexOf(tier);
                const prevTier = tierIdx > 0 ? tierOrder[tierIdx - 1] : null;
                const nextTier = tierIdx < tierOrder.length - 1 ? tierOrder[tierIdx + 1] : null;
                const hasError =
                  (prevTier && tierThresholds[tier] <= tierThresholds[prevTier]) ||
                  (nextTier && tierThresholds[tier] >= tierThresholds[nextTier]);
                const errorMsg = tier !== "bronze" && prevTier && tierThresholds[tier] <= tierThresholds[prevTier]
                  ? `Must be greater than ${tierConfig[prevTier].label} (${tierThresholds[prevTier]})`
                  : null;

                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between py-2">
                      <Badge className={cn("text-xs w-20 justify-center", tierConfig[tier].badgeClass)}>{tierConfig[tier].label}</Badge>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          value={tierThresholds[tier]}
                          onChange={e => setTierThresholds(prev => ({ ...prev, [tier]: parseInt(e.target.value) || 0 }))}
                          className={cn("w-28 text-right", errorMsg && "border-destructive focus-visible:ring-destructive")}
                          disabled={tier === "bronze"}
                        />
                        <span className="text-sm text-muted-foreground w-12">points</span>
                      </div>
                    </div>
                    {errorMsg && <p className="text-xs text-destructive text-right mr-16">{errorMsg}</p>}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Bronze always starts at 0. Thresholds must increase with each tier.
            </p>
          </Card>

          {/* Save applies to Points Earning Rules, Per-Outlet Overrides, and Tier Thresholds */}
          <div className="flex justify-end">
            <Button onClick={() => toast.success("Settings saved")}>Save Settings</Button>
          </div>

          {/* Program behaviour */}
          <Card className="p-6">
            <h2 className="text-lg font-heading font-semibold mb-1">Program Behaviour</h2>
            <p className="text-sm text-muted-foreground mb-5">These settings apply globally to all outlets.</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Cross-outlet redemption</p>
                  <p className="text-xs text-muted-foreground">Allow customers to redeem points earned at any outlet</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-prompt cashiers</p>
                  <p className="text-xs text-muted-foreground">Ask cashier to look up loyalty member at every checkout</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Allow POS registration</p>
                  <p className="text-xs text-muted-foreground">Let cashiers register new members during checkout</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Show points on receipt</p>
                  <p className="text-xs text-muted-foreground">Print loyalty balance and earned points on customer receipts</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Points expiry</p>
                  <p className="text-xs text-muted-foreground">Automatically expire unused points after a period</p>
                </div>
                <Switch />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Dialogs */}
      <RewardFormDialog
        open={rewardFormOpen}
        onOpenChange={setRewardFormOpen}
        reward={editingReward}
        onSave={handleSaveReward}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reward</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>? Cashiers will no longer be able to offer this reward at checkout.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReward} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
