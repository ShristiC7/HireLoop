import StatCard from "../../components/StatCard";
import { Briefcase, ClipboardCheck, Trophy, Star } from "lucide-react";
import { jobs } from "../../data/jobs";

export default function StudentDashboard() {
  const applied = JSON.parse(localStorage.getItem("hireloop_applications") || "[]");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Track your applications and opportunities</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Applications" value={applied.length} icon={<Briefcase size={24} />} color="bg-gradient-to-br from-blue-500 to-blue-600" />
        <StatCard title="Interviews" value={1} icon={<ClipboardCheck size={24} />} color="bg-gradient-to-br from-orange-500 to-orange-600" />
        <StatCard title="Offers" value={0} icon={<Trophy size={24} />} color="bg-gradient-to-br from-green-500 to-green-600" />
        <StatCard title="Available Jobs" value={jobs.length} icon={<Star size={24} />} color="bg-gradient-to-br from-purple-500 to-purple-600" />
      </div>

      {/* Recommended Jobs */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recommended Jobs</h2>
          <p className="text-gray-600 mt-1">Opportunities tailored for you</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.slice(0, 4).map((job) => (
            <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-purple-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{job.role}</h3>
                  <p className="text-gray-600 text-sm mt-1">{job.company}</p>
                </div>
                <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">{job.type}</span>
              </div>
              <div className="flex gap-6 text-sm text-gray-600 pt-4 border-t">
                <span className="font-medium text-gray-900">{job.salary}</span>
                <span>{job.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
