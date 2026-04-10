export interface InterviewQuestion {
  id: number;
  question: string;
  feedback: string;
}

export const interviewQuestions: InterviewQuestion[] = [
  { id: 1, question: "Tell me about yourself and why you're interested in this role.", feedback: "Good answer! Try to keep it concise and relevant to the role. Mention your key skills and experiences." },
  { id: 2, question: "What is your greatest strength?", feedback: "Nice! Back your strengths with specific examples from your projects or internships." },
  { id: 3, question: "Describe a challenging project you worked on.", feedback: "Well structured! Remember to use the STAR method - Situation, Task, Action, Result." },
  { id: 4, question: "Where do you see yourself in 5 years?", feedback: "Good vision! Show ambition while being realistic. Connect your growth to the company's mission." },
  { id: 5, question: "Why should we hire you?", feedback: "Strong finish! Highlight what makes you unique and how you can add value to the team." },
];
