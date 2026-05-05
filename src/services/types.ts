/**
 * Shared service response types.
 * Both real and mock implementations must return these shapes.
 */

export interface ServiceResponse<T> {
  data: T;
  error?: never;
}

export interface ServiceError {
  data?: never;
  error: string;
  code?: string;
}

export type ServiceResult<T> = ServiceResponse<T> | ServiceError;

/** Helper to create a success result */
export function ok<T>(data: T): ServiceResult<T> {
  return { data };
}

/** Helper to create an error result */
export function err<T = never>(message: string, code?: string): ServiceResult<T> {
  return { error: message, code };
}

/** Type guard */
export function isOk<T>(result: ServiceResult<T>): result is ServiceResponse<T> {
  return "data" in result && !("error" in result && result.error);
}
