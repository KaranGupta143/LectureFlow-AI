import { Progress } from "@/components/ui/progress";
import type { Concept } from "@/lib/lectureflow/types";

type Props = {
  concepts: Concept[];
  revised: Set<string>;
};

export function KnowledgeTracker({ concepts, revised }: Props) {
  const total = concepts.length;
  const done = concepts.filter((c) => revised.has(c.topic)).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="paper-card rounded-lg p-5">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-display text-xl text-ink">Knowledge tracker</h3>
        <span className="text-2xl font-display text-primary tabular-nums">
          {done}/{total}
        </span>
      </div>
      <Progress value={pct} className="h-2 mb-4" />
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label="Covered" value={total} />
        <Stat label="Revised" value={done} />
        <Stat label="Pending" value={total - done} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-secondary/50 py-2">
      <div className="text-xl font-display text-ink tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-ink-muted">{label}</div>
    </div>
  );
}
