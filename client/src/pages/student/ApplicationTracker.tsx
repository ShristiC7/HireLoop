<<<<<<< HEAD
import { useState, useEffect } from "react";
import { CheckCircle2, Circle, XCircle, Loader2, Briefcase } from "lucide-react";
import { api } from "../../lib/api";

type AppStatus =
  | "APPLIED"
  | "SHORTLISTED"
  | "INTERVIEW_SCHEDULED"
  | "OFFER"
  | "REJECTED";

interface Application {
  id: string;
  status: AppStatus;
  appliedAt: string;
  job: {
    id: string;
    title: string;
    recruiter: { companyName: string };
  };
}

const STATUS_STEPS = ["APPLIED", "SHORTLISTED", "INTERVIEW_SCHEDULED", "OFFER"];

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  SHORTLISTED: "Shortlisted",
  INTERVIEW_SCHEDULED: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

function getStepIndex(status: AppStatus): number {
  return STATUS_STEPS.indexOf(status);
}

export default function ApplicationTracker() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ data: Application[] }>("/student/applications")
      .then((res) => setApplications(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Application Tracker</h2>
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={18} className="animate-spin" />
          <span>Loading applications...</span>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Application Tracker</h2>
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Briefcase size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No applications yet</p>
          <p className="text-gray-400 text-sm mt-1">
            <a href="/student/jobs" className="text-purple-600 hover:underline">
              Browse jobs and apply →
            </a>
          </p>
=======
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
>>>>>>> 14bd8b14076dc1cb4408c222a00edc5c9c780f11
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
<<<<<<< HEAD
      <div>
        <h2 className="text-xl font-semibold">Application Tracker</h2>
        <p className="text-gray-500 text-sm mt-1">
          {applications.length} application{applications.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-4">
        {applications.map((app) => {
          const isRejected = app.status === "REJECTED";
          const currentStep = getStepIndex(app.status);

          return (
            <div key={app.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{app.job.title}</h3>
                  <p className="text-sm text-gray-500">
                    {app.job.recruiter.companyName}
                  </p>
                </div>
                <div className="text-right">
                  {isRejected ? (
                    <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                      <XCircle size={14} /> Rejected
                    </span>
                  ) : (
                    <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      {STATUS_LABELS[app.status]}
                    </span>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Applied {new Date(app.appliedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {!isRejected && (
                <div className="flex items-center gap-1.5 mt-2">
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step} className="flex items-center gap-1.5 flex-1">
                      <div className="flex flex-col items-center">
                        {i <= currentStep ? (
                          <CheckCircle2 size={18} className="text-purple-600" />
                        ) : (
                          <Circle size={18} className="text-gray-300" />
                        )}
                        <span
                          className={`text-xs mt-1 text-center leading-tight ${
                            i <= currentStep
                              ? "text-purple-600 font-medium"
                              : "text-gray-400"
                          }`}
                        >
                          {STATUS_LABELS[step]}
                        </span>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mb-4 ${
                            i < currentStep ? "bg-purple-500" : "bg-gray-200"
                          }`}
                        />
=======
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
>>>>>>> 14bd8b14076dc1cb4408c222a00edc5c9c780f11
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
