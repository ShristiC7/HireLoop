import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStartMockInterview, useSubmitInterviewAnswer, useGetInterviewSummary, useListInterviewSessions } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Mic, Send, Bot, User, Sparkles, BarChart3, CheckCircle, TrendingUp, Clock, PlayCircle, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ROLES = ["Software Engineer", "Data Scientist", "Product Manager", "Frontend Developer", "Backend Developer", "Full Stack Developer", "DevOps Engineer", "Machine Learning Engineer"];
const LEVELS = ["fresher", "experienced", "senior"];

interface Message { role: "bot" | "user"; content: string; feedback?: string; score?: number; }

function CircleScore({ score, size = 80, color = "#6366f1" }: { score: number; size?: number; color?: string }) {
  const sw = 8;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const c = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={sw} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color === "auto" ? c : color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: "easeOut" }} />
      </svg>
      <div className="absolute flex items-center justify-center">
        <span className="text-base font-bold">{score}</span>
      </div>
    </div>
  );
}

export default function AIInterview() {
  const [role, setRole] = useState("Software Engineer");
  const [level, setLevel] = useState("fresher");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [answer, setAnswer] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [questionNum, setQuestionNum] = useState(1);
  const [viewSummaryId, setViewSummaryId] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const startInterview = useStartMockInterview();
  const submitAnswer = useSubmitInterviewAnswer();
  const { data: summary } = useGetInterviewSummary(viewSummaryId ?? "", { query: { enabled: !!viewSummaryId } });
  const { data: sessions } = useListInterviewSessions();

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleStart = () => {
    startInterview.mutate({ data: { role, level: level as "fresher" | "experienced" | "senior" } }, {
      onSuccess: (data) => {
        setSessionId(data.sessionId);
        setCurrentQuestion(data.currentQuestion ?? null);
        setTotalQuestions(data.totalQuestions ?? 5);
        setQuestionNum(1);
        setIsComplete(false);
        setMessages([{ role: "bot", content: `Welcome to your ${role} interview! I'll ask you ${data.totalQuestions} questions.\n\nQuestion 1: ${data.currentQuestion}` }]);
        toast({ title: "Interview started!" });
      },
      onError: () => toast({ title: "Failed to start interview", variant: "destructive" }),
    });
  };

  const handleSubmit = () => {
    if (!sessionId || !answer.trim()) return;
    const userAnswer = answer.trim();
    setMessages(prev => [...prev, { role: "user", content: userAnswer }]);
    setAnswer("");

    submitAnswer.mutate({ sessionId, data: { answer: userAnswer } }, {
      onSuccess: (data) => {
        const botMsg: Message = {
          role: "bot",
          content: data.isComplete
            ? `Great job! You've completed all ${totalQuestions} questions.\n\nFinal feedback: ${data.feedback}`
            : `${data.feedback}${data.nextQuestion ? `\n\nQuestion ${questionNum + 1}: ${data.nextQuestion}` : ""}`,
          feedback: data.feedback,
          score: data.score,
        };
        setMessages(prev => [...prev, botMsg]);
        if (!data.isComplete) {
          setQuestionNum(q => q + 1);
          setCurrentQuestion(data.nextQuestion ?? null);
        } else {
          setIsComplete(true);
          setViewSummaryId(sessionId);
        }
      },
      onError: () => toast({ title: "Failed to submit answer", variant: "destructive" }),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2 mb-1">
            <Mic size={20} className="text-accent" />
            <h1 className="text-2xl font-bold font-serif">AI Mock Interview</h1>
          </div>
          <p className="text-muted-foreground text-sm">Practice with role-specific questions and get instant AI feedback</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Setup or Chat */}
          <div className="lg:col-span-2">
            {!sessionId ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-card border border-card-border space-y-5">
                <h2 className="font-semibold">Configure Your Interview</h2>
                <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <div className="flex flex-wrap gap-2">
                    {ROLES.map(r => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", role === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}
                        data-testid={`role-${r.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Experience Level</label>
                  <div className="flex gap-2">
                    {LEVELS.map(l => (
                      <button
                        key={l}
                        onClick={() => setLevel(l)}
                        className={cn("px-4 py-2 rounded-lg text-xs font-semibold border capitalize transition-all", level === l ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent/30")}
                        data-testid={`level-${l}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(34,211,238,0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStart}
                  disabled={startInterview.isPending}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accent to-primary text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                  data-testid="button-start-interview"
                >
                  <PlayCircle size={16} />
                  {startInterview.isPending ? "Starting..." : "Start Interview"}
                </motion.button>
              </motion.div>
            ) : (
              <div className="flex flex-col h-[560px] rounded-2xl bg-card border border-card-border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm font-semibold">{role} Interview</span>
                    <span className="text-xs text-muted-foreground">· {level}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Q{questionNum}/{totalQuestions}</span>
                </div>

                {/* Messages */}
                <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-4">
                  <AnimatePresence>
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                        data-testid={`message-${i}`}
                      >
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0", msg.role === "bot" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary")}>
                          {msg.role === "bot" ? <Bot size={14} /> : <User size={14} />}
                        </div>
                        <div className={cn("max-w-[80%] space-y-1", msg.role === "user" ? "items-end" : "items-start")}>
                          <div className={cn("px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap", msg.role === "bot" ? "bg-secondary rounded-tl-sm text-foreground" : "bg-primary text-white rounded-tr-sm")}>
                            {msg.content}
                          </div>
                          {msg.score !== undefined && (
                            <div className="flex items-center gap-2 px-2">
                              <Star size={11} className="text-amber-400" />
                              <span className="text-xs text-muted-foreground">Answer score: <span className="font-semibold text-foreground">{msg.score}/100</span></span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {(startInterview.isPending || submitAnswer.isPending) && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center"><Bot size={14} className="text-accent" /></div>
                      <div className="px-4 py-3 rounded-2xl bg-secondary text-sm flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce delay-100" />
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce delay-200" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                {!isComplete && (
                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={2}
                        placeholder="Type your answer... (Enter to send)"
                        className="flex-1 bg-transparent border border-input rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                        data-testid="input-answer"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSubmit}
                        disabled={!answer.trim() || submitAnswer.isPending}
                        className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center shrink-0 self-end disabled:opacity-50"
                        data-testid="button-send-answer"
                      >
                        <Send size={16} />
                      </motion.button>
                    </div>
                  </div>
                )}

                {isComplete && (
                  <div className="p-4 border-t border-border text-center">
                    <p className="text-sm font-semibold text-green-400">Interview Complete!</p>
                    <button onClick={() => { setSessionId(null); setMessages([]); setIsComplete(false); setViewSummaryId(null); }} className="mt-2 text-xs text-primary hover:underline" data-testid="button-new-interview">Start New Interview</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: Summary or History */}
          <div className="space-y-5">
            {/* Summary */}
            {summary && viewSummaryId && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={16} className="text-primary" />
                  <h3 className="font-semibold text-sm">Interview Summary</h3>
                </div>
                <div className="flex justify-around mb-4">
                  <div className="text-center">
                    <CircleScore score={summary.overallScore ?? 0} color="auto" />
                    <p className="text-xs text-muted-foreground mt-1">Overall</p>
                  </div>
                  <div className="text-center">
                    <CircleScore score={summary.communicationScore ?? 0} color="#6366f1" />
                    <p className="text-xs text-muted-foreground mt-1">Communication</p>
                  </div>
                  <div className="text-center">
                    <CircleScore score={summary.technicalScore ?? 0} color="#22d3ee" />
                    <p className="text-xs text-muted-foreground mt-1">Technical</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1"><CheckCircle size={12} className="text-green-400" /><span className="text-xs font-semibold">Strengths</span></div>
                    <ul className="space-y-1">{summary.strengths?.map((s: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-green-400" />{s}</li>)}</ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1"><TrendingUp size={12} className="text-amber-400" /><span className="text-xs font-semibold">Areas to Improve</span></div>
                    <ul className="space-y-1">{summary.improvements?.map((s: string, i: number) => <li key={i} className="text-xs text-muted-foreground flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-amber-400" />{s}</li>)}</ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Past Sessions */}
            <div className="p-5 rounded-2xl bg-card border border-card-border">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={16} className="text-muted-foreground" />
                <h3 className="font-semibold text-sm">Past Sessions</h3>
              </div>
              {(sessions ?? []).filter(s => s.status === "completed").slice(0, 5).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No completed sessions yet</p>
              ) : (
                <div className="space-y-2">
                  {(sessions ?? []).filter(s => s.status === "completed").slice(0, 5).map(s => (
                    <button
                      key={s.sessionId}
                      onClick={() => setViewSummaryId(s.sessionId)}
                      className="w-full text-left p-3 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition-colors"
                      data-testid={`session-${s.sessionId}`}
                    >
                      <p className="text-xs font-semibold">{s.role}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground capitalize">{s.level}</span>
                        {s.overallScore && <span className="text-xs font-bold text-primary">{s.overallScore}%</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
