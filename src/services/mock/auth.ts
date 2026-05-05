/**
 * Mock Auth Service
 * Extracted from AuthContext — same logic, same responses.
 */

import type { MockUser, SafeUser } from "@/contexts/AuthContext";
import { loadUsers, saveUsers, generatePassword } from "@/contexts/AuthContext";
import { ok, err, type ServiceResult } from "../types";
import type { AuthLoginResponse, AuthResetResponse, AuthService } from "./auth.types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockAuthService: AuthService = {
  async login(email: string, password: string): Promise<ServiceResult<AuthLoginResponse>> {
    await delay(400);
    const users = loadUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found || found.password !== password) {
      return err("Invalid email or password");
    }
    if (found.status === "inactive") {
      return err("This account has been deactivated. Contact your administrator.");
    }
    const { password: _pw, ...safe } = found;
    return ok({ user: safe, token: `mock-token-${found.id}` });
  },

  async resetPassword(email: string): Promise<ServiceResult<AuthResetResponse>> {
    await delay(600);
    const users = loadUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) {
      return err("No account found with that email");
    }
    const newPassword = generatePassword(12);
    users[idx] = { ...users[idx], password: newPassword };
    saveUsers(users);
    console.info(`[mock email → ${email}]\nYour new password: ${newPassword}`);
    return ok({ newPassword });
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<ServiceResult<void>> {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return err("User not found");
    if (users[idx].password !== currentPassword) return err("Current password is incorrect");
    users[idx] = { ...users[idx], password: newPassword };
    saveUsers(users);
    return ok(undefined);
  },

  async updateProfile(
    userId: string,
    patch: Partial<Pick<MockUser, "display_name" | "phone" | "avatar_url">>
  ): Promise<ServiceResult<SafeUser>> {
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return err("User not found");
    users[idx] = { ...users[idx], ...patch };
    saveUsers(users);
    const { password, ...safe } = users[idx];
    return ok(safe);
  },
};
