import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListStudents } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Users, Search, GraduationCap, X, Award, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const BRANCHES = ["All", "CSE", "ECE", "EE", "ME", "CE", "IT"];
const PLACEMENT = ["all", "placed", "not placed"];

const placementColors: Record<string, string> = {
  placed: "bg-green-500/10 text-green-400 border-green-500/20",
  "not placed": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  unplaced: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  in_process: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  internship: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

interface PlacementModalProps {
  student: { id: number; name: string; placementStatus: string; placedCompany?: string | null; packageLpa?: number | null };
  onClose: () => void;
  onSave: (id: number, status: string, company: string, pkg: number | null) => void;
}

function PlacementModal({ student, onClose, onSave }: PlacementModalProps) {
  const [status, setStatus] = useState(student.placementStatus);
  const [company, setCompany] = useState(student.placedCompany ?? "");
  const [pkg, setPkg] = useState(student.packageLpa?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(student.id, status, company, pkg ? parseFloat(pkg) : null);
    setSaving(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-card-border rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Update Placement Status</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{student.name}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-secondary/50 flex items-center justify-center transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Placement Status</label>
            <div className="flex gap-2">
              {["unplaced", "placed", "internship"].map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-semibold border capitalize transition-all",
                    status === s
                      ? s === "placed" ? "bg-green-500/10 text-green-400 border-green-500/30" : s === "internship" ? "bg-blue-500/10 text-blue-400 border-blue-500/30" : "bg-muted text-muted-foreground border-border"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {(status === "placed" || status === "internship") && (
            <>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Company Name</label>
                <div className="relative">
                  <Building size={13} className="absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Google, Infosys, TCS"
                    className="w-full pl-8 pr-3 bg-secondary/30 border border-border rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                  Package (LPA){status === "internship" ? " / Monthly Stipend (₹)" : ""}
                </label>
                <div className="relative">
                  <Award size={13} className="absolute left-3 top-2.5 text-muted-foreground" />
                  <input
                    type="number"
                    value={pkg}
                    onChange={e => setPkg(e.target.value)}
                    step="0.5"
                    min="0"
                    placeholder={status === "placed" ? "e.g. 8.5" : "e.g. 25000"}
                    className="w-full pl-8 pr-3 bg-secondary/30 border border-border rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary/30 transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-60"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Save Status"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AdminStudents() {
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("All");
  const [placementFilter, setPlacementFilter] = useState("all");
  const [modal, setModal] = useState<null | { id: number; name: string; placementStatus: string; placedCompany?: string | null; packageLpa?: number | null }>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useListStudents({ branch: branch !== "All" ? branch : undefined });

  const filtered = (students ?? []).filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.email?.toLowerCase().includes(search.toLowerCase())) return false;
    if (placementFilter === "placed" && s.placementStatus !== "placed") return false;
    if (placementFilter === "not placed" && s.placementStatus === "placed") return false;
    return true;
  });

  const handleUpdatePlacement = async (id: number, status: string, company: string, pkg: number | null) => {
    try {
      const res = await fetch(`${BASE}/api/admin/students/${id}/placement`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ placementStatus: status, placedCompany: company || null, packageLpa: pkg }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast({ title: "Student placement updated!" });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    } catch {
      toast({ title: "Failed to update placement", variant: "destructive" });
    }
  };

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
                  {["Student", "Branch", "CGPA", "Batch", "Status", "Resume Score", "Actions"].map(h => (
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
                          {student.placedCompany && (
                            <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
                              <Building size={9} /> {student.placedCompany} {student.packageLpa ? `· ${student.packageLpa} LPA` : ""}
                            </p>
                          )}
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
                    <td className="px-4 py-3">
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setModal({ id: student.id, name: student.name, placementStatus: student.placementStatus, placedCompany: student.placedCompany, packageLpa: student.packageLpa })}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                        data-testid={`button-update-placement-${student.id}`}
                      >
                        Update
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <PlacementModal
            student={modal}
            onClose={() => setModal(null)}
            onSave={handleUpdatePlacement}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
