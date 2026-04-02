import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatNaira } from "@/lib/currency";
import {
  loyaltyCustomers, loyaltyRewards, tierConfig, calculatePointsEarned,
  type LoyaltyCustomer, type LoyaltyReward, type LoyaltyRedemption,
} from "@/data/loyaltyData";
import {
  Search, Star, Gift, Award, User, Phone, ChevronRight,
  X, Sparkles, TrendingUp, CheckCircle2, UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  subtotal: number;
  onApplyRedemption: (redemption: LoyaltyRedemption) => void;
  onClearRedemption: () => void;
  currentRedemption: LoyaltyRedemption | null;
}

type PanelView = "search" | "profile" | "rewards" | "register";

export default function LoyaltyRedemptionPanel({ subtotal, onApplyRedemption, onClearRedemption, currentRedemption }: Props) {
  const [view, setView] = useState<PanelView>(currentRedemption ? "profile" : "search");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyCustomer | null>(
    currentRedemption ? loyaltyCustomers.find(c => c.id === currentRedemption.customerId) || null : null
  );

  // Registration form state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return loyaltyCustomers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const availableRewards = useMemo(() => {
    if (!selectedCustomer) return [];
    return loyaltyRewards
      .filter(r => r.isActive && r.pointsCost <= selectedCustomer.points)
      .sort((a, b) => a.pointsCost - b.pointsCost);
  }, [selectedCustomer]);

  const allRewards = useMemo(() => {
    return loyaltyRewards.filter(r => r.isActive).sort((a, b) => a.pointsCost - b.pointsCost);
  }, []);

  const pointsToEarn = selectedCustomer
    ? calculatePointsEarned(subtotal, selectedCustomer.loyaltyTier)
    : 0;

  const selectCustomer = (customer: LoyaltyCustomer) => {
    setSelectedCustomer(customer);
    setView("profile");
    setSearchQuery("");
  };

  const redeemReward = (reward: LoyaltyReward) => {
    if (!selectedCustomer) return;
    let discountValue = 0;
    if (reward.type === "discount_percentage") {
      discountValue = Math.round(subtotal * reward.value / 100);
    } else if (reward.type === "discount_fixed") {
      discountValue = Math.min(reward.value, subtotal);
    }

    onApplyRedemption({
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      rewardId: reward.id,
      rewardName: reward.name,
      pointsUsed: reward.pointsCost,
      discountValue,
      pointsEarned: pointsToEarn,
    });
    setView("profile");
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    onClearRedemption();
    setView("search");
    setSearchQuery("");
  };

  const handleRegister = () => {
    if (!regName.trim() || !regPhone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    const newCustomer: LoyaltyCustomer = {
      id: `c${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      loyaltyTier: "bronze",
      points: 0,
      totalSpent: 0,
      visitCount: 0,
      lastVisit: null,
      notes: "",
      tags: ["New"],
      createdAt: new Date(),
    };
    loyaltyCustomers.push(newCustomer);
    toast.success(`${newCustomer.name} enrolled as a Bronze member!`);
    setSelectedCustomer(newCustomer);
    setRegName("");
    setRegPhone("");
    setRegEmail("");
    setView("profile");
  };

  // ── Compact applied state ──
  if (currentRedemption && view === "profile") {
    const tc = selectedCustomer ? tierConfig[selectedCustomer.loyaltyTier] : null;
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{currentRedemption.customerName}</p>
              {tc && <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", tc.badgeClass)}>{tc.label}</Badge>}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearCustomer}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-primary">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-medium">{currentRedemption.rewardName} redeemed</span>
          </div>
          {currentRedemption.discountValue > 0 && (
            <span className="font-semibold text-[hsl(var(--success))]">-{formatNaira(currentRedemption.discountValue)}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{currentRedemption.pointsUsed} pts used</span>
          <span>•</span>
          <span className="text-primary">+{currentRedemption.pointsEarned} pts earned</span>
        </div>
        <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={() => setView("rewards")}>
          Change Reward
        </Button>
      </div>
    );
  }

  // ── Register new member view ──
  if (view === "register") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium">New Loyalty Member</p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setView("search")}>
            Cancel
          </Button>
        </div>
        <div className="space-y-2">
          <Input
            value={regName}
            onChange={e => setRegName(e.target.value)}
            placeholder="Full Name *"
            className="h-9 text-sm"
            autoFocus
          />
          <Input
            value={regPhone}
            onChange={e => setRegPhone(e.target.value)}
            placeholder="Phone Number *"
            className="h-9 text-sm"
          />
          <Input
            value={regEmail}
            onChange={e => setRegEmail(e.target.value)}
            placeholder="Email (Optional)"
            className="h-9 text-sm"
          />
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-2.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 mb-1">
            <Award className="w-3.5 h-3.5 text-orange-500" />
            <span className="font-medium text-foreground">Starts at Bronze tier</span>
          </div>
          <p>Earns {calculatePointsEarned(subtotal, "bronze")} points on this order</p>
        </div>
        <Button className="w-full h-9 text-sm gap-1.5" onClick={handleRegister}>
          <UserPlus className="w-4 h-4" />
          Enroll & Link to Order
        </Button>
      </div>
    );
  }

  // ── Search view ──
  if (view === "search") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium">Loyalty & Rewards</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="pl-8 h-9 text-sm"
            autoFocus
          />
        </div>

        {searchQuery.trim() && (
          <ScrollArea className="max-h-40">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-4 space-y-2">
                <p className="text-xs text-muted-foreground">No matching customers found</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    setRegName(searchQuery.trim());
                    setView("register");
                  }}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Register "{searchQuery.trim()}" as New Member
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredCustomers.map(c => {
                  const tc = tierConfig[c.loyaltyTier];
                  return (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all text-left"
                    >
                      <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${tc.color}20` }}>
                        <User className="w-4 h-4" style={{ color: tc.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium truncate">{c.name}</span>
                          <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 shrink-0", tc.badgeClass)}>{tc.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{c.phone}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-yellow-500" />
                            {c.points.toLocaleString()} pts
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        )}

        {!searchQuery.trim() && (
          <div className="text-center space-y-1.5 py-1">
            <p className="text-[11px] text-muted-foreground">
              Link a loyalty member to earn points & redeem rewards
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-primary"
              onClick={() => setView("register")}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register New Member
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Profile view ──
  if (view === "profile" && selectedCustomer) {
    const tc = tierConfig[selectedCustomer.loyaltyTier];
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium">Loyalty Member</p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearCustomer}>
            Remove
          </Button>
        </div>

        {/* Customer card */}
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full flex items-center justify-center" style={{ backgroundColor: `${tc.color}15` }}>
              <Award className="w-5 h-5" style={{ color: tc.color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{selectedCustomer.name}</span>
                <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", tc.badgeClass)}>{tc.label}</Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Phone className="w-3 h-3" />
                {selectedCustomer.phone}
              </div>
            </div>
          </div>

          {/* Points summary */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="text-center p-2 rounded-lg bg-background">
              <p className="text-lg font-bold text-foreground">{selectedCustomer.points.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">Available Points</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background">
              <p className="text-lg font-bold text-primary">+{pointsToEarn}</p>
              <p className="text-[10px] text-muted-foreground">Points to Earn</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background">
              <p className="text-lg font-bold text-foreground">{selectedCustomer.visitCount}</p>
              <p className="text-[10px] text-muted-foreground">Total Visits</p>
            </div>
          </div>

          {/* Tier multiplier */}
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>{tc.earnMultiplier}x points multiplier for {tc.label} members</span>
          </div>
        </div>

        {/* Redeem button */}
        <Button
          variant="outline"
          className="w-full h-9 text-sm gap-1.5"
          onClick={() => setView("rewards")}
        >
          <Gift className="w-4 h-4" />
          Redeem Rewards ({availableRewards.length} available)
        </Button>
      </div>
    );
  }

  // ── Rewards view ──
  if (view === "rewards" && selectedCustomer) {
    const tc = tierConfig[selectedCustomer.loyaltyTier];
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setView("profile")}>
              <X className="w-3.5 h-3.5" />
            </Button>
            <p className="text-sm font-medium">Redeem Reward</p>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3.5 h-3.5 text-yellow-500" />
            <span className="font-semibold">{selectedCustomer.points.toLocaleString()} pts</span>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-1.5">
            {allRewards.map(r => {
              const canRedeem = r.pointsCost <= selectedCustomer.points;
              const isSelected = currentRedemption?.rewardId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => canRedeem && redeemReward(r)}
                  disabled={!canRedeem}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : canRedeem
                        ? "border-border hover:border-primary/30 hover:bg-muted/30"
                        : "border-border opacity-40 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                    canRedeem ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Gift className={cn("w-4 h-4", canRedeem ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block">{r.name}</span>
                    <span className="text-[11px] text-muted-foreground block">{r.description}</span>
                    {r.type === "discount_percentage" && (
                      <span className="text-[11px] text-[hsl(var(--success))] font-medium">
                        Saves {formatNaira(Math.round(subtotal * r.value / 100))}
                      </span>
                    )}
                    {r.type === "discount_fixed" && (
                      <span className="text-[11px] text-[hsl(var(--success))] font-medium">
                        Saves {formatNaira(Math.min(r.value, subtotal))}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-0.5 text-xs font-semibold">
                      <Star className="w-3 h-3 text-yellow-500" />
                      {r.pointsCost}
                    </div>
                    {!canRedeem && (
                      <span className="text-[10px] text-muted-foreground">
                        Need {(r.pointsCost - selectedCustomer.points).toLocaleString()} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setView("profile")}>
          Back to Profile
        </Button>
      </div>
    );
  }

  return null;
}
