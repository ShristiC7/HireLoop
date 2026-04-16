import { type ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
  requiredRole?: "student" | "recruiter" | "admin";
}

export default function DashboardLayout({ children, requiredRole }: Props) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && requiredRole && user.role !== requiredRole) {
      if (user.role === "student") setLocation("/student/dashboard");
      else if (user.role === "recruiter") setLocation("/recruiter/dashboard");
      else setLocation("/admin/dashboard");
    }
  }, [user, isLoading, requiredRole, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading HireLoop...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <motion.main
        key="dashboard-main"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 overflow-y-auto"
      >
        <div className="min-h-full p-6">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
