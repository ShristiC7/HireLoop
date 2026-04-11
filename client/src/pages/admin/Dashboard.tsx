import { useState, useEffect } from "react";
import StatCard from "../../components/StatCard";
import { Users, Building2, Trophy, Briefcase, TrendingUp, Loader2 } from "lucide-react";
import { api } from "../../lib/api";

interface DashboardOverview {
  totalStudents: number;
  totalRecruiters: number;
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  placements: number;
  placementRate: string;
  pendingRecruiters: number;
}

interface DashboardData {
  overview: DashboardOverview;
  statusBreakdown: Record<string, number>;
  departmentPlacements: Record<string, number>;
  pendingRecruiterApprovals: unknown[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: DashboardData }>("/admin/dashboard")
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 py-12">
        <Loader2 size={20} className="animate-spin" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Placement cell overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Students"
          value={data?.overview?.totalStudents ?? 0}
          icon={<Users size={20} />}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Total Companies"
          value={data?.overview?.totalRecruiters ?? 0}
          icon={<Building2 size={20} />}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
        <StatCard
          title="Placements"
          value={data?.overview?.placements ?? 0}
          icon={<Trophy size={20} />}
          color="bg-gradient-to-br from-green-500 to-green-600"
        />
        <StatCard
          title="Active Jobs"
          value={data?.overview?.activeJobs ?? 0}
          icon={<Briefcase size={20} />}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <StatCard
          title="Applications"
          value={data?.overview?.totalApplications ?? 0}
          icon={<TrendingUp size={20} />}
          color="bg-gradient-to-br from-pink-500 to-pink-600"
        />
        <StatCard
          title="Pending Approvals"
          value={data?.overview?.pendingRecruiters ?? 0}
          icon={<Building2 size={20} />}
          color={
            (data?.overview?.pendingRecruiters ?? 0) > 0
              ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
              : "bg-gradient-to-br from-gray-400 to-gray-500"
          }
        />
      </div>

      {/* Placement rate */}
      {data?.overview && (
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Overall Placement Rate</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(parseFloat(data.overview.placementRate) || 0, 100)}%` }}
              />
            </div>
            <span className="text-lg font-bold text-green-600 min-w-16 text-right">
              {data.overview.placementRate}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {data.overview.placements} students placed out of {data.overview.totalStudents} registered
          </p>
        </div>
      )}

      {/* Pending approvals banner */}
      {(data?.overview?.pendingRecruiters ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-800">
              {data!.overview.pendingRecruiters} recruiter{data!.overview.pendingRecruiters !== 1 ? "s" : ""} awaiting approval
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              Review and approve company registrations
            </p>
          </div>
          <a
            href="/admin/companies"
            className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition-colors"
          >
            Review Now
          </a>
        </div>
      )}
    </div>
  );
}
