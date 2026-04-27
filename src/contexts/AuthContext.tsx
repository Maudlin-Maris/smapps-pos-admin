import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// ===== MOCK AUTH (no backend) =====
// Replace with real auth wiring later.

export interface MockUser {
  id: string;
  email: string;
  password: string; // mock only — never do this with real users
  display_name: string;
  phone: string;
  avatar_url: string | null;
  role: "admin" | "manager" | "staff";
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
  },
  {
    id: "u_manager",
    email: "manager@smapps.com",
    password: "manager123",
    display_name: "Store Manager",
    phone: "",
    avatar_url: null,
    role: "manager",
  },
];

function loadUsers(): MockUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_USERS;
  }
}

function saveUsers(users: MockUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  let out = "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) out += chars[arr[i] % chars.length];
  return out;
}

interface AuthContextValue {
  user: Omit<MockUser, "password"> | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => void;
  resetPassword: (email: string) => Promise<{ error?: string; newPassword?: string }>;
  updateProfile: (patch: Partial<Pick<MockUser, "display_name" | "phone" | "avatar_url">>) => void;
  changePassword: (current: string, next: string) => { error?: string };
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<MockUser, "password"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers(); // ensure seed
    const sessionId = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    if (sessionId) {
      const found = loadUsers().find((u) => u.id === sessionId);
      if (found) {
        const { password, ...safe } = found;
        setUser(safe);
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 400));
    const users = loadUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found || found.password !== password) {
      return { error: "Invalid email or password" };
    }
    const { password: _pw, ...safe } = found;
    setUser(safe);
    localStorage.setItem(SESSION_KEY, found.id);
    return {};
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  };

  const resetPassword = async (email: string) => {
    await new Promise((r) => setTimeout(r, 600));
    const users = loadUsers();
    const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) {
      // For privacy we still pretend success in the UI, but signal here for the demo
      return { error: "No account found with that email" };
    }
    const newPassword = generatePassword(12);
    users[idx] = { ...users[idx], password: newPassword };
    saveUsers(users);
    // Mock "send email" — log to console so it can be observed in dev
    console.info(`[mock email → ${email}]\nYour new password: ${newPassword}`);
    return { newPassword };
  };

  const updateProfile: AuthContextValue["updateProfile"] = (patch) => {
    if (!user) return;
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return;
    users[idx] = { ...users[idx], ...patch };
    saveUsers(users);
    const { password, ...safe } = users[idx];
    setUser(safe);
  };

  const changePassword: AuthContextValue["changePassword"] = (current, next) => {
    if (!user) return { error: "Not signed in" };
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) return { error: "User not found" };
    if (users[idx].password !== current) return { error: "Current password is incorrect" };
    users[idx] = { ...users[idx], password: next };
    saveUsers(users);
    return {};
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signOut, resetPassword, updateProfile, changePassword }}
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
