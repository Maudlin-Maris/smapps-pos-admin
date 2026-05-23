import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { OutletProvider } from "@/contexts/OutletContext";
import { POSProvider } from "@/contexts/POSContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import MenuManagement from "@/pages/MenuManagement";
import InventoryManagement from "@/pages/InventoryManagement";
import TransferManagement, { TransferManagementCreate, TransferManagementDetails } from "@/pages/TransferManagement";
import InventoryHistory from "@/pages/InventoryHistory";
import CustomerManagement from "@/pages/CustomerManagement";


import Reports from "@/pages/Reports";
import ExpenseManagement from "@/pages/ExpenseManagement";
import OutletManagement from "@/pages/OutletManagement";
import SubscriptionManagement from "@/pages/SubscriptionManagement";
import CashierManagement from "@/pages/CashierManagement";
import LoyaltyManagement from "@/pages/LoyaltyManagement";
import TipsManagement from "@/pages/TipsManagement";
import POSMain from "@/pages/POS/POSMain";
import PromoBundleManagement from "@/pages/PromoBundleManagement";
import Auth from "@/pages/Auth";
import Profile from "@/pages/Profile";
import UserManagement from "@/pages/UserManagement";
import RolesPermissions from "@/pages/RolesPermissions";
import ModifierGroups from "@/pages/ModifierGroups";
import TerminalManagement from "@/pages/TerminalManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Protected = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <OutletProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/" element={<Protected><Dashboard /></Protected>} />
                <Route path="/profile" element={<Protected><Profile /></Protected>} />
                <Route path="/menu" element={<Protected><MenuManagement /></Protected>} />
                <Route path="/bundles" element={<Protected><PromoBundleManagement /></Protected>} />
                <Route path="/modifiers" element={<Protected><ModifierGroups /></Protected>} />
                <Route path="/inventory" element={<Protected><InventoryManagement /></Protected>} />
                <Route path="/inventory/transfers" element={<Protected><TransferManagement /></Protected>} />
                <Route path="/inventory/transfers/new" element={<Protected><TransferManagementCreate /></Protected>} />
                <Route path="/inventory/transfers/:id/edit" element={<Protected><TransferManagementCreate /></Protected>} />
                <Route path="/inventory/transfers/:id" element={<Protected><TransferManagementDetails /></Protected>} />
                <Route path="/inventory/history" element={<Protected><InventoryHistory /></Protected>} />
                <Route path="/customers" element={<Protected><CustomerManagement /></Protected>} />
                <Route path="/loyalty" element={<Protected><LoyaltyManagement /></Protected>} />
                
                <Route path="/reports" element={<Protected><Reports /></Protected>} />
                <Route path="/expenses" element={<Protected><ExpenseManagement /></Protected>} />
                <Route path="/tips" element={<Protected><TipsManagement /></Protected>} />
                <Route path="/outlets" element={<Protected><OutletManagement /></Protected>} />
                <Route path="/cashiers" element={<Protected><CashierManagement /></Protected>} />
                <Route path="/subscription" element={<Protected><SubscriptionManagement /></Protected>} />
                <Route path="/users" element={<Protected><UserManagement /></Protected>} />
                <Route path="/roles" element={<Protected><RolesPermissions /></Protected>} />
                <Route path="/terminals" element={<Protected><TerminalManagement /></Protected>} />
                <Route path="/pos" element={<POSProvider><POSMain /></POSProvider>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </OutletProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
