import { useState } from "react";
import { Download } from "lucide-react";

export default function ResumeBuilder() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    skills: "", education: "", projects: "",
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDownload = () => {
    alert("Resume download simulated! In a real app, this would generate a PDF.");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold">Resume Builder</h2>

      <div className="bg-card rounded-xl border p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="john@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Skills</label>
          <input
            value={form.skills}
            onChange={(e) => update("skills", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="React, Python, SQL, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Education</label>
          <textarea
            value={form.education}
            onChange={(e) => update("education", e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="B.Tech in Computer Science, XYZ University, 2021-2025"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Projects</label>
          <textarea
            value={form.projects}
            onChange={(e) => update("projects", e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Describe your key projects..."
          />
        </div>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          <Download size={16} />
          Download Resume
        </button>
      </div>
    </div>
  );
}
