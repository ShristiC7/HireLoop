import { useState } from "react";
import { motion } from "framer-motion";
import { useListStudents } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Users, Search, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const BRANCHES = ["All", "CSE", "ECE", "EE", "ME", "CE", "IT"];
const PLACEMENT = ["all", "placed", "not placed"];

const placementColors: Record<string, string> = {
  placed: "bg-green-500/10 text-green-400 border-green-500/20",
  "not placed": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  in_process: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function AdminStudents() {
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("All");
  const [placementFilter, setPlacementFilter] = useState("all");

  const { data: students, isLoading } = useListStudents({ branch: branch !== "All" ? branch : undefined });

  const filtered = (students ?? []).filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout requiredRole="admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2 mb-1">
            <Users size={20} className="text-primary" />
            <h1 className="text-2xl font-bold font-serif">All Students</h1>
          </div>
          <p className="text-muted-foreground text-sm">{filtered.length} students total</p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name or email..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {BRANCHES.map(b => (
              <button key={b} onClick={() => setBranch(b)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", branch === b ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30")} data-testid={`filter-branch-${b.toLowerCase()}`}>{b}</button>
            ))}
          </div>
          <div className="flex gap-2">
            {PLACEMENT.map(p => (
              <button key={p} onClick={() => setPlacementFilter(p)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-all", placementFilter === p ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent/30")} data-testid={`filter-placed-${p}`}>{p}</button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users size={40} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold">No students found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-card-border">
            <table className="w-full">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  {["Student", "Branch", "CGPA", "Batch", "Status", "Resume Score"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((student, i) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-secondary/20 transition-colors"
                    data-testid={`student-row-${student.id}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-bold text-primary">
                          {student.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{student.name}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <GraduationCap size={11} /> {student.branch}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-semibold text-foreground">{student.cgpa}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{student.batch}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border capitalize", placementColors[student.placementStatus] ?? "bg-muted text-muted-foreground border-border")}>
                        {student.placementStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${student.resumeScore}%` }} />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">{student.resumeScore}%</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
