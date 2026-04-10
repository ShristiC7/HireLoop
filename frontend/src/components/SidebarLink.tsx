import { NavLink as RouterNavLink } from "react-router-dom";
import { ReactNode } from "react";

interface SidebarLinkProps {
  to: string;
  icon: ReactNode;
  label: string;
}

export default function SidebarLink({ to, icon, label }: SidebarLinkProps) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all font-medium ${
          isActive
            ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 border-l-2 border-purple-400"
            : "text-gray-300 hover:bg-slate-700/50 hover:text-white"
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </RouterNavLink>
  );
}
