import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
  LayoutDashboard, User, FileText, Briefcase, ClipboardList,
  Brain, Mic, BarChart3, Users, Building, Megaphone, LogOut, Zap,
  ChevronRight, Crown, CreditCard, Sparkles, Target, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

const studentNav = [
  { href: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/student/profile", icon: User, label: "Profile" },
  { href: "/student/resume", icon: FileText, label: "Resume Builder" },
  { href: "/student/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/student/recommendations", icon: Sparkles, label: "Recommendations" },
  { href: "/student/applications", icon: ClipboardList, label: "Applications" },
  { href: "/student/ai-resume", icon: Brain, label: "AI Resume" },
  { href: "/student/ai-interview", icon: Mic, label: "AI Interview" },
  { href: "/student/cover-letter", icon: FileText, label: "Cover Letter", className: "hidden" },
  { href: "/student/skill-radar", icon: Target, label: "Skill Radar" },
  { href: "/student/premium", icon: Crown, label: "Go Premium" },
];

const studentMobileNav = [
  { href: "/student/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/student/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/student/recommendations", icon: Sparkles, label: "For You" },
  { href: "/student/applications", icon: ClipboardList, label: "Applied" },
  { href: "/student/profile", icon: User, label: "Profile" },
];

const recruiterNav = [
  { href: "/recruiter/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/recruiter/profile", icon: Building, label: "Company Profile" },
  { href: "/recruiter/jobs", icon: Briefcase, label: "My Jobs" },
  { href: "/recruiter/jobs/new", icon: Zap, label: "Post a Job" },
  { href: "/recruiter/payment", icon: CreditCard, label: "Payments" },
];

const recruiterMobileNav = [
  { href: "/recruiter/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/recruiter/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/recruiter/jobs/new", icon: Zap, label: "Post" },
  { href: "/recruiter/profile", icon: Building, label: "Profile" },
];

const adminNav = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/students", icon: Users, label: "Students" },
  { href: "/admin/recruiters", icon: Building, label: "Recruiters" },
  { href: "/admin/jobs", icon: Briefcase, label: "Job Approvals" },
  { href: "/admin/placements", icon: BarChart3, label: "Placements" },
  { href: "/admin/announcements", icon: Megaphone, label: "Announcements" },
];

const adminMobileNav = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/admin/students", icon: Users, label: "Students" },
  { href: "/admin/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/admin/announcements", icon: Megaphone, label: "Posts" },
];

function NavItem({ href, icon: Icon, label, small }: { href: string; icon: React.ElementType; label: string; small?: boolean }) {
  const [location] = useLocation();
  const isActive = location === href || (href !== "/" && location.startsWith(href));

  if (small) {
    return (
      <Link href={href}>
        <div className={cn(
          "flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}>
          <Icon size={20} className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground")} />
          <span className="text-[10px]">{label}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ x: 2 }}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 group",
          isActive
            ? "bg-primary/15 text-primary border border-primary/20 glow-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
        )}
        data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <Icon size={16} className={cn("transition-colors shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        <span className="truncate">{label}</span>
        {isActive && <ChevronRight size={12} className="ml-auto text-primary shrink-0" />}
      </motion.div>
    </Link>
  );
}

export function MobileBottomNav() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const mobileNav = user?.role === "student" ? studentMobileNav
    : user?.role === "recruiter" ? recruiterMobileNav
    : adminMobileNav;

  if (!user) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border md:hidden safe-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {mobileNav.map(item => (
          <NavItem key={item.href} {...item} small />
        ))}
        <button
          onClick={() => { logout(); setLocation("/"); }}
          className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all text-muted-foreground hover:text-destructive"
        >
          <LogOut size={20} />
          <span className="text-[10px]">Out</span>
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
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
    <div className="hidden md:flex flex-col h-full w-64 bg-sidebar border-r border-sidebar-border shrink-0">
      <div className="p-5 border-b border-sidebar-border">
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight gradient-text font-serif">HireLoop</span>
          </div>
        </Link>
      </div>

      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-primary/20 shrink-0">
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
          <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
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
