import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import MenuManagement from "@/pages/MenuManagement";
import InventoryManagement from "@/pages/InventoryManagement";
import Reports from "@/pages/Reports";
import ExpenseManagement from "@/pages/ExpenseManagement";
import OutletManagement from "@/pages/OutletManagement";
import SubscriptionManagement from "@/pages/SubscriptionManagement";
import CashierManagement from "@/pages/CashierManagement";
import FeesAndTaxes from "@/pages/FeesAndTaxes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
          <Route
            path="/menu"
            element={
              <AppLayout>
                <MenuManagement />
              </AppLayout>
            }
          />
          <Route
            path="/inventory"
            element={
              <AppLayout>
                <InventoryManagement />
              </AppLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <AppLayout>
                <Reports />
              </AppLayout>
            }
          />
          <Route
            path="/expenses"
            element={
              <AppLayout>
                <ExpenseManagement />
              </AppLayout>
            }
          />
          <Route
            path="/outlets"
            element={
              <AppLayout>
                <OutletManagement />
              </AppLayout>
            }
          />
          <Route
            path="/cashiers"
            element={
              <AppLayout>
                <CashierManagement />
              </AppLayout>
            }
          />
          <Route
            path="/subscription"
            element={
              <AppLayout>
                <SubscriptionManagement />
              </AppLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
