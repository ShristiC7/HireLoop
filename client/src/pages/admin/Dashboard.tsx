import StatCard from "../../components/StatCard";
import { Users, Building2, Trophy } from "lucide-react";
import { students } from "../../data/students";
import { companies } from "../../data/companies";

export default function AdminDashboard() {
  const placed = students.filter((s) => s.status === "Offer").length;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Admin Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Students" value={students.length} icon={<Users size={20} />} />
        <StatCard title="Total Companies" value={companies.length} icon={<Building2 size={20} />} color="bg-warning/10 text-warning" />
        <StatCard title="Placements" value={placed} icon={<Trophy size={20} />} color="bg-success/10 text-success" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-medium mb-3">Branch Distribution</h3>
          <div className="space-y-2">
            {["CSE", "IT", "ECE"].map((branch) => {
              const count = students.filter((s) => s.branch === branch).length;
              const pct = Math.round((count / students.length) * 100);
              return (
                <div key={branch} className="flex items-center gap-3">
                  <span className="text-sm w-10">{branch}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div className="bg-primary rounded-full h-2" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-medium mb-3">Placement Status</h3>
          <div className="space-y-2">
            {["Applied", "Shortlisted", "Interview", "Offer", "Rejected"].map((status) => {
              const count = students.filter((s) => s.status === status).length;
              return (
                <div key={status} className="flex justify-between text-sm">
                  <span>{status}</span>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
