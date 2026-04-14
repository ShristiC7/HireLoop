import { motion } from "framer-motion";
import { useListRecruiters, useApproveRecruiter, getListRecruitersQueryKey } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Building, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function AdminRecruiters() {
  const { data: recruiters, isLoading } = useListRecruiters();
  const approveRecruiter = useApproveRecruiter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleApprove = (id: number, approve: boolean) => {
    approveRecruiter.mutate({ recruiterId: id, data: { isApproved: approve } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRecruitersQueryKey() });
        toast({ title: `Recruiter ${approve ? "approved" : "rejected"}` });
      },
      onError: () => toast({ title: "Failed to update recruiter", variant: "destructive" }),
    });
  };

  const pending = (recruiters ?? []).filter(r => !r.isApproved);
  const approved = (recruiters ?? []).filter(r => r.isApproved);

  return (
    <DashboardLayout requiredRole="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2 mb-1">
            <Building size={20} className="text-primary" />
            <h1 className="text-2xl font-bold font-serif">Recruiters</h1>
          </div>
          <p className="text-muted-foreground text-sm">{pending.length} pending approval · {approved.length} approved</p>
        </motion.div>

        {pending.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-amber-400 mb-3">Pending Approval ({pending.length})</h2>
            <div className="space-y-3">
              {pending.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl bg-card border border-amber-500/20"
                  data-testid={`recruiter-pending-${r.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"><Building size={18} className="text-amber-400" /></div>
                      <div>
                        <p className="font-semibold">{r.companyName}</p>
                        <p className="text-sm text-muted-foreground">{r.name} · {r.email}</p>
                        {r.companyWebsite && <a href={r.companyWebsite} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{r.companyWebsite}</a>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleApprove(r.id, true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-xs font-semibold hover:bg-green-500/20 transition-colors"
                        data-testid={`button-approve-${r.id}`}
                      >
                        <CheckCircle size={13} /> Approve
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleApprove(r.id, false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-colors"
                        data-testid={`button-reject-${r.id}`}
                      >
                        <XCircle size={13} /> Reject
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-green-400 mb-3">Approved Companies ({approved.length})</h2>
          {approved.length === 0 ? (
            <div className="text-center py-10">
              <Building size={32} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No approved companies yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approved.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-4 rounded-2xl bg-card border border-card-border flex items-center justify-between"
                  data-testid={`recruiter-approved-${r.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center"><Building size={16} className="text-green-400" /></div>
                    <div>
                      <p className="font-semibold text-sm">{r.companyName}</p>
                      <p className="text-xs text-muted-foreground">{r.name} · {r.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-400 font-semibold border border-green-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <CheckCircle size={11} /> Approved
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
