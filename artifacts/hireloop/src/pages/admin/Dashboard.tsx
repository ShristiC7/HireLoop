import { motion } from "framer-motion";
import { useGetAdminDashboard, useGetPlacementStats } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Users, Building, Briefcase, TrendingUp, BarChart3, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: number | string; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-card border border-card-border">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center mb-3", color)}>
        <Icon size={18} className="text-white" />
      </div>
      <p className="text-2xl font-bold font-serif">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs text-primary mt-1">{sub}</p>}
    </motion.div>
  );
}

function CircleProgress({ value, color = "#6366f1", size = 80 }: { value: number; color?: string; size?: number }) {
  const sw = 8;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={sw} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.2, ease: "easeOut" }} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-lg font-bold">{value}%</span>
      </div>
    </div>
  );
}

const COLORS = ["#6366f1", "#22d3ee", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminDashboard() {
  const { data: dashboard, isLoading } = useGetAdminDashboard();
  const { data: stats } = useGetPlacementStats();

  return (
    <DashboardLayout requiredRole="admin">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold font-serif">Placement Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time analytics for your institution</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-card animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Students" value={dashboard?.totalStudents ?? 0} icon={Users} color="bg-primary" />
              <StatCard label="Placed Students" value={dashboard?.placedStudents ?? 0} icon={Award} color="bg-green-500" />
              <StatCard label="Active Companies" value={dashboard?.activeCompanies ?? 0} icon={Building} color="bg-blue-500" />
              <StatCard label="Open Jobs" value={dashboard?.totalJobs ?? 0} icon={Briefcase} color="bg-amber-500" />
            </div>

            {/* Placement Rate + Packages */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 flex flex-col items-center">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">Placement Rate</p>
                <CircleProgress value={dashboard?.placementRate ?? 0} color="#6366f1" size={110} />
                <div className="flex gap-6 mt-4">
                  <div className="text-center">
                    <p className="text-lg font-bold font-serif text-green-400">{dashboard?.averagePackageLpa?.toFixed(1)} LPA</p>
                    <p className="text-xs text-muted-foreground">Avg Package</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold font-serif text-primary">{dashboard?.highestPackageLpa} LPA</p>
                    <p className="text-xs text-muted-foreground">Highest</p>
                  </div>
                </div>
              </div>

              {/* Monthly trend */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-card-border">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-primary" />
                  <h3 className="font-semibold text-sm">Monthly Placement Trend</h3>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={dashboard?.monthlyTrend ?? []}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="placed" radius={[4, 4, 0, 0]}>
                      {(dashboard?.monthlyTrend ?? []).map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Branch wise */}
            {stats && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-card border border-card-border">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={16} className="text-accent" />
                    <h3 className="font-semibold text-sm">Branch-wise Placement</h3>
                  </div>
                  <div className="flex flex-col md:flex-row gap-6 mt-4">
                    <div className="flex-1 space-y-3">
                      {(stats.branchWise ?? []).map((branch: { branch: string; placed: number; total: number; rate: number; avgPackage: number }, i: number) => (
                        <div key={branch.branch} data-testid={`branch-row-${branch.branch.toLowerCase()}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-medium uppercase text-muted-foreground">{branch.branch}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold" style={{ color: COLORS[i % COLORS.length] }}>{branch.rate}%</span>
                            </div>
                          </div>
                          <div className="h-1 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: COLORS[i % COLORS.length] }}
                              initial={{ width: 0 }}
                              animate={{ width: `${branch.rate}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="w-full md:w-32 h-32 flex shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.branchWise ?? []}
                            innerRadius={30}
                            outerRadius={50}
                            paddingAngle={5}
                            dataKey="placed"
                          >
                            {(stats.branchWise ?? []).map((_: unknown, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-card border border-card-border">
                  <div className="flex items-center gap-2 mb-4">
                    <Building size={16} className="text-chart-3" />
                    <h3 className="font-semibold text-sm">Top Hiring Companies</h3>
                  </div>
                  <div className="space-y-3">
                    {(stats.companyWise ?? []).slice(0, 6).map((c: { company: string; hired: number; avgPackage: number }, i: number) => (
                      <div key={c.company} className="flex items-center justify-between" data-testid={`company-row-${i}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: COLORS[i % COLORS.length] + "22", color: COLORS[i % COLORS.length] }}>
                            {i + 1}
                          </div>
                          <span className="text-sm font-medium">{c.company}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{c.hired} hired</span>
                          <span className="font-semibold text-foreground">{c.avgPackage} LPA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Placements */}
            {(dashboard?.recentPlacements ?? []).length > 0 && (
              <div className="p-6 rounded-2xl bg-card border border-card-border">
                <h3 className="font-semibold text-sm mb-4">Recent Placements</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {dashboard?.recentPlacements?.slice(0, 6).map(s => (
                    <div key={s.id} className="p-3.5 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20" data-testid={`placement-${s.id}`}>
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.branch} · {s.batch}</p>
                      {s.packageLpa && <p className="text-xs text-green-400 font-semibold mt-1">{s.packageLpa} LPA</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
