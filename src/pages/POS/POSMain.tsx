import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { usePOS } from "@/contexts/POSContext";
import { getFeatures } from "@/data/businessTypes";
import POSLogin from "@/components/pos/POSLogin";
import POSPinEntry from "@/components/pos/POSPinEntry";
import ProductGrid from "@/components/pos/ProductGrid";
import POSCart from "@/components/pos/POSCart";
import PaymentDialog from "@/components/pos/PaymentDialog";
import OrdersPanel from "@/components/pos/OrdersPanel";
import KitchenDisplay from "@/components/pos/KitchenDisplay";
import PrinterManagementDialog from "@/components/pos/PrinterManagementDialog";
import { usePrinters } from "@/hooks/use-printers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingCart, ClipboardList, CookingPot, Lock, LogOut, Store,
  Menu as MenuIcon, BarChart3, PlayCircle, StopCircle, Clock, DoorOpen, DoorClosed, User, Printer, MoreVertical, Sun, Moon
} from "lucide-react";
import CashierSalesDialog from "@/components/pos/CashierSalesDialog";
import CashierProfileDialog from "@/components/pos/CashierProfileDialog";
import { StartShiftDialog, CloseShiftDialog } from "@/components/pos/ShiftDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import logoIconLight from "@/assets/logo-icon-light.png";

type POSTab = "catalog" | "orders" | "kitchen";

