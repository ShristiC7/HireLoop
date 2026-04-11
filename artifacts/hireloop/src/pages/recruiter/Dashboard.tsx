import { motion } from "framer-motion";
import { useGetRecruiterDashboard } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Briefcase, Users, CheckCircle, BarChart3, TrendingUp, ExternalLink, Plus } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  applied: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  shortlisted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  interview: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  offer: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-card border border-card-border hover:border-primary/30 transition-all">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", color)}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-2xl font-bold font-serif">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}

export default function RecruiterDashboard() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useGetRecruiterDashboard();

  return (
    <DashboardLayout requiredRole="recruiter">
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold font-serif">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your campus recruitment</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-card animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Jobs" value={dashboard?.totalJobs ?? 0} icon={Briefcase} color="bg-primary" />
              <StatCard label="Active Jobs" value={dashboard?.activeJobs ?? 0} icon={TrendingUp} color="bg-green-500" />
              <StatCard label="Total Applicants" value={dashboard?.totalApplicants ?? 0} icon={Users} color="bg-blue-500" />
              <StatCard label="Shortlisted" value={dashboard?.shortlistedCount ?? 0} icon={CheckCircle} color="bg-amber-500" />
            </div>

            {/* Job Stats */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm">Job Performance</h2>
                  <Link href="/recruiter/jobs">
                    <span className="text-xs text-primary cursor-pointer hover:underline flex items-center gap-1">View all <ExternalLink size={11} /></span>
                  </Link>
                </div>
                {(dashboard?.jobStats ?? []).length === 0 ? (
                  <div className="p-8 rounded-2xl bg-card border border-dashed border-border text-center">
                    <Briefcase size={32} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium">No jobs posted yet</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">Post your first job to start receiving applications</p>
                    <Link href="/recruiter/jobs/new">
                      <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold mx-auto" data-testid="button-post-job">
                        <Plus size={13} /> Post a Job
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboard?.jobStats?.map((job, i) => (
                      <motion.div
                        key={job.jobId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-xl bg-card border border-card-border"
                        data-testid={`card-job-stat-${job.jobId}`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <p className="font-semibold text-sm">{job.title}</p>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users size={11} /> {job.applicants} total</span>
                          <span className="flex items-center gap-1"><CheckCircle size={11} className="text-amber-400" /> {job.shortlisted} shortlisted</span>
                        </div>
                        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                            style={{ width: `${job.applicants > 0 ? (job.shortlisted / job.applicants) * 100 : 0}%` }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent applicants */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm">Recent Applicants</h2>
                </div>
                <div className="space-y-3">
                  {(dashboard?.recentApplicants ?? []).slice(0, 5).map((app, i) => {
                    if (!app) return null;
                    return (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.07 }}
                        className="p-3.5 rounded-xl bg-card border border-card-border"
                        data-testid={`card-applicant-${app.id}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xs font-bold text-primary">
                            {app.student?.name?.[0] ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{app.student?.name ?? "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{app.student?.branch} · {app.student?.cgpa} CGPA</p>
                          </div>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border capitalize", statusColors[app.status])}>
                          {app.status}
                        </span>
                      </motion.div>
                    );
                  })}
                  {!dashboard?.recentApplicants?.length && (
                    <div className="p-6 rounded-xl bg-card border border-dashed border-border text-center">
                      <Users size={20} className="text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No applicants yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/recruiter/jobs/new">
                <motion.div whileHover={{ scale: 1.01, borderColor: "rgba(99,102,241,0.4)" }} className="p-5 rounded-2xl bg-card border border-card-border flex items-center gap-4 cursor-pointer" data-testid="link-post-job">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Plus size={20} className="text-primary" /></div>
                  <div>
                    <p className="font-semibold text-sm">Post a Job</p>
                    <p className="text-xs text-muted-foreground">Reach thousands of students</p>
                  </div>
                </motion.div>
              </Link>
              <Link href="/recruiter/jobs">
                <motion.div whileHover={{ scale: 1.01, borderColor: "rgba(34,211,238,0.4)" }} className="p-5 rounded-2xl bg-card border border-card-border flex items-center gap-4 cursor-pointer" data-testid="link-manage-jobs">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><BarChart3 size={20} className="text-accent" /></div>
                  <div>
                    <p className="font-semibold text-sm">Manage Applicants</p>
                    <p className="text-xs text-muted-foreground">Review and shortlist candidates</p>
                  </div>
                </motion.div>
              </Link>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
