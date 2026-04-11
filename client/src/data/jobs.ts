export interface Job {
  id: string;
  company: string;
  role: string;
  salary: string;
  branch: string;
  cgpa: number;
  location: string;
  type: string;
  posted: string;
}

export const jobs: Job[] = [
  { id: "j1", company: "Google", role: "Software Engineer", salary: "₹25 LPA", branch: "CSE", cgpa: 8.0, location: "Bangalore", type: "Full-time", posted: "2 days ago" },
  { id: "j2", company: "Microsoft", role: "Frontend Developer", salary: "₹22 LPA", branch: "CSE", cgpa: 7.5, location: "Hyderabad", type: "Full-time", posted: "3 days ago" },
  { id: "j3", company: "Amazon", role: "SDE Intern", salary: "₹60K/month", branch: "CSE", cgpa: 7.0, location: "Bangalore", type: "Internship", posted: "1 day ago" },
  { id: "j4", company: "Flipkart", role: "Backend Developer", salary: "₹18 LPA", branch: "IT", cgpa: 7.0, location: "Bangalore", type: "Full-time", posted: "5 days ago" },
  { id: "j5", company: "Infosys", role: "Systems Engineer", salary: "₹6.5 LPA", branch: "All", cgpa: 6.0, location: "Pune", type: "Full-time", posted: "1 week ago" },
  { id: "j6", company: "TCS", role: "Digital Analyst", salary: "₹7 LPA", branch: "All", cgpa: 6.0, location: "Mumbai", type: "Full-time", posted: "4 days ago" },
  { id: "j7", company: "Razorpay", role: "Full Stack Developer", salary: "₹20 LPA", branch: "CSE", cgpa: 7.5, location: "Bangalore", type: "Full-time", posted: "2 days ago" },
  { id: "j8", company: "Zomato", role: "Data Analyst", salary: "₹12 LPA", branch: "CSE", cgpa: 7.0, location: "Gurugram", type: "Full-time", posted: "6 days ago" },
];
