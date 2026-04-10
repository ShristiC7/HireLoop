import { jobs } from "../../data/jobs";
import { CheckCircle2, Circle, XCircle } from "lucide-react";

const steps = ["Applied", "Shortlisted", "Interview", "Offer"];

export default function ApplicationTracker() {
  const applied: string[] = JSON.parse(localStorage.getItem("hireloop_applications") || "[]");
  const appliedJobs = jobs.filter((j) => applied.includes(j.id));

  const getStep = (index: number) => {
    if (index === 0) return 1;
    if (index === 1) return 2;
    if (index === 2) return 3;
    return 0;
  };

  if (appliedJobs.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Application Tracker</h2>
        <div className="bg-card rounded-xl border p-8 text-center">
          <p className="text-muted-foreground">No applications yet. Apply to jobs first!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Application Tracker</h2>

      <div className="space-y-4">
        {appliedJobs.map((job, idx) => {
          const currentStep = getStep(idx % 4);
          const rejected = idx % 5 === 4;

          return (
            <div key={job.id} className="bg-card rounded-xl border p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-medium">{job.role}</h3>
                  <p className="text-sm text-muted-foreground">{job.company}</p>
                </div>
                {rejected && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <XCircle size={14} /> Rejected
                  </span>
                )}
              </div>

              {!rejected && (
                <div className="flex items-center gap-2">
                  {steps.map((step, i) => (
                    <div key={step} className="flex items-center gap-2 flex-1">
                      <div className="flex flex-col items-center">
                        {i <= currentStep ? (
                          <CheckCircle2 size={20} className="text-primary" />
                        ) : (
                          <Circle size={20} className="text-muted-foreground/40" />
                        )}
                        <span className={`text-xs mt-1 ${i <= currentStep ? "text-primary font-medium" : "text-muted-foreground"}`}>
                          {step}
                        </span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 ${i < currentStep ? "bg-primary" : "bg-border"}`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
