import { type ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";

interface Props {
  children: ReactNode;
  requiredRole?: "student" | "recruiter" | "admin";
}

export default function DashboardLayout({ children, requiredRole }: Props) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  // FR-109: mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && requiredRole && user.role !== requiredRole) {
      if (user.role === "student") setLocation("/student/dashboard");
      else if (user.role === "recruiter") setLocation("/recruiter/dashboard");
      else setLocation("/admin/dashboard");
    }
  }, [user, isLoading, requiredRole, setLocation]);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [useLocation()[0]]);

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
      {/* Desktop sidebar — always visible on lg+ */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay — FR-109 */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            {/* Sidebar drawer */}
            <motion.div
              key="sidebar-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar onClose={() => setMobileSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.main
        key="dashboard-main"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 overflow-y-auto"
      >
        {/* Mobile top bar — FR-109 */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background sticky top-0 z-30">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
            aria-label="Open menu"
            data-testid="button-mobile-menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-base tracking-tight gradient-text font-serif">HireLoop</span>
        </div>

        <div className="min-h-full p-4 md:p-6">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
