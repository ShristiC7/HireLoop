import { useState, useEffect } from "react";
import { Plus, Trash2, Save, FileText, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../context/AuthContext";

interface Resume {
  id: string;
  title: string;
  isDefault: boolean;
  atsScore?: number;
  createdAt: string;
  builderData?: {
    skills?: string;
    education?: string;
    projects?: string;
    bio?: string;
  };
}

export default function ResumeBuilder() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [form, setForm] = useState({
    title: "",
    skills: "",
    education: "",
    projects: "",
    bio: "",
  });

  // Load all resumes on mount
  useEffect(() => {
    api
      .get<{ data: Resume[] }>("/student/resumes")
      .then((res) => {
        setResumes(res.data);
        if (res.data.length > 0) {
          selectResume(res.data[0]);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []); // eslint-disable-line

  const selectResume = (resume: Resume) => {
    setSelectedId(resume.id);
    setForm({
      title: resume.title,
      skills: resume.builderData?.skills || "",
      education: resume.builderData?.education || "",
      projects: resume.builderData?.projects || "",
      bio: resume.builderData?.bio || "",
    });
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const res = await api.post<{ data: Resume }>("/student/resumes", {
        title: `Resume ${resumes.length + 1}`,
        isDefault: resumes.length === 0,
        builderData: {},
      });
      setResumes((prev) => [res.data, ...prev]);
      selectResume(res.data);
      toast({ title: "Resume created ✅" });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedId || isSaving) return;
    setIsSaving(true);
    try {
      const res = await api.put<{ data: Resume }>(`/student/resumes/${selectedId}`, {
        title: form.title,
        builderData: {
          skills: form.skills,
          education: form.education,
          projects: form.projects,
          bio: form.bio,
        },
      });
      setResumes((prev) =>
        prev.map((r) => (r.id === selectedId ? { ...r, ...res.data } : r))
      );
      toast({ title: "Resume saved ✅" });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/student/resumes/${id}`);
      const updated = resumes.filter((r) => r.id !== id);
      setResumes(updated);
      if (selectedId === id) {
        if (updated.length > 0) {
          selectResume(updated[0]);
        } else {
          setSelectedId(null);
          setForm({ title: "", skills: "", education: "", projects: "", bio: "" });
        }
      }
      toast({ title: "Resume deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Pre-fill from user profile
  const prefillFromProfile = () => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        bio: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-12">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading resumes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resume Builder</h2>
          <p className="text-gray-500 text-sm mt-1">
            Build and manage your resumes — AI ATS analysis is available after saving
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60"
        >
          {isCreating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          New Resume
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: resume list */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
            My Resumes ({resumes.length})
          </p>
          {resumes.length === 0 ? (
            <div className="bg-white rounded-xl border p-4 text-center text-sm text-gray-500">
              <FileText size={24} className="mx-auto mb-2 text-gray-300" />
              <p>No resumes yet.</p>
              <p>Click "New Resume" to start.</p>
            </div>
          ) : (
            resumes.map((r) => (
              <div
                key={r.id}
                onClick={() => selectResume(r)}
                className={`relative flex items-center gap-2 p-3 rounded-xl border cursor-pointer group transition-all ${
                  selectedId === r.id
                    ? "border-purple-400 bg-purple-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <FileText
                  size={16}
                  className={selectedId === r.id ? "text-purple-600" : "text-gray-400"}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      selectedId === r.id ? "text-purple-700" : "text-gray-800"
                    }`}
                  >
                    {r.title}
                  </p>
                  {r.atsScore != null && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      ATS:{" "}
                      <span
                        className={
                          r.atsScore >= 70
                            ? "text-green-600 font-semibold"
                            : "text-orange-500 font-semibold"
                        }
                      >
                        {Math.round(r.atsScore)}
                      </span>
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(r.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Editor */}
        {selectedId ? (
          <div className="lg:col-span-3 bg-white rounded-2xl border p-6 space-y-5">
            <div className="flex items-center justify-between">
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="Resume title"
                className="text-lg font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none pb-1 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={prefillFromProfile}
                  className="text-xs px-3 py-1.5 rounded-lg border text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Pre-fill from profile
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-60"
                >
                  {isSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Save
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                Professional Summary / Bio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => update("bio", e.target.value)}
                rows={2}
                placeholder="Final year CSE student specializing in full-stack development..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                Skills
              </label>
              <input
                value={form.skills}
                onChange={(e) => update("skills", e.target.value)}
                placeholder="JavaScript, React, Node.js, Python, SQL, Git..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-400 mt-1">Separate skills with commas</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                Education
              </label>
              <textarea
                value={form.education}
                onChange={(e) => update("education", e.target.value)}
                rows={3}
                placeholder="B.Tech in Computer Science, XYZ University, 2021-2025, CGPA: 8.5"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5 text-gray-700">
                Projects
              </label>
              <textarea
                value={form.projects}
                onChange={(e) => update("projects", e.target.value)}
                rows={5}
                placeholder={"Project Name: MyApp\nTech: React, Node.js, PostgreSQL\nDescription: Built a full-stack app that...\n\nProject Name: Another Project\nTech: Python, ML\nDescription: ..."}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-800">
              <p className="font-semibold mb-1">💡 AI Resume Analysis</p>
              <p>
                After saving, go to the Jobs page and apply to a job. The AI will score your resume
                against the job description and show you improvement tips.
              </p>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-3 bg-white rounded-2xl border p-12 text-center text-gray-500">
            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Select a resume to edit</p>
            <p className="text-sm mt-1">Or create a new one to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
