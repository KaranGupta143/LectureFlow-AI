import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, RefreshCw, BookMarked, Target, Repeat } from "lucide-react";
import type { ActionPlan } from "@/lib/lectureflow/types";

type Props = {
  plan: ActionPlan | null;
  onGenerate: () => void;
  loading: boolean;
};

export function ActionPlanPanel({ plan, onGenerate, loading }: Props) {
  return (
    <div className="space-y-4">
      <div className="paper-card rounded-lg p-5 bg-gradient-to-br from-primary/5 to-amber-glow/5 border-primary/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl text-ink">Today&rsquo;s study plan</h3>
            <p className="text-sm text-ink-muted mt-1">
              A concrete plan based on what you&rsquo;ve marked as revised.
            </p>
          </div>
          <Button onClick={onGenerate} disabled={loading} size="sm">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : plan ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {plan ? "Regenerate" : "Generate plan"}
          </Button>
        </div>
      </div>

      {plan && (
        <div className="grid gap-3">
          <PlanSection
            icon={<Repeat className="h-4 w-4" />}
            title="Revise today"
            color="text-primary"
            items={plan.revise}
          />
          <PlanSection
            icon={<BookMarked className="h-4 w-4" />}
            title="Practice"
            color="text-accent"
            items={plan.practice}
          />
          <PlanSection
            icon={<Target className="h-4 w-4" />}
            title="Focus next"
            color="text-primary"
            items={plan.focus}
          />
        </div>
      )}

      {!plan && !loading && (
        <p className="text-sm text-ink-muted italic px-1">
          Tip: tick concepts on the left as you revise them — the plan adapts to your progress.
        </p>
      )}
    </div>
  );
}

function PlanSection({
  icon,
  title,
  color,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  items: string[];
}) {
  return (
    <div className="paper-card rounded-lg p-5">
      <div className={`flex items-center gap-2 mb-3 ${color}`}>
        {icon}
        <h4 className="font-medium text-sm uppercase tracking-wider">{title}</h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-ink leading-relaxed text-[15px]">
            <span className={`${color} mt-1.5`}>•</span>
            <span className="flex-1">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
