import { useState } from "react";
import { interviewQuestions } from "../../data/questions";
import { ChevronRight, MessageCircle } from "lucide-react";

export default function MockInterview() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

  const question = interviewQuestions[currentQ];

  const handleSubmit = () => {
    if (!answer.trim()) return;
    setShowFeedback(true);
  };

  const handleNext = () => {
    setAnswer("");
    setShowFeedback(false);
    setCurrentQ((prev) => Math.min(prev + 1, interviewQuestions.length - 1));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-xl font-semibold">Mock Interview</h2>

      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            Question {currentQ + 1} of {interviewQuestions.length}
          </span>
          <div className="flex gap-1">
            {interviewQuestions.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i <= currentQ ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <MessageCircle size={16} />
          </div>
          <p className="font-medium pt-1">{question.question}</p>
        </div>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
          placeholder="Type your answer here..."
          className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-4"
        />

        {showFeedback && (
          <div className="bg-accent rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-accent-foreground mb-1">Feedback</p>
            <p className="text-sm text-muted-foreground">{question.feedback}</p>
          </div>
        )}

        <div className="flex gap-3">
          {!showFeedback ? (
            <button
              onClick={handleSubmit}
              className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Submit Answer
            </button>
          ) : (
            currentQ < interviewQuestions.length - 1 && (
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Next Question <ChevronRight size={16} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
