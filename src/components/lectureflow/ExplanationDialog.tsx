import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Lightbulb, Coffee, PenLine } from "lucide-react";

type Explanation = {
  simple: string;
  realLifeExample: string;
  solvedExample: string;
};

type Props = {
  topic: string | null;
  explanation: Explanation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ExplanationDialog({ topic, explanation, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-paper border-rule">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-ink">{topic}</DialogTitle>
        </DialogHeader>
        {explanation && (
          <div className="space-y-6 mt-2">
            <Section icon={<Lightbulb className="h-4 w-4" />} title="Simple explanation">
              {explanation.simple}
            </Section>
            <Section icon={<Coffee className="h-4 w-4" />} title="Real-life example">
              {explanation.realLifeExample}
            </Section>
            <Section icon={<PenLine className="h-4 w-4" />} title="Solved example">
              {explanation.solvedExample}
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-primary">
        {icon}
        <h4 className="font-medium text-sm uppercase tracking-wider">{title}</h4>
      </div>
      <p className="text-ink leading-relaxed whitespace-pre-wrap text-[15px]">{children}</p>
    </div>
  );
}
