import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { OutletProvider } from "@/contexts/OutletContext";
import { POSProvider } from "@/contexts/POSContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import MenuManagement from "@/pages/MenuManagement";
import InventoryManagement from "@/pages/InventoryManagement";
import AdvancedInventory from "@/pages/AdvancedInventory";
import PurchaseOrders from "@/pages/PurchaseOrders";
import CustomerManagement from "@/pages/CustomerManagement";

import AdvancedReports from "@/pages/AdvancedReports";
import Reports from "@/pages/Reports";
import ExpenseManagement from "@/pages/ExpenseManagement";
import OutletManagement from "@/pages/OutletManagement";
import SubscriptionManagement from "@/pages/SubscriptionManagement";
import CashierManagement from "@/pages/CashierManagement";
import LoyaltyManagement from "@/pages/LoyaltyManagement";
import POSMain from "@/pages/POS/POSMain";
import PromoBundleManagement from "@/pages/PromoBundleManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OutletProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/menu" element={<AppLayout><MenuManagement /></AppLayout>} />
            <Route path="/bundles" element={<AppLayout><PromoBundleManagement /></AppLayout>} />
            
            <Route path="/inventory" element={<AppLayout><InventoryManagement /></AppLayout>} />
            <Route path="/inventory/advanced" element={<AppLayout><AdvancedInventory /></AppLayout>} />
            <Route path="/purchase-orders" element={<AppLayout><PurchaseOrders /></AppLayout>} />
            <Route path="/customers" element={<AppLayout><CustomerManagement /></AppLayout>} />
            <Route path="/loyalty" element={<AppLayout><LoyaltyManagement /></AppLayout>} />
            <Route path="/insights" element={<AppLayout><AdvancedReports /></AppLayout>} />
            <Route path="/reports" element={<AppLayout><Reports /></AppLayout>} />
            <Route path="/expenses" element={<AppLayout><ExpenseManagement /></AppLayout>} />
            <Route path="/outlets" element={<AppLayout><OutletManagement /></AppLayout>} />
            <Route path="/cashiers" element={<AppLayout><CashierManagement /></AppLayout>} />
            <Route path="/subscription" element={<AppLayout><SubscriptionManagement /></AppLayout>} />
            <Route path="/pos" element={<POSProvider><POSMain /></POSProvider>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </OutletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
