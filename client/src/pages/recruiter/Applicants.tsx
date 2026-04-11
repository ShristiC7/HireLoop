import { useState, useEffect } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../hooks/use-toast";

interface Job {
  id: string;
  title: string;
}

interface Applicant {
  id: string;
  status: string;
  appliedAt: string;
  student: {
    firstName: string;
    lastName: string;
    department: string;
    cgpa?: number;
    skills: string[];
    avatarUrl?: string;
  };
  resume?: { atsScore?: number };
}

const STATUS_OPTIONS = [
  { value: "SHORTLISTED", label: "Shortlist" },
  { value: "INTERVIEW_SCHEDULED", label: "Schedule Interview" },
  { value: "OFFER", label: "Extend Offer" },
  { value: "REJECTED", label: "Reject" },
];

const STATUS_BADGE: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-700",
  SHORTLISTED: "bg-green-100 text-green-700",
  INTERVIEW_SCHEDULED: "bg-yellow-100 text-yellow-700",
  OFFER: "bg-purple-100 text-purple-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default function Applicants() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load list of recruiter's jobs
  useEffect(() => {
    api
      .get<{ data: Job[] }>("/recruiter/jobs")
      .then((res) => {
        setJobs(res.data);
        if (res.data.length > 0) setSelectedJob(res.data[0].id);
      })
      .catch(() => {})
      .finally(() => setIsLoadingJobs(false));
  }, []);

  // Load applicants for selected job
  useEffect(() => {
    if (!selectedJob) return;
    setIsLoadingApplicants(true);
    api
      .get<{ data: Applicant[] }>(`/recruiter/jobs/${selectedJob}/applicants`)
      .then((res) => setApplicants(res.data))
      .catch(() => setApplicants([]))
      .finally(() => setIsLoadingApplicants(false));
  }, [selectedJob]);

  const updateStatus = async (applicationId: string, status: string) => {
    setUpdatingId(applicationId);
    try {
      await api.patch(`/recruiter/applications/${applicationId}/status`, { status });
      setApplicants((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
      );
      toast({ title: "Status updated", description: `Application marked as ${status.replace("_", " ")}` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update status";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoadingJobs) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-12">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Applicants</h2>
        <p className="text-gray-500 text-sm mt-1">Review and manage applications</p>
      </div>

      {/* Job selector */}
      {jobs.length > 0 && (
        <div className="relative inline-block">
          <label className="block text-sm font-semibold mb-1.5 text-gray-700">
            Select Job Posting
          </label>
          <div className="relative">
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="pl-4 pr-10 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none min-w-64"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Table */}
      {jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-gray-500">
          <p>No jobs posted yet.</p>
          <a href="/recruiter/post" className="text-blue-600 hover:underline text-sm mt-1 inline-block">
            Post your first job →
          </a>
        </div>
      ) : isLoadingApplicants ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={18} className="animate-spin" />
          <span>Loading applicants...</span>
        </div>
      ) : applicants.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-gray-500">
          <p>No applicants for this job yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">CGPA</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Branch</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Skills</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ATS Score</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {a.student.firstName} {a.student.lastName}
                  </td>
                  <td className="px-4 py-3">{a.student.cgpa ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{a.student.department}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {a.student.skills.slice(0, 3).map((s) => (
                        <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {a.resume?.atsScore != null ? (
                      <span className={`font-semibold ${a.resume.atsScore >= 70 ? "text-green-600" : "text-orange-500"}`}>
                        {Math.round(a.resume.atsScore)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[a.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {a.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 flex-wrap">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => updateStatus(a.id, opt.value)}
                          disabled={a.status === opt.value || updatingId === a.id}
                          className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all disabled:opacity-40 ${
                            a.status === opt.value
                              ? "bg-gray-100 text-gray-400 cursor-default"
                              : opt.value === "REJECTED"
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : opt.value === "OFFER"
                              ? "bg-purple-50 text-purple-600 hover:bg-purple-100"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                          }`}
                        >
                          {updatingId === a.id ? <Loader2 size={12} className="animate-spin inline" /> : opt.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
