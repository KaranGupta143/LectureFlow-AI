import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  onAnalyze: (notes: string) => Promise<void>;
  loading: boolean;
};

export function NotesInput({ onAnalyze, loading }: Props) {
  const [notes, setNotes] = useState("");

  async function handleFile(file: File) {
    if (file.type === "application/pdf") {
      toast.message("PDF detected", {
        description: "For best results, copy the text and paste it below. Direct PDF parsing isn't supported in this version.",
      });
      return;
    }
    if (file.size > 1_000_000) {
      toast.error("File too large (max 1MB of text)");
      return;
    }
    const text = await file.text();
    setNotes(text);
    toast.success(`Loaded ${file.name}`);
  }

  async function submit() {
    if (notes.trim().length < 20) {
      toast.error("Please paste at least a paragraph of notes");
      return;
    }
    await onAnalyze(notes.trim());
  }

  return (
    <div className="paper-card rounded-xl p-6 flex flex-col gap-4 h-full">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-display text-ink">Your lecture notes</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {notes.length.toLocaleString()} chars
        </span>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-muted cursor-pointer hover:text-primary transition-colors w-fit">
        <Upload className="h-4 w-4" />
        <span>Upload .txt / .md file</span>
        <input
          type="file"
          accept=".txt,.md,.text,application/pdf,text/plain"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
      </label>

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Paste your lecture notes here. The more detail, the better the analysis. Try a chapter summary, class notes, or transcribed audio…"
        className="flex-1 min-h-[320px] font-sans text-[15px] leading-relaxed resize-none bg-paper border-rule"
      />

      <Button
        onClick={submit}
        disabled={loading}
        size="lg"
        className="w-full font-medium tracking-wide"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your lecture…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" /> Extract concepts &amp; questions
          </>
        )}
      </Button>
    </div>
  );
}
