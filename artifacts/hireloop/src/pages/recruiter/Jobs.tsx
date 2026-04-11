import { useState } from "react";
import { motion } from "framer-motion";
import { useListJobs, useGetJobApplications, useUpdateApplicationStatus, getListJobsQueryKey } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Briefcase, Users, ChevronDown, ChevronUp, Plus, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

const APPLICATION_STATUSES = ["applied", "shortlisted", "interview", "offer", "rejected"] as const;
const statusColors: Record<string, string> = {
  applied: "border-blue-500/20 text-blue-400",
  shortlisted: "border-amber-500/20 text-amber-400",
  interview: "border-purple-500/20 text-purple-400",
  offer: "border-green-500/20 text-green-400",
  rejected: "border-red-500/20 text-red-400",
};

function JobRow({ job }: { job: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const j = job as { id: number; title: string; company: string; status: string; jobType: string; applicantCount: number; deadline: string };

  const { data: applications, isLoading } = useGetJobApplications(j.id, {}, { query: { enabled: expanded } });
  const updateStatus = useUpdateApplicationStatus();

  const filtered = filter === "all" ? (applications ?? []) : (applications ?? []).filter(a => a!.status === filter);

  const handleStatusChange = (appId: number, status: string) => {
    updateStatus.mutate({ applicationId: appId, data: { status: status as typeof APPLICATION_STATUSES[number] } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey({}) });
        toast({ title: `Application updated to ${status}` });
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  };

  return (
    <div className="rounded-2xl bg-card border border-card-border overflow-hidden" data-testid={`job-row-${j.id}`}>
      <div
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-secondary/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Briefcase size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold">{j.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("text-xs px-2 py-0.5 rounded-full capitalize", j.status === "active" ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground")}>
                {j.status}
              </span>
              <span className="text-xs text-muted-foreground capitalize">{j.jobType}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm font-semibold">{j.applicantCount}</p>
            <p className="text-xs text-muted-foreground">applicants</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={10} /> Due {formatDistanceToNow(new Date(j.deadline), { addSuffix: true })}</p>
          </div>
          {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-border p-5">
          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {["all", ...APPLICATION_STATUSES].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn("px-3 py-1 rounded-lg text-xs font-medium border capitalize transition-all", filter === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}
                data-testid={`filter-${s}`}
              >
                {s} {s === "all" ? `(${(applications ?? []).length})` : `(${(applications ?? []).filter(a => a!.status === s).length})`}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-secondary/30 rounded-xl animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Users size={24} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No applicants in this category</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((app) => {
                if (!app) return null;
                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border"
                    data-testid={`applicant-${app.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
                        {app.student?.name?.[0] ?? "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{app.student?.name}</p>
                        <p className="text-xs text-muted-foreground">{app.student?.branch} · CGPA {app.student?.cgpa} · {app.student?.batch}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        className={cn("text-xs font-semibold bg-transparent border px-2.5 py-1 rounded-full cursor-pointer focus:outline-none", statusColors[app.status])}
                        data-testid={`select-status-${app.id}`}
                      >
                        {APPLICATION_STATUSES.map(s => <option key={s} value={s} className="text-foreground bg-background capitalize">{s}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function RecruiterJobs() {
  const { data: jobs, isLoading } = useListJobs({});

  return (
    <DashboardLayout requiredRole="recruiter">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif">My Jobs</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your job postings and applicants</p>
          </div>
          <Link href="/recruiter/jobs/new">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold" data-testid="button-post-job">
              <Plus size={15} /> Post Job
            </motion.button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />)}</div>
        ) : (jobs ?? []).length === 0 ? (
          <div className="text-center py-20">
            <Briefcase size={40} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold">No jobs posted yet</p>
            <p className="text-muted-foreground text-sm mt-2 mb-6">Post your first campus job to start recruiting</p>
            <Link href="/recruiter/jobs/new">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold mx-auto" data-testid="button-post-first-job">
                <Plus size={15} /> Post a Job
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {(jobs ?? []).map(job => (
              <JobRow key={job.id} job={job as Record<string, unknown>} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
