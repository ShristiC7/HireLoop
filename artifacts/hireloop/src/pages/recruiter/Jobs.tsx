import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListJobs, useGetJobApplications, useUpdateApplicationStatus, getListJobsQueryKey } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Briefcase, Users, ChevronDown, ChevronUp, Plus, Clock, Calendar, Search, X, Sparkles, Bot, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { Link } from "wouter";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

const APPLICATION_STATUSES = ["applied", "shortlisted", "interview", "offer", "rejected"] as const;
const statusColors: Record<string, string> = {
  applied: "border-blue-500/20 text-blue-400",
  shortlisted: "border-amber-500/20 text-amber-400",
  interview: "border-purple-500/20 text-purple-400",
  offer: "border-green-500/20 text-green-400",
  rejected: "border-red-500/20 text-red-400",
};

function InterviewScheduleModal({
  appId,
  studentName,
  onClose,
  onSchedule,
}: {
  appId: number;
  studentName: string;
  onClose: () => void;
  onSchedule: (appId: number, date: string, notes: string) => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!date) return;
    const datetime = new Date(`${date}T${time}:00`).toISOString();
    onSchedule(appId, datetime, notes);
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
            <h3 className="font-semibold">Schedule Interview</h3>
            <p className="text-xs text-muted-foreground mt-0.5">with {studentName}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-secondary/50 flex items-center justify-center transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Interview Date</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Interview Time</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Interview format, preparation tips, meeting link..."
              rows={3}
              className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
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
            onClick={handleSubmit}
            disabled={!date}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-60"
          >
            <Calendar size={14} /> Schedule
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface ShortlistResult {
  applicationId: number;
  studentName: string;
  matchScore: number;
  recommendation: string;
  reason: string;
}

function SmartShortlistModal({ jobId, jobTitle, onClose }: { jobId: number; jobTitle: string; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ShortlistResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const runShortlist = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/ai/smart-shortlist/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to shortlist");
      const data = await res.json();
      setResults(data.shortlist ?? []);
      toast({ title: "AI shortlisting complete!" });
    } catch {
      setError("AI shortlisting failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
        className="w-full max-w-lg bg-card border border-card-border rounded-2xl p-6 space-y-5 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2"><Sparkles size={16} className="text-primary" /> AI Smart Shortlist</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{jobTitle}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        {!results && !loading && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground">AI will analyze all applicants for this job and rank them by fit score, matching their skills and experience to the job requirements.</p>
            </div>
            <button
              onClick={runShortlist}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl text-sm font-semibold"
            >
              <Bot size={16} /> Run AI Shortlisting
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-10 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Analyzing {jobTitle} applicants...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertCircle size={16} className="text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {results && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{results.length} applicants ranked by AI match score</p>
            {results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No applicants to shortlist yet</p>
            ) : (
              results.map((r, i) => (
                <div key={r.applicationId} className={cn("p-4 rounded-xl border", r.recommendation === "shortlist" ? "border-green-500/20 bg-green-500/5" : r.recommendation === "consider" ? "border-amber-500/20 bg-amber-500/5" : "border-border bg-secondary/20")}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                      <span className="font-semibold text-sm">{r.studentName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs font-bold", r.matchScore >= 75 ? "text-green-500" : r.matchScore >= 50 ? "text-amber-500" : "text-muted-foreground")}>
                        {r.matchScore}% match
                      </span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", r.recommendation === "shortlist" ? "bg-green-500/15 text-green-500" : r.recommendation === "consider" ? "bg-amber-500/15 text-amber-500" : "bg-muted text-muted-foreground")}>
                        {r.recommendation}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.reason}</p>
                </div>
              ))
            )}
            <button onClick={runShortlist} className="w-full text-xs text-primary hover:underline py-2">Re-run analysis</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function JobRow({ job }: { job: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [skillFilter, setSkillFilter] = useState("");
  const [scheduleModal, setScheduleModal] = useState<{ appId: number; studentName: string } | null>(null);
  const [shortlistModal, setShortlistModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const j = job as { id: number; title: string; company: string; status: string; jobType: string; applicantCount: number; deadline: string };

  const { data: applications, isLoading } = useGetJobApplications(j.id, {}, { query: { enabled: expanded } });
  const updateStatus = useUpdateApplicationStatus();

  const filtered = (applications ?? []).filter(a => {
    if (!a) return false;
    if (filter !== "all" && a.status !== filter) return false;
    if (skillFilter) {
      const studentSkills = (a.student as Record<string, unknown>)?.skills as string[] ?? [];
      return studentSkills.some(s => s.toLowerCase().includes(skillFilter.toLowerCase()));
    }
    return true;
  });

  const handleStatusChange = (appId: number, status: string, currentStatus: string) => {
    if (status === "interview" && currentStatus !== "interview") {
      const app = (applications ?? []).find(a => a?.id === appId);
      const name = (app?.student as Record<string, unknown>)?.name as string ?? "Candidate";
      setScheduleModal({ appId, studentName: name });
      return;
    }
    updateStatus.mutate({ applicationId: appId, data: { status: status as typeof APPLICATION_STATUSES[number] } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey({}) });
        toast({ title: `Application updated to ${status}` });
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  };

  const handleScheduleInterview = (appId: number, interviewDate: string, notes: string) => {
    updateStatus.mutate({
      applicationId: appId,
      data: { status: "interview", interviewDate, notes }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListJobsQueryKey({}) });
        toast({ title: "Interview scheduled successfully!" });
        setScheduleModal(null);
      },
      onError: () => toast({ title: "Failed to schedule", variant: "destructive" }),
    });
  };

  return (
    <>
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
            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex gap-2 flex-wrap flex-1">
                {["all", ...APPLICATION_STATUSES].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={cn("px-3 py-1 rounded-lg text-xs font-medium border capitalize transition-all", filter === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}
                    data-testid={`filter-${s}`}
                  >
                    {s} {s === "all" ? `(${(applications ?? []).length})` : `(${(applications ?? []).filter(a => a?.status === s).length})`}
                  </button>
                ))}
                <button
                  onClick={() => setShortlistModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all ml-auto"
                  data-testid="button-ai-shortlist"
                >
                  <Sparkles size={11} /> AI Shortlist
                </button>
              </div>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  value={skillFilter}
                  onChange={e => setSkillFilter(e.target.value)}
                  placeholder="Filter by skill..."
                  className="pl-8 pr-3 py-1.5 bg-secondary/30 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-ring w-40"
                />
                {skillFilter && (
                  <button onClick={() => setSkillFilter("")} className="absolute right-2 top-2.5">
                    <X size={10} className="text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
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
                  const student = app.student as Record<string, unknown> | undefined;
                  const studentSkills = (student?.skills as string[]) ?? [];
                  return (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border"
                      data-testid={`applicant-${app.id}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {(student?.name as string)?.[0] ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{student?.name as string}</p>
                          <p className="text-xs text-muted-foreground">{student?.branch as string} · CGPA {student?.cgpa as number} · {student?.batch as string}</p>
                          {studentSkills.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-1">
                              {studentSkills.slice(0, 4).map(skill => (
                                <span key={skill} className={cn("text-[10px] px-1.5 py-0.5 rounded-full", skillFilter && skill.toLowerCase().includes(skillFilter.toLowerCase()) ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary text-muted-foreground")}>
                                  {skill}
                                </span>
                              ))}
                              {studentSkills.length > 4 && <span className="text-[10px] text-muted-foreground">+{studentSkills.length - 4}</span>}
                            </div>
                          )}
                          {app.interviewDate && (
                            <p className="text-[10px] text-purple-400 flex items-center gap-1 mt-1">
                              <Calendar size={9} /> Interview: {format(new Date(app.interviewDate), "dd MMM yyyy, h:mm a")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value, app.status)}
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

      <AnimatePresence>
        {scheduleModal && (
          <InterviewScheduleModal
            appId={scheduleModal.appId}
            studentName={scheduleModal.studentName}
            onClose={() => setScheduleModal(null)}
            onSchedule={handleScheduleInterview}
          />
        )}
        {shortlistModal && (
          <SmartShortlistModal
            jobId={j.id}
            jobTitle={j.title}
            onClose={() => setShortlistModal(false)}
          />
        )}
      </AnimatePresence>
    </>
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
