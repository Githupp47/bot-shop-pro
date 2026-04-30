import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Send, Bot, User, Sparkles, Loader2 } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatWidget() {
  const { userId } = useParams();
  const [params] = useSearchParams();
  const customerName = params.get("name") || "Visitor";
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "สวัสดีค่ะ ดิฉันเป็นผู้ช่วย AI พร้อมตอบทุกคำถามค่ะ มีอะไรให้ช่วยไหมคะ?" },
  ]);
  const [draft, setDraft] = useState("");
  const [convId, setConvId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  const send = async () => {
    if (!draft.trim() || !userId || loading) return;
    const text = draft.trim();
    setDraft("");
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          ownerId: userId,
          customerName,
          channel: "web_widget",
          conversationId: convId,
          message: text,
          history: msgs,
        }),
      });
      const data = await res.json();
      if (data.conversationId) setConvId(data.conversationId);
      if (data.reply) setMsgs((m) => [...m, { role: "assistant", content: data.reply }]);
      else if (data.error) setMsgs((m) => [...m, { role: "assistant", content: `⚠️ ${data.error}` }]);
    } catch (e: any) {
      setMsgs((m) => [...m, { role: "assistant", content: "⚠️ Connection error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/40">
        <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-display font-semibold leading-none">AI Assistant</div>
          <div className="text-xs text-muted-foreground mt-0.5">Online · ตอบทันที 24/7</div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="h-7 w-7 rounded-full bg-gradient-primary grid place-items-center shrink-0">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="h-7 w-7 rounded-full bg-muted grid place-items-center shrink-0">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="h-7 w-7 rounded-full bg-gradient-primary grid place-items-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="bg-muted px-3 py-2 rounded-2xl text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border/50 p-3 bg-card/40">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="พิมพ์ข้อความ..."
            className="flex-1 bg-background border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={send}
            disabled={loading || !draft.trim()}
            className="h-10 w-10 grid place-items-center rounded-xl bg-gradient-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="text-[10px] text-muted-foreground text-center mt-2">Powered by AI Commerce Agent</div>
      </div>
    </div>
  );
}
