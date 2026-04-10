export interface Company {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected";
  sector: string;
  openings: number;
}

export const companies: Company[] = [
  { id: "c1", name: "Google", status: "approved", sector: "Tech", openings: 5 },
  { id: "c2", name: "Microsoft", status: "approved", sector: "Tech", openings: 3 },
  { id: "c3", name: "Amazon", status: "approved", sector: "E-commerce", openings: 8 },
  { id: "c4", name: "Startup XYZ", status: "pending", sector: "Fintech", openings: 2 },
  { id: "c5", name: "NewCorp", status: "pending", sector: "EdTech", openings: 4 },
  { id: "c6", name: "TechVentures", status: "pending", sector: "SaaS", openings: 1 },
];
