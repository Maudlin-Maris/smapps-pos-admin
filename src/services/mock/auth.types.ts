/**
 * Auth service type definitions.
 * Both real and mock implementations conform to this interface.
 */

import type { MockUser, SafeUser } from "@/contexts/AuthContext";
import type { ServiceResult } from "../types";

export interface AuthLoginResponse {
  user: SafeUser;
  token: string;
}

export interface AuthResetResponse {
  newPassword?: string;
}

export interface AuthService {
  login(email: string, password: string): Promise<ServiceResult<AuthLoginResponse>>;
  resetPassword(email: string): Promise<ServiceResult<AuthResetResponse>>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<ServiceResult<void>>;
  updateProfile(
    userId: string,
    patch: Partial<Pick<MockUser, "display_name" | "phone" | "avatar_url">>
  ): Promise<ServiceResult<SafeUser>>;
}
