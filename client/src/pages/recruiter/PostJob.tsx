import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useToast } from "../../hooks/use-toast";
import { Loader2 } from "lucide-react";

const BRANCHES = ["CSE", "IT", "ECE", "EEE", "ME", "CE", "Mathematics"];
const JOB_TYPES = ["Full-time", "Internship", "Contract", "Part-time"];

export default function PostJob() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    responsibilities: "",
    requirements: "",
    location: "",
    isRemote: false,
    jobType: "Full-time",
    salary: "",
    minCgpa: "",
    eligibleBranches: [] as string[],
    skills: "",
    deadline: "",
  });

  const update = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleBranch = (branch: string) => {
    setForm((prev) => ({
      ...prev,
      eligibleBranches: prev.eligibleBranches.includes(branch)
        ? prev.eligibleBranches.filter((b) => b !== branch)
        : [...prev.eligibleBranches, branch],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        responsibilities: form.responsibilities || undefined,
        requirements: form.requirements || undefined,
        location: form.location || undefined,
        isRemote: form.isRemote,
        jobType: form.jobType,
        salary: form.salary || undefined,
        minCgpa: form.minCgpa ? parseFloat(form.minCgpa) : undefined,
        eligibleBranches: form.eligibleBranches,
        eligibleDegrees: ["B.Tech", "B.E.", "MCA"],
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      };

      await api.post("/recruiter/jobs", payload);

      toast({
        title: "Job posted! ✅",
        description: "Your job has been submitted for admin review.",
      });
      navigate("/recruiter");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to post job";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Post a New Job</h2>
        <p className="text-gray-500 text-sm mt-1">
          Fill in the details below. The job will go live after admin approval.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-5">
        {/* Role title */}
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-gray-700">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
            placeholder="e.g. Software Development Engineer"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-gray-700">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
            rows={4}
            placeholder="Describe the role, team, and what the candidate will do..."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Requirements */}
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-gray-700">
            Requirements
          </label>
          <textarea
            value={form.requirements}
            onChange={(e) => update("requirements", e.target.value)}
            rows={3}
            placeholder="List required qualifications, experience, etc."
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Location + Job Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700">
              Location
            </label>
            <input
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
              placeholder="e.g. Bangalore"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700">
              Job Type
            </label>
            <select
              value={form.jobType}
              onChange={(e) => update("jobType", e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Salary + CGPA */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700">
              Salary / CTC
            </label>
            <input
              value={form.salary}
              onChange={(e) => update("salary", e.target.value)}
              placeholder="e.g. 8-12 LPA"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700">
              Min CGPA
            </label>
            <input
              value={form.minCgpa}
              type="number"
              step="0.1"
              min="0"
              max="10"
              onChange={(e) => update("minCgpa", e.target.value)}
              placeholder="e.g. 7.0"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-gray-700">
            Required Skills (comma-separated)
          </label>
          <input
            value={form.skills}
            onChange={(e) => update("skills", e.target.value)}
            placeholder="JavaScript, React, Node.js, SQL"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-semibold mb-1.5 text-gray-700">
            Application Deadline
          </label>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => update("deadline", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Eligible branches */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">
            Eligible Branches (select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {BRANCHES.map((branch) => (
              <button
                key={branch}
                type="button"
                onClick={() => toggleBranch(branch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  form.eligibleBranches.includes(branch)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "text-gray-600 border-gray-300 hover:border-blue-400"
                }`}
              >
                {branch}
              </button>
            ))}
          </div>
        </div>

        {/* Remote toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isRemote}
            onChange={(e) => update("isRemote", e.target.checked)}
            className="w-4 h-4 rounded text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">This is a remote position</span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold hover:from-blue-700 hover:to-blue-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={18} className="animate-spin" />}
          {isSubmitting ? "Posting..." : "Post Job"}
        </button>
      </form>
    </div>
  );
}
