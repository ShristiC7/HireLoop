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
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Job Listings</h1>
        <p className="text-gray-600 mt-2">Browse and apply to available positions</p>
      </div>

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
    </div>
  );
}
