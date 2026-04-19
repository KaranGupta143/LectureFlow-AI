import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, BookOpen, Loader2 } from "lucide-react";
import type { Concept } from "@/lib/lectureflow/types";

type Props = {
  concepts: Concept[];
  revised: Set<string>;
  onToggleRevised: (topic: string) => void;
  onExplain: (topic: string) => void;
  explainingTopic: string | null;
};

export function ConceptList({ concepts, revised, onToggleRevised, onExplain, explainingTopic }: Props) {
  return (
    <div className="space-y-3">
      {concepts.map((c) => {
        const isRevised = revised.has(c.topic);
        return (
          <div
            key={c.id}
            className="paper-card rounded-lg p-5 transition-all hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => onToggleRevised(c.topic)}
                    className="text-primary hover:scale-110 transition-transform"
                    aria-label={isRevised ? "Mark as pending" : "Mark as revised"}
                  >
                    {isRevised ? (
                      <CheckCircle2 className="h-5 w-5 fill-primary text-primary-foreground" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  <h3 className="font-display text-xl text-ink leading-tight">{c.topic}</h3>
                </div>
                <p className="text-sm text-ink-muted leading-relaxed mb-3">
                  {c.definition}
                </p>
                {c.subtopics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.subtopics.map((s, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onExplain(c.topic)}
                disabled={explainingTopic === c.topic}
                className="shrink-0 text-primary hover:text-primary hover:bg-primary/10"
              >
                {explainingTopic === c.topic ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BookOpen className="h-4 w-4" />
                )}
                Explain
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
