import { useState } from "react";
import { motion } from "framer-motion";
import { useAnalyzeResume } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Brain, Sparkles, AlertTriangle, CheckCircle, TrendingUp, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function CircleScore({ score, label, color = "#6366f1", size = 100 }: { score: number; label: string; color?: string; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 75) return "#22c55e";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const c = color === "auto" ? getColor() : color;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
          <motion.circle
            cx={size/2} cy={size/2} r={radius}
            fill="none" stroke={c} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold" style={{ color: c }}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

export default function AIResume() {
  const [jobDescription, setJobDescription] = useState("");
  const analyzeResume = useAnalyzeResume();
  const { toast } = useToast();
  const [result, setResult] = useState<{
    atsScore: number;
    matchPercentage: number;
    keywordGaps: string[];
    suggestions: string[];
    strengths: string[];
    sectionScores: Record<string, number>;
  } | null>(null);

  const handleAnalyze = () => {
    analyzeResume.mutate({ data: { jobDescription } }, {
      onSuccess: (data) => {
        setResult(data);
        toast({ title: "Resume analyzed successfully!" });
      },
      onError: () => toast({ title: "Analysis failed", description: "Make sure you have a resume built first.", variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={20} className="text-primary" />
            <h1 className="text-2xl font-bold font-serif">AI Resume Analyzer</h1>
          </div>
          <p className="text-muted-foreground text-sm">Get AI-powered ATS score, keyword analysis, and improvement suggestions</p>
        </motion.div>

        {/* Input */}
        <div className="p-6 rounded-2xl bg-card border border-card-border">
          <label className="text-sm font-semibold mb-3 block">Job Description (Optional)</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={4}
            placeholder="Paste the job description here to get a match percentage and targeted feedback..."
            className="w-full bg-transparent border border-input rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="input-job-description"
          />
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(99,102,241,0.4)" }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAnalyze}
            disabled={analyzeResume.isPending}
            className="mt-4 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-accent/80 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
            data-testid="button-analyze-resume"
          >
            <Sparkles size={15} />
            {analyzeResume.isPending ? "Analyzing with AI..." : "Analyze My Resume"}
          </motion.button>
        </div>

        {analyzeResume.isPending && (
          <div className="p-8 rounded-2xl bg-card border border-card-border text-center">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium">AI is analyzing your resume...</p>
            <p className="text-xs text-muted-foreground mt-1">This may take a moment</p>
          </div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Score Overview */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <h2 className="font-semibold mb-5">Score Overview</h2>
              <div className="flex items-center justify-around flex-wrap gap-6">
                <CircleScore score={result.atsScore} label="ATS Score" color="auto" size={110} />
                <CircleScore score={result.matchPercentage} label="Job Match" color="#22d3ee" size={110} />
                {Object.entries(result.sectionScores).map(([key, val]) => (
                  <CircleScore key={key} score={val} label={key.charAt(0).toUpperCase() + key.slice(1)} color="auto" size={80} />
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {/* Strengths */}
              <div className="p-5 rounded-2xl bg-card border border-card-border">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle size={16} className="text-green-400" />
                  <h3 className="font-semibold text-sm">Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2 text-xs text-foreground/80"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                      {s}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Keyword Gaps */}
              <div className="p-5 rounded-2xl bg-card border border-card-border">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle size={16} className="text-amber-400" />
                  <h3 className="font-semibold text-sm">Keyword Gaps</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.keywordGaps.map((kw, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-medium"
                      data-testid={`keyword-gap-${i}`}
                    >
                      {kw}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Suggestions */}
              <div className="p-5 rounded-2xl bg-card border border-card-border">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-primary" />
                  <h3 className="font-semibold text-sm">Suggestions</h3>
                </div>
                <ul className="space-y-2">
                  {result.suggestions.map((s, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2 text-xs text-foreground/80"
                    >
                      <Zap size={11} className="text-primary mt-0.5 shrink-0" />
                      {s}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {!result && !analyzeResume.isPending && (
          <div className="p-12 rounded-2xl bg-card border border-dashed border-border text-center">
            <Brain size={40} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold">Ready to analyze your resume</p>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
              Click the analyze button above. Optionally paste a job description for targeted feedback.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
