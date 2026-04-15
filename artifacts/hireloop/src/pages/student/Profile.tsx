import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useGetStudentProfile, useUpdateStudentProfile, getGetStudentProfileQueryKey } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { User, Linkedin, Github, GraduationCap, Code, Save, X, Plus } from "lucide-react";

const BRANCHES = ["CSE", "ECE", "EE", "ME", "CE", "IT", "Chemical", "Aerospace"];
const COMMON_SKILLS = ["JavaScript", "Python", "React", "Node.js", "Java", "C++", "Machine Learning", "SQL", "Git", "Docker", "TypeScript", "AWS"];

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

export default function StudentProfile() {
  const { data: profile, isLoading } = useGetStudentProfile();
  const updateProfile = useUpdateStudentProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // FR-110: custom skill tag input state
  const [customSkillInput, setCustomSkillInput] = useState("");
  const customSkillRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
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

  const toggleSkill = (skill: string) => {
    const current = form.getValues("skills");
    if (current.includes(skill)) {
      form.setValue("skills", current.filter(s => s !== skill), { shouldDirty: true });
    } else {
      form.setValue("skills", [...current, skill], { shouldDirty: true });
    }
  };

  // FR-110: Add a custom skill from the text input
  const addCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (!trimmed) return;
    // Sanitize: allow letters, numbers, spaces, + . # -
    const sanitized = trimmed.replace(/[^a-zA-Z0-9 .#+\-]/g, "").trim();
    if (!sanitized) return;
    const current = form.getValues("skills");
    if (!current.map(s => s.toLowerCase()).includes(sanitized.toLowerCase())) {
      form.setValue("skills", [...current, sanitized], { shouldDirty: true });
    }
    setCustomSkillInput("");
    customSkillRef.current?.focus();
  };

  const handleCustomSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomSkill();
    }
  };

  const onSubmit = (data: FormData) => {
    updateProfile.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStudentProfileQueryKey() });
        toast({ title: "Profile updated successfully" });
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to update profile";
        toast({ title: msg, variant: "destructive" });
      },
    });
  };

  const currentSkills = form.watch("skills");

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <h1 className="text-2xl font-bold font-serif">My Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Complete your profile to improve placement readiness</p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />)}
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
                {/* FR-109: mobile-first grid: 1 col on mobile, 2 on sm+ */}
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
                    <FormItem className="col-span-1 sm:col-span-2">
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
                {/* FR-109: mobile-first grid: 1 col on mobile, 3 on sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField control={form.control} name="branch" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Branch</FormLabel>
                      <FormControl>
                        <select className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm" data-testid="select-branch" {...field}>
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

              {/* Skills — FR-110: tag input + custom skills */}
              <div className="p-6 rounded-2xl bg-card border border-card-border">
                <div className="flex items-center gap-2 mb-4">
                  <Code size={16} className="text-primary" />
                  <h2 className="font-semibold text-sm">Skills</h2>
                  {currentSkills.length > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground">{currentSkills.length} selected</span>
                  )}
                </div>

                {/* Selected skills as dismissible tags */}
                {currentSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {currentSkills.map(skill => (
                      <motion.span
                        key={skill}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/15 text-primary border border-primary/30"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => toggleSkill(skill)}
                          className="ml-0.5 hover:text-destructive transition-colors"
                          aria-label={`Remove ${skill}`}
                          data-testid={`remove-skill-${skill.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <X size={11} />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}

                {/* Custom skill input */}
                <div className="flex gap-2 mb-4">
                  <input
                    ref={customSkillRef}
                    type="text"
                    value={customSkillInput}
                    onChange={e => setCustomSkillInput(e.target.value)}
                    onKeyDown={handleCustomSkillKeyDown}
                    placeholder="Add a custom skill (e.g. PyTorch, Figma)…"
                    maxLength={40}
                    data-testid="input-custom-skill"
                    className="flex-1 rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={addCustomSkill}
                    disabled={!customSkillInput.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-medium disabled:opacity-40"
                    data-testid="button-add-custom-skill"
                  >
                    <Plus size={13} /> Add
                  </motion.button>
                </div>

                {/* Quick-select predefined skills */}
                <p className="text-xs text-muted-foreground mb-2">Quick select:</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SKILLS.map(skill => (
                    <motion.button
                      key={skill}
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        currentSkills.includes(skill)
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                      data-testid={`skill-${skill.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {skill}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Social */}
              <div className="p-6 rounded-2xl bg-card border border-card-border">
                <div className="flex items-center gap-2 mb-5">
                  <Linkedin size={16} className="text-primary" />
                  <h2 className="font-semibold text-sm">Social Links</h2>
                </div>
                {/* FR-109: mobile-first grid */}
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
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
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
