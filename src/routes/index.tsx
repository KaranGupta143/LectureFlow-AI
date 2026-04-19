import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster, toast } from "sonner";
import { GraduationCap } from "lucide-react";
import { NotesInput } from "@/components/lectureflow/NotesInput";
import { ConceptList } from "@/components/lectureflow/ConceptList";
import { QuestionList } from "@/components/lectureflow/QuestionList";
import { ActionPlanPanel } from "@/components/lectureflow/ActionPlanPanel";
import { DoubtChat } from "@/components/lectureflow/DoubtChat";
import { KnowledgeTracker } from "@/components/lectureflow/KnowledgeTracker";
import { ExplanationDialog } from "@/components/lectureflow/ExplanationDialog";
import {
  analyzeNotes,
  explainConcept,
  generateActionPlan,
  chatDoubt,
} from "@/lib/lectureflow/lectureflow.functions";
import type { AnalysisResult, ActionPlan, ChatMessage } from "@/lib/lectureflow/types";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "LectureFlow AI — From notes to actionable learning" },
      {
        name: "description",
        content:
          "Turn lecture notes into key concepts, predicted exam questions, and a daily study action plan. Built for students.",
      },
    ],
  }),
});

const STORAGE_KEY = "lectureflow:v1";

type Persisted = {
  notes: string;
  analysis: AnalysisResult | null;
  revised: string[];
};

function Index() {
  const [notes, setNotes] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [revised, setRevised] = useState<Set<string>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);

  const [explainOpen, setExplainOpen] = useState(false);
  const [explainTopic, setExplainTopic] = useState<string | null>(null);
  const [explainData, setExplainData] = useState<{ simple: string; realLifeExample: string; solvedExample: string } | null>(null);
  const [explaining, setExplaining] = useState<string | null>(null);

  const [plan, setPlan] = useState<ActionPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Load from session storage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p: Persisted = JSON.parse(raw);
        setNotes(p.notes ?? "");
        setAnalysis(p.analysis ?? null);
        setRevised(new Set(p.revised ?? []));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist
  useEffect(() => {
    const p: Persisted = { notes, analysis, revised: Array.from(revised) };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    } catch {
      // ignore
    }
  }, [notes, analysis, revised]);

  async function handleAnalyze(rawNotes: string) {
    setAnalyzing(true);
    setNotes(rawNotes);
    try {
      const result = await analyzeNotes({ data: { notes: rawNotes } });
      setAnalysis(result);
      setRevised(new Set());
      setPlan(null);
      toast.success("Lecture analyzed", { description: `${result.concepts.length} concepts found.` });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to analyze notes");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleExplain(topic: string) {
    setExplaining(topic);
    setExplainTopic(topic);
    setExplainData(null);
    setExplainOpen(true);
    try {
      const data = await explainConcept({ data: { topic, context: notes } });
      setExplainData(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not explain");
      setExplainOpen(false);
    } finally {
      setExplaining(null);
    }
  }

  function toggleRevised(topic: string) {
    setRevised((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  }

  async function handleGeneratePlan() {
    if (!analysis) return;
    setPlanLoading(true);
    try {
      const result = await generateActionPlan({
        data: {
          notes,
          concepts: analysis.concepts.map((c) => c.topic),
          revised: Array.from(revised),
        },
      });
      setPlan(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build plan");
    } finally {
      setPlanLoading(false);
    }
  }

  async function handleChat(messages: ChatMessage[]) {
    const res = await chatDoubt({ data: { messages, context: notes } });
    return res.reply;
  }

  return (
    <main className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      <header className="border-b border-rule">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl leading-none text-ink">LectureFlow AI</h1>
              <p className="text-xs text-ink-muted mt-0.5">From notes to actionable learning</p>
            </div>
          </div>
          <div className="hidden sm:block text-xs text-ink-muted italic">
            Upload &middot; Understand &middot; Act
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-6">
        {/* LEFT: input */}
        <section className="lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] flex flex-col gap-4">
          <NotesInput onAnalyze={handleAnalyze} loading={analyzing} />
          {analysis && <KnowledgeTracker concepts={analysis.concepts} revised={revised} />}
        </section>

        {/* RIGHT: output */}
        <section>
          {!analysis && !analyzing && <EmptyState />}

          {analyzing && (
            <div className="paper-card rounded-xl p-12 text-center">
              <div className="inline-block h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
              <p className="font-display text-xl text-ink">Reading your lecture…</p>
              <p className="text-sm text-ink-muted mt-1">Extracting concepts and predicting exam questions.</p>
            </div>
          )}

          {analysis && (
            <div>
              <div className="mb-4">
                <p className="text-xs uppercase tracking-widest text-ink-muted mb-1">Lecture</p>
                <h2 className="font-display text-3xl text-ink leading-tight">{analysis.title}</h2>
              </div>

              <Tabs defaultValue="concepts" className="w-full">
                <TabsList className="grid grid-cols-4 w-full bg-secondary/60">
                  <TabsTrigger value="concepts">Concepts</TabsTrigger>
                  <TabsTrigger value="questions">Questions</TabsTrigger>
                  <TabsTrigger value="plan">Action plan</TabsTrigger>
                  <TabsTrigger value="chat">Doubt mode</TabsTrigger>
                </TabsList>

                <TabsContent value="concepts" className="mt-4">
                  <ConceptList
                    concepts={analysis.concepts}
                    revised={revised}
                    onToggleRevised={toggleRevised}
                    onExplain={handleExplain}
                    explainingTopic={explaining}
                  />
                </TabsContent>

                <TabsContent value="questions" className="mt-4">
                  <QuestionList questions={analysis.questions} />
                </TabsContent>

                <TabsContent value="plan" className="mt-4">
                  <ActionPlanPanel plan={plan} onGenerate={handleGeneratePlan} loading={planLoading} />
                </TabsContent>

                <TabsContent value="chat" className="mt-4">
                  <DoubtChat onSend={handleChat} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </section>
      </div>

      <ExplanationDialog
        topic={explainTopic}
        explanation={explainData}
        open={explainOpen}
        onOpenChange={setExplainOpen}
      />

      <footer className="border-t border-rule mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6 text-xs text-ink-muted flex items-center justify-between">
          <span>LectureFlow AI · A study companion, not just a summarizer.</span>
          <span className="italic">Built for curious students.</span>
        </div>
      </footer>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="paper-card rounded-xl p-10">
      <p className="text-xs uppercase tracking-widest text-primary mb-3">How it works</p>
      <h2 className="font-display text-4xl text-ink leading-tight mb-6">
        Lecture &rarr; Understanding &rarr; Action.
      </h2>
      <ol className="space-y-4 text-ink-muted">
        <Step n={1} title="Paste your notes">
          Drop in lecture notes, a chapter summary, or transcribed audio.
        </Step>
        <Step n={2} title="Get key concepts &amp; predicted questions">
          We extract topics, definitions, and 5 likely exam questions.
        </Step>
        <Step n={3} title="Click any concept to learn it">
          AI explains it like a teacher — simple words, real example, solved problem.
        </Step>
        <Step n={4} title="Generate today&rsquo;s action plan">
          Get a concrete list: what to revise, what to practice, what to focus on.
        </Step>
      </ol>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="font-display text-3xl text-primary leading-none w-8 shrink-0">{n}</span>
      <div>
        <h3 className="font-medium text-ink">{title}</h3>
        <p className="text-sm mt-0.5">{children}</p>
      </div>
    </li>
  );
}
