import type { Question } from "@/lib/lectureflow/types";

export function QuestionList({ questions }: { questions: Question[] }) {
  return (
    <ol className="space-y-3">
      {questions.map((q, i) => (
        <li key={i} className="paper-card rounded-lg p-5">
          <div className="flex items-start gap-3">
            <span className="font-display text-2xl text-primary leading-none mt-1">
              {i + 1}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded ${
                  q.type === "long"
                    ? "bg-accent/10 text-accent"
                    : "bg-primary/10 text-primary"
                }`}>
                  {q.type === "long" ? "Long answer" : "Short answer"}
                </span>
              </div>
              <p className="text-ink leading-relaxed">{q.question}</p>
              {q.hint && (
                <p className="text-xs text-ink-muted mt-2 italic">Hint: {q.hint}</p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
