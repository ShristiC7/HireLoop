import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetStudentProfile, useUpdateStudentProfile, getGetStudentProfileQueryKey } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { User, Linkedin, Github, GraduationCap, Code, Save, Plus, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const BRANCHES = ["CSE", "ECE", "EE", "ME", "CE", "IT", "Chemical", "Aerospace", "BioTech", "Other"];
const SUGGESTED_SKILLS = [
  "JavaScript", "TypeScript", "Python", "React", "Node.js", "Java", "C++", "C",
  "Machine Learning", "SQL", "Git", "Docker", "AWS", "Angular", "Vue.js",
  "MongoDB", "PostgreSQL", "Redis", "Kubernetes", "Spring Boot", "Django",
  "FastAPI", "Next.js", "GraphQL", "REST API", "Go", "Rust", "Swift", "Kotlin",
  "Flutter", "React Native", "TensorFlow", "PyTorch", "Data Science", "DevOps",
  "System Design", "Algorithms", "Data Structures", "CI/CD", "Linux",
];

const schema = z.object({
  name: z.string().min(2, "Min 2 characters"),
  phone: z.string().optional(),
  branch: z.string().min(1),
  batch: z.string().min(4),
  cgpa: z.coerce.number().min(0).max(10),
  bio: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  skills: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

function SkillTagInput({ value, onChange }: { value: string[]; onChange: (skills: string[]) => void }) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = SUGGESTED_SKILLS.filter(s =>
    s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s)
  ).slice(0, 8);

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !value.includes(trimmed) && value.length < 30) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeSkill = (skill: string) => {
    onChange(value.filter(s => s !== skill));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      addSkill(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeSkill(value[value.length - 1]);
    }
    if (e.key === "Escape") setShowSuggestions(false);
  };

  return (
    <div className="space-y-3">
      <div
        className="min-h-[44px] flex flex-wrap gap-1.5 p-2 rounded-xl border border-input bg-transparent cursor-text focus-within:ring-2 focus-within:ring-ring transition-shadow"
        onClick={() => inputRef.current?.focus()}
      >
        <AnimatePresence mode="popLayout">
          {value.map(skill => (
            <motion.span
              key={skill}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/25"
            >
              {skill}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeSkill(skill); }}
                className="w-3.5 h-3.5 rounded-full hover:bg-primary/25 flex items-center justify-center transition-colors"
              >
                <X size={9} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        <input
          ref={inputRef}
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "Type a skill and press Enter..." : "Add more..."}
          className="flex-1 min-w-[120px] bg-transparent text-sm placeholder:text-muted-foreground outline-none py-0.5 px-1"
          data-testid="input-skill"
        />
      </div>

      {showSuggestions && (inputValue || filtered.length > 0) && (
        <div className="p-3 rounded-xl border border-border bg-card shadow-lg space-y-2">
          {inputValue && !SUGGESTED_SKILLS.some(s => s.toLowerCase() === inputValue.toLowerCase()) && (
            <button
              type="button"
              onClick={() => addSkill(inputValue)}
              className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Plus size={12} /> Add "{inputValue}" as custom skill
            </button>
          )}
          {filtered.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Suggestions</p>
              <div className="flex flex-wrap gap-1.5">
                {filtered.map(skill => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => addSkill(skill)}
                    className="px-2.5 py-1 rounded-full text-xs border border-border hover:border-primary/30 hover:bg-primary/10 hover:text-primary transition-all"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <p className="text-xs text-muted-foreground mb-2">Popular skills — click to add</p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_SKILLS.slice(0, 16).filter(s => !value.includes(s)).map(skill => (
            <button
              key={skill}
              type="button"
              onClick={() => addSkill(skill)}
              className="px-2.5 py-1 rounded-full text-xs border border-border text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary transition-all"
              data-testid={`skill-${skill.toLowerCase().replace(/\s+/g, "-")}`}
            >
              + {skill}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{value.length}/30 skills added</p>
    </div>
  );
}

export default function StudentProfile() {
  const { data: profile, isLoading } = useGetStudentProfile();
  const updateProfile = useUpdateStudentProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(schema as any),
    defaultValues: { name: "", phone: "", branch: "CSE", batch: "2025", cgpa: 0, bio: "", linkedinUrl: "", githubUrl: "", skills: [] },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        phone: profile.phone ?? "",
        branch: profile.branch,
        batch: profile.batch,
        cgpa: profile.cgpa,
        bio: profile.bio ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        githubUrl: profile.githubUrl ?? "",
        skills: profile.skills ?? [],
      });
    }
  }, [profile, form]);

  const onSubmit = (data: FormData) => {
    updateProfile.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStudentProfileQueryKey() });
        toast({ title: "Profile updated successfully", description: "Your changes have been saved." });
      },
      onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
    });
  };

  const completeness = profile ? Math.min(100, [
    profile.name, profile.phone, profile.bio, profile.linkedinUrl,
    profile.githubUrl, profile.skills?.length > 0, profile.cgpa > 0,
    profile.branch, profile.batch,
  ].filter(Boolean).length * 11) : 0;

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <h1 className="text-2xl font-bold font-serif">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Complete your profile to improve placement readiness</p>

          {!isLoading && (
            <div className="mt-4 p-4 rounded-xl bg-card border border-card-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">Profile Completeness</span>
                <span className={cn("text-xs font-semibold", completeness >= 75 ? "text-green-600" : completeness >= 50 ? "text-amber-600" : "text-red-500")}>
                  {completeness}%
                </span>
              </div>
              <div className="w-full bg-secondary/50 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completeness}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={cn("h-2 rounded-full", completeness >= 75 ? "bg-green-500" : completeness >= 50 ? "bg-amber-500" : "bg-red-500")}
                />
              </div>
              {completeness < 75 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {completeness < 50 ? "Add skills, bio, and social links to unlock job recommendations" : "Almost there! Fill in remaining fields to get better matches"}
                </p>
              )}
              {completeness >= 75 && (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 size={12} /> Great profile! Recruiters can find you easily.
                </p>
              )}
            </div>
          )}
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Personal Info */}
              <div className="p-6 rounded-2xl bg-card border border-card-border">
                <div className="flex items-center gap-2 mb-5">
                  <User size={16} className="text-primary" />
                  <h2 className="font-semibold text-sm">Personal Information</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Full Name</FormLabel>
                      <FormControl><Input data-testid="input-name" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Phone</FormLabel>
                      <FormControl><Input placeholder="+91 9876543210" data-testid="input-phone" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bio" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-xs">Bio</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                          rows={3}
                          placeholder="Tell recruiters about yourself..."
                          data-testid="input-bio"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Academic Info */}
              <div className="p-6 rounded-2xl bg-card border border-card-border">
                <div className="flex items-center gap-2 mb-5">
                  <GraduationCap size={16} className="text-primary" />
                  <h2 className="font-semibold text-sm">Academic Details</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="branch" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Branch</FormLabel>
                      <FormControl>
                        <select className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" data-testid="select-branch" {...field}>
                          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="batch" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Batch Year</FormLabel>
                      <FormControl><Input placeholder="2025" data-testid="input-batch" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="cgpa" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">CGPA</FormLabel>
                      <FormControl><Input type="number" step="0.1" min="0" max="10" data-testid="input-cgpa" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Skills */}
              <div className="p-6 rounded-2xl bg-card border border-card-border">
                <div className="flex items-center gap-2 mb-3">
                  <Code size={16} className="text-primary" />
                  <h2 className="font-semibold text-sm">Skills</h2>
                </div>
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <SkillTagInput value={field.value} onChange={field.onChange} />
                  )}
                />
              </div>

              {/* Social Links */}
              <div className="p-6 rounded-2xl bg-card border border-card-border">
                <div className="flex items-center gap-2 mb-5">
                  <Linkedin size={16} className="text-primary" />
                  <h2 className="font-semibold text-sm">Social Links</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs flex items-center gap-1.5"><Linkedin size={12} /> LinkedIn</FormLabel>
                      <FormControl><Input placeholder="https://linkedin.com/in/..." data-testid="input-linkedin" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="githubUrl" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs flex items-center gap-1.5"><Github size={12} /> GitHub</FormLabel>
                      <FormControl><Input placeholder="https://github.com/..." data-testid="input-github" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={updateProfile.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                data-testid="button-save-profile"
              >
                <Save size={15} />
                {updateProfile.isPending ? "Saving..." : "Save Profile"}
              </motion.button>
            </form>
          </Form>
        )}
      </div>
    </DashboardLayout>
  );
}
