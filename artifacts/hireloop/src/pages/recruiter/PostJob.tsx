import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useCreateJob } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Plus, Trash2, Briefcase } from "lucide-react";
import { useState } from "react";

const BRANCHES = ["CSE", "ECE", "EE", "ME", "CE", "IT", "Chemical", "Aerospace"];
const JOB_TYPES = ["fulltime", "internship", "contract"] as const;

const schema = z.object({
  title: z.string().min(2, "Title required"),
  company: z.string().min(2, "Company required"),
  description: z.string().min(10, "Description required"),
  location: z.string().optional(),
  jobType: z.enum(JOB_TYPES),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  minCgpa: z.coerce.number().min(0).max(10),
  deadline: z.string().min(1, "Deadline required"),
});

type FormData = z.infer<typeof schema>;

export default function PostJob() {
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>(BRANCHES);
  const createJob = useCreateJob();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", company: "", description: "", location: "", jobType: "fulltime",
      salaryMin: 0, salaryMax: 0, minCgpa: 6.0,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
  });

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const toggleBranch = (b: string) => {
    if (selectedBranches.includes(b)) setSelectedBranches(selectedBranches.filter(x => x !== b));
    else setSelectedBranches([...selectedBranches, b]);
  };

  const onSubmit = (data: FormData) => {
    createJob.mutate({
      data: {
        ...data,
        skills,
        eligibleBranches: selectedBranches,
        salaryMin: data.salaryMin ?? undefined,
        salaryMax: data.salaryMax ?? undefined,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Job posted successfully!" });
        setLocation("/recruiter/jobs");
      },
      onError: () => toast({ title: "Failed to post job", variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout requiredRole="recruiter">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Briefcase size={20} className="text-primary" />
            <h1 className="text-2xl font-bold font-serif">Post a Job</h1>
          </div>
          <p className="text-muted-foreground text-sm">Fill out the details to attract the right candidates</p>
        </motion.div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Basic Info */}
            <div className="p-6 rounded-2xl bg-card border border-card-border space-y-4">
              <h2 className="font-semibold text-sm">Job Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Job Title</FormLabel>
                    <FormControl><Input placeholder="e.g. Software Engineer" data-testid="input-title" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="company" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Company</FormLabel>
                    <FormControl><Input placeholder="Company name" data-testid="input-company" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Location</FormLabel>
                    <FormControl><Input placeholder="e.g. Bangalore (Hybrid)" data-testid="input-location" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="jobType" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Job Type</FormLabel>
                    <FormControl>
                      <select className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" data-testid="select-job-type" {...field}>
                        {JOB_TYPES.map(t => <option key={t} value={t} className="bg-background capitalize">{t}</option>)}
                      </select>
                    </FormControl>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Job Description</FormLabel>
                  <FormControl>
                    <textarea rows={4} placeholder="Describe the role, responsibilities, and requirements..." className="w-full bg-transparent border border-input rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" data-testid="input-description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Compensation */}
            <div className="p-6 rounded-2xl bg-card border border-card-border space-y-4">
              <h2 className="font-semibold text-sm">Compensation & Eligibility</h2>
              <div className="grid grid-cols-3 gap-4">
                <FormField control={form.control} name="salaryMin" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Min Salary (LPA)</FormLabel>
                    <FormControl><Input type="number" step="0.5" data-testid="input-salary-min" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="salaryMax" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Max Salary (LPA)</FormLabel>
                    <FormControl><Input type="number" step="0.5" data-testid="input-salary-max" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="minCgpa" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Min CGPA</FormLabel>
                    <FormControl><Input type="number" step="0.1" min="0" max="10" data-testid="input-min-cgpa" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="deadline" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Application Deadline</FormLabel>
                  <FormControl><Input type="date" data-testid="input-deadline" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Skills */}
            <div className="p-6 rounded-2xl bg-card border border-card-border space-y-4">
              <h2 className="font-semibold text-sm">Required Skills</h2>
              <div className="flex gap-2">
                <Input placeholder="Add skill (e.g. React, Python)" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }} className="text-sm" data-testid="input-skill" />
                <button type="button" onClick={addSkill} className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold" data-testid="button-add-skill"><Plus size={14} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((s, i) => (
                  <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs" data-testid={`skill-tag-${i}`}>
                    {s}
                    <button type="button" onClick={() => setSkills(skills.filter((_, j) => j !== i))}><Trash2 size={10} /></button>
                  </span>
                ))}
              </div>
            </div>

            {/* Eligible Branches */}
            <div className="p-6 rounded-2xl bg-card border border-card-border space-y-4">
              <h2 className="font-semibold text-sm">Eligible Branches</h2>
              <div className="flex flex-wrap gap-2">
                {BRANCHES.map(b => (
                  <motion.button
                    key={b}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleBranch(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${selectedBranches.includes(b) ? "bg-accent/10 text-accent border-accent/30" : "border-border text-muted-foreground hover:border-accent/30"}`}
                    data-testid={`branch-${b.toLowerCase()}`}
                  >
                    {b}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={createJob.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
              data-testid="button-submit-job"
            >
              <Briefcase size={15} />
              {createJob.isPending ? "Posting..." : "Post Job"}
            </motion.button>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
