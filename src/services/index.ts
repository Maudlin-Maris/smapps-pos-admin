/**
 * Service Layer — Central Entry Point
 */

// Re-export utilities
export { useMockForDomain, setDomainOverride, getDomainOverrides } from "./config";
export { isOk, ok, err } from "./types";
export type { ServiceResult } from "./types";

export const services: any = {};
