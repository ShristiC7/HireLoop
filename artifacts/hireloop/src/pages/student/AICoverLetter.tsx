import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { FileText, Sparkles, Building, Briefcase, ChevronRight, Copy, Check, Download, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";

export default function CoverLetterGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!companyName || !jobTitle || !jobDescription) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setCoverLetter("");
    
    try {
      const response = await fetch("/api/v1/ai/cover-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // The API client automatically sets authorization if using the generated client,
          // but since we're using raw fetch, we need the token from localStorage
          "Authorization": `Bearer ${localStorage.getItem("hireloop_token")}`
        },
        body: JSON.stringify({ companyName, jobTitle, jobDescription }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate cover letter");
      }

      const data = await response.json();
      setCoverLetter(data.coverLetter);
      toast({ title: "Cover letter generated successfully" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to generate cover letter", variant: "destructive" });
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
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Add simple text parsing for the PDF
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    
    // Margin and dimensions
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    
    const splitText = pdf.splitTextToSize(coverLetter, pageWidth);
    pdf.text(splitText, margin, margin);
    
    pdf.save(`${companyName.replace(/\s+/g, '_')}_Cover_Letter.pdf`);
    toast({ title: "PDF Downloaded" });
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
            <Sparkles className="text-primary" size={24} /> AI Cover Letter
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate a personalized cover letter matching your resume to the job description.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-6 rounded-2xl bg-card border border-card-border">
              <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Briefcase size={16} className="text-primary" /> Job Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Company Name</label>
                  <Input 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google, Stripe" 
                    className="bg-transparent"
                    data-testid="input-company-name"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Job Title</label>
                  <Input 
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Frontend Engineer" 
                    className="bg-transparent"
                    data-testid="input-job-title"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block">Job Description</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={8}
                    placeholder="Paste the job description here..."
                    className="w-full bg-transparent border border-input rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    data-testid="input-job-desc"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleGenerate}
                  disabled={isGenerating || !companyName || !jobTitle || !jobDescription}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  data-testid="button-generate"
                >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isGenerating ? "Generating Magic..." : "Generate Cover Letter"}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Result Panel */}
          <div className="lg:col-span-7">
            <div className="h-full min-h-[500px] p-6 rounded-2xl bg-card border border-card-border flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <h2 className="font-semibold text-sm flex items-center gap-2">
                  <FileText size={16} className="text-primary" /> Generated Letter
                </h2>
                
                {coverLetter && (
                  <div className="flex gap-2">
                    <button 
                      onClick={copyToClipboard}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary/50 transition-colors"
                      data-testid="button-copy"
                    >
                      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button 
                      onClick={downloadPDF}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-medium hover:bg-primary/20 transition-colors"
                      data-testid="button-download"
                    >
                      <Download size={12} /> PDF
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto relative">
                <AnimatePresence mode="wait">
                  {isGenerating ? (
                    <motion.div 
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground"
                    >
                      <Loader2 size={32} className="animate-spin mb-4 text-primary" />
                      <p className="text-sm font-medium">Analyzing your resume and the job description...</p>
                      <p className="text-xs mt-1">Crafting the perfect pitch.</p>
                    </motion.div>
                  ) : coverLetter ? (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="prose prose-sm dark:prose-invert max-w-none text-foreground whitespace-pre-wrap leading-relaxed"
                    >
                      {coverLetter}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl bg-secondary/10"
                    >
                      <FileText size={48} className="mb-4 opacity-20" />
                      <p className="text-sm">Your AI-generated cover letter will appear here.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
