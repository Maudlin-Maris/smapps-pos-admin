import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, CreditCard, Calendar, Zap, Shield, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const currentPlan = {
  name: "Business Pro",
  price: "₦79/mo",
  renewalDate: "March 15, 2026",
  daysLeft: 18,
  features: ["Unlimited outlets", "Advanced analytics", "Priority support", "API access", "Custom reports"],
  usage: { outlets: { used: 4, max: 999 }, transactions: { used: 12450, max: 999999 }, staff: { used: 20, max: 100 } },
};

const plans = [
  {
    name: "Starter",
    price: "₦29/mo",
    features: ["1 outlet", "Basic analytics", "Email support", "500 transactions/mo"],
    popular: false,
  },
  {
    name: "Business Pro",
    price: "₦79/mo",
    features: ["Unlimited outlets", "Advanced analytics", "Priority support", "API access", "Custom reports"],
    popular: true,
  },
  {
    name: "Enterprise",
    price: "₦199/mo",
    features: ["Everything in Pro", "Dedicated manager", "SLA guarantee", "White-label", "Custom integrations"],
    popular: false,
  },
];

const paymentHistory = [
  { date: "Feb 15, 2026", amount: "₦79.00", status: "Paid", method: "Visa •••• 4242" },
  { date: "Jan 15, 2026", amount: "₦79.00", status: "Paid", method: "Visa •••• 4242" },
  { date: "Dec 15, 2025", amount: "₦79.00", status: "Paid", method: "Visa •••• 4242" },
  { date: "Nov 15, 2025", amount: "₦79.00", status: "Paid", method: "Visa •••• 4242" },
];

export default function SubscriptionManagement() {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Subscription</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your plan and billing</p>
      </div>

      {/* Current Plan */}
      <Card className="p-5 border-primary/20 bg-primary/[0.02]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-heading font-bold text-lg">{currentPlan.name}</h3>
              <Badge className="text-xs">Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Renews on {currentPlan.renewalDate} · {currentPlan.daysLeft} days left
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-heading font-bold">{currentPlan.price}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Outlets</p>
            <p className="text-sm font-semibold">{currentPlan.usage.outlets.used} used</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Transactions</p>
            <p className="text-sm font-semibold">{currentPlan.usage.transactions.used.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Staff</p>
            <p className="text-sm font-semibold">{currentPlan.usage.staff.used} / {currentPlan.usage.staff.max}</p>
            <Progress value={(currentPlan.usage.staff.used / currentPlan.usage.staff.max) * 100} className="h-1.5 mt-1" />
          </div>
        </div>
      </Card>

      {/* Plans */}
      <div>
        <h3 className="font-heading font-semibold mb-4">Available Plans</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "p-5 relative",
                plan.popular && "border-primary shadow-md"
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-2.5 left-4 text-xs">Current Plan</Badge>
              )}
              <h4 className="font-heading font-bold">{plan.name}</h4>
              <p className="text-2xl font-heading font-bold mt-2">{plan.price}</p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.popular ? "default" : "outline"}
                size="sm"
                className="w-full mt-5"
                disabled={plan.popular}
              >
                {plan.popular ? "Current" : "Upgrade"}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <Card className="p-5">
        <h3 className="font-heading font-semibold mb-4">Payment History</h3>
        <div className="space-y-3">
          {paymentHistory.map((payment, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{payment.amount}</p>
                  <p className="text-xs text-muted-foreground">{payment.method}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="text-xs bg-success/10 text-success">
                  {payment.status}
                </Badge>
                <p className="text-xs text-muted-foreground mt-0.5">{payment.date}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
