<<<<<<< HEAD
import { useState, useEffect } from "react";
import StatCard from "../../components/StatCard";
import { Briefcase, Users, FileCheck, Loader2 } from "lucide-react";
import { api } from "../../lib/api";

interface DashboardData {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  shortlisted: number;
  recentApplications: Array<{
    id: string;
    status: string;
    appliedAt: string;
    student: {
      firstName: string;
      lastName: string;
      department: string;
      cgpa?: number;
    };
    job: { title: string };
  }>;
}

const STATUS_BADGE: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-700",
  SHORTLISTED: "bg-green-100 text-green-700",
  INTERVIEW_SCHEDULED: "bg-yellow-100 text-yellow-700",
  OFFER: "bg-purple-100 text-purple-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function RecruiterDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: DashboardData }>("/recruiter/dashboard")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-12">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recruiter Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview of your hiring activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Job Posts"
          value={data?.totalJobs ?? 0}
          icon={<Briefcase size={20} />}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Total Applicants"
          value={data?.totalApplications ?? 0}
          icon={<Users size={20} />}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
        <StatCard
          title="Shortlisted"
          value={data?.shortlisted ?? 0}
          icon={<FileCheck size={20} />}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Recent Applicants</h3>
        {!data?.recentApplications?.length ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
            <p>No applicants yet. Post a job to start receiving applications.</p>
            <a
              href="/recruiter/post"
              className="text-blue-600 hover:underline text-sm mt-1 inline-block"
            >
              Post a job →
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Branch</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">CGPA</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Job</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentApplications.map((app) => (
                  <tr key={app.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {app.student.firstName} {app.student.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{app.student.department}</td>
                    <td className="px-4 py-3">{app.student.cgpa ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{app.job.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          STATUS_BADGE[app.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {app.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
=======
import StatCard from "../../components/StatCard";
import { Briefcase, Users, FileCheck } from "lucide-react";
import { students } from "../../data/students";

export default function RecruiterDashboard() {
  const postedJobs: any[] = JSON.parse(localStorage.getItem("hireloop_posted_jobs") || "[]");

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Recruiter Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Job Posts" value={postedJobs.length} icon={<Briefcase size={20} />} />
        <StatCard title="Total Applicants" value={students.length} icon={<Users size={20} />} color="bg-warning/10 text-warning" />
        <StatCard title="Shortlisted" value={students.filter(s => s.status === "Shortlisted").length} icon={<FileCheck size={20} />} color="bg-success/10 text-success" />
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">Recent Applicants</h3>
        <div className="bg-card rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Branch</th>
                <th className="text-left px-4 py-3 font-medium">CGPA</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.slice(0, 5).map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.branch}</td>
                  <td className="px-4 py-3">{s.cgpa}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      s.status === "Shortlisted" ? "bg-success/10 text-success" :
                      s.status === "Rejected" ? "bg-destructive/10 text-destructive" :
                      "bg-accent text-accent-foreground"
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
>>>>>>> 14bd8b14076dc1cb4408c222a00edc5c9c780f11
      </div>
    </div>
  );
}
