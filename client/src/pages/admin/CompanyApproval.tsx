import { useState } from "react";
import { companies as initialCompanies } from "../../data/companies";
import { CheckCircle2, XCircle } from "lucide-react";

export default function CompanyApproval() {
  const [companyList, setCompanyList] = useState(initialCompanies);

  const updateStatus = (id: string, status: "approved" | "rejected") => {
    setCompanyList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Company Approval</h2>

      <div className="space-y-3">
        {companyList.map((company) => (
          <div key={company.id} className="bg-card rounded-xl border p-4 flex items-center justify-between">
            <div>
              <h3 className="font-medium">{company.name}</h3>
              <p className="text-sm text-muted-foreground">
                {company.sector} • {company.openings} opening{company.openings > 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {company.status === "pending" ? (
                <>
                  <button
                    onClick={() => updateStatus(company.id, "approved")}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button
                    onClick={() => updateStatus(company.id, "rejected")}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                </>
              ) : (
                <span className={`text-sm px-3 py-1 rounded-full capitalize ${
                  company.status === "approved"
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}>
                  {company.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
