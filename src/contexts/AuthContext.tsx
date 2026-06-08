import { LoginResponse, User } from "@/lib/types/login-response";
import {
  useChangePassword,
  useLogin,
  useResetPassword,
  useUpdateProfile,
} from "@/services/api/auth";
import { api } from "@/services/api/base";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// ===== MOCK AUTH (no backend) =====
// Replace with real auth wiring later.

export interface MockUser {
  id: string;
  email: string;
  password: string; // mock only — never do this with real users
  display_name: string;
  first_name: string;
  last_name: string;
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
    first_name: "Admin",
    last_name: "User",
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
    first_name: "Store",
    last_name: "Manager",
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
  const firstName = u.first_name ?? "";
  const lastName = u.last_name ?? "";
  const displayName = u.display_name ?? "";
  return {
    id: u.id,
    email: u.email,
    password: u.password,
    display_name: displayName || `${firstName} ${lastName}`.trim(),
    first_name: firstName,
    last_name: lastName,
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

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  permissions: string[];
  roleName: string;
  hasPermission: (perm: string | string[]) => boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
  logout: () => void;
  resetPassword: (
    email: string,
  ) => Promise<{ error?: string; newPassword?: string }>;
  updateProfile: (profile: Partial<User>) => Promise<void>;
  changePassword: (
    current: string,
    next: string,
  ) => Promise<{ error?: string }>;
  rolesVersion: number;
  bumpRolesVersion: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesVersion, setRolesVersion] = useState(0);

  const isLoggedIn = !!user;

  const loginMutation = useLogin();
  const resetPasswordMutation = useResetPassword();
  const changePasswordMutation = useChangePassword();
  const updateProfileMutation = useUpdateProfile(user?.id);

  const loginSuccess = (data: LoginResponse) => {
    const userData: Omit<LoginResponse, "success" | "message" | "tokenType"> = {
      token: data.token,
      user: data.user,
    };
    localStorage.setItem("jhakie_user", JSON.stringify(userData));
    setUser(data.user);
    api.defaults.headers.Authorization = `Bearer ${data.token}`;
  };

  const persistUser = (updatedUser: User) => {
    const stored = localStorage.getItem("jhakie_user");
    if (stored) {
      try {
        const userData: Omit<LoginResponse, "success"> = JSON.parse(stored);
        userData.user = updatedUser;
        localStorage.setItem("jhakie_user", JSON.stringify(userData));
      } catch (error) {
        console.error("Failed to parse/update stored user data:", error);
      }
    }
    setUser(updatedUser);
  };

  useEffect(() => {
    const stored = localStorage.getItem("jhakie_user");
    if (stored) {
      try {
        const userData: Omit<LoginResponse, "success"> = JSON.parse(stored);
        if (userData && userData.user && userData.token) {
          setUser(userData.user);
          // Set Authorization header if user has token
          api.defaults.headers.Authorization = `Bearer ${userData.token}`;
        }
      } catch (error) {
        console.error("Failed to parse stored user data:", error);
        localStorage.removeItem("jhakie_user");
      }
    }
    setLoading(false);
  }, []);

  const permissions = user?.permissions ?? [];
  const roleName = user?.role?.name ?? "";

  const hasPermission = (perm: string | string[]) => {
    if (!user) return false;
    const list = Array.isArray(perm) ? perm : [perm];
    return list.every((p) => permissions.includes(p));
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await loginMutation.trigger({ email, password });
      if (response && response.user && response.token) {
        loginSuccess(response);
        return {};
      }
      return { error: "Invalid email or password" };
    } catch (e: any) {
      return {
        error: e.response?.data?.message || e.message || "Failed to sign in",
      };
    }
  };

  const signOut = () => {
    localStorage.removeItem("jhakie_user");
    setUser(null);
    delete api.defaults.headers.Authorization;
  };

  const logout = signOut;

  const resetPassword = async (email: string) => {
    try {
      const response = await resetPasswordMutation.trigger({ email });
      if (response) {
        return { newPassword: response.newPassword };
      }
      return { error: "Failed to reset password" };
    } catch (e: any) {
      return {
        error:
          e.response?.data?.message || e.message || "Failed to reset password",
      };
    }
  };

  const updateProfile = async (profile: Partial<User>) => {
    if (!user) return;
    try {
      const response = await updateProfileMutation.trigger(profile);
      if (response) {
        persistUser(response);
      }
    } catch (e: any) {
      console.error("Failed to update profile:", e);
    }
  };

  const changePassword = async (current: string, next: string) => {
    if (!user) return { error: "Not signed in" };
    try {
      await changePasswordMutation.trigger({
        userId: user.id,
        currentPassword: current,
        newPassword: next,
      });
      return {};
    } catch (e: any) {
      return {
        error:
          e.response?.data?.message || e.message || "Failed to change password",
      };
    }
  };

  const bumpRolesVersion = () => setRolesVersion((v) => v + 1);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isLoggedIn,
        permissions,
        roleName,
        hasPermission,
        signIn,
        signOut,
        logout,
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
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
