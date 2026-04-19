import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, MessageCircle } from "lucide-react";
import type { ChatMessage } from "@/lib/lectureflow/types";

type Props = {
  onSend: (msgs: ChatMessage[]) => Promise<string>;
};

export function DoubtChat({ onSend }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await onSend(next);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = ["Explain this better", "Give an easier explanation", "Give more examples"];

  return (
    <div className="paper-card rounded-lg p-4 flex flex-col h-[520px]">
      <div className="flex items-center gap-2 pb-3 border-b border-rule mb-3">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="font-medium text-ink">Doubt mode</h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-ink-muted mb-4">Ask anything about your lecture.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-rule text-ink-muted hover:text-primary hover:border-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-secondary text-ink rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 pt-3 border-t border-rule mt-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask a doubt…"
          disabled={loading}
          className="bg-paper"
        />
        <Button onClick={send} disabled={loading || !input.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
