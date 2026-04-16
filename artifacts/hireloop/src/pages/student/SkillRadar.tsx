import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useListJobs } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Target, BookOpen, Loader2, Sparkles, AlertCircle, X, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RadarPoint { skill: string; studentLevel: number; requiredLevel: number; status: string; }
interface RadarResult {
  radarData: RadarPoint[];
  jobs: { id: number; title: string; company: string }[];
  overallMatch: number;
  missingSkills: string[];
  partialSkills: string[];
}
interface Roadmap {
  skill: string;
  overview: string;
  weeks: { week: number; title: string; goals: string[]; resources: { title: string; url: string; type: string; duration: string }[]; project: string }[];
  estimatedHours: number;
}

export default function SkillRadar() {
  const { token } = useAuth();
  const { data: jobs } = useListJobs({});
  const { toast } = useToast();
  const [selectedJobIds, setSelectedJobIds] = useState<number[]>([]);
  const [result, setResult] = useState<RadarResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [roadmapSkill, setRoadmapSkill] = useState<string | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const apiBase = import.meta.env.VITE_API_URL ?? `${import.meta.env.BASE_URL}api`;

  const toggleJob = (id: number) => {
    setSelectedJobIds(prev =>
      prev.includes(id) ? prev.filter(j => j !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const analyze = async () => {
    if (selectedJobIds.length === 0) {
      toast({ title: "Select at least one job to analyze", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${apiBase}/ai/skill-radar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobIds: selectedJobIds }),
      });
      if (!resp.ok) throw new Error("Failed");
      setResult(await resp.json());
    } catch {
      toast({ title: "Analysis failed. Try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async (skill: string) => {
    setRoadmapSkill(skill);
    setRoadmapLoading(true);
    setRoadmap(null);
    try {
      const resp = await fetch(`${apiBase}/ai/learning-roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skill }),
      });
      if (!resp.ok) throw new Error("Failed");
      setRoadmap(await resp.json());
    } catch {
      toast({ title: "Failed to generate roadmap", variant: "destructive" });
    } finally {
      setRoadmapLoading(false);
    }
  };

  const activeJobs = jobs?.filter(j => j.status === "active") ?? [];

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Target size={16} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold font-serif">Skill Gap Radar</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-11">Compare your skills against job requirements — click gaps to get a personalized learning roadmap</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-2xl bg-card border border-card-border space-y-4"
          >
            <div>
              <h2 className="font-semibold text-sm mb-1">Select Jobs (up to 3)</h2>
              <p className="text-xs text-muted-foreground">{selectedJobIds.length}/3 selected</p>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {activeJobs.map(job => {
                const selected = selectedJobIds.includes(job.id);
                const disabled = !selected && selectedJobIds.length >= 3;
                return (
                  <button
                    key={job.id}
                    onClick={() => toggleJob(job.id)}
                    disabled={disabled}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all text-xs",
                      selected
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : disabled
                        ? "opacity-40 cursor-not-allowed bg-secondary/30 border-border"
                        : "bg-secondary/30 border-border hover:border-primary/30 text-foreground"
                    )}
                  >
                    <p className="font-medium truncate">{job.title}</p>
                    <p className="text-muted-foreground truncate">{job.company}</p>
                  </button>
                );
              })}
              {activeJobs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No active jobs available</p>
              )}
            </div>

            <button
              onClick={analyze}
              disabled={loading || selectedJobIds.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {loading ? "Analyzing..." : "Analyze Gaps"}
            </button>
          </motion.div>

          <div className="md:col-span-2 space-y-5">
            {!result && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-card border border-card-border"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                  <Target size={28} className="text-primary/60" />
                </div>
                <p className="font-semibold">Select jobs to analyze</p>
                <p className="text-sm text-muted-foreground mt-1">Choose up to 3 jobs on the left to see your skill gaps</p>
              </motion.div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center py-16 rounded-2xl bg-card border border-card-border">
                <Loader2 size={28} className="animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">Analyzing skill gaps...</p>
              </div>
            )}

            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="p-5 rounded-2xl bg-card border border-card-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">Skill Gap Analysis</h3>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-semibold border",
                      result.overallMatch >= 75 ? "bg-green-500/15 text-green-600 border-green-500/20"
                        : result.overallMatch >= 50 ? "bg-amber-500/15 text-amber-600 border-amber-500/20"
                        : "bg-red-500/15 text-red-500 border-red-500/20"
                    )}>
                      {result.overallMatch}% Overall Match
                    </span>
                  </div>

                  {result.radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={result.radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <Radar name="Your Skills" dataKey="studentLevel" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                        <Radar name="Required" dataKey="requiredLevel" stroke="#f97316" fill="#f97316" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                          formatter={(value, name) => [`${value}%`, name]}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm">
                      <AlertCircle size={14} />
                      No skills data found for selected jobs. Try selecting different jobs.
                    </div>
                  )}
                </div>

                {(result.missingSkills.length > 0 || result.partialSkills.length > 0) && (
                  <div className="p-5 rounded-2xl bg-card border border-card-border">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen size={14} className="text-primary" />
                      <h3 className="font-semibold text-sm">Skill Gaps — Click to Generate Roadmap</h3>
                    </div>

                    {result.missingSkills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Missing Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {result.missingSkills.map(skill => (
                            <button
                              key={skill}
                              onClick={() => generateRoadmap(skill)}
                              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                            >
                              <BookOpen size={11} /> {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.partialSkills.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Partial Match</p>
                        <div className="flex flex-wrap gap-2">
                          {result.partialSkills.map(skill => (
                            <button
                              key={skill}
                              onClick={() => generateRoadmap(skill)}
                              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-colors flex items-center gap-1.5"
                            >
                              <BookOpen size={11} /> {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {(roadmapSkill || roadmap) && (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="p-6 rounded-2xl bg-card border border-card-border"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  <h3 className="font-semibold">
                    {roadmapLoading ? `Generating roadmap for "${roadmapSkill}"...` : `4-Week Learning Roadmap: ${roadmap?.skill}`}
                  </h3>
                </div>
                <button
                  onClick={() => { setRoadmap(null); setRoadmapSkill(null); }}
                  className="w-7 h-7 rounded-lg hover:bg-secondary/50 flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {roadmapLoading && (
                <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                  <Loader2 size={18} className="animate-spin text-primary" />
                  <span className="text-sm">AI is generating your personalized roadmap...</span>
                </div>
              )}

              {roadmap && !roadmapLoading && (
                <div className="space-y-4">
                  {roadmap.overview && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{roadmap.overview}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>⏱ Estimated: {roadmap.estimatedHours}h total</span>
                    <span>📅 4 weeks</span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {roadmap.weeks.map(week => (
                      <div key={week.week} className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">{week.week}</span>
                          <p className="font-semibold text-sm">{week.title}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Goals</p>
                          <ul className="space-y-1">
                            {week.goals.map((g, i) => (
                              <li key={i} className="text-xs flex items-start gap-1.5 text-foreground">
                                <span className="text-primary mt-0.5">•</span> {g}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Resources</p>
                          <ul className="space-y-1">
                            {week.resources.map((r, i) => (
                              <li key={i} className="text-xs">
                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{r.title}</a>
                                <span className="text-muted-foreground"> · {r.type} · {r.duration}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {week.project && (
                          <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                            <p className="text-xs font-medium">🛠 Project: {week.project}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
