import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
  LayoutDashboard, User, FileText, Briefcase, ClipboardList,
  Brain, Mic, BarChart3, Users, Building, Megaphone, LogOut, Zap, ChevronRight, Crown, CreditCard, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const studentNav = [
  { href: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/student/profile", icon: User, label: "Profile" },
  { href: "/student/resume", icon: FileText, label: "Resume Builder" },
  { href: "/student/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/student/applications", icon: ClipboardList, label: "Applications" },
  { href: "/student/announcements", icon: Megaphone, label: "Notice Board" },
  { href: "/student/ai-resume", icon: Brain, label: "AI Resume" },
  { href: "/student/ai-cover-letter", icon: FileText, label: "AI Cover Letter" },
  { href: "/student/ai-interview", icon: Mic, label: "AI Interview" },
  { href: "/student/premium", icon: Crown, label: "Go Premium" },
];

const recruiterNav = [
  { href: "/recruiter/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/recruiter/profile", icon: Building, label: "Company Profile" },
  { href: "/recruiter/jobs", icon: Briefcase, label: "My Jobs" },
  { href: "/recruiter/jobs/new", icon: Zap, label: "Post a Job" },
  { href: "/recruiter/payment", icon: CreditCard, label: "Payments" },
];

const adminNav = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/students", icon: Users, label: "Students" },
  { href: "/admin/recruiters", icon: Building, label: "Recruiters" },
  { href: "/admin/placements", icon: BarChart3, label: "Placements" },
  { href: "/admin/announcements", icon: Megaphone, label: "Announcements" },
];

function NavItem({ href, icon: Icon, label, onClose }: { href: string; icon: React.ElementType; label: string; onClose?: () => void }) {
  const [location] = useLocation();
  const isActive = location === href || (href !== "/" && location.startsWith(href));

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ x: 2 }}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 group",
          isActive
            ? "bg-primary/15 text-primary border border-primary/20 glow-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
        )}
        data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <Icon size={16} className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        <span>{label}</span>
        {isActive && <ChevronRight size={12} className="ml-auto text-primary" />}
      </motion.div>
    </Link>
  );
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const navItems = user?.role === "student" ? studentNav : user?.role === "recruiter" ? recruiterNav : adminNav;
  const roleLabel = user?.role === "student" ? "Student" : user?.role === "recruiter" ? "Recruiter" : "Admin";
  const roleColor = user?.role === "student" ? "text-accent" : user?.role === "recruiter" ? "text-primary" : "text-chart-3";

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="flex flex-col h-full w-64 bg-sidebar border-r border-sidebar-border">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={onClose}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight gradient-text font-serif">HireLoop</span>
            </div>
          </Link>
          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
              aria-label="Close menu"
              data-testid="button-close-mobile-sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-primary/20">
            <span className="text-sm font-semibold text-primary">{user?.name?.[0]?.toUpperCase() ?? "U"}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
            <p className={cn("text-xs font-medium", roleColor)}>{roleLabel}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => (
          <NavItem key={item.href} {...item} onClose={onClose} />
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full"
          data-testid="button-logout"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
