import { Link, useLocation } from "wouter";
import { Home, Briefcase, FileText, User, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileBottomNav({ role }: { role?: string }) {
  const [location] = useLocation();

  const studentLinks = [
    { href: "/student/dashboard", icon: LayoutDashboard, label: "Home" },
    { href: "/student/jobs", icon: Briefcase, label: "Jobs" },
    { href: "/student/applications", icon: FileText, label: "Apps" },
    { href: "/student/profile", icon: User, label: "Profile" },
  ];

  const recruiterLinks = [
    { href: "/recruiter/dashboard", icon: LayoutDashboard, label: "Home" },
    { href: "/recruiter/jobs", icon: Briefcase, label: "Jobs" },
    { href: "/recruiter/profile", icon: User, label: "Profile" },
  ];

  const links = role === "recruiter" ? recruiterLinks : studentLinks;

  if (role === "admin") return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border px-4 py-2 flex items-center justify-around pb-safe">
      {links.map((link) => {
        const isActive = location === link.href;
        const Icon = link.icon;
        
        return (
          <Link key={link.href} href={link.href}>
            <button
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <motion.div
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isActive && "bg-primary/10"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span className="text-[10px] font-medium tracking-tight">
                {link.label}
              </span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}

// Add motion import from framer-motion manually since it might be needed
import { motion } from "framer-motion";
