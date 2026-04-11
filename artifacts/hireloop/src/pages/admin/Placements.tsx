import { motion } from "framer-motion";
import { useGetAdminDashboard, useGetPlacementStats, useListStudents } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BarChart3, PieChart as PieIcon, TrendingUp, Download, FileText, Users, GraduationCap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { useToast } from "@/hooks/use-toast";

const COLORS = ["#6366f1", "#22d3ee", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function DownloadButton({ label, href, icon: Icon }: { label: string; href: string; icon: React.ElementType }) {
  const { toast } = useToast();
  const handleClick = async () => {
    try {
      const res = await fetch(href, { credentials: "include" });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? "report.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: `${label} downloaded!` });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-sm font-medium transition-colors"
    >
      <Icon size={14} />
      {label}
      <Download size={12} className="opacity-60" />
    </motion.button>
  );
}

export default function AdminPlacements() {
  const { data: dashboard } = useGetAdminDashboard();
  const { data: stats } = useGetPlacementStats();
  const { data: allStudents } = useListStudents({});

  const batchWise = Object.values(
    (allStudents ?? []).reduce<Record<string, { batch: string; total: number; placed: number; avgPackage: number; pkgSum: number }>>((acc, s) => {
      const b = s.batch ?? "Unknown";
      if (!acc[b]) acc[b] = { batch: b, total: 0, placed: 0, avgPackage: 0, pkgSum: 0 };
      acc[b].total++;
      if (s.placementStatus === "placed") {
        acc[b].placed++;
        acc[b].pkgSum += Number(s.packageLpa ?? 0);
      }
      return acc;
    }, {})
  ).map(b => ({
    ...b,
    rate: b.total > 0 ? Math.round((b.placed / b.total) * 100) : 0,
    avgPackage: b.placed > 0 ? parseFloat((b.pkgSum / b.placed).toFixed(1)) : 0,
  })).sort((a, b) => a.batch.localeCompare(b.batch));

  return (
    <DashboardLayout requiredRole="admin">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <BarChart3 size={20} className="text-primary" />
              <h1 className="text-2xl font-bold font-serif">Placement Analytics</h1>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">Deep dive into placement statistics</p>
        </motion.div>

        {/* Export Reports Section */}
        <div className="p-5 rounded-2xl bg-card border border-card-border">
          <div className="flex items-center gap-2 mb-3">
            <Download size={16} className="text-primary" />
            <h3 className="font-semibold text-sm">Export Reports</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Download placement data as CSV files for offline analysis and presentations</p>
          <div className="flex flex-wrap gap-3">
            <DownloadButton
              label="All Students"
              href={`${BASE}/api/admin/reports/students`}
              icon={Users}
            />
            <DownloadButton
              label="Placement Report"
              href={`${BASE}/api/admin/reports/placements`}
              icon={FileText}
            />
            <DownloadButton
              label="Applications Report"
              href={`${BASE}/api/admin/reports/applications`}
              icon={BarChart3}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Branch wise bar chart */}
          <div className="p-6 rounded-2xl bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-primary" />
              <h3 className="font-semibold text-sm">Branch-wise Placement Rate</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats?.branchWise ?? []}>
                <XAxis dataKey="branch" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="rate" name="Placement %" radius={[4, 4, 0, 0]}>
                  {(stats?.branchWise ?? []).map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Package distribution */}
          <div className="p-6 rounded-2xl bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4">
              <PieIcon size={16} className="text-accent" />
              <h3 className="font-semibold text-sm">Package Distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats?.packageDistribution ?? []} dataKey="count" nameKey="range" cx="50%" cy="50%" outerRadius={80} label={({ range, percent }: { range: string; percent: number }) => `${range} (${(percent * 100).toFixed(0)}%)`} labelLine={false} fontSize={10}>
                  {(stats?.packageDistribution ?? []).map((_: unknown, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend formatter={(value: string) => <span style={{ fontSize: 11 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Avg package by branch */}
          <div className="p-6 rounded-2xl bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-chart-3" />
              <h3 className="font-semibold text-sm">Avg Package by Branch (LPA)</h3>
            </div>
            <div className="space-y-3">
              {(stats?.branchWise ?? []).map((b: { branch: string; avgPackage: number; rate: number }) => (
                <div key={b.branch} data-testid={`avg-package-${b.branch}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{b.branch}</span>
                    <span className="text-xs font-bold text-green-400">{b.avgPackage || "N/A"} LPA</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-green-500 to-accent rounded-full" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (b.avgPackage / 42) * 100)}%` }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Company table */}
          <div className="p-6 rounded-2xl bg-card border border-card-border">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-primary" />
              <h3 className="font-semibold text-sm">Company Hiring Stats</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left pb-2">Company</th>
                  <th className="text-right pb-2">Hired</th>
                  <th className="text-right pb-2">Avg (LPA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(stats?.companyWise ?? []).map((c: { company: string; hired: number; avgPackage: number }, i: number) => (
                  <tr key={c.company} className="text-sm" data-testid={`company-row-${i}`}>
                    <td className="py-2 font-medium">{c.company}</td>
                    <td className="py-2 text-right text-muted-foreground">{c.hired}</td>
                    <td className="py-2 text-right font-semibold text-green-400">{c.avgPackage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Batch Analytics */}
        <div className="p-6 rounded-2xl bg-card border border-card-border">
          <div className="flex items-center gap-2 mb-5">
            <GraduationCap size={16} className="text-accent" />
            <h3 className="font-semibold text-sm">Batch-wise Placement Analytics</h3>
          </div>
          {batchWise.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No student data available yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left pb-2">Batch Year</th>
                    <th className="text-right pb-2">Total Students</th>
                    <th className="text-right pb-2">Placed</th>
                    <th className="text-right pb-2">Placement %</th>
                    <th className="text-right pb-2">Avg Package (LPA)</th>
                    <th className="pb-2 pl-4">Rate Bar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batchWise.map((b, i) => (
                    <motion.tr
                      key={b.batch}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="text-sm"
                      data-testid={`batch-row-${b.batch}`}
                    >
                      <td className="py-2.5 font-semibold flex items-center gap-1.5">
                        <GraduationCap size={12} className="text-accent" /> {b.batch}
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">{b.total}</td>
                      <td className="py-2.5 text-right text-green-400 font-medium">{b.placed}</td>
                      <td className="py-2.5 text-right font-bold">{b.rate}%</td>
                      <td className="py-2.5 text-right text-green-400">{b.avgPackage > 0 ? `${b.avgPackage}` : "—"}</td>
                      <td className="py-2.5 pl-4">
                        <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: COLORS[i % COLORS.length] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${b.rate}%` }}
                            transition={{ duration: 0.8, delay: i * 0.05 }}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
