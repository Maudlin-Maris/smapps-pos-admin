import type { SWRConfiguration } from "swr";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "./api-hooks";
import { createUrlWithParams } from "@/lib/utils";

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceName: string;
  staffName: string;
  date: string;
  time: string;
  duration: number; // minutes
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  notes: string;
  outletId: string;
}

export const initialAppointments: Appointment[] = [
  { id: "a1", customerName: "Sarah Johnson", customerPhone: "+234 801 234 5678", serviceName: "Full Color", staffName: "Amara", date: "2026-03-24", time: "10:00", duration: 90, status: "scheduled", notes: "", outletId: "outlet-1" },
  { id: "a2", customerName: "Mike Chen", customerPhone: "+234 802 345 6789", serviceName: "Men's Haircut", staffName: "Tunde", date: "2026-03-24", time: "11:00", duration: 30, status: "in_progress", notes: "Fade style", outletId: "outlet-1" },
  { id: "a3", customerName: "Lisa Park", customerPhone: "+234 803 456 7890", serviceName: "Blowout", staffName: "Amara", date: "2026-03-24", time: "14:00", duration: 45, status: "completed", notes: "", outletId: "outlet-1" },
  { id: "a4", customerName: "James Brown", customerPhone: "+234 804 567 8901", serviceName: "Beard Trim", staffName: "Tunde", date: "2026-03-25", time: "09:00", duration: 20, status: "scheduled", notes: "", outletId: "outlet-1" },
];

export const useGetServiceBookings = (
  params?: {
    outletId?: string;
    status?: string;
    search?: string;
  },
  options?: SWRConfiguration,
) => {
  const { isLoggedIn } = useAuth();
  const url = isLoggedIn
    ? createUrlWithParams("/api/admin/service-bookings", params)
    : null;

  return useApi<Appointment[]>(url, {
    fetcher: async () => {
      // Simulate API query/filter logic on the server side
      await new Promise((resolve) => setTimeout(resolve, 50));
      let result = [...initialAppointments];

      if (params?.outletId && params.outletId !== "all") {
        result = result.filter((a) => a.outletId === params.outletId);
      }
      if (params?.status && params.status !== "all") {
        result = result.filter((a) => a.status === params.status);
      }
      if (params?.search) {
        const q = params.search.trim().toLowerCase();
        result = result.filter(
          (a) =>
            a.customerName.toLowerCase().includes(q) ||
            a.serviceName.toLowerCase().includes(q) ||
            a.staffName.toLowerCase().includes(q)
        );
      }
      return result;
    },
    ...options,
  });
};
