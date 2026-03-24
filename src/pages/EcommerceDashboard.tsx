import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Globe, ShoppingCart, TrendingUp, Package, Eye, Settings,
  Instagram, Facebook, ArrowUpRight, BarChart3, Layers, Tag,
  Truck, CreditCard, RefreshCcw,
} from "lucide-react";

interface SalesChannel {
  id: string;
  name: string;
  icon: React.ElementType;
  connected: boolean;
  orders: number;
  revenue: number;
  syncStatus: "synced" | "syncing" | "error";
  lastSync: string;
}

interface OnlineOrder {
  id: string;
  orderNumber: string;
  channel: string;
  customer: string;
  items: number;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  date: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(n);
}

const defaultChannels: SalesChannel[] = [
  { id: "web", name: "Online Store", icon: Globe, connected: true, orders: 156, revenue: 2340000, syncStatus: "synced", lastSync: "2 min ago" },
  { id: "instagram", name: "Instagram Shop", icon: Instagram, connected: true, orders: 43, revenue: 680000, syncStatus: "synced", lastSync: "5 min ago" },
  { id: "facebook", name: "Facebook Shop", icon: Facebook, connected: false, orders: 0, revenue: 0, syncStatus: "error", lastSync: "Never" },
  { id: "pos", name: "In-Store POS", icon: ShoppingCart, connected: true, orders: 892, revenue: 12500000, syncStatus: "synced", lastSync: "Real-time" },
];

const defaultOrders: OnlineOrder[] = [
  { id: "o1", orderNumber: "ORD-4521", channel: "Online Store", customer: "Adebayo Johnson", items: 3, total: 45000, status: "pending", date: "Jun 14, 2024" },
  { id: "o2", orderNumber: "ORD-4520", channel: "Instagram Shop", customer: "Chioma Okafor", items: 1, total: 18500, status: "processing", date: "Jun 14, 2024" },
  { id: "o3", orderNumber: "ORD-4519", channel: "Online Store", customer: "Musa Abdullahi", items: 5, total: 72000, status: "shipped", date: "Jun 13, 2024" },
  { id: "o4", orderNumber: "ORD-4518", channel: "In-Store POS", customer: "Walk-in", items: 2, total: 15000, status: "delivered", date: "Jun 13, 2024" },
  { id: "o5", orderNumber: "ORD-4517", channel: "Online Store", customer: "Ngozi Eze", items: 1, total: 8500, status: "cancelled", date: "Jun 12, 2024" },
];

const orderStatusConfig: Record<string, { color: string }> = {
  pending: { color: "bg-warning/15 text-warning" },
  processing: { color: "bg-info/15 text-info" },
  shipped: { color: "bg-accent/15 text-accent" },
  delivered: { color: "bg-success/15 text-success" },
  cancelled: { color: "bg-destructive/15 text-destructive" },
};

type Tab = "overview" | "orders" | "channels" | "settings";

