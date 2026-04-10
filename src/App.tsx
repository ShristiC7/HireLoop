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

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: string }) {
  const { isLoggedIn, role } = useAuth();
  if (!isLoggedIn) return <Navigate to="/" replace />;
  if (role !== allowedRole) return <Navigate to={`/${role}`} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isLoggedIn, role } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isLoggedIn ? <Navigate to={`/${role}`} replace /> : <Login />} />

      <Route path="/student" element={<ProtectedRoute allowedRole="student"><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="jobs" element={<JobListings />} />
        <Route path="resume" element={<ResumeBuilder />} />
        <Route path="tracker" element={<ApplicationTracker />} />
        <Route path="interview" element={<MockInterview />} />
      </Route>

      <Route path="/recruiter" element={<ProtectedRoute allowedRole="recruiter"><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<RecruiterDashboard />} />
        <Route path="post" element={<PostJob />} />
        <Route path="applicants" element={<Applicants />} />
      </Route>

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
