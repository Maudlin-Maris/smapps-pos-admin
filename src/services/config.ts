/**
 * API Service Configuration
 *
 * Controls whether each domain uses real API or mock fallback.
 * Toggle globally via VITE_USE_MOCK_API or per-endpoint.
 */

export type ServiceDomain =
  | "auth"
  | "cashiers"
  | "outlets"
  | "orders"
  | "products"
  | "inventory"
  | "customers"
  | "terminals"
  | "loyalty"
  | "reports"
  | "expenses"
  | "purchaseOrders"
  | "modifiers"
  | "promoBundles"
  | "departments"
  | "roles";

/** Per-domain overrides: true = force mock, false = force real, undefined = follow global */
const domainOverrides: Partial<Record<ServiceDomain, boolean>> = {
  // Example: uncomment to force a specific domain to always use mock
  // auth: false,       // auth always hits real API
  // cashiers: true,    // cashiers always uses mock
};

/** Global toggle: defaults to true (mock) when env var is absent */
export function isGlobalMockEnabled(): boolean {
  const flag = import.meta.env.VITE_USE_MOCK_API;
  if (flag === undefined || flag === "") return true; // default to mock
  return flag === "true" || flag === "1";
}

/** Check if a specific domain should use mock */
export function useMockForDomain(domain: ServiceDomain): boolean {
  const override = domainOverrides[domain];
  if (override !== undefined) return override;
  return isGlobalMockEnabled();
}

/** Base URL for real API calls */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_SUPABASE_URL || "";
}

/**
 * Override a domain at runtime (useful for dev tools / debugging).
 * Changes are NOT persisted across page reloads.
 */
export function setDomainOverride(domain: ServiceDomain, useMock: boolean | undefined) {
  if (useMock === undefined) {
    delete domainOverrides[domain];
  } else {
    domainOverrides[domain] = useMock;
  }
}

/** Get current state of all domain overrides (for dev tools) */
export function getDomainOverrides(): Partial<Record<ServiceDomain, boolean>> {
  return { ...domainOverrides };
}
