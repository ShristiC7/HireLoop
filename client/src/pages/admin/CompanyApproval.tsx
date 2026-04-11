import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Building2, Loader2, Clock } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../hooks/use-toast";

interface Recruiter {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  companyName: string;
  companyWebsite?: string;
  industry?: string;
  companySize?: string;
  firstName: string;
  lastName: string;
  user: { email: string; createdAt: string };
  rejectionReason?: string;
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-gray-100 text-gray-600",
};

export default function CompanyApproval() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const { toast } = useToast();

  const fetchRecruiters = () => {
    setIsLoading(true);
    api
      .get<{ data: Recruiter[] }>(`/admin/recruiters?status=${filter === "ALL" ? "" : filter}`)
      .then((res) => setRecruiters(res.data))
      .catch(() => setRecruiters([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchRecruiters(); }, [filter]); // eslint-disable-line

  const approve = async (id: string) => {
    setActionId(id);
    try {
      await api.patch(`/admin/recruiters/${id}/approve`);
      setRecruiters((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" as const } : r))
      );
      toast({ title: "Recruiter approved ✅", description: "They can now post jobs." });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setActionId(null);
    }
  };

  const reject = async (id: string) => {
    setActionId(id);
    try {
      await api.patch(`/admin/recruiters/${id}/reject`, { reason: "Does not meet requirements." });
      setRecruiters((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" as const } : r))
      );
      toast({ title: "Recruiter rejected", variant: "destructive" });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Company Approvals</h2>
        <p className="text-gray-500 text-sm mt-1">Review and manage recruiter registrations</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white border text-gray-600 hover:border-blue-400"
            }`}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={18} className="animate-spin" />
          <span>Loading...</span>
        </div>
      ) : recruiters.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center text-gray-500">
          <Building2 size={40} className="mx-auto mb-3 text-gray-300" />
          <p>No {filter !== "ALL" ? filter.toLowerCase() : ""} recruiters found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recruiters.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border p-4 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{r.companyName}</h3>
                  <p className="text-sm text-gray-500">
                    {r.industry} {r.companySize ? `• ${r.companySize} employees` : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Contact: {r.firstName} {r.lastName} ({r.user.email})
                  </p>
                  {r.companyWebsite && (
                    <a
                      href={r.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      {r.companyWebsite}
                    </a>
                  )}
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    Applied {new Date(r.user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_BADGE[r.status]}`}
                >
                  {r.status}
                </span>

                {r.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => approve(r.id)}
                      disabled={actionId === r.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      {actionId === r.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => reject(r.id)}
                      disabled={actionId === r.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
