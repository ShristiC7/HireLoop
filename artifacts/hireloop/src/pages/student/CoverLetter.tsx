import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListJobs } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Sparkles, Copy, Check, FileText, ChevronDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface CoverLetterResult {
  coverLetter: string;
  subject: string;
}

export default function CoverLetter() {
  const { token } = useAuth();
  const { data: jobs } = useListJobs({});
  const { toast } = useToast();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [customNote, setCustomNote] = useState("");
  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const apiBase = import.meta.env.VITE_API_URL ?? `${import.meta.env.BASE_URL}api`;

  const generate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch(`${apiBase}/ai/cover-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId: selectedJobId || undefined, customNote }),
      });
      if (!resp.ok) throw new Error("Failed to generate");
      const data = await resp.json();
      setResult(data);
    } catch {
      toast({ title: "Failed to generate cover letter", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard!" });
  };

  const selectedJob = jobs?.find(j => String(j.id) === selectedJobId);

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold font-serif">Cover Letter Generator</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-11">AI-powered cover letters tailored to your profile and the job</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-card border border-card-border space-y-5"
          >
            <h2 className="font-semibold text-sm">Configure</h2>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Target Job (Optional)
              </label>
              <div className="relative">
                <select
                  value={selectedJobId}
                  onChange={e => setSelectedJobId(e.target.value)}
                  className="w-full appearance-none bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-10"
                >
                  <option value="">General cover letter</option>
                  {jobs?.map(job => (
                    <option key={job.id} value={String(job.id)}>
                      {job.title} — {job.company}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            {selectedJob && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 space-y-1">
                <p className="text-xs font-semibold text-primary">{selectedJob.title}</p>
                <p className="text-xs text-muted-foreground">{selectedJob.company} · {selectedJob.location}</p>
                {selectedJob.skills && selectedJob.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedJob.skills.slice(0, 5).map((s: string) => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-secondary/60 text-muted-foreground">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                rows={3}
                placeholder="Any specific points to highlight, referral, or context..."
                className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>

            <button
              onClick={generate}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Generating...</>
              ) : (
                <><Sparkles size={16} /> Generate Cover Letter</>
              )}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-card border border-card-border space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Result</h2>
              {result && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary text-xs font-medium transition-colors"
                >
                  {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 py-4"
                >
                  {[100, 85, 92, 75, 88, 65].map((w, i) => (
                    <div key={i} className={`h-3 bg-muted rounded animate-pulse`} style={{ width: `${w}%` }} />
                  ))}
                  <p className="text-xs text-muted-foreground text-center pt-2 flex items-center justify-center gap-2">
                    <Sparkles size={12} className="text-primary animate-pulse" />
                    AI is crafting your cover letter...
                  </p>
                </motion.div>
              )}

              {!loading && !result && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                    <FileText size={24} className="text-primary/60" />
                  </div>
                  <p className="text-sm font-medium">Ready to generate</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                    Select a job and click Generate to create a personalized cover letter
                  </p>
                </motion.div>
              )}

              {!loading && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {result.subject && (
                    <div className="p-3 rounded-xl bg-accent/10 border border-accent/20">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Subject Line</p>
                      <p className="text-sm font-medium">{result.subject}</p>
                    </div>
                  )}
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border max-h-[360px] overflow-y-auto">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{result.coverLetter}</pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-primary/5 border border-primary/15"
        >
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Tips:</strong> The AI generates your letter based on your profile. Make sure your profile is complete with skills, experience, and projects for the best results. Always review and personalize the generated letter before sending.
          </p>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
