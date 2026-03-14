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
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Menu", path: "/menu", icon: UtensilsCrossed },
  { title: "Inventory", path: "/inventory", icon: Package },
  { title: "Expenses", path: "/expenses", icon: Receipt },
  { title: "Reports", path: "/reports", icon: FileBarChart },
  { title: "Outlets", path: "/outlets", icon: Store },
  { title: "Cashiers", path: "/cashiers", icon: Users },
  { title: "Subscription", path: "/subscription", icon: CreditCard },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

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

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <RouterNavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? item.title : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-pos-sidebar-accent text-pos-sidebar-fg-active"
                    : "text-pos-sidebar-fg hover:bg-pos-sidebar-accent/60 hover:text-pos-sidebar-fg-active"
                )}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </RouterNavLink>
            );
          })}
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
        {navItems.map((item) => {
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
              <span>{item.title}</span>
            </RouterNavLink>
          );
        })}
      </nav>
    </div>
  );
}