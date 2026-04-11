import { useState } from "react";
import { ChevronRight, MessageCircle, Loader2, Trophy, RotateCcw } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../context/AuthContext";

interface Question {
  question: string;
  answer?: string;
  aiScore?: number;
  aiFeedback?: string;
}

interface InterviewSession {
  id: string;
  questions: Question[];
  jobRole: string;
  overallScore?: number;
  overallFeedback?: string;
  completedAt?: string;
}

type Phase = "setup" | "interview" | "finished";

const JOB_ROLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "Product Manager",
  "DevOps Engineer",
  "UI/UX Designer",
  "Business Analyst",
];

export default function MockInterview() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("setup");
  const [jobRole, setJobRole] = useState("Software Engineer");
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const isPremium = user?.isPremium;

  const startInterview = async () => {
    setIsLoading(true);
    try {
      const res = await api.post<{ data: InterviewSession }>("/ai/mock-interview/start", {
        jobRole,
        questionCount: 5,
      });
      setSession(res.data);
      setCurrentQ(0);
      setAnswer("");
      setShowFeedback(false);
      setPhase("interview");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start interview";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !session || isEvaluating) return;
    setIsEvaluating(true);
    try {
      const res = await api.post<{ data: InterviewSession }>("/ai/mock-interview/answer", {
        sessionId: session.id,
        questionIndex: currentQ,
        answer: answer.trim(),
      });
      setSession(res.data);
      setShowFeedback(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to evaluate answer";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsEvaluating(false);
    }
  };

  const nextQuestion = () => {
    setAnswer("");
    setShowFeedback(false);
    setCurrentQ((prev) => prev + 1);
  };

  const finishInterview = async () => {
    if (!session || isFinishing) return;
    setIsFinishing(true);
    try {
      const res = await api.post<{ data: InterviewSession }>("/ai/mock-interview/finish", {
        sessionId: session.id,
      });
      setSession(res.data);
      setPhase("finished");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to finish session";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsFinishing(false);
    }
  };

  const reset = () => {
    setPhase("setup");
    setSession(null);
    setCurrentQ(0);
    setAnswer("");
    setShowFeedback(false);
  };

  const question = session?.questions?.[currentQ];
  const totalQuestions = session?.questions?.length ?? 0;
  const isLastQuestion = currentQ === totalQuestions - 1;

  /* ── Setup phase ── */
  if (phase === "setup") {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Mock Interview</h2>
          <p className="text-gray-500 text-sm mt-1">
            Practice with AI-generated role-specific questions and get instant feedback
          </p>
        </div>

        {!isPremium && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-semibold">Free tier: 3 sessions/month</p>
            <p className="mt-0.5">Upgrade to Premium for unlimited sessions and priority feedback.</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Select Job Role
            </label>
            <select
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              {JOB_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
            <p className="font-medium text-gray-800">What to expect:</p>
            <p>• 5 AI-generated questions (technical + behavioural)</p>
            <p>• Instant feedback and score per answer</p>
            <p>• Overall session report at the end</p>
          </div>

          <button
            onClick={startInterview}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 size={18} className="animate-spin" /> Generating Questions...</>
            ) : (
              <><MessageCircle size={18} /> Start Interview</>
            )}
          </button>
        </div>
      </div>
    );
  }

  /* ── Finished phase ── */
  if (phase === "finished" && session) {
    const score = session.overallScore ?? 0;
    const color = score >= 75 ? "text-green-600" : score >= 50 ? "text-orange-500" : "text-red-500";

    return (
      <div className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-2xl border p-6 text-center">
          <Trophy size={48} className="mx-auto mb-3 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">Interview Complete!</h2>
          <p className={`text-5xl font-black mt-3 ${color}`}>{Math.round(score)}%</p>
          <p className="text-gray-500 mt-1">Overall Score</p>
          {session.overallFeedback && (
            <p className="text-gray-700 mt-4 text-sm leading-relaxed bg-gray-50 rounded-xl p-4">
              {session.overallFeedback}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Per-Question Breakdown</h3>
          {session.questions.map((q, i) => (
            <div key={i} className="bg-white rounded-xl border p-4">
              <p className="text-sm font-medium text-gray-800 mb-2">
                Q{i + 1}: {q.question}
              </p>
              {q.answer && (
                <p className="text-xs text-gray-500 mb-2 bg-gray-50 rounded-lg p-2">
                  Your answer: {q.answer}
                </p>
              )}
              {q.aiFeedback && (
                <p className="text-xs text-gray-700 bg-purple-50 rounded-lg p-2">
                  {q.aiFeedback}
                </p>
              )}
              {q.aiScore != null && (
                <p className={`text-xs font-semibold mt-1.5 ${q.aiScore >= 7 ? "text-green-600" : q.aiScore >= 5 ? "text-orange-500" : "text-red-500"}`}>
                  Score: {q.aiScore}/10
                </p>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-purple-300 text-purple-700 font-semibold hover:bg-purple-50 transition-colors"
        >
          <RotateCcw size={16} /> Start New Interview
        </button>
      </div>
    );
  }

  /* ── Interview phase ── */
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{session?.jobRole} Interview</h2>
        <span className="text-sm text-gray-500">
          Question {currentQ + 1} of {totalQuestions}
        </span>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full ${i <= currentQ ? "bg-purple-500" : "bg-gray-200"}`}
          />
        ))}
      </div>

      <div className="bg-white rounded-2xl border p-6 space-y-4">
        {/* Question */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <MessageCircle size={16} />
          </div>
          <p className="font-medium text-gray-900 pt-1">{question?.question}</p>
        </div>

        {/* Answer input */}
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={5}
          placeholder="Type your answer here..."
          disabled={showFeedback}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none disabled:bg-gray-50 disabled:text-gray-600"
        />

        {/* AI Feedback */}
        {showFeedback && question?.aiFeedback && (
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-purple-800">AI Feedback</p>
              {question.aiScore != null && (
                <span className={`text-lg font-black ${question.aiScore >= 7 ? "text-green-600" : question.aiScore >= 5 ? "text-orange-500" : "text-red-500"}`}>
                  {question.aiScore}/10
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700">{question.aiFeedback}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {!showFeedback ? (
            <button
              onClick={submitAnswer}
              disabled={!answer.trim() || isEvaluating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isEvaluating ? (
                <><Loader2 size={16} className="animate-spin" /> Evaluating...</>
              ) : "Submit Answer"}
            </button>
          ) : isLastQuestion ? (
            <button
              onClick={finishInterview}
              disabled={isFinishing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isFinishing ? (
                <><Loader2 size={16} className="animate-spin" /> Generating Report...</>
              ) : <><Trophy size={16} /> Finish & Get Report</>}
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
            >
              Next Question <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
