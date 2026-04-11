/**
 * AuthContext — Real authentication connected to HireLoop backend
 *
 * Handles:
 * - Login: POST /auth/login → stores accessToken in-memory, refreshToken in cookie
 * - Register: POST /auth/register
 * - Logout: POST /auth/logout → clears cookie server-side
 * - Session restore: GET /auth/me on app load (uses refreshToken cookie silently)
 * - Role: backend sends "STUDENT" | "RECRUITER" | "ADMIN" (uppercase)
 *         we normalise to lowercase for route matching
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { api, tokenStore } from "../lib/api";

// Backend role values
type BackendRole = "STUDENT" | "RECRUITER" | "ADMIN";
// Frontend route role values (lowercase — matches routes /student, /recruiter, /admin)
type RouteRole = "student" | "recruiter" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: BackendRole;
  isEmailVerified: boolean;
  firstName?: string;
  lastName?: string;
  isPremium?: boolean;
  companyName?: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  /** Lowercase role for route matching */
  role: RouteRole | null;
  /** Display name (firstName or email) */
  name: string;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  role: BackendRole;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

function toRouteRole(role: BackendRole): RouteRole {
  return role.toLowerCase() as RouteRole;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Derive computed values from user
  const isLoggedIn = user !== null;
  const role: RouteRole | null = user ? toRouteRole(user.role) : null;
  const name = user
    ? user.firstName || user.email.split("@")[0]
    : "";

  // ── Initialize: try to restore session on app load ─────────────────────────
  // The refresh token is in an httpOnly cookie — silentRefresh inside api.ts
  // handles getting a new accessToken automatically when /auth/me returns 401.
  useEffect(() => {
    (async () => {
      try {
        // First try silent refresh to get a new accessToken
        const refreshRes = await fetch("/api/v1/auth/refresh", {
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData?.data?.accessToken) {
            tokenStore.set(refreshData.data.accessToken);
          }
        }

        // Now fetch /auth/me with the token
        const res = await api.get<{ data: AuthUser }>("/auth/me");
        setUser(res.data);
      } catch {
        // No valid session — that's fine, user will log in
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<AuthUser> => {
    const res = await api.post<{
      data: { accessToken: string; user: AuthUser };
    }>("/auth/login", { email, password });

    tokenStore.set(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const register = async (data: RegisterData): Promise<AuthUser> => {
    const res = await api.post<{
      data: { accessToken: string; user: AuthUser };
    }>("/auth/register", data);

    tokenStore.set(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Continue even if server logout fails
    }
    tokenStore.set(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, isLoading, role, name, login, register, logout }}
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
