import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, Flame, Sparkles, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function LiveChat() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [convs, setConvs] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("conversations").select("*").order("last_message_at", { ascending: false }).then(({ data }) => {
      setConvs(data || []);
      setActive(data?.[0] || null);
    });
  }, [user]);

  useEffect(() => {
    if (!active) return;
    supabase.from("messages").select("*").eq("conversation_id", active.id).order("created_at", { ascending: true }).then(({ data }) => setMsgs(data || []));
    const ch = supabase.channel(`conv-${active.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${active.id}` }, (p) => setMsgs((m) => [...m, p.new])).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active]);

  const send = async () => {
    if (!user || !active || !draft.trim()) return;
    await supabase.from("messages").insert({ conversation_id: active.id, user_id: user.id, sender: "human", content: draft });
    await supabase.from("conversations").update({ last_message: draft, last_message_at: new Date().toISOString() }).eq("id", active.id);
    setDraft("");
  };

  const askAI = async () => {
    if (!user || !active) return;
    const lastCustomer = [...msgs].reverse().find((m) => m.sender === "customer");
    if (!lastCustomer) {
      toast.error("ไม่พบข้อความจากลูกค้า");
      return;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("chat-ai", {
        body: { conversationId: active.id, message: lastCustomer.content, channel: active.channel },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("AI ตอบแล้ว");
    } catch (e: any) {
      toast.error(e.message || "AI ตอบไม่ได้");
    } finally {
      setAiLoading(false);
    }
  };

  const removeConv = async (id: string) => {
    if (!confirm("ลบบทสนทนานี้?")) return;
    await supabase.from("messages").delete().eq("conversation_id", id);
    await supabase.from("conversations").delete().eq("id", id);
    setConvs((cs) => cs.filter((c) => c.id !== id));
    if (active?.id === id) setActive(null);
    toast.success("ลบแล้ว");
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="font-display text-2xl md:text-3xl font-bold">{t("dash.livechat")}</h1>
        {active && (
          <Button size="sm" variant="ghost" className="md:hidden ml-auto" onClick={() => setActive(null)}>
            ← Back
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-180px)]">
        <Card className={`md:col-span-4 bg-gradient-card border-border/50 overflow-y-auto ${active ? "hidden md:block" : "block"}`}>
          {convs.map((c) => (
            <div key={c.id} className={`group relative w-full border-b border-border/40 transition hover:bg-card/50 ${active?.id === c.id ? "bg-card/70" : ""}`}>
              <button onClick={() => setActive(c)} className="w-full text-left p-4 pr-10">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-sm">{c.customer_name}</div>
                  {c.lead_tag === "hot" && <Badge variant="outline" className="border-destructive/40 text-destructive"><Flame className="h-3 w-3 mr-1" />Hot</Badge>}
                  {c.lead_tag === "warm" && <Badge variant="outline" className="border-warning/40 text-warning">Warm</Badge>}
                </div>
                <div className="text-xs text-muted-foreground truncate">{c.last_message}</div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase">{c.channel} · {c.status}</div>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeConv(c.id); }}
                className="absolute top-3 right-2 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition"
                aria-label="ลบบทสนทนา"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </Card>

        <Card className={`md:col-span-8 bg-gradient-card border-border/50 flex flex-col ${active ? "flex" : "hidden md:flex"}`}>
          {active ? (
            <>
              <div className="p-4 border-b border-border/40 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{active.customer_name}</div>
                  <div className="text-xs text-muted-foreground uppercase">{active.channel}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={askAI} disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Ask AI
                  </Button>
                  <Button size="sm" variant="outline">{t("dash.takeover")}</Button>
                  <Button size="sm" variant="ghost" onClick={() => removeConv(active.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgs.map((m) => {
                  const isCustomer = m.sender === "customer";
                  const isAI = m.sender === "ai";
                  return (
                    <div key={m.id} className={`flex gap-2 ${isCustomer ? "justify-start" : "justify-end"}`}>
                      {isCustomer && <div className="h-8 w-8 rounded-full bg-muted grid place-items-center shrink-0"><User className="h-4 w-4" /></div>}
                      <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${isCustomer ? "bg-muted" : isAI ? "bg-gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                        {isAI && <div className="text-[10px] opacity-80 flex items-center gap-1 mb-1"><Bot className="h-3 w-3" />AI</div>}
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-border/40 flex gap-2">
                <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("dash.typeMessage")} onKeyDown={(e) => e.key === "Enter" && send()} />
                <Button onClick={send} className="bg-gradient-primary"><Send className="h-4 w-4" /></Button>
              </div>
            </>
          ) : <div className="grid place-items-center flex-1 text-muted-foreground">Select a conversation</div>}
        </Card>
      </div>
    </div>
  );
}
