import { useState } from "react";
import { students as initialStudents } from "../../data/students";

export default function Applicants() {
  const [studentList, setStudentList] = useState(initialStudents);

  const updateStatus = (id: string, status: string) => {
    setStudentList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Applicants</h2>

      <div className="bg-card rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">CGPA</th>
              <th className="text-left px-4 py-3 font-medium">Skills</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {studentList.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">{s.cgpa}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    s.status === "Shortlisted" ? "bg-success/10 text-success" :
                    s.status === "Rejected" ? "bg-destructive/10 text-destructive" :
                    "bg-accent text-accent-foreground"
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(s.id, "Shortlisted")}
                      className="text-xs px-3 py-1 rounded bg-success/10 text-success hover:bg-success/20 transition-colors"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => updateStatus(s.id, "Rejected")}
                      className="text-xs px-3 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
