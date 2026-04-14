import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListJobs, useApplyToJob, getListJobsQueryKey } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, MapPin, DollarSign, Clock, Briefcase, Filter, X, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const BRANCHES = ["All", "CSE", "ECE", "EE", "ME", "CE", "IT"];
const JOB_TYPES = ["all", "fulltime", "internship", "contract"];

function JobCard({ job, onApply, applying }: { job: Record<string, unknown>; onApply: (id: number) => void; applying: boolean }) {
  const j = job as { id: number; title: string; company: string; location?: string; salaryMin?: number; salaryMax?: number; jobType: string; eligibleBranches: string[]; minCgpa: number; skills: string[]; deadline: string; applicantCount: number };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="p-5 rounded-2xl bg-card border border-card-border hover:border-primary/30 transition-all duration-300 flex flex-col gap-3"
      data-testid={`card-job-${j.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("px-2 py-0.5 rounded-md text-xs font-semibold", {
              "bg-green-500/10 text-green-400": j.jobType === "fulltime",
              "bg-blue-500/10 text-blue-400": j.jobType === "internship",
              "bg-amber-500/10 text-amber-400": j.jobType === "contract",
            })}>
              {j.jobType}
            </span>
          </div>
          <h3 className="font-semibold text-foreground">{j.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{j.company}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
          <Briefcase size={18} className="text-primary" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {j.location && <span className="flex items-center gap-1"><MapPin size={11} />{j.location}</span>}
        {j.salaryMin && j.salaryMax && (
          <span className="flex items-center gap-1"><DollarSign size={11} />{j.salaryMin}-{j.salaryMax} LPA</span>
        )}
        <span className="flex items-center gap-1"><Clock size={11} />Due {formatDistanceToNow(new Date(j.deadline), { addSuffix: true })}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {j.skills.slice(0, 4).map((s: string) => (
          <span key={s} className="px-2 py-0.5 bg-secondary rounded-md text-xs text-muted-foreground">{s}</span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Min CGPA: {j.minCgpa}</p>
          <p>{j.applicantCount} applicants</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onApply(j.id)}
          disabled={applying}
          className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
          data-testid={`button-apply-${j.id}`}
        >
          {applying ? "Applying..." : "Apply Now"}
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function StudentJobs() {
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("All");
  const [jobType, setJobType] = useState("all");
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const applyMutation = useApplyToJob();

  const params: { search?: string; branch?: string } = {};
  if (search) params.search = search;
  if (branch !== "All") params.branch = branch;

  const { data: jobs, isLoading } = useListJobs(params);

  const filtered = (jobs ?? []).filter(j => jobType === "all" || j.jobType === jobType);

  const handleApply = (jobId: number) => {
    setApplyingId(jobId);
    applyMutation.mutate({ data: { jobId } }, {
      onSuccess: () => {
        toast({ title: "Application submitted!", description: "Good luck!" });
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey(params) });
        setApplyingId(null);
      },
      onError: (err: unknown) => {
        const e = err as { response?: { data?: { error?: string } } };
        toast({ title: e?.response?.data?.error ?? "Failed to apply", variant: "destructive" });
        setApplyingId(null);
      },
    });
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold font-serif">Job Board</h1>
          <p className="text-muted-foreground text-sm mt-1">Browse {filtered.length} open positions</p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search roles, companies..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-jobs"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {BRANCHES.map(b => (
              <button
                key={b}
                onClick={() => setBranch(b)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", branch === b ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}
                data-testid={`filter-branch-${b.toLowerCase()}`}
              >
                {b}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {JOB_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setJobType(t)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize", jobType === t ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent/30")}
                data-testid={`filter-type-${t}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-48 rounded-2xl bg-card animate-pulse" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((job) => (
              <JobCard
                key={job.id}
                job={job as Record<string, unknown>}
                onApply={handleApply}
                applying={applyingId === job.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Briefcase size={40} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold">No jobs found</p>
            <p className="text-muted-foreground text-sm mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
