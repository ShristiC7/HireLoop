import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useGetResume, useUpdateResume, getGetResumeQueryKey } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, FileText, Briefcase, GraduationCap, Code, Award, Download, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ExperienceEntry { title: string; company: string; duration: string; description: string; }
interface EducationEntry { degree: string; institution: string; year: string; gpa: string; }
interface ProjectEntry { title: string; description: string; tech: string[]; link: string; }

export default function ResumeBuilder() {
  const { user } = useAuth();
  const { data: resume, isLoading } = useGetResume();
  const updateResume = useUpdateResume();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const [summary, setSummary] = useState("");
  const [experience, setExperience] = useState<ExperienceEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCert, setNewCert] = useState("");
  const [activeSection, setActiveSection] = useState("summary");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (resume) {
      setSummary(resume.summary ?? "");
      setExperience((resume.experience as ExperienceEntry[]) ?? []);
      setEducation((resume.education as EducationEntry[]) ?? []);
      setProjects((resume.projects as ProjectEntry[]) ?? []);
      setCertifications(resume.certifications ?? []);
    }
  }, [resume]);

  const handleSave = () => {
    updateResume.mutate({
      data: { summary, experience, education, projects, certifications, languages: [] }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetResumeQueryKey() });
        toast({ title: "Resume saved!" });
      },
      onError: () => toast({ title: "Failed to save", variant: "destructive" }),
    });
  };

  const handlePrintPDF = async () => {
    const printContent = printRef.current;
    if (!printContent || isExporting) return;
    
    setIsExporting(true);
    try {
      // Create a temporary clone to fix styling specifically for PDF export
      const clone = printContent.cloneNode(true) as HTMLElement;
      // Add a wrapper to enforce dimensions and high quality rendering
      const wrapper = document.createElement('div');
      wrapper.style.width = '794px'; // A4 width in pixels at 96 DPI
      wrapper.style.padding = '40px';
      wrapper.style.backgroundColor = 'white';
      wrapper.style.position = 'absolute';
      wrapper.style.left = '-9999px'; // Hide offscreen
      
      // Copy explicit styles we need for the PDF
      clone.style.border = 'none';
      clone.style.boxShadow = 'none';
      clone.style.height = 'auto';
      clone.style.margin = '0';
      wrapper.appendChild(clone);
      document.body.appendChild(wrapper);

      const canvas = await html2canvas(wrapper, {
        scale: 2, // High resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      document.body.removeChild(wrapper);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${user?.name?.replace(/\s+/g, '_') ?? 'student'}_resume.pdf`);
      
      toast({ title: "PDF Exported Successfully" });
    } catch (err) {
      console.error("PDF generation failed", err);
      toast({ title: "Failed to export PDF", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const addExp = () => setExperience([...experience, { title: "", company: "", duration: "", description: "" }]);
  const addEdu = () => setEducation([...education, { degree: "", institution: "", year: "", gpa: "" }]);
  const addProject = () => setProjects([...projects, { title: "", description: "", tech: [], link: "" }]);
  const addCert = () => { if (newCert) { setCertifications([...certifications, newCert]); setNewCert(""); } };

  const sections = [
    { key: "summary", label: "Summary", icon: FileText },
    { key: "experience", label: "Experience", icon: Briefcase },
    { key: "education", label: "Education", icon: GraduationCap },
    { key: "projects", label: "Projects", icon: Code },
    { key: "certifications", label: "Certifications", icon: Award },
  ];

  if (isLoading) return (
    <DashboardLayout requiredRole="student">
      <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />)}</div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-serif">Resume Builder</h1>
            <p className="text-muted-foreground text-sm">ATS Score: <span className="text-primary font-semibold">{resume?.atsScore ?? 0}%</span></p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrintPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary/50 border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-secondary/70 transition-colors disabled:opacity-60"
              data-testid="button-export-pdf"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} 
              {isExporting ? "Exporting..." : "Export PDF"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={updateResume.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-60"
              data-testid="button-save-resume"
            >
              <Save size={14} />{updateResume.isPending ? "Saving..." : "Save Resume"}
            </motion.button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {sections.map(s => (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${activeSection === s.key ? "bg-primary/10 text-primary border-primary/20" : "border-border text-muted-foreground hover:border-primary/30"}`}
                  data-testid={`section-${s.key}`}
                >
                  <s.icon size={12} /> {s.label}
                </button>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-card border border-card-border space-y-4">
              {activeSection === "summary" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Professional Summary</label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={5}
                    placeholder="Write a compelling summary about your background, skills, and career goals..."
                    className="w-full bg-transparent border border-input rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    data-testid="input-summary"
                  />
                </div>
              )}

              {activeSection === "experience" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Work Experience</h3>
                    <button onClick={addExp} className="flex items-center gap-1 text-xs text-primary hover:underline" data-testid="button-add-experience"><Plus size={12} /> Add</button>
                  </div>
                  {experience.map((exp, i) => (
                    <div key={i} className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2" data-testid={`exp-entry-${i}`}>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Job Title" value={exp.title} onChange={e => { const u=[...experience]; u[i].title=e.target.value; setExperience(u); }} className="text-sm" />
                        <Input placeholder="Company" value={exp.company} onChange={e => { const u=[...experience]; u[i].company=e.target.value; setExperience(u); }} className="text-sm" />
                        <Input placeholder="Duration (e.g. Jun-Aug 2024)" value={exp.duration} onChange={e => { const u=[...experience]; u[i].duration=e.target.value; setExperience(u); }} className="text-sm col-span-2" />
                      </div>
                      <textarea rows={2} placeholder="Key responsibilities and achievements..." value={exp.description} onChange={e => { const u=[...experience]; u[i].description=e.target.value; setExperience(u); }} className="w-full bg-transparent border border-input rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
                      <button onClick={() => setExperience(experience.filter((_, j) => j !== i))} className="text-destructive text-xs flex items-center gap-1 hover:underline" data-testid={`button-delete-exp-${i}`}><Trash2 size={11} /> Remove</button>
                    </div>
                  ))}
                  {experience.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No experience entries yet</p>}
                </div>
              )}

              {activeSection === "education" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Education</h3>
                    <button onClick={addEdu} className="flex items-center gap-1 text-xs text-primary hover:underline" data-testid="button-add-education"><Plus size={12} /> Add</button>
                  </div>
                  {education.map((edu, i) => (
                    <div key={i} className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2" data-testid={`edu-entry-${i}`}>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Degree (e.g. B.Tech CSE)" value={edu.degree} onChange={e => { const u=[...education]; u[i].degree=e.target.value; setEducation(u); }} className="text-sm" />
                        <Input placeholder="Institution" value={edu.institution} onChange={e => { const u=[...education]; u[i].institution=e.target.value; setEducation(u); }} className="text-sm" />
                        <Input placeholder="Year (e.g. 2021-2025)" value={edu.year} onChange={e => { const u=[...education]; u[i].year=e.target.value; setEducation(u); }} className="text-sm" />
                        <Input placeholder="GPA/CGPA" value={edu.gpa} onChange={e => { const u=[...education]; u[i].gpa=e.target.value; setEducation(u); }} className="text-sm" />
                      </div>
                      <button onClick={() => setEducation(education.filter((_, j) => j !== i))} className="text-destructive text-xs flex items-center gap-1 hover:underline"><Trash2 size={11} /> Remove</button>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === "projects" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Projects</h3>
                    <button onClick={addProject} className="flex items-center gap-1 text-xs text-primary hover:underline" data-testid="button-add-project"><Plus size={12} /> Add</button>
                  </div>
                  {projects.map((proj, i) => (
                    <div key={i} className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2" data-testid={`proj-entry-${i}`}>
                      <Input placeholder="Project Title" value={proj.title} onChange={e => { const u=[...projects]; u[i].title=e.target.value; setProjects(u); }} className="text-sm" />
                      <textarea rows={2} placeholder="Description..." value={proj.description} onChange={e => { const u=[...projects]; u[i].description=e.target.value; setProjects(u); }} className="w-full bg-transparent border border-input rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
                      <Input placeholder="Tech stack (e.g. React, Node.js, PostgreSQL)" value={proj.tech.join(", ")} onChange={e => { const u=[...projects]; u[i].tech=e.target.value.split(",").map(t=>t.trim()).filter(Boolean); setProjects(u); }} className="text-sm" />
                      <Input placeholder="Project URL (optional)" value={proj.link} onChange={e => { const u=[...projects]; u[i].link=e.target.value; setProjects(u); }} className="text-sm" />
                      <button onClick={() => setProjects(projects.filter((_, j) => j !== i))} className="text-destructive text-xs flex items-center gap-1 hover:underline"><Trash2 size={11} /> Remove</button>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === "certifications" && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Certifications</h3>
                  <div className="flex gap-2">
                    <Input placeholder="e.g. AWS Solutions Architect" value={newCert} onChange={e => setNewCert(e.target.value)} onKeyDown={e => e.key === "Enter" && addCert()} className="text-sm" data-testid="input-certification" />
                    <button onClick={addCert} className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold" data-testid="button-add-cert"><Plus size={14} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {certifications.map((cert, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs" data-testid={`cert-${i}`}>
                        {cert}
                        <button onClick={() => setCertifications(certifications.filter((_, j) => j !== i))} className="hover:text-destructive"><Trash2 size={10} /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div ref={printRef} className="p-6 rounded-2xl bg-white text-gray-900 border border-border shadow-xl h-fit sticky top-6 print:shadow-none print:border-none print:p-0">
            <div className="header text-center border-b border-gray-200 pb-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900 entry-title">{user?.name ?? "Your Name"}</h2>
              <p className="entry-sub text-sm text-gray-600 mt-1">{user?.email}</p>
            </div>

            {summary && (
              <div className="section mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">Summary</h3>
                <p className="entry-desc text-xs text-gray-700 leading-relaxed">{summary}</p>
              </div>
            )}

            {experience.length > 0 && (
              <div className="section mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Experience</h3>
                {experience.map((exp, i) => (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between">
                      <p className="entry-title text-xs font-semibold">{exp.title || "Title"}</p>
                      <p className="entry-sub text-xs text-gray-500">{exp.duration}</p>
                    </div>
                    <p className="entry-sub text-xs text-gray-600">{exp.company}</p>
                    {exp.description && <p className="entry-desc text-xs text-gray-500 mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {education.length > 0 && (
              <div className="section mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Education</h3>
                {education.map((edu, i) => (
                  <div key={i} className="mb-1">
                    <p className="entry-title text-xs font-semibold">{edu.degree}</p>
                    <p className="entry-sub text-xs text-gray-600">{edu.institution} · {edu.year}</p>
                  </div>
                ))}
              </div>
            )}

            {projects.length > 0 && (
              <div className="section mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Projects</h3>
                {projects.map((proj, i) => (
                  <div key={i} className="mb-2">
                    <p className="entry-title text-xs font-semibold">{proj.title}</p>
                    <p className="entry-desc text-xs text-gray-600">{proj.description}</p>
                    {proj.tech.length > 0 && <p className="text-xs text-indigo-600 mt-0.5">{proj.tech.map((t, j) => <span key={j} className="tag">{t}</span>)}</p>}
                    {proj.link && <a href={proj.link} className="text-xs text-indigo-500">{proj.link}</a>}
                  </div>
                ))}
              </div>
            )}

            {certifications.length > 0 && (
              <div className="section">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Certifications</h3>
                <div className="flex flex-wrap gap-1">
                  {certifications.map((c, i) => <span key={i} className="cert text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{c}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
