import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Zap, Copy, Download, Wand2, Briefcase, FileText, Check } from "lucide-react";
import { api } from "@/lib/api";
import { jsPDF } from "jspdf";

export default function AICoverLetter() {
  const [jobDescription, setJobDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      toast({ title: "Please provide a job description", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await api.post("/ai/cover-letter", { jobDescription });
      setCoverLetter(res.data.coverLetter);
      toast({ title: "Generator successful!", description: "Tailored to your profile." });
    } catch (err) {
      toast({ title: "Generation failed", description: "Please try again later.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(coverLetter, 180);
    doc.text(splitText, 15, 20);
    doc.save(`Cover_Letter_${user?.name?.replace(/\s+/g, "_")}.pdf`);
    toast({ title: "PDF Downloaded" });
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold font-serif">AI Cover Letter Generator</h1>
          <p className="text-muted-foreground mt-1 text-lg">Generate professional, tailored cover letters in seconds.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="p-6 rounded-3xl bg-card border border-card-border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Briefcase className="text-primary" size={20} />
                </div>
                <h3 className="font-semibold text-lg">Job Details</h3>
              </div>
              
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Paste the Job Description (JD) below
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job requirements, responsibilities, and company details here..."
                className="w-full h-80 p-4 rounded-2xl bg-secondary/30 border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all text-sm leading-relaxed"
              />

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full mt-6 py-4 bg-gradient-to-r from-primary to-accent text-white rounded-2xl font-bold flex items-center justify-center gap-2.5 disabled:opacity-70 shadow-lg shadow-primary/20"
              >
                {isGenerating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Wand2 size={19} />
                )}
                {isGenerating ? "Synthesizing..." : "Generate with GPT-5"}
              </motion.button>
            </div>
          </motion.div>

          {/* Results Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <AnimatePresence mode="wait">
              {coverLetter ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 rounded-3xl bg-card border border-card-border shadow-md min-h-full flex flex-col"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                      <FileText className="text-primary" size={18} />
                      <span className="font-semibold uppercase tracking-wider text-xs text-muted-foreground">Draft Generated</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={copyToClipboard}
                        className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/70 transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                      <button 
                        onClick={downloadPDF}
                        className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium text-xs flex items-center gap-1.5"
                      >
                        <Download size={16} /> PDF
                      </button>
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground font-serif bg-secondary/20 p-6 rounded-2xl flex-1 max-h-[500px] overflow-y-auto">
                    {coverLetter}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  className="h-full rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center p-8 text-center"
                >
                  <div className="w-16 h-16 rounded-3xl bg-muted/30 flex items-center justify-center mb-4">
                    <Zap className="text-muted-foreground" size={28} />
                  </div>
                  <h3 className="font-semibold text-muted-foreground">No draft yet</h3>
                  <p className="text-sm text-muted-foreground/60 max-w-[240px] mt-2">
                    Enter the job description and click generate to see the magic.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
