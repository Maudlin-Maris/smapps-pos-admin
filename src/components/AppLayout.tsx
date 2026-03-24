import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import logoLight from "@/assets/logo-light.png";
import logoIconLight from "@/assets/logo-icon-light.png";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Package,
  Store,
  CreditCard,
  FileBarChart,
  Receipt,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  Users,
  CalendarClock,
  ShoppingCart,
  Truck,
  ArrowLeftRight,
  Heart,
  Globe,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
  section?: string;
}

const coreNavItems: NavItem[] = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  // Sales & Catalog
  { title: "Catalog", path: "/menu", icon: UtensilsCrossed, section: "Sales" },
  
  { title: "Appointments", path: "/appointments", icon: CalendarClock, section: "Sales" },
  { title: "Omnichannel", path: "/omnichannel", icon: Globe, section: "Sales" },
  // Inventory & Supply
  { title: "Inventory", path: "/inventory", icon: Package, section: "Inventory" },
  { title: "Advanced Inventory", path: "/inventory/advanced", icon: ArrowLeftRight, section: "Inventory" },
  { title: "Purchase Orders", path: "/purchase-orders", icon: Truck, section: "Inventory" },
  // Customers
  { title: "Customers & Loyalty", path: "/customers", icon: Heart, section: "Customers" },
  // Finance & Reports
  { title: "Expenses", path: "/expenses", icon: Receipt, section: "Finance" },
  { title: "Reports", path: "/reports", icon: FileBarChart, section: "Finance" },
  { title: "Advanced Insights", path: "/insights", icon: BarChart3, section: "Finance" },
  // Settings
  { title: "Outlets", path: "/outlets", icon: Store, section: "Settings" },
  { title: "Cashiers", path: "/cashiers", icon: Users, section: "Settings" },
  { title: "Subscription", path: "/subscription", icon: CreditCard, section: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const navItems = coreNavItems;

  // Group items by section
  const grouped: { section: string; items: NavItem[] }[] = [];
  let currentSection: string | null = null;
  navItems.forEach((item) => {
    const section = item.section || "";
    if (section !== currentSection || grouped.length === 0) {
      currentSection = section;
      grouped.push({ section, items: [item] });
    } else {
      grouped[grouped.length - 1].items.push(item);
    }
  });

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-pos-sidebar-bg transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-pos-sidebar-border px-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {collapsed ? (
              <img src={logoIconLight} alt="Smapps" className="h-7 w-7 shrink-0" />
            ) : (
              <img src={logoLight} alt="Smapps" className="h-7" />
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-pos-sidebar-fg lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto">
          {grouped.map((group, gi) => (
            <div key={gi}>
              {group.section && !collapsed && (
                <p className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider text-pos-sidebar-fg/50 font-semibold">
                  {group.section}
                </p>
              )}
              {collapsed && group.section && <div className="my-2 mx-2 border-t border-pos-sidebar-border" />}
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <RouterNavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    title={collapsed ? item.title : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-0",
                      isActive
                        ? "bg-pos-sidebar-accent text-pos-sidebar-fg-active"
                        : "text-pos-sidebar-fg hover:bg-pos-sidebar-accent/60 hover:text-pos-sidebar-fg-active"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.title}</span>}
                  </RouterNavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex items-center justify-center border-t border-pos-sidebar-border p-3 text-pos-sidebar-fg hover:text-pos-sidebar-fg-active transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>

        {!collapsed && (
          <div className="border-t border-pos-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pos-sidebar-accent text-xs font-bold text-pos-sidebar-fg-active shrink-0">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-pos-sidebar-fg-active truncate">Admin User</p>
                <p className="text-xs text-pos-sidebar-fg truncate">admin@retailpos.com</p>
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="border-t border-pos-sidebar-border p-2 flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pos-sidebar-accent text-xs font-bold text-pos-sidebar-fg-active">
              A
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-foreground lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-sm text-muted-foreground">
              Today: {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-border bg-card py-2 lg:hidden">
        {[coreNavItems[0], ...coreNavItems.filter((i) => ["Products", "Inventory", "Reports", "Customers & Loyalty", "Outlets"].includes(i.title))].slice(0, 6).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <RouterNavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors",
                isActive ? "text-primary font-semibold" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate max-w-[60px]">{item.title.split(" ")[0]}</span>
            </RouterNavLink>
          );
        })}
      </nav>
    </div>
  );
}
