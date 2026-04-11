import { motion } from "framer-motion";
import { useGetStudentDashboard, useListAnnouncements } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { Brain, Briefcase, CheckCircle, ClipboardList, TrendingUp, Zap, Megaphone, ExternalLink, Clock } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-card border border-card-border hover:border-primary/30 transition-all duration-300"
    >
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", color)}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-2xl font-bold font-serif">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
    </motion.div>
  );
}

function CircleProgress({ value, size = 80, strokeWidth = 8, color = "#6366f1" }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold">{value}%</span>
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  applied: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  shortlisted: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  interview: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  offer: "bg-green-500/10 text-green-400 border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const announcementColors: Record<string, string> = {
  urgent: "border-l-red-500",
  placement: "border-l-green-500",
  event: "border-l-blue-500",
  general: "border-l-primary",
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useGetStudentDashboard();
  const { data: announcements } = useListAnnouncements();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
          <p className="text-muted-foreground text-sm">{greeting},</p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-4">
            <h1 className="text-2xl font-bold font-serif">{user?.name}</h1>
            {!isLoading && dashboard && (
              <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground"
              >
                {(dashboard.placementReadiness ?? 0) >= 80
                  ? "You're placement-ready! Keep it up."
                  : (dashboard.placementReadiness ?? 0) >= 50
                  ? `You're ${dashboard.placementReadiness}% placement-ready — a few more steps to go.`
                  : "Let's build your placement profile — start with your resume!"}
              </motion.p>
            )}
          </div>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Readiness + Stats */}
            <div className="grid lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-1 p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
              >
                <p className="text-xs font-semibold text-primary mb-3 uppercase tracking-wider">Placement Readiness</p>
                <div className="flex items-center gap-4">
                  <CircleProgress value={dashboard?.placementReadiness ?? 0} color="#6366f1" />
                  <div>
                    <p className="text-sm text-muted-foreground mt-1">Profile: {dashboard?.profileCompleteness}%</p>
                    <p className="text-sm text-muted-foreground">Resume: {dashboard?.resumeScore}%</p>
                    <Link href="/student/ai-resume">
                      <p className="text-xs text-primary mt-2 cursor-pointer hover:underline flex items-center gap-1">
                        <Brain size={11} /> Boost score
                      </p>
                    </Link>
                  </div>
                </div>
              </motion.div>

              <StatCard label="Applications" value={dashboard?.totalApplications ?? 0} icon={ClipboardList} color="bg-blue-500" />
              <StatCard label="Shortlisted" value={dashboard?.shortlisted ?? 0} icon={CheckCircle} color="bg-amber-500" />
              <StatCard label="Offers" value={dashboard?.offers ?? 0} icon={TrendingUp} color="bg-green-500" />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Applications */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm">Recent Applications</h2>
                  <Link href="/student/applications">
                    <span className="text-xs text-primary cursor-pointer hover:underline flex items-center gap-1">View all <ExternalLink size={11} /></span>
                  </Link>
                </div>
                {dashboard?.recentApplications && dashboard.recentApplications.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.recentApplications.map((app, i) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-card border border-card-border hover:border-primary/30 transition-colors"
                        data-testid={`card-application-${app.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{app.job?.title ?? "Unknown Job"}</p>
                          <p className="text-xs text-muted-foreground">{app.job?.company}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border capitalize", statusColors[app.status])}>
                            {app.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-card border border-dashed border-border text-center">
                    <ClipboardList size={28} className="text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium">No applications yet</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">Browse jobs and apply to get started</p>
                    <Link href="/student/jobs">
                      <button className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold" data-testid="button-browse-jobs">Browse Jobs</button>
                    </Link>
                  </div>
                )}

                {/* Recommended Jobs */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-sm">Recommended Jobs</h2>
                    <Link href="/student/jobs">
                      <span className="text-xs text-primary cursor-pointer hover:underline">See all</span>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {(dashboard?.recommendedJobs ?? []).slice(0, 3).map((job, i) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.07 }}
                        className="flex items-center justify-between p-4 rounded-xl bg-card border border-card-border hover:border-accent/30 transition-colors"
                        data-testid={`card-job-${job.id}`}
                      >
                        <div>
                          <p className="text-sm font-semibold">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.company} · {job.location ?? "Remote"}</p>
                        </div>
                        <Link href="/student/jobs">
                          <button className="px-3 py-1.5 text-xs font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors" data-testid={`button-apply-job-${job.id}`}>
                            Apply
                          </button>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Announcements */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone size={16} className="text-primary" />
                  <h2 className="font-semibold text-sm">Announcements</h2>
                </div>
                <div className="space-y-3">
                  {(announcements ?? []).slice(0, 5).map((ann, i) => (
                    <motion.div
                      key={ann.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className={cn("p-3.5 rounded-xl bg-card border border-card-border border-l-2", announcementColors[ann.type])}
                      data-testid={`card-announcement-${ann.id}`}
                    >
                      <p className="text-xs font-semibold text-foreground">{ann.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Clock size={10} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}</span>
                      </div>
                    </motion.div>
                  ))}
                  {!announcements?.length && (
                    <div className="p-6 rounded-xl bg-card border border-dashed border-border text-center">
                      <Megaphone size={20} className="text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No announcements yet</p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
                  <Link href="/student/ai-resume">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-card-border hover:border-primary/30 cursor-pointer transition-colors" data-testid="link-ai-resume">
                      <Brain size={16} className="text-primary" />
                      <span className="text-sm font-medium">Analyze Resume</span>
                    </div>
                  </Link>
                  <Link href="/student/ai-interview">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-card-border hover:border-accent/30 cursor-pointer transition-colors" data-testid="link-ai-interview">
                      <Zap size={16} className="text-accent" />
                      <span className="text-sm font-medium">Practice Interview</span>
                    </div>
                  </Link>
                  <Link href="/student/resume">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-card-border hover:border-chart-3/30 cursor-pointer transition-colors" data-testid="link-resume-builder">
                      <Briefcase size={16} className="text-chart-3" />
                      <span className="text-sm font-medium">Update Resume</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