export default function EcommerceDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [channels, setChannels] = useState(defaultChannels);
  const [orders] = useState(defaultOrders);

  const totalOnlineRevenue = channels.filter((c) => c.connected).reduce((s, c) => s + c.revenue, 0);
  const totalOrders = channels.filter((c) => c.connected).reduce((s, c) => s + c.orders, 0);
  const connectedCount = channels.filter((c) => c.connected).length;

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "orders", label: `Orders (${orders.length})` },
    { key: "channels", label: `Channels (${connectedCount})` },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight">Omnichannel</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all sales channels from one place</p>
        </div>
        <Button className="gap-1.5"><RefreshCcw className="h-4 w-4" /> Sync All Channels</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center"><Globe className="h-5 w-5 text-accent" /></div>
            <div><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-xl font-heading font-bold">{fmt(totalOnlineRevenue)}</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-success" /></div>
            <div><p className="text-xs text-muted-foreground">Total Orders</p><p className="text-xl font-heading font-bold">{totalOrders.toLocaleString()}</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center"><Layers className="h-5 w-5 text-warning" /></div>
            <div><p className="text-xs text-muted-foreground">Active Channels</p><p className="text-xl font-heading font-bold">{connectedCount}</p></div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-info" /></div>
            <div><p className="text-xs text-muted-foreground">Avg. Order Value</p><p className="text-xl font-heading font-bold">{totalOrders > 0 ? fmt(totalOnlineRevenue / totalOrders) : "₦0"}</p></div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap", tab === t.key ? "bg-card shadow-sm" : "text-muted-foreground")}>{t.label}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Channels Overview */}
          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-4">Sales Channels</h3>
            <div className="space-y-3">
              {channels.map((ch) => {
                const Icon = ch.icon;
                return (
                  <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><Icon className="h-5 w-5" /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{ch.name}</span>
                          <Badge variant="secondary" className={cn("text-xs", ch.connected ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>
                            {ch.connected ? "Connected" : "Disconnected"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Last sync: {ch.lastSync}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{fmt(ch.revenue)}</p>
                      <p className="text-xs text-muted-foreground">{ch.orders} orders</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recent Online Orders */}
          <Card className="p-5">
            <h3 className="font-heading font-semibold mb-4">Recent Orders</h3>
            <div className="space-y-2">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{order.orderNumber}</span>
                      <Badge variant="secondary" className={cn("text-xs", orderStatusConfig[order.status]?.color)}>
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{order.customer} · {order.channel}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{fmt(order.total)}</p>
                    <p className="text-xs text-muted-foreground">{order.items} items</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "orders" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Order</th>
                  <th className="text-left p-3 font-medium">Channel</th>
                  <th className="text-left p-3 font-medium">Customer</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Items</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-left p-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b hover:bg-muted/30">
                    <td className="p-3 font-medium">{o.orderNumber}</td>
                    <td className="p-3 text-muted-foreground">{o.channel}</td>
                    <td className="p-3">{o.customer}</td>
                    <td className="p-3"><Badge variant="secondary" className={cn("text-xs", orderStatusConfig[o.status]?.color)}>{o.status}</Badge></td>
                    <td className="p-3 text-right">{o.items}</td>
                    <td className="p-3 text-right font-medium">{fmt(o.total)}</td>
                    <td className="p-3 text-muted-foreground">{o.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "channels" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map((ch) => {
            const Icon = ch.icon;
            return (
              <Card key={ch.id} className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center"><Icon className="h-6 w-6" /></div>
                    <div>
                      <h3 className="font-heading font-semibold">{ch.name}</h3>
                      <p className="text-xs text-muted-foreground">Last sync: {ch.lastSync}</p>
                    </div>
                  </div>
                  <Switch checked={ch.connected} onCheckedChange={(checked) => setChannels((prev) => prev.map((c) => c.id === ch.id ? { ...c, connected: checked } : c))} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="font-heading font-bold">{ch.orders}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="font-heading font-bold text-sm">{fmt(ch.revenue)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant="secondary" className={cn("text-xs mt-1", ch.syncStatus === "synced" ? "bg-success/15 text-success" : ch.syncStatus === "syncing" ? "bg-info/15 text-info" : "bg-destructive/15 text-destructive")}>
                      {ch.syncStatus}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            { icon: Package, title: "Inventory Sync", desc: "Automatically sync stock levels across all channels", enabled: true },
            { icon: Tag, title: "Price Sync", desc: "Keep pricing consistent across online and in-store", enabled: true },
            { icon: Truck, title: "Shipping Rules", desc: "Configure shipping rates and delivery zones", enabled: false },
            { icon: CreditCard, title: "Payment Methods", desc: "Manage accepted payment methods per channel", enabled: true },
            { icon: BarChart3, title: "Analytics Tracking", desc: "Track conversions and customer behavior across channels", enabled: true },
            { icon: RefreshCcw, title: "Auto-Sync Schedule", desc: "Set automatic sync intervals for inventory updates", enabled: false },
          ].map((item) => (
            <Card key={item.title} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><item.icon className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-medium text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <Switch defaultChecked={item.enabled} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
