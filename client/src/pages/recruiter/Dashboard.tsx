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
      </div>
    </div>
  );
}
