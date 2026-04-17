import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CheckCircle, XCircle, Briefcase, Building, Calendar, Users, AlertCircle, Clock, ChevronDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface PendingJob {
  id: number;
  title: string;
  company: string;
  location?: string;
  jobType: string;
  description: string;
  skills: string[];
  minCgpa: number;
  eligibleBranches: string[];
  deadline: string;
  salaryMin?: number;
  salaryMax?: number;
  applicantCount: number;
  createdAt: string;
  status: string;
}

export default function AdminJobs() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const apiBase = import.meta.env.VITE_API_URL ?? `${import.meta.env.BASE_URL}api`;

  const { data: pendingJobs, isLoading } = useQuery<PendingJob[]>({
    queryKey: ["admin-pending-jobs"],
    queryFn: async () => {
      const resp = await fetch(`${apiBase}/jobs/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Failed");
      return resp.json();
    },
  });

  const { data: allJobs } = useQuery<PendingJob[]>({
    queryKey: ["admin-all-jobs"],
    queryFn: async () => {
      const resp = await fetch(`${apiBase}/jobs?status=all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Failed");
      return resp.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const resp = await fetch(`${apiBase}/jobs/${jobId}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Failed");
      return resp.json();
    },
    onSuccess: () => {
      toast({ title: "Job approved and now live!" });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-jobs"] });
    },
    onError: () => toast({ title: "Failed to approve", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ jobId, reason }: { jobId: number; reason: string }) => {
      const resp = await fetch(`${apiBase}/jobs/${jobId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      if (!resp.ok) throw new Error("Failed");
      return resp.json();
    },
    onSuccess: () => {
      toast({ title: "Job rejected" });
      setRejectingId(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-jobs"] });
    },
    onError: () => toast({ title: "Failed to reject", variant: "destructive" }),
  });

  const jobTypeLabel: Record<string, string> = { fulltime: "Full-Time", internship: "Internship", contract: "Contract" };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Briefcase size={16} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold font-serif">Job Approvals</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-11">Review and approve job postings from recruiters</p>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pending Review", value: pendingJobs?.length ?? 0, color: "bg-amber-500/10 text-amber-600", icon: Clock },
            { label: "Active Jobs", value: allJobs?.filter(j => j.status === "active").length ?? 0, color: "bg-green-500/10 text-green-600", icon: CheckCircle },
            { label: "Total Jobs", value: allJobs?.length ?? 0, color: "bg-primary/10 text-primary", icon: Briefcase },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className={cn("p-4 rounded-2xl bg-card border border-card-border flex items-center gap-3")}>
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color.replace("text-", "bg-").split(" ")[0])}>
                <Icon size={18} className={color.split(" ")[1]} />
              </div>
              <div>
                <p className="text-xl font-bold font-serif">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <Clock size={14} className="text-amber-500" />
            Pending Approval ({pendingJobs?.length ?? 0})
          </h2>

          {isLoading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-card border border-card-border animate-pulse" />)}
            </div>
          )}

          {!isLoading && (!pendingJobs || pendingJobs.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl bg-card border border-card-border text-center">
              <CheckCircle size={32} className="text-green-500 mb-3" />
              <p className="font-semibold">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">No job postings are waiting for review</p>
            </div>
          )}

          {pendingJobs?.map((job, idx) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-2xl bg-card border border-card-border overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                        <Clock size={10} /> Pending
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary/60 text-muted-foreground border border-border">
                        {jobTypeLabel[job.jobType] ?? job.jobType}
                      </span>
                    </div>
                    <h3 className="font-semibold">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Building size={11} /> {job.company}</span>
                      {job.location && <span>{job.location}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        Submitted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                      </span>
                      <span>Min CGPA: {job.minCgpa}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
                      className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground transition-colors"
                    >
                      <ChevronDown size={14} className={cn("transition-transform", expandedId === job.id ? "rotate-180" : "")} />
                    </button>
                    <button
                      onClick={() => approveMutation.mutate(job.id)}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-600 border border-green-500/20 text-xs font-semibold hover:bg-green-500/25 transition-colors disabled:opacity-60"
                    >
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button
                      onClick={() => setRejectingId(rejectingId === job.id ? null : job.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-500 border border-red-500/20 text-xs font-semibold hover:bg-red-500/25 transition-colors"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                </div>

                {rejectingId === job.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 space-y-2"
                  >
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection (will be emailed to recruiter)..."
                      rows={2}
                      className="w-full bg-secondary/30 border border-red-500/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => rejectMutation.mutate({ jobId: job.id, reason: rejectReason })}
                        disabled={rejectMutation.isPending}
                        className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-60"
                      >
                        Confirm Reject
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(""); }}
                        className="px-3 py-1.5 rounded-lg bg-secondary/50 text-xs font-medium hover:bg-secondary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {expandedId === job.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 pt-4 border-t border-border space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-1">Eligible Branches</p>
                        <p className="font-medium">{job.eligibleBranches.length > 0 ? job.eligibleBranches.join(", ") : "All branches"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Application Deadline</p>
                        <p className="font-medium">{new Date(job.deadline).toLocaleDateString()}</p>
                      </div>
                      {job.salaryMin && (
                        <div>
                          <p className="text-muted-foreground mb-1">Salary Range</p>
                          <p className="font-medium">₹{job.salaryMin}–{job.salaryMax} LPA</p>
                        </div>
                      )}
                    </div>
                    {job.skills.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Required Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {job.skills.map(s => (
                            <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-secondary/60 border border-border">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Job Description</p>
                      <p className="text-xs text-foreground leading-relaxed line-clamp-4">{job.description}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
