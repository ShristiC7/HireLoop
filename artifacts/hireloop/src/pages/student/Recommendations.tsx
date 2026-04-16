import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Sparkles, MapPin, Calendar, Briefcase, TrendingUp, AlertCircle, ChevronRight, Zap } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface RecommendedJob {
  id: number;
  title: string;
  company: string;
  location?: string;
  jobType: string;
  salaryMin?: number;
  salaryMax?: number;
  deadline: string;
  skills: string[];
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  status: string;
}

function MatchBadge({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500/15 text-green-600 border-green-500/20"
    : score >= 60 ? "bg-amber-500/15 text-amber-600 border-amber-500/20"
    : "bg-red-500/15 text-red-500 border-red-500/20";
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border", color)}>
      {score}% match
    </span>
  );
}

function JobTypeTag({ type }: { type: string }) {
  const labels: Record<string, string> = { fulltime: "Full-Time", internship: "Internship", contract: "Contract" };
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
      {labels[type] ?? type}
    </span>
  );
}

export default function Recommendations() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const apiBase = import.meta.env.VITE_API_URL ?? `${import.meta.env.BASE_URL}api`;

  const { data, isLoading, error } = useQuery({
    queryKey: ["ai-recommendations"],
    queryFn: async () => {
      const resp = await fetch(`${apiBase}/ai/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      if (!resp.ok) throw new Error("Failed to fetch");
      return resp.json() as Promise<{ recommendations: RecommendedJob[]; message?: string }>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const applyMutation = useMutation({
    mutationFn: async (jobId: number) => {
      const resp = await fetch(`${apiBase}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error ?? "Failed to apply");
      }
      return resp.json();
    },
    onSuccess: () => {
      toast({ title: "Applied successfully! 🎉" });
      queryClient.invalidateQueries({ queryKey: ["ai-recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const handleApply = async (jobId: number) => {
    setApplyingId(jobId);
    applyMutation.mutate(jobId);
    setApplyingId(null);
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold font-serif">Smart Recommendations</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-11">Jobs matched to your profile, skills, and CGPA</p>
        </motion.div>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-card border border-card-border animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
            <AlertCircle size={16} />
            <p className="text-sm">Failed to load recommendations. Please complete your profile first.</p>
          </div>
        )}

        {!isLoading && data && (
          <>
            {data.recommendations.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles size={28} className="text-primary/60" />
                </div>
                <div>
                  <p className="font-semibold">No recommendations yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {data.message ?? "Complete your profile with skills, CGPA, and branch to get personalized recommendations."}
                  </p>
                </div>
                <Link href="/student/profile">
                  <button className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity">
                    Complete Profile
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{data.recommendations.length} jobs matched to your profile</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingUp size={12} className="text-primary" />
                    Sorted by match score
                  </div>
                </div>

                {data.recommendations.map((job, idx) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-5 rounded-2xl bg-card border border-card-border hover:border-primary/30 transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <MatchBadge score={job.matchScore} />
                          <JobTypeTag type={job.jobType} />
                          {idx === 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/20">
                              ⚡ Top Match
                            </span>
                          )}
                        </div>

                        <h3 className="font-semibold text-base group-hover:text-primary transition-colors">{job.title}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{job.company}</p>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} /> {job.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            Closes {formatDistanceToNow(new Date(job.deadline), { addSuffix: true })}
                          </span>
                          {job.salaryMin && (
                            <span className="flex items-center gap-1">
                              <Briefcase size={11} />
                              ₹{job.salaryMin}–{job.salaryMax} LPA
                            </span>
                          )}
                        </div>

                        {job.matchedSkills.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {job.matchedSkills.slice(0, 5).map(s => (
                              <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-600 border border-green-500/20">
                                ✓ {s}
                              </span>
                            ))}
                            {job.missingSkills.slice(0, 3).map(s => (
                              <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-500 border border-red-500/20">
                                ✗ {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        <button
                          onClick={() => handleApply(job.id)}
                          disabled={applyingId === job.id}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 whitespace-nowrap"
                        >
                          <Zap size={12} />
                          Quick Apply
                        </button>
                        <Link href={`/student/jobs`}>
                          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                            View Details <ChevronRight size={12} />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
