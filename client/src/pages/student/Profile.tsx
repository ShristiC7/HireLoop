import { useState, useEffect } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/use-toast";

interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  college: string | null;
  department: string | null;
  degree: string | null;
  graduationYear: number | null;
  cgpa: number | null;
  skills: string[];
  bio: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  portfolioUrl: string | null;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    college: "",
    department: "",
    degree: "",
    graduationYear: "",
    cgpa: "",
    skills: [] as string[],
    bio: "",
    githubUrl: "",
    linkedinUrl: "",
    portfolioUrl: "",
  });

  useEffect(() => {
    api
      .get<{ data: StudentProfile }>("/student/profile")
      .then((res) => {
        const p = res.data;
        if (p) {
          setForm({
            firstName: p.firstName || "",
            lastName: p.lastName || "",
            phone: p.phone || "",
            college: p.college || "",
            department: p.department || "",
            degree: p.degree || "",
            graduationYear: p.graduationYear ? String(p.graduationYear) : "",
            cgpa: p.cgpa ? String(p.cgpa) : "",
            skills: p.skills || [],
            bio: p.bio || "",
            githubUrl: p.githubUrl || "",
            linkedinUrl: p.linkedinUrl || "",
            portfolioUrl: p.portfolioUrl || "",
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load profile", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddSkill = () => {
    const val = skillInput.trim();
    if (val && !form.skills.includes(val)) {
      setForm((prev) => ({ ...prev, skills: [...prev.skills, val] }));
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      const payload = {
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        phone: form.phone || undefined,
        college: form.college || undefined,
        department: form.department || undefined,
        degree: form.degree || undefined,
        graduationYear: form.graduationYear ? parseInt(form.graduationYear) : undefined,
        cgpa: form.cgpa ? parseFloat(form.cgpa) : undefined,
        skills: form.skills,
        bio: form.bio || undefined,
        githubUrl: form.githubUrl || undefined,
        linkedinUrl: form.linkedinUrl || undefined,
        portfolioUrl: form.portfolioUrl || undefined,
      };

      await api.put("/student/profile", payload);
      toast({
        title: "Profile successfully saved!",
        description: "Your information is now updated dynamically.",
      });
    } catch (err: any) {
      toast({
        title: "Error saving profile",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-500 gap-2">
        <Loader2 size={24} className="animate-spin" />
        <span>Loading your profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
          My Profile
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Make sure your details are up-to-date so recruiters can find you easily based on CGPA and Skills!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Details Panel */}
        <div className="bg-white rounded-3xl p-8 border shadow-sm space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 border-b pb-4">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">First Name</label>
              <input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Last Name</label>
              <input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Bio / About Me</label>
            <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 resize-none" placeholder="Share a little bit about yourself and your career goals" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50" placeholder="+12 3456 ..." />
            </div>
          </div>
        </div>

        {/* Education & Academia Panel */}
        <div className="bg-white rounded-3xl p-8 border shadow-sm space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 border-b pb-4">Education</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">College / Institution</label>
              <input value={form.college} onChange={(e) => update("college", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50" placeholder="e.g. Stanford University" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Degree</label>
              <input value={form.degree} onChange={(e) => update("degree", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50" placeholder="e.g. B.Tech" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Department</label>
              <input value={form.department} onChange={(e) => update("department", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50" placeholder="e.g. Computer Science" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Graduation Year</label>
              <input type="number" min="2020" max="2035" value={form.graduationYear} onChange={(e) => update("graduationYear", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50" placeholder="e.g. 2026" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">CGPA</label>
              <input type="number" step="0.1" min="0" max="10" value={form.cgpa} onChange={(e) => update("cgpa", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50" placeholder="e.g. 8.5" />
            </div>
          </div>
        </div>

        {/* Links & Skills */}
        <div className="bg-white rounded-3xl p-8 border shadow-sm space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 border-b pb-4">Skills & Links</h3>
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Skills</label>
            <div className="flex gap-2">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSkill(); }}} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50" placeholder="Type a skill and press Add or Enter..." />
              <button type="button" onClick={handleAddSkill} className="px-6 py-3 rounded-xl bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 transition">Add</button>
            </div>
            {form.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {form.skills.map((skill) => (
                  <div key={skill} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg">
                    {skill}
                    <button type="button" onClick={() => handleRemoveSkill(skill)} className="p-0.5 hover:bg-gray-300 rounded-md transition-colors"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">LinkedIn URL</label>
              <input type="url" value={form.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50" placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">GitHub URL</label>
              <input type="url" value={form.githubUrl} onChange={(e) => update("githubUrl", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50" placeholder="https://github.com/..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-2 text-gray-700">Portfolio URL</label>
              <input type="url" value={form.portfolioUrl} onChange={(e) => update("portfolioUrl", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50" placeholder="https://..." />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mt-8 sticky bottom-0 bg-white py-4 border-t">
          <button type="submit" disabled={isSaving} className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition flex items-center justify-center gap-2 transform active:scale-95 shadow-lg shadow-purple-500/30">
            {isSaving && <Loader2 size={20} className="animate-spin" />}
            {isSaving ? "Saving..." : "Save Profile Data"}
          </button>
        </div>
      </form>
    </div>
  );
}
