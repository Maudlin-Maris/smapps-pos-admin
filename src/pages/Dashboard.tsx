import { KpiCard } from "@/components/KpiCard";
import { Card } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";

const salesData = [
  { name: "Mon", sales: 4200, orders: 42 },
  { name: "Tue", sales: 5800, orders: 58 },
  { name: "Wed", sales: 4900, orders: 49 },
  { name: "Thu", sales: 6300, orders: 63 },
  { name: "Fri", sales: 7100, orders: 71 },
  { name: "Sat", sales: 8400, orders: 84 },
  { name: "Sun", sales: 6800, orders: 68 },
];

const categoryData = [
  { name: "Food", value: 12400 },
  { name: "Drinks", value: 8200 },
  { name: "Services", value: 5600 },
  { name: "Retail", value: 9800 },
];

const recentTransactions = [
  { id: "TXN-001", customer: "Walk-in Customer", amount: "$42.50", items: 3, time: "2 min ago", status: "Completed" },
  { id: "TXN-002", customer: "Jane Smith", amount: "$128.00", items: 7, time: "15 min ago", status: "Completed" },
  { id: "TXN-003", customer: "Bob Wilson", amount: "$35.75", items: 2, time: "32 min ago", status: "Refunded" },
  { id: "TXN-004", customer: "Walk-in Customer", amount: "$67.20", items: 4, time: "1 hr ago", status: "Completed" },
  { id: "TXN-005", customer: "Alice Brown", amount: "$215.00", items: 12, time: "1.5 hr ago", status: "Completed" },
  { id: "TXN-006", customer: "Walk-in Customer", amount: "$19.99", items: 1, time: "2 hr ago", status: "Completed" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your business performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard
          title="Today's Sales"
          value="$8,420"
          change="+12.5% vs yesterday"
          changeType="positive"
          icon={DollarSign}
        />
        <KpiCard
          title="Orders"
          value="84"
          change="+8 from yesterday"
          changeType="positive"
          icon={ShoppingCart}
        />
        <KpiCard
          title="Customers"
          value="62"
          change="-3 from yesterday"
          changeType="negative"
          icon={Users}
        />
        <KpiCard
          title="Avg. Order"
          value="$100.24"
          change="+4.2% this week"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4 lg:p-5">
          <h3 className="font-heading font-semibold mb-4">Weekly Sales</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 90%)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="hsl(217, 91%, 60%)" fill="url(#salesGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 lg:p-5">
          <h3 className="font-heading font-semibold mb-4">By Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" width={60} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 90%)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="value" fill="hsl(160, 84%, 39%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="p-4 lg:p-5">
        <h3 className="font-heading font-semibold mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">ID</th>
                <th className="pb-3 font-medium text-muted-foreground hidden sm:table-cell">Customer</th>
                <th className="pb-3 font-medium text-muted-foreground">Amount</th>
                <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Items</th>
                <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Time</th>
                <th className="pb-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((txn) => (
                <tr key={txn.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 font-mono text-xs">{txn.id}</td>
                  <td className="py-3 hidden sm:table-cell">{txn.customer}</td>
                  <td className="py-3 font-semibold">{txn.amount}</td>
                  <td className="py-3 hidden md:table-cell">{txn.items}</td>
                  <td className="py-3 text-muted-foreground hidden lg:table-cell">{txn.time}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        txn.status === "Completed"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
