import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

import StudentDashboard from "@/pages/student/Dashboard";
import StudentProfile from "@/pages/student/Profile";
import StudentResume from "@/pages/student/Resume";
import StudentJobs from "@/pages/student/Jobs";
import StudentApplications from "@/pages/student/Applications";
import AIResume from "@/pages/student/AIResume";
import AIInterview from "@/pages/student/AIInterview";

import RecruiterDashboard from "@/pages/recruiter/Dashboard";
import RecruiterJobs from "@/pages/recruiter/Jobs";
import PostJob from "@/pages/recruiter/PostJob";

import AdminDashboard from "@/pages/admin/Dashboard";
import AdminStudents from "@/pages/admin/Students";
import AdminRecruiters from "@/pages/admin/Recruiters";
import AdminPlacements from "@/pages/admin/Placements";
import AdminAnnouncements from "@/pages/admin/Announcements";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Student */}
      <Route path="/student/dashboard" component={StudentDashboard} />
      <Route path="/student/profile" component={StudentProfile} />
      <Route path="/student/resume" component={StudentResume} />
      <Route path="/student/jobs" component={StudentJobs} />
      <Route path="/student/applications" component={StudentApplications} />
      <Route path="/student/ai-resume" component={AIResume} />
      <Route path="/student/ai-interview" component={AIInterview} />

      {/* Recruiter */}
      <Route path="/recruiter/dashboard" component={RecruiterDashboard} />
      <Route path="/recruiter/jobs" component={RecruiterJobs} />
      <Route path="/recruiter/jobs/new" component={PostJob} />

      {/* Admin */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/students" component={AdminStudents} />
      <Route path="/admin/recruiters" component={AdminRecruiters} />
      <Route path="/admin/placements" component={AdminPlacements} />
      <Route path="/admin/announcements" component={AdminAnnouncements} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
