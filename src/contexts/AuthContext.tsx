import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  loadRoles,
  Role,
  PermissionId,
  SYSTEM_ROLES,
} from "@/lib/rbac";
import { services, isOk } from "@/services";
import { setAuthToken, clearAuthToken } from "@/services/http";

// ===== MOCK AUTH (no backend) =====
// Replace with real auth wiring later.

export interface MockUser {
  id: string;
  email: string;
  password: string; // mock only — never do this with real users
  display_name: string;
  phone: string;
  avatar_url: string | null;
  role: "admin" | "manager" | "staff"; // legacy free-form label (kept for compat)
  role_id: string; // FK into roles store
  outlet_ids: string[]; // assigned branches; [] = all outlets
  status: "active" | "inactive";
  created_at: string;
}

const STORAGE_KEY = "smapps_mock_users";
const SESSION_KEY = "smapps_mock_session";

const DEFAULT_USERS: MockUser[] = [
  {
    id: "u_admin",
    email: "admin@smapps.com",
    password: "admin123",
    display_name: "Admin User",
    phone: "+234 800 000 0000",
    avatar_url: null,
    role: "admin",
    role_id: "role_admin",
    outlet_ids: [],
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "u_manager",
    email: "manager@smapps.com",
    password: "manager123",
    display_name: "Store Manager",
    phone: "",
    avatar_url: null,
    role: "manager",
    role_id: "role_manager",
    outlet_ids: [],
    status: "active",
    created_at: new Date().toISOString(),
  },
];

function migrateUser(u: any): MockUser {
  return {
    id: u.id,
    email: u.email,
    password: u.password,
    display_name: u.display_name ?? "",
    phone: u.phone ?? "",
    avatar_url: u.avatar_url ?? null,
    role: u.role ?? "staff",
    role_id:
      u.role_id ??
      (u.role === "admin"
        ? "role_admin"
        : u.role === "manager"
        ? "role_manager"
        : "role_cashier"),
    outlet_ids: Array.isArray(u.outlet_ids) ? u.outlet_ids : [],
    status: u.status ?? "active",
    created_at: u.created_at ?? new Date().toISOString(),
  };
}

export function loadUsers(): MockUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    return parsed.map(migrateUser);
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveUsers(users: MockUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let out = "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) out += chars[arr[i] % chars.length];
  return out;
}

export type SafeUser = Omit<MockUser, "password">;

interface AuthContextValue {
  user: SafeUser | null;
  loading: boolean;
  permissions: PermissionId[];
  roleName: string;
  hasPermission: (perm: PermissionId | PermissionId[]) => boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
  resetPassword: (email: string) => Promise<{ error?: string; newPassword?: string }>;
  updateProfile: (patch: Partial<Pick<MockUser, "display_name" | "phone" | "avatar_url">>) => void;
  changePassword: (current: string, next: string) => { error?: string };
  // bump to force consumers to re-read users/roles after admin edits
  rolesVersion: number;
  bumpRolesVersion: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesVersion, setRolesVersion] = useState(0);

  useEffect(() => {
    loadUsers();
    loadRoles();
    const sessionId = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (sessionId) {
      const found = loadUsers().find((u) => u.id === sessionId);
      if (found && found.status === "active") {
        const { password, ...safe } = found;
        setUser(safe);
      }
    }
    setLoading(false);
  }, []);

  const { permissions, roleName } = useMemo(() => {
    if (!user) return { permissions: [] as PermissionId[], roleName: "" };
    const roles = loadRoles();
    const role: Role | undefined =
      roles.find((r) => r.id === user.role_id) ||
      SYSTEM_ROLES.find((r) => r.id === user.role_id);
    return { permissions: role?.permissions ?? [], roleName: role?.name ?? user.role };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, rolesVersion]);

  const hasPermission = (perm: PermissionId | PermissionId[]) => {
    if (!user) return false;
    const list = Array.isArray(perm) ? perm : [perm];
    return list.every((p) => permissions.includes(p));
  };

  const signIn = async (email: string, password: string) => {
    const result = await services.auth.login(email, password);
    if (!isOk(result)) {
      return { error: result.error };
    }
    const { user: loggedIn, token } = result.data;
    setUser(loggedIn);
    setAuthToken(token);
    localStorage.setItem(SESSION_KEY, loggedIn.id);
    return {};
  };

  const signOut = () => {
    setUser(null);
    clearAuthToken();
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const resetPassword = async (email: string) => {
    const result = await services.auth.resetPassword(email);
    if (!isOk(result)) {
      return { error: result.error };
    }
    return { newPassword: result.data.newPassword };
  };

  const updateProfile: AuthContextValue["updateProfile"] = async (patch) => {
    if (!user) return;
    const result = await services.auth.updateProfile(user.id, patch);
    if (isOk(result)) {
      setUser(result.data);
    }
  };

  const changePassword: AuthContextValue["changePassword"] = (current, next) => {
    if (!user) return { error: "Not signed in" };
    // Fire-and-forget async call, return sync result for compat
    services.auth.changePassword(user.id, current, next).then((result) => {
      if (!isOk(result)) {
        console.warn("[auth] changePassword failed:", result.error);
      }
    });
    // For backward compat with sync callers, do local check too
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return { error: "User not found" };
    if (users[idx].password !== current) return { error: "Current password is incorrect" };
    users[idx] = { ...users[idx], password: next };
    saveUsers(users);
    return {};
  };

  const bumpRolesVersion = () => setRolesVersion((v) => v + 1);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        permissions,
        roleName,
        hasPermission,
        signIn,
        signOut,
        resetPassword,
        updateProfile,
        changePassword,
        rolesVersion,
        bumpRolesVersion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
