<<<<<<< HEAD
import { useState, useEffect, useCallback } from "react";
import { Briefcase, MapPin, GraduationCap, Search, Loader2, Filter } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../hooks/use-toast";

interface Job {
  id: string;
  title: string;
  salary?: string;
  location?: string;
  isRemote: boolean;
  jobType?: string;
  minCgpa?: number;
  eligibleBranches: string[];
  skills: string[];
  deadline?: string;
  createdAt: string;
  recruiter: {
    companyName: string;
    companyLogo?: string;
    industry?: string;
  };
  _count: { applications: number };
}

interface JobsResponse {
  success: boolean;
  data: Job[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface AppliedState {
  [jobId: string]: boolean;
}

export default function JobListings() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [meta, setMeta] = useState<JobsResponse["meta"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  const [applied, setApplied] = useState<AppliedState>({});
  const [search, setSearch] = useState("");
  const [jobType, setJobType] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        ...(search && { search }),
        ...(jobType && { jobType }),
      });
      const res = await api.get<JobsResponse>(`/jobs?${params}`);
      setJobs(res.data);
      setMeta(res.meta);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load jobs";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [page, search, jobType, toast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleApply = async (jobId: string) => {
    if (applied[jobId] || isApplying) return;
    setIsApplying(jobId);
    try {
      await api.post(`/student/apply/${jobId}`, { coverLetter: "" });
      setApplied((prev) => ({ ...prev, [jobId]: true }));
      toast({
        title: "Applied successfully! 🎉",
        description: "Your application has been submitted.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to apply";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsApplying(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
=======
import { useState } from "react";
import { jobs } from "../../data/jobs";
import { Briefcase, MapPin, GraduationCap } from "lucide-react";

export default function JobListings() {
  const [applied, setApplied] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem("hireloop_applications") || "[]");
  });

  const handleApply = (jobId: string) => {
    const updated = [...applied, jobId];
    setApplied(updated);
    localStorage.setItem("hireloop_applications", JSON.stringify(updated));
>>>>>>> 14bd8b14076dc1cb4408c222a00edc5c9c780f11
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Listings</h1>
        <p className="text-gray-600 mt-2">Browse and apply to available positions</p>
      </div>

<<<<<<< HEAD
      {/* Search & Filter bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search roles, companies, skills..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={jobType}
            onChange={(e) => { setJobType(e.target.value); setPage(1); }}
            className="pl-8 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
          >
            <option value="">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Jobs grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-purple-600" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
          <Briefcase size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No jobs found</p>
          <p className="text-sm mt-1">Try adjusting your search filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {jobs.map((job) => {
              const hasApplied = applied[job.id];
              const applying = isApplying === job.id;
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col hover:shadow-lg transition-all hover:border-purple-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                      <Briefcase size={20} />
                    </div>
                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">
                      {job.jobType || "Full-time"}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {job.recruiter.companyName}
                  </p>

                  <div className="flex flex-col gap-2 text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-2">
                      <MapPin size={14} className="text-purple-600" />
                      {job.isRemote ? "Remote" : job.location || "Not specified"}
                    </span>
                    {job.minCgpa && (
                      <span className="flex items-center gap-2">
                        <GraduationCap size={14} className="text-purple-600" />
                        Min CGPA: {job.minCgpa}
                      </span>
                    )}
                  </div>

                  {job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {job.skills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded"
                        >
                          {s}
                        </span>
                      ))}
                      {job.skills.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{job.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-4 border-t">
                    <span className="font-bold text-gray-900">{job.salary || "Not disclosed"}</span>
                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={hasApplied || applying}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                        hasApplied
                          ? "bg-green-100 text-green-700 cursor-not-allowed"
                          : "bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-lg transform hover:scale-105"
                      }`}
                    >
                      {applying && <Loader2 size={14} className="animate-spin" />}
                      {hasApplied ? "Applied ✓" : "Apply"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={!meta.hasPrev}
                className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!meta.hasNext}
                className="px-4 py-2 rounded-lg border text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
=======
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {jobs.map((job) => {
          const hasApplied = applied.includes(job.id);
          return (
            <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col hover:shadow-lg transition-all hover:border-purple-200">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                  <Briefcase size={20} />
                </div>
                <span className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full">{job.posted}</span>
              </div>

              <h3 className="text-lg font-bold text-gray-900">{job.role}</h3>
              <p className="text-gray-600 text-sm mb-4">{job.company}</p>

              <div className="flex flex-col gap-3 text-sm text-gray-600 mb-6">
                <span className="flex items-center gap-2"><MapPin size={14} className="text-purple-600" />{job.location}</span>
                <span className="flex items-center gap-2"><GraduationCap size={14} className="text-purple-600" />Min CGPA: {job.cgpa}</span>
              </div>

              <div className="flex items-center justify-between mt-auto pt-6 border-t">
                <span className="font-bold text-gray-900">{job.salary}</span>
                <button
                  onClick={() => handleApply(job.id)}
                  disabled={hasApplied}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    hasApplied
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-lg transform hover:scale-105"
                  }`}
                >
                  {hasApplied ? "Applied" : "Apply"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
>>>>>>> 14bd8b14076dc1cb4408c222a00edc5c9c780f11
    </div>
  );
}
