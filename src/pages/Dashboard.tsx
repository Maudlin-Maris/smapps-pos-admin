import { useState } from "react";
import { KpiCard } from "@/components/KpiCard";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const outlets = [
  { id: "all", name: "All Outlets" },
  { id: "outlet-1", name: "Downtown Supermarket" },
  { id: "outlet-2", name: "Mall Food Court" },
  { id: "outlet-3", name: "Westside Salon" },
  { id: "outlet-4", name: "Airport Kiosk" },
];

const outletData: Record<string, {
  kpis: { sales: string; orders: string; customers: string; avgOrder: string; salesChange: string; ordersChange: string; custChange: string; avgChange: string };
  salesTrend: { name: string; sales: number }[];
  topItems: { name: string; qty: number; revenue: number }[];
  paymentMethods: { name: string; value: number; color: string }[];
  recentTxns: { id: string; customer: string; amount: string; method: string; time: string; status: string }[];
}> = {
  all: {
    kpis: { sales: "$24,860", orders: "248", customers: "189", avgOrder: "$100.24", salesChange: "+12.5%", ordersChange: "+18", custChange: "+11", avgChange: "+4.2%" },
    salesTrend: [
      { name: "Mon", sales: 12400 }, { name: "Tue", sales: 15800 }, { name: "Wed", sales: 13900 },
      { name: "Thu", sales: 17300 }, { name: "Fri", sales: 19100 }, { name: "Sat", sales: 24860 }, { name: "Sun", sales: 18800 },
    ],
    topItems: [
      { name: "Grilled Chicken Combo", qty: 86, revenue: 1290 },
      { name: "Premium Haircut", qty: 64, revenue: 1920 },
      { name: "Fresh Juice (L)", qty: 112, revenue: 672 },
      { name: "Detergent 2kg", qty: 58, revenue: 870 },
      { name: "Espresso Coffee", qty: 142, revenue: 710 },
    ],
    paymentMethods: [
      { name: "Cash", value: 8950, color: "hsl(var(--chart-1))" },
      { name: "Card", value: 9420, color: "hsl(var(--chart-2))" },
      { name: "Mobile Money", value: 4890, color: "hsl(var(--chart-3))" },
      { name: "Bank Transfer", value: 1600, color: "hsl(var(--chart-4))" },
    ],
    recentTxns: [
      { id: "TXN-001", customer: "Walk-in", amount: "$42.50", method: "Cash", time: "2 min ago", status: "Completed" },
      { id: "TXN-002", customer: "Jane Smith", amount: "$128.00", method: "Card", time: "15 min ago", status: "Completed" },
      { id: "TXN-003", customer: "Bob Wilson", amount: "$35.75", method: "Mobile Money", time: "32 min ago", status: "Refunded" },
      { id: "TXN-004", customer: "Walk-in", amount: "$67.20", method: "Card", time: "1 hr ago", status: "Completed" },
      { id: "TXN-005", customer: "Alice Brown", amount: "$215.00", method: "Cash", time: "1.5 hr ago", status: "Completed" },
    ],
  },
  "outlet-1": {
    kpis: { sales: "$8,420", orders: "84", customers: "62", avgOrder: "$100.24", salesChange: "+12.5%", ordersChange: "+8", custChange: "-3", avgChange: "+4.2%" },
    salesTrend: [
      { name: "Mon", sales: 4200 }, { name: "Tue", sales: 5800 }, { name: "Wed", sales: 4900 },
      { name: "Thu", sales: 6300 }, { name: "Fri", sales: 7100 }, { name: "Sat", sales: 8400 }, { name: "Sun", sales: 6800 },
    ],
    topItems: [
      { name: "Detergent 2kg", qty: 42, revenue: 630 },
      { name: "Rice 5kg", qty: 38, revenue: 570 },
      { name: "Cooking Oil 1L", qty: 56, revenue: 448 },
      { name: "Bread (White)", qty: 120, revenue: 360 },
      { name: "Eggs (Tray)", qty: 34, revenue: 340 },
    ],
    paymentMethods: [
      { name: "Cash", value: 3800, color: "hsl(var(--chart-1))" },
      { name: "Card", value: 2900, color: "hsl(var(--chart-2))" },
      { name: "Mobile Money", value: 1420, color: "hsl(var(--chart-3))" },
      { name: "Bank Transfer", value: 300, color: "hsl(var(--chart-4))" },
    ],
    recentTxns: [
      { id: "TXN-101", customer: "Walk-in", amount: "$42.50", method: "Cash", time: "5 min ago", status: "Completed" },
      { id: "TXN-102", customer: "Mary K.", amount: "$86.00", method: "Card", time: "22 min ago", status: "Completed" },
      { id: "TXN-103", customer: "Walk-in", amount: "$19.99", method: "Mobile Money", time: "45 min ago", status: "Completed" },
    ],
  },
  "outlet-2": {
    kpis: { sales: "$6,240", orders: "72", customers: "58", avgOrder: "$86.67", salesChange: "+8.1%", ordersChange: "+5", custChange: "+7", avgChange: "-1.3%" },
    salesTrend: [
      { name: "Mon", sales: 3100 }, { name: "Tue", sales: 4200 }, { name: "Wed", sales: 3800 },
      { name: "Thu", sales: 5100 }, { name: "Fri", sales: 5600 }, { name: "Sat", sales: 6240 }, { name: "Sun", sales: 4900 },
    ],
    topItems: [
      { name: "Grilled Chicken Combo", qty: 86, revenue: 1290 },
      { name: "Fresh Juice (L)", qty: 112, revenue: 672 },
      { name: "Espresso Coffee", qty: 142, revenue: 710 },
      { name: "Burger Meal", qty: 64, revenue: 576 },
      { name: "Fried Rice", qty: 48, revenue: 432 },
    ],
    paymentMethods: [
      { name: "Cash", value: 2200, color: "hsl(var(--chart-1))" },
      { name: "Card", value: 2800, color: "hsl(var(--chart-2))" },
      { name: "Mobile Money", value: 1040, color: "hsl(var(--chart-3))" },
      { name: "Bank Transfer", value: 200, color: "hsl(var(--chart-4))" },
    ],
    recentTxns: [
      { id: "TXN-201", customer: "Walk-in", amount: "$18.50", method: "Cash", time: "3 min ago", status: "Completed" },
      { id: "TXN-202", customer: "Walk-in", amount: "$32.00", method: "Card", time: "18 min ago", status: "Completed" },
    ],
  },
  "outlet-3": {
    kpis: { sales: "$5,800", orders: "48", customers: "42", avgOrder: "$120.83", salesChange: "+15.2%", ordersChange: "+3", custChange: "+5", avgChange: "+6.8%" },
    salesTrend: [
      { name: "Mon", sales: 2800 }, { name: "Tue", sales: 3200 }, { name: "Wed", sales: 2900 },
      { name: "Thu", sales: 3500 }, { name: "Fri", sales: 4200 }, { name: "Sat", sales: 5800 }, { name: "Sun", sales: 4100 },
    ],
    topItems: [
      { name: "Premium Haircut", qty: 24, revenue: 720 },
      { name: "Hair Treatment", qty: 18, revenue: 900 },
      { name: "Manicure & Pedicure", qty: 22, revenue: 660 },
      { name: "Beard Trim", qty: 32, revenue: 480 },
      { name: "Hair Coloring", qty: 8, revenue: 640 },
    ],
    paymentMethods: [
      { name: "Cash", value: 1950, color: "hsl(var(--chart-1))" },
      { name: "Card", value: 2400, color: "hsl(var(--chart-2))" },
      { name: "Mobile Money", value: 1250, color: "hsl(var(--chart-3))" },
      { name: "Bank Transfer", value: 200, color: "hsl(var(--chart-4))" },
    ],
    recentTxns: [
      { id: "TXN-301", customer: "Sarah M.", amount: "$45.00", method: "Card", time: "10 min ago", status: "Completed" },
      { id: "TXN-302", customer: "Walk-in", amount: "$30.00", method: "Cash", time: "40 min ago", status: "Completed" },
    ],
  },
  "outlet-4": {
    kpis: { sales: "$4,400", orders: "44", customers: "27", avgOrder: "$100.00", salesChange: "+6.3%", ordersChange: "+2", custChange: "+2", avgChange: "+1.1%" },
    salesTrend: [
      { name: "Mon", sales: 2300 }, { name: "Tue", sales: 2600 }, { name: "Wed", sales: 2300 },
      { name: "Thu", sales: 2400 }, { name: "Fri", sales: 2200 }, { name: "Sat", sales: 4400 }, { name: "Sun", sales: 3000 },
    ],
    topItems: [
      { name: "Travel Snack Pack", qty: 68, revenue: 680 },
      { name: "Bottled Water", qty: 120, revenue: 360 },
      { name: "Magazine", qty: 44, revenue: 440 },
      { name: "Neck Pillow", qty: 22, revenue: 550 },
      { name: "Earphones", qty: 18, revenue: 540 },
    ],
    paymentMethods: [
      { name: "Cash", value: 1000, color: "hsl(var(--chart-1))" },
      { name: "Card", value: 2320, color: "hsl(var(--chart-2))" },
      { name: "Mobile Money", value: 880, color: "hsl(var(--chart-3))" },
      { name: "Bank Transfer", value: 200, color: "hsl(var(--chart-4))" },
    ],
    recentTxns: [
      { id: "TXN-401", customer: "Walk-in", amount: "$12.50", method: "Card", time: "8 min ago", status: "Completed" },
      { id: "TXN-402", customer: "Walk-in", amount: "$28.00", method: "Cash", time: "25 min ago", status: "Completed" },
    ],
  },
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Dashboard() {
  const [selectedOutlet, setSelectedOutlet] = useState("all");
  const data = outletData[selectedOutlet];
  const outletName = outlets.find((o) => o.id === selectedOutlet)?.name ?? "All Outlets";

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header with outlet selector */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview for {outletName}</p>
        </div>
        <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Select outlet" />
          </SelectTrigger>
          <SelectContent>
            {outlets.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard title="Today's Sales" value={data.kpis.sales} change={`${data.kpis.salesChange} vs yesterday`} changeType="positive" icon={DollarSign} />
        <KpiCard title="Orders" value={data.kpis.orders} change={`${data.kpis.ordersChange} from yesterday`} changeType="positive" icon={ShoppingCart} />
        <KpiCard title="Customers" value={data.kpis.customers} change={`${data.kpis.custChange} from yesterday`} changeType={data.kpis.custChange.startsWith("-") ? "negative" : "positive"} icon={Users} />
        <KpiCard title="Avg. Order" value={data.kpis.avgOrder} change={`${data.kpis.avgChange} this week`} changeType={data.kpis.avgChange.startsWith("-") ? "negative" : "positive"} icon={TrendingUp} />
      </div>

      {/* Sales Trend + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4 lg:p-5">
          <h3 className="font-heading font-semibold mb-4">Weekly Sales Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesTrend}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(196, 84%, 64%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(196, 84%, 64%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 3%, 87%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(233, 10%, 46%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(233, 10%, 46%)" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(210, 3%, 87%)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Sales"]}
                />
                <Area type="monotone" dataKey="sales" stroke="hsl(196, 84%, 64%)" fill="url(#salesGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 lg:p-5">
          <h3 className="font-heading font-semibold mb-4">Sales by Payment Method</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.paymentMethods}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={90}
                  dataKey="value"
                >
                  {data.paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top Selling Items */}
      <Card className="p-4 lg:p-5">
        <h3 className="font-heading font-semibold mb-4">Top Selling Items</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 3%, 87%)" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(233, 10%, 46%)" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(233, 10%, 46%)" width={120} />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Bar dataKey="qty" fill="hsl(196, 84%, 64%)" radius={[0, 4, 4, 0]} name="Qty Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-medium text-muted-foreground">#</th>
                  <th className="pb-2 font-medium text-muted-foreground">Item</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">Qty</th>
                  <th className="pb-2 font-medium text-muted-foreground text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topItems.map((item, i) => (
                  <tr key={item.name} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 text-muted-foreground">{i + 1}</td>
                    <td className="py-2.5 font-medium">{item.name}</td>
                    <td className="py-2.5 text-right">{item.qty}</td>
                    <td className="py-2.5 text-right font-semibold">${item.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

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
                <th className="pb-3 font-medium text-muted-foreground hidden md:table-cell">Method</th>
                <th className="pb-3 font-medium text-muted-foreground hidden lg:table-cell">Time</th>
                <th className="pb-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentTxns.map((txn) => (
                <tr key={txn.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 font-mono text-xs">{txn.id}</td>
                  <td className="py-3 hidden sm:table-cell">{txn.customer}</td>
                  <td className="py-3 font-semibold">{txn.amount}</td>
                  <td className="py-3 hidden md:table-cell">{txn.method}</td>
                  <td className="py-3 text-muted-foreground hidden lg:table-cell">{txn.time}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      txn.status === "Completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}>
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
