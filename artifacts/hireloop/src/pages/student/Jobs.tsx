import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListJobs, useApplyToJob, getListJobsQueryKey, useGetStudentProfile } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, MapPin, DollarSign, Clock, Briefcase, Filter, X, CheckCircle, Zap, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const BRANCHES = ["All", "CSE", "ECE", "EE", "ME", "CE", "IT"];
const JOB_TYPES = ["all", "fulltime", "internship", "contract"];

function JobCard({ job, onApply, applying, matchScore }: { job: Record<string, unknown>; onApply: (id: number) => void; applying: boolean; matchScore?: number }) {
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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 relative">
          <Briefcase size={18} className="text-primary" />
          {matchScore !== undefined && matchScore > 70 && (
            <div className="absolute -top-2 -right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Sparkles size={10} className="text-white" />
            </div>
          )}
        </div>
      </div>

      {matchScore !== undefined && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${matchScore}%` }}
              className={cn("h-full", {
                "bg-green-500": matchScore >= 80,
                "bg-amber-500": matchScore >= 50 && matchScore < 80,
                "bg-muted-foreground": matchScore < 50
              })}
            />
          </div>
          <span className={cn("text-[10px] font-bold uppercase", {
            "text-green-500": matchScore >= 80,
            "text-amber-600": matchScore >= 50 && matchScore < 80,
            "text-muted-foreground": matchScore < 50
          })}>
            {matchScore}% Match
          </span>
        </div>
      )}

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
  const [showSmart, setShowSmart] = useState(false);
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const applyMutation = useApplyToJob();
  const { data: profile } = useGetStudentProfile();

  const params: { search?: string; branch?: string } = {};
  if (search) params.search = search;
  if (branch !== "All") params.branch = branch;

  const { data: jobs, isLoading } = useListJobs(params);

  const calculateMatchScore = (job: any) => {
    if (!profile) return undefined;
    
    let score = 0;
    
    // 1. Branch Match (30%)
    const branchMatch = job.eligibleBranches.includes(profile.branch) || job.eligibleBranches.includes("All");
    if (branchMatch) score += 30;

    // 2. CGPA Eligibility (20%)
    if (profile.cgpa >= job.minCgpa) score += 20;

    // 3. Skill Overlap (50%)
    if (job.skills.length > 0) {
      const studentSkills = new Set(profile.skills.map(s => s.toLowerCase()));
      const overlap = job.skills.filter((s: string) => studentSkills.has(s.toLowerCase())).length;
      score += Math.round((overlap / job.skills.length) * 50);
    } else {
      score += 25; // Default if no skills listed
    }

    return Math.min(score, 100);
  };

  const processedJobs = useMemo(() => {
    let result = (jobs ?? []).filter(j => jobType === "all" || j.jobType === jobType);
    
    if (showSmart && profile) {
      return result
        .map(j => ({ ...j, _matchScore: calculateMatchScore(j) }))
        .sort((a, b) => (b._matchScore || 0) - (a._matchScore || 0));
    }
    
    return result;
  }, [jobs, jobType, showSmart, profile]);

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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-serif">Job Board</h1>
            <p className="text-muted-foreground text-sm mt-1">Browse {processedJobs.length} open positions</p>
          </div>
          
          <button 
            onClick={() => setShowSmart(!showSmart)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all border shadow-sm",
              showSmart 
                ? "bg-accent/10 border-accent/40 text-accent ring-2 ring-accent/20" 
                : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
            )}
            data-testid="toggle-smart-recommendations"
          >
            <Zap size={16} className={showSmart ? "fill-accent" : ""} />
            Smart Recommendations
            {showSmart && <Sparkles size={14} className="animate-pulse" />}
          </button>
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
        ) : processedJobs.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {processedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job as Record<string, unknown>}
                onApply={handleApply}
                applying={applyingId === job.id}
                matchScore={(job as any)._matchScore}
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
