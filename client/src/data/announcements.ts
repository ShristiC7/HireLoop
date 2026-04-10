export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

export const defaultAnnouncements: Announcement[] = [
  { id: "a1", title: "Placement Drive - Google", content: "Google is visiting campus on March 15. All CSE students with 8+ CGPA are eligible.", date: "2025-03-10" },
  { id: "a2", title: "Resume Submission Deadline", content: "Submit your updated resumes by March 20 to the placement cell.", date: "2025-03-08" },
  { id: "a3", title: "Mock Interview Sessions", content: "Mock interviews will be held from March 12-14 in Seminar Hall.", date: "2025-03-05" },
];
