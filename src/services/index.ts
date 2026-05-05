/**
 * Service Layer — Central Entry Point
 *
 * Provides a unified API surface with automatic mock/real switching.
 * Import services from here:
 *
 *   import { services } from "@/services";
 *   const result = await services.auth.login(email, password);
 *
 * Toggle globally: VITE_USE_MOCK_API=true/false (defaults to true)
 * Override per-domain: setDomainOverride("auth", false)
 */

import { useMockForDomain, type ServiceDomain } from "./config";
import type { ServiceResult } from "./types";

// Mock implementations
import { mockAuthService } from "./mock/auth";
import { mockCashiersService } from "./mock/cashiers";
import { mockOutletsService } from "./mock/outlets";
import { mockOrdersService } from "./mock/orders";
import { mockTerminalsService } from "./mock/terminals";
import { mockInventoryService } from "./mock/inventory";

// Real API implementations
import { realAuthService } from "./api/auth";
import { realCashiersService } from "./api/cashiers";
import { realOutletsService } from "./api/outlets";
import { realOrdersService } from "./api/orders";
import { realTerminalsService } from "./api/terminals";
import { realInventoryService } from "./api/inventory";

// Type imports
import type { AuthService } from "./mock/auth.types";
import type { CashiersService } from "./mock/cashiers.types";
import type { OutletsService } from "./mock/outlets.types";
import type { OrdersService } from "./mock/orders.types";
import type { TerminalsService } from "./mock/terminals.types";
import type { InventoryService } from "./mock/inventory.types";

/**
 * Creates a proxy that routes each method call to either
 * the real or mock implementation, with fallback on failure.
 */
function withFallback<T extends object>(
  domain: ServiceDomain,
  real: T,
  mock: T
): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const realFn = (real as any)[prop];
      const mockFn = (mock as any)[prop];

      if (typeof mockFn !== "function") return mockFn;

      return async (...args: any[]) => {
        // If mock mode is forced, skip real API entirely
        if (useMockForDomain(domain)) {
          return mockFn(...args);
        }

        // Try real API first
        try {
          const result: ServiceResult<any> = await realFn(...args);
          // If the real API returned an error that looks like a network/server issue,
          // fall back to mock (but not for auth errors like "Invalid password")
          if ("error" in result && result.error) {
            const msg = result.error.toLowerCase();
            const isNetworkError =
              msg.includes("failed to fetch") ||
              msg.includes("network") ||
              msg.includes("request failed: 0") ||
              msg.includes("request failed: 502") ||
              msg.includes("request failed: 503") ||
              msg.includes("request failed: 504");
            if (isNetworkError) {
              console.warn(
                `[services/${domain}/${String(prop)}] API unavailable, falling back to mock:`,
                result.error
              );
              return mockFn(...args);
            }
          }
          return result;
        } catch (e) {
          console.warn(
            `[services/${domain}/${String(prop)}] API call threw, falling back to mock:`,
            e
          );
          return mockFn(...args);
        }
      };
    },
  });
}

export interface Services {
  auth: AuthService;
  cashiers: CashiersService;
  outlets: OutletsService;
  orders: OrdersService;
  terminals: TerminalsService;
  inventory: InventoryService;
}

export const services: Services = {
  auth: withFallback("auth", realAuthService, mockAuthService),
  cashiers: withFallback("cashiers", realCashiersService, mockCashiersService),
  outlets: withFallback("outlets", realOutletsService, mockOutletsService),
  orders: withFallback("orders", realOrdersService, mockOrdersService),
  terminals: withFallback("terminals", realTerminalsService, mockTerminalsService),
  inventory: withFallback("inventory", realInventoryService, mockInventoryService),
};

// Re-export utilities
export { useMockForDomain, setDomainOverride, getDomainOverrides } from "./config";
export { isOk, ok, err } from "./types";
export type { ServiceResult } from "./types";
