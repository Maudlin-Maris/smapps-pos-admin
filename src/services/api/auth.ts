/**
 * Real API Auth Service
 * Calls backend endpoints. Falls back to mock if API unavailable.
 */

import { apiRequest } from "../http";
import { ok, err, type ServiceResult } from "../types";
import type { AuthLoginResponse, AuthResetResponse, AuthService } from "../mock/auth.types";
import type { MockUser, SafeUser } from "@/contexts/AuthContext";

export const realAuthService: AuthService = {
  async login(email: string, password: string): Promise<ServiceResult<AuthLoginResponse>> {
    try {
      const data = await apiRequest<AuthLoginResponse>("/api/auth/login", {
        method: "POST",
        body: { email, password },
        skipAuth: true,
      });
      return ok(data);
    } catch (error: any) {
      return err(error?.message || "Login failed");
    }
  },

  async resetPassword(email: string): Promise<ServiceResult<AuthResetResponse>> {
    try {
      const data = await apiRequest<AuthResetResponse>("/api/auth/reset-password", {
        method: "POST",
        body: { email },
        skipAuth: true,
      });
      return ok(data);
    } catch (error: any) {
      return err(error?.message || "Password reset failed");
    }
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<ServiceResult<void>> {
    try {
      await apiRequest<void>("/api/auth/change-password", {
        method: "POST",
        body: { userId, currentPassword, newPassword },
      });
      return ok(undefined);
    } catch (error: any) {
      return err(error?.message || "Password change failed");
    }
  },

  async updateProfile(
    userId: string,
    patch: Partial<Pick<MockUser, "display_name" | "phone" | "avatar_url">>
  ): Promise<ServiceResult<SafeUser>> {
    try {
      const data = await apiRequest<SafeUser>(`/api/users/${userId}/profile`, {
        method: "PATCH",
        body: patch,
      });
      return ok(data);
    } catch (error: any) {
      return err(error?.message || "Profile update failed");
    }
  },
};
