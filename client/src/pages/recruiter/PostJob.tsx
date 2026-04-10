import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PostJob() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ role: "", cgpa: "", branch: "", salary: "" });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = JSON.parse(localStorage.getItem("hireloop_posted_jobs") || "[]");
    const newJob = { ...form, id: Date.now().toString(), posted: "Just now" };
    localStorage.setItem("hireloop_posted_jobs", JSON.stringify([...existing, newJob]));
    alert("Job posted successfully!");
    navigate("/recruiter");
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-xl font-semibold">Post a New Job</h2>

      <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Role</label>
          <input
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. Software Engineer"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Min CGPA</label>
            <input
              value={form.cgpa}
              onChange={(e) => update("cgpa", e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. 7.0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Branch</label>
            <input
              value={form.branch}
              onChange={(e) => update("branch", e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. CSE"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Salary</label>
          <input
            value={form.salary}
            onChange={(e) => update("salary", e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. ₹15 LPA"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          Post Job
        </button>
      </form>
    </div>
  );
}
