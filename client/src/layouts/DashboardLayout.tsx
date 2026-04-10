import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SidebarLink from "../components/SidebarLink";
import Footer from "../components/Footer";
import {
  LayoutDashboard, Briefcase, FileText, ClipboardList,
  MessageSquare, Users, PlusCircle, Building2, Megaphone,
  LogOut, Menu, X
} from "lucide-react";
import { useState } from "react";

const studentLinks = [
  { to: "/student", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { to: "/student/jobs", icon: <Briefcase size={18} />, label: "Job Listings" },
  { to: "/student/resume", icon: <FileText size={18} />, label: "Resume Builder" },
  { to: "/student/tracker", icon: <ClipboardList size={18} />, label: "Application Tracker" },
  { to: "/student/interview", icon: <MessageSquare size={18} />, label: "Mock Interview" },
];

const recruiterLinks = [
  { to: "/recruiter", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { to: "/recruiter/post", icon: <PlusCircle size={18} />, label: "Post Job" },
  { to: "/recruiter/applicants", icon: <Users size={18} />, label: "Applicants" },
];

const adminLinks = [
  { to: "/admin", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { to: "/admin/companies", icon: <Building2 size={18} />, label: "Company Approval" },
  { to: "/admin/announcements", icon: <Megaphone size={18} />, label: "Announcements" },
];

export default function DashboardLayout() {
  const { role, name, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = role === "student" ? studentLinks : role === "recruiter" ? recruiterLinks : adminLinks;
  const roleLabel = role === "student" ? "Student" : role === "recruiter" ? "Recruiter" : "Admin";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white">
            Hire<span className="text-purple-400">Loop</span>
          </h1>
          <p className="text-xs text-gray-400 mt-2">{roleLabel} Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {links.map((link) => (
            <div key={link.to} onClick={() => setSidebarOpen(false)}>
              <SidebarLink {...link} />
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{name}</p>
              <p className="text-xs text-gray-400 capitalize">{role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-red-400 w-full px-3 py-2 rounded-lg transition-colors hover:bg-red-400/10"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-8 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu size={20} className="text-gray-600" />
          </button>
          <div className="ml-auto text-sm text-gray-600">
            Welcome back, <span className="font-semibold text-gray-900">{name}</span>!
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
