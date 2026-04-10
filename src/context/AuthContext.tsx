import { createContext, useContext, useState, ReactNode } from "react";

type Role = "student" | "recruiter" | "admin";

interface AuthState {
  isLoggedIn: boolean;
  role: Role | null;
  name: string;
  login: (role: Role, name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setLoggedIn] = useState(() => {
    return localStorage.getItem("hireloop_logged") === "true";
  });
  const [role, setRole] = useState<Role | null>(() => {
    return (localStorage.getItem("hireloop_role") as Role) || null;
  });
  const [name, setName] = useState(() => {
    return localStorage.getItem("hireloop_name") || "";
  });

  const login = (r: Role, n: string) => {
    setLoggedIn(true);
    setRole(r);
    setName(n);
    localStorage.setItem("hireloop_logged", "true");
    localStorage.setItem("hireloop_role", r);
    localStorage.setItem("hireloop_name", n);
  };

  const logout = () => {
    setLoggedIn(false);
    setRole(null);
    setName("");
    localStorage.removeItem("hireloop_logged");
    localStorage.removeItem("hireloop_role");
    localStorage.removeItem("hireloop_name");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, name, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
