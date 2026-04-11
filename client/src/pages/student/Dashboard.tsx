<<<<<<< HEAD
import { useEffect, useState } from "react";
import StatCard from "../../components/StatCard";
import { Briefcase, ClipboardCheck, Trophy, Star, Loader2 } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

interface StudentStats {
  totalApplications: number;
  shortlisted: number;
  interviews: number;
  offers: number;
}

interface Job {
  id: string;
  title: string;
  salary: string;
  location: string;
  isRemote: boolean;
  jobType: string;
  recruiter: { companyName: string; companyLogo?: string };
  skills: string[];
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, jobsRes] = await Promise.allSettled([
          api.get<{ data: StudentStats }>("/student/stats"),
          api.get<{ data: Job[] }>("/jobs/recommended"),
        ]);

        if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
        if (jobsRes.status === "fulfilled") setRecommendedJobs(jobsRes.value.data);
      } catch {
        // fail silently — show zeros
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const firstName = user?.firstName || "Student";
=======
import StatCard from "../../components/StatCard";
import { Briefcase, ClipboardCheck, Trophy, Star } from "lucide-react";
import { jobs } from "../../data/jobs";

export default function StudentDashboard() {
  const applied = JSON.parse(localStorage.getItem("hireloop_applications") || "[]");
>>>>>>> 14bd8b14076dc1cb4408c222a00edc5c9c780f11

  return (
    <div className="space-y-8">
      <div>
<<<<<<< HEAD
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Track your applications and opportunities
        </p>
=======
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Track your applications and opportunities</p>
>>>>>>> 14bd8b14076dc1cb4408c222a00edc5c9c780f11
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
<<<<<<< HEAD
        <StatCard
          title="Applications"
          value={stats?.totalApplications ?? 0}
          icon={<Briefcase size={24} />}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Interviews"
          value={stats?.interviews ?? 0}
          icon={<ClipboardCheck size={24} />}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
        <StatCard
          title="Offers"
          value={stats?.offers ?? 0}
          icon={<Trophy size={24} />}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title="Shortlisted"
          value={stats?.shortlisted ?? 0}
          icon={<Star size={24} />}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
=======
        <StatCard title="Applications" value={applied.length} icon={<Briefcase size={24} />} color="bg-gradient-to-br from-blue-500 to-blue-600" />
        <StatCard title="Interviews" value={1} icon={<ClipboardCheck size={24} />} color="bg-gradient-to-br from-orange-500 to-orange-600" />
        <StatCard title="Offers" value={0} icon={<Trophy size={24} />} color="bg-gradient-to-br from-green-500 to-green-600" />
        <StatCard title="Available Jobs" value={jobs.length} icon={<Star size={24} />} color="bg-gradient-to-br from-purple-500 to-purple-600" />
>>>>>>> 14bd8b14076dc1cb4408c222a00edc5c9c780f11
      </div>

      {/* Recommended Jobs */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recommended Jobs</h2>
          <p className="text-gray-600 mt-1">Opportunities tailored for you</p>
        </div>
<<<<<<< HEAD

        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            <span>Loading recommendations...</span>
          </div>
        ) : recommendedJobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
            <p>Complete your profile with skills to see personalized recommendations.</p>
            <p className="text-sm mt-1">
              <a href="/student/resume" className="text-purple-600 hover:underline">
                Build your resume →
              </a>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedJobs.slice(0, 4).map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-purple-200"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {job.recruiter.companyName}
                    </p>
                  </div>
                  <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                    {job.jobType || "Full-time"}
                  </span>
                </div>
                <div className="flex gap-6 text-sm text-gray-600 pt-4 border-t">
                  <span className="font-medium text-gray-900">{job.salary}</span>
                  <span>{job.isRemote ? "Remote" : job.location}</span>
                </div>
              </div>
            ))}
          </div>
        )}
=======
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
>>>>>>> 14bd8b14076dc1cb4408c222a00edc5c9c780f11
      </div>
    </div>
  );
}
