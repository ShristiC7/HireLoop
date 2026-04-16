import { motion } from "framer-motion";
import { useListMyApplications } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ClipboardList, MapPin, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

const PIPELINE = [
  { key: "applied", label: "Applied", color: "bg-blue-500", textColor: "text-blue-400", borderColor: "border-blue-500/30" },
  { key: "shortlisted", label: "Shortlisted", color: "bg-amber-500", textColor: "text-amber-400", borderColor: "border-amber-500/30" },
  { key: "interview", label: "Interview", color: "bg-purple-500", textColor: "text-purple-400", borderColor: "border-purple-500/30" },
  { key: "offer", label: "Offer", color: "bg-green-500", textColor: "text-green-400", borderColor: "border-green-500/30" },
];

const FINAL_STATUS = {
  rejected: { label: "Rejected", color: "bg-red-500/10", textColor: "text-red-400", borderColor: "border-red-500/30" },
};

export default function Applications() {
  const { data: applications, isLoading } = useListMyApplications();

  const grouped = (applications ?? []).reduce<Record<string, typeof applications>>((acc, app) => {
    const key = app!.status;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(app);
    return acc;
  }, {});

  const activeApps = (applications ?? []).filter(a => a!.status !== "rejected");
  const rejectedApps = (applications ?? []).filter(a => a!.status === "rejected");

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold font-serif">My Applications</h1>
          <p className="text-muted-foreground text-sm mt-1">{(applications ?? []).length} total applications</p>
        </motion.div>

        {/* Pipeline overview */}
        <div className="grid grid-cols-4 gap-3">
          {PIPELINE.map((stage, i) => (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn("p-4 rounded-2xl bg-card border flex flex-col items-center text-center", stage.borderColor)}
            >
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mb-2 text-white text-xs font-bold", stage.color)}>
                {(grouped[stage.key] ?? []).length}
              </div>
              <p className={cn("text-xs font-semibold", stage.textColor)}>{stage.label}</p>
            </motion.div>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-card animate-pulse" />)}
          </div>
        ) : activeApps.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList size={40} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold">No applications yet</p>
            <p className="text-muted-foreground text-sm mt-2 mb-6">Start applying to jobs to track your progress here</p>
            <Link href="/student/jobs">
              <button className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold" data-testid="button-find-jobs">Find Jobs</button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activeApps.map((app, i) => {
              if (!app) return null;
              const stage = PIPELINE.find(s => s.key === app.status);
              const stageIndex = PIPELINE.findIndex(s => s.key === app.status);

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-5 rounded-2xl bg-card border border-card-border"
                  data-testid={`card-application-${app.id}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-semibold">{app.job?.title ?? "Unknown Role"}</h3>
                      <p className="text-sm text-muted-foreground">{app.job?.company}</p>
                      {app.job?.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin size={10} />{app.job.location}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold border capitalize", stage?.textColor, stage?.borderColor)}>
                        {app.status}
                      </span>
                      <span className="text-xs text-muted-foreground">Applied {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Timeline pipeline */}
                  <div className="flex items-center gap-1 group/timeline">
                    {PIPELINE.map((s, j) => (
                      <div key={s.key} className="flex items-center gap-1 flex-1">
                        <div className={cn(
                          "flex-1 h-1.5 rounded-full transition-all",
                          j <= stageIndex ? stage?.color : "bg-muted"
                        )} />
                        <div className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center text-[8px] shrink-0 border-2",
                          j <= stageIndex ? `${stage?.color} border-transparent text-white` : "border-border bg-transparent"
                        )}>
                          {j <= stageIndex && <span>✓</span>}
                        </div>
                        {j < PIPELINE.length - 1 && (
                          <ArrowRight size={10} className={cn("hidden sm:block", j < stageIndex ? "text-foreground" : "text-muted-foreground")} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {PIPELINE.map(s => (
                      <span key={s.key} className="text-[10px] sm:text-xs text-muted-foreground hidden xs:block">{s.label}</span>
                    ))}
                  </div>

                  {app.interviewDate && (
                    <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs">
                      <span className="font-semibold text-purple-400">Interview scheduled: </span>
                      <span className="text-muted-foreground">{new Date(app.interviewDate).toLocaleDateString()} at {new Date(app.interviewDate).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {app.notes && (
                    <p className="mt-2 text-xs text-muted-foreground italic">{app.notes}</p>
                  )}
                </motion.div>
              );
            })}

            {/* Rejected */}
            {rejectedApps.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Rejected ({rejectedApps.length})</h3>
                {rejectedApps.map((app) => {
                  if (!app) return null;
                  return (
                    <div key={app.id} className="p-4 rounded-xl bg-card/50 border border-red-500/20 flex items-center justify-between opacity-60 mb-2" data-testid={`card-rejected-${app.id}`}>
                      <div>
                        <p className="text-sm font-medium">{app.job?.title}</p>
                        <p className="text-xs text-muted-foreground">{app.job?.company}</p>
                      </div>
                      <span className="text-xs font-semibold text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">Rejected</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
