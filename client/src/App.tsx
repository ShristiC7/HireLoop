import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";
import StudentDashboard from "./pages/student/Dashboard";
import JobListings from "./pages/student/JobListings";
import ResumeBuilder from "./pages/student/ResumeBuilder";
import ApplicationTracker from "./pages/student/ApplicationTracker";
import MockInterview from "./pages/student/MockInterview";
import RecruiterDashboard from "./pages/recruiter/Dashboard";
import PostJob from "./pages/recruiter/PostJob";
import Applicants from "./pages/recruiter/Applicants";
import AdminDashboard from "./pages/admin/Dashboard";
import CompanyApproval from "./pages/admin/CompanyApproval";
import Announcements from "./pages/admin/Announcements";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Protected route: checks login + role match
function ProtectedRoute({
  children,
  allowedRole,
}: {
  children: React.ReactNode;
  allowedRole: string; // lowercase: "student" | "recruiter" | "admin"
}) {
  const { isLoggedIn, role, isLoading } = useAuth();

  // Show nothing while session restore is in progress
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return <Navigate to="/" replace />;
  // Wrong role → redirect to their own dashboard
  if (role !== allowedRole) return <Navigate to={`/${role}`} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isLoggedIn, role, isLoading } = useAuth();

  // Wait for session check before rendering login vs. dashboard
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading HireLoop...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root: redirect logged-in users to their dashboard */}
      <Route
        path="/"
        element={
          isLoggedIn ? <Navigate to={`/${role}`} replace /> : <Login />
        }
      />

      {/* Student routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="student">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="jobs" element={<JobListings />} />
        <Route path="resume" element={<ResumeBuilder />} />
        <Route path="tracker" element={<ApplicationTracker />} />
        <Route path="interview" element={<MockInterview />} />
      </Route>

      {/* Recruiter routes */}
      <Route
        path="/recruiter"
        element={
          <ProtectedRoute allowedRole="recruiter">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RecruiterDashboard />} />
        <Route path="post" element={<PostJob />} />
        <Route path="applicants" element={<Applicants />} />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
      <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="companies" element={<CompanyApproval />} />
        <Route path="announcements" element={<Announcements />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