export default function POSMain() {
  const {
    authState, currentCashier, currentOutlet, setCurrentOutlet, availableOutlets,
    lockScreen, logout, cart, cartTotal, currentShift, outletOpen, toggleOutletOpen, orders
  } = usePOS();
  const [activeTab, setActiveTab] = useState<POSTab>("catalog");
  const [showCheckout, setShowCheckout] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [startShiftOpen, setStartShiftOpen] = useState(false);
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);
  const [outletToggleConfirm, setOutletToggleConfirm] = useState(false);
  const [printerDialogOpen, setPrinterDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const { theme, setTheme } = useTheme();

  const { printers, updatePrinters, routeOrderToPrinters } = usePrinters(currentOutlet?.id || "");

  // Auto-route dockets when a new order is created
  const [lastOrderCount, setLastOrderCount] = useState(orders.length);
  useEffect(() => {
    if (orders.length > lastOrderCount) {
      const latestOrder = orders[0];
      if (latestOrder && latestOrder.status !== "voided") {
        routeOrderToPrinters(latestOrder, currentOutlet);
      }
    }
    setLastOrderCount(orders.length);
  }, [orders.length]);

  const features = currentOutlet ? getFeatures(currentOutlet.businessType) : null;
  const showKitchen = features?.hasDineIn || features?.hasMenu;

  // Handle auth states
  if (authState === "login") return <POSLogin />;
  if (authState === "pin") return <POSPinEntry mode="pin" />;
  if (authState === "locked") return <POSPinEntry mode="locked" />;

  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const tabs: { id: POSTab; label: string; icon: React.ReactNode; show: boolean }[] = [
    { id: "catalog", label: "Catalog", icon: <MenuIcon className="w-4 h-4" />, show: true },
    { id: "orders", label: "Orders", icon: <ClipboardList className="w-4 h-4" />, show: true },
    { id: "kitchen", label: "Kitchen", icon: <CookingPot className="w-4 h-4" />, show: !!showKitchen },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar */}
      <header className="flex items-center gap-1.5 sm:gap-2 h-14 px-2 sm:px-3 border-b border-border bg-card shrink-0 overflow-hidden">
        <img src={logoIconLight} alt="Smapps" className="h-7 w-7 shrink-0" />
        {/* Outlet selector */}
        <Select value={currentOutlet?.id || ""} onValueChange={id => {
          const outlet = availableOutlets.find(o => o.id === id);
          if (outlet) setCurrentOutlet(outlet);
        }}>
          <SelectTrigger className="h-8 w-auto max-w-[180px] text-xs gap-1 border-0 bg-muted/50">
            <Store className="w-3.5 h-3.5 shrink-0" />
            <SelectValue placeholder="Select outlet" />
          </SelectTrigger>
          <SelectContent>
            {availableOutlets.map(o => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Business open/close toggle */}
        <button
          onClick={() => setOutletToggleConfirm(true)}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            outletOpen
              ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
              : "bg-destructive/10 text-destructive hover:bg-destructive/20"
          }`}
        >
          {outletOpen ? <DoorOpen className="w-3.5 h-3.5" /> : <DoorClosed className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{outletOpen ? "Open" : "Closed"}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${outletOpen ? "bg-emerald-500" : "bg-destructive"}`} />
        </button>

        {/* Tabs (desktop) */}
        <div className="hidden md:flex items-center gap-1 ml-4">
          {tabs.filter(t => t.show).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Shift indicator */}
        <div className="hidden sm:flex items-center">
          {currentShift && (
            <button
              onClick={() => setCloseShiftOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <Clock className="w-3 h-3" />
              Shift Active
            </button>
          )}
        </div>

        <div className="flex-1" />

        {/* User info & actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Desktop: show all buttons inline */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted transition-colors"
              title="My Profile"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                {currentCashier?.name.charAt(0)}
              </div>
              <span className="text-xs font-medium text-foreground truncate max-w-[100px]">{currentCashier?.name}</span>
            </button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPrinterDialogOpen(true)} title="Printers">
              <Printer className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle Theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSalesOpen(true)} title="My Sales">
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={lockScreen} title="Lock Screen">
              <Lock className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={logout} title="Sign Out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile: collapse into a dropdown menu */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setProfileOpen(true)}>
                  <User className="w-4 h-4 mr-2" />
                  {currentCashier?.name || "Profile"}
                </DropdownMenuItem>
                {currentShift && (
                  <DropdownMenuItem onClick={() => setCloseShiftOpen(true)}>
                    <StopCircle className="w-4 h-4 mr-2" />
                    Close Shift
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPrinterDialogOpen(true)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Printers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSalesOpen(true)}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  My Sales
                </DropdownMenuItem>
                <DropdownMenuItem onClick={lockScreen}>
                  <Lock className="w-4 h-4 mr-2" />
                  Lock Screen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Tab content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === "catalog" && <ProductGrid />}
          {activeTab === "orders" && <OrdersPanel printers={printers} />}
          {activeTab === "kitchen" && <KitchenDisplay />}
        </div>

        {/* Right panel - Cart (desktop) */}
        {activeTab === "catalog" && !isMobile && (
          <div className="w-80 xl:w-96 border-l border-border flex flex-col bg-card">
            <POSCart onCheckout={() => setShowCheckout(true)} />
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden flex items-center border-t border-border bg-card shrink-0">
        {tabs.filter(t => t.show).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
              activeTab === tab.id ? "text-primary font-semibold" : "text-muted-foreground"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
        {/* Cart button (mobile) */}
        <button
          onClick={() => setMobileCartOpen(true)}
          className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs text-muted-foreground relative"
        >
          <ShoppingCart className="w-4 h-4" />
          {cartItemCount > 0 && (
            <span className="absolute top-1.5 right-1/4 -translate-x-1/2 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
          <span>Cart</span>
        </button>
      </nav>

      {/* Mobile cart sheet */}
      <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <SheetContent side="bottom" className="h-[80vh] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Cart</SheetTitle>
          </SheetHeader>
          <POSCart onCheckout={() => { setMobileCartOpen(false); setShowCheckout(true); }} />
        </SheetContent>
      </Sheet>

      {/* Checkout dialog */}
      <PaymentDialog open={showCheckout} onClose={() => setShowCheckout(false)} />

      {/* Cashier sales dialog */}
      <CashierSalesDialog open={salesOpen} onClose={() => setSalesOpen(false)} />

      {/* Cashier profile dialog */}
      <CashierProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Shift dialogs */}
      <StartShiftDialog open={startShiftOpen} onClose={() => setStartShiftOpen(false)} />
      <CloseShiftDialog open={closeShiftOpen} onClose={() => setCloseShiftOpen(false)} />

      {/* Printer management */}
      <PrinterManagementDialog
        open={printerDialogOpen}
        onClose={() => setPrinterDialogOpen(false)}
        printers={printers}
        onPrintersChange={updatePrinters}
      />

      {/* Open/Close business confirmation */}
      <AlertDialog open={outletToggleConfirm} onOpenChange={setOutletToggleConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {outletOpen ? "Close Business?" : "Open Business?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {outletOpen
                ? `Are you sure you want to close ${currentOutlet?.name || "this outlet"} for the day? Cashiers will not be able to create new orders while closed.`
                : `Are you sure you want to open ${currentOutlet?.name || "this outlet"} for business?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={toggleOutletOpen}
              className={outletOpen ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {outletOpen ? "Yes, Close Business" : "Yes, Open Business"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
