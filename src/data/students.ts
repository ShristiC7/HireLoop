export interface Student {
  id: string;
  name: string;
  cgpa: number;
  branch: string;
  skills: string[];
  status: string;
}

export const students: Student[] = [
  { id: "s1", name: "Aarav Sharma", cgpa: 8.5, branch: "CSE", skills: ["React", "Node.js", "Python"], status: "Applied" },
  { id: "s2", name: "Priya Patel", cgpa: 9.1, branch: "CSE", skills: ["Java", "Spring", "SQL"], status: "Shortlisted" },
  { id: "s3", name: "Rohan Gupta", cgpa: 7.8, branch: "IT", skills: ["Python", "Django", "AWS"], status: "Applied" },
  { id: "s4", name: "Sneha Reddy", cgpa: 8.2, branch: "CSE", skills: ["JavaScript", "React", "MongoDB"], status: "Interview" },
  { id: "s5", name: "Vikram Singh", cgpa: 7.3, branch: "ECE", skills: ["C++", "Embedded", "IoT"], status: "Applied" },
  { id: "s6", name: "Ananya Joshi", cgpa: 8.9, branch: "CSE", skills: ["ML", "Python", "TensorFlow"], status: "Offer" },
  { id: "s7", name: "Karan Mehta", cgpa: 7.6, branch: "IT", skills: ["PHP", "Laravel", "MySQL"], status: "Rejected" },
  { id: "s8", name: "Divya Nair", cgpa: 8.0, branch: "CSE", skills: ["Go", "Docker", "Kubernetes"], status: "Shortlisted" },
];
