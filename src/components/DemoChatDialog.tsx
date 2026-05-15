import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Send, Bot, User, Sparkles, Loader2, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Msg = { role: "user" | "assistant"; content: string };

const DEMO_PRODUCTS = [
  { name: "iPhone 15 Pro 256GB", price: 42900, stock: 8 },
  { name: "MacBook Air M3", price: 39900, stock: 5 },
  { name: "AirPods Pro 2", price: 8990, stock: 24 },
  { name: "iPad Air", price: 24900, stock: 12 },
  { name: "Apple Watch Ultra 2", price: 31900, stock: 3 },
];

const SCRIPT: { match: RegExp; reply: (s: DemoState) => string; effect?: (s: DemoState) => void }[] = [
  {
    match: /(สวัสดี|hello|hi|หวัดดี)/i,
    reply: () => "สวัสดีค่ะ ยินดีต้อนรับสู่ร้านของเรา 🙌 กำลังหาสินค้าอะไรอยู่คะ? เรามี iPhone, MacBook, AirPods, iPad ค่ะ",
  },
  {
    match: /(iphone|ไอโฟน)/i,
    reply: (s) => {
      const p = s.products.find((x) => x.name.includes("iPhone"))!;
      return `iPhone 15 Pro 256GB ราคา ฿${p.price.toLocaleString()} ค่ะ เหลือสต็อก ${p.stock} ชิ้น 📱\nสนใจสั่งเลยไหมคะ?`;
    },
  },
  {
    match: /(macbook|แมค)/i,
    reply: (s) => {
      const p = s.products.find((x) => x.name.includes("MacBook"))!;
      return `MacBook Air M3 ราคา ฿${p.price.toLocaleString()} ค่ะ เหลือ ${p.stock} เครื่อง 💻 ผ่อน 0% 10 เดือนได้นะคะ`;
    },
  },
  {
    match: /(airpods|หูฟัง)/i,
    reply: (s) => {
      const p = s.products.find((x) => x.name.includes("AirPods"))!;
      return `AirPods Pro 2 ราคา ฿${p.price.toLocaleString()} ค่ะ มีสต็อก ${p.stock} ชิ้นพร้อมส่ง 🎧`;
    },
  },
  {
    match: /(สั่ง|ยืนยัน|เอา|order|buy|ซื้อ)/i,
    reply: (s) => {
      // Find last mentioned product or pick iPhone
      const target = s.lastMentioned || s.products.find((x) => x.name.includes("iPhone"))!;
      if (target.stock <= 0) return `ขออภัยค่ะ ${target.name} หมดสต็อกแล้ว 😢`;
      return `รับทราบค่ะ! 🎉 จัดส่ง ${target.name} 1 ชิ้น (฿${target.price.toLocaleString()}) ให้นะคะ\n\n📦 ตัดสต็อกอัตโนมัติ: ${target.stock} → ${target.stock - 1} ชิ้น\n📨 แจ้งเตือนเจ้าของร้านแล้วค่ะ`;
    },
    effect: (s) => {
      const target = s.lastMentioned || s.products.find((x) => x.name.includes("iPhone"))!;
      if (target.stock > 0) target.stock -= 1;
    },
  },
  {
    match: /(แอดมิน|พนักงาน|เจ้าหน้าที่|คน|human|agent)/i,
    reply: () => "🙋 รับทราบค่ะ กำลังโอนสายให้เจ้าหน้าที่นะคะ — ระบบแจ้งเตือนเจ้าของร้านเรียบร้อย จะมีพนักงานติดต่อกลับใน 2-3 นาทีค่ะ",
    effect: (s) => { s.takeover = true; },
  },
  {
    match: /(ราคา|เท่าไหร่|price)/i,
    reply: (s) =>
      "ราคาสินค้าของเราค่ะ:\n" +
      s.products.map((p) => `• ${p.name} — ฿${p.price.toLocaleString()} (สต็อก ${p.stock})`).join("\n"),
  },
];

type DemoState = { products: typeof DEMO_PRODUCTS; lastMentioned: any; takeover: boolean };

export function DemoChatDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "สวัสดีค่ะ ดิฉันเป็น AI Sales Assistant 🤖✨\nลองทักทาย, ถามสินค้า, สั่งซื้อ หรือพิมพ์ 'ขอคุยกับแอดมิน' เพื่อดูระบบแจ้งเตือนค่ะ" },
  ]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const stateRef = useRef<DemoState>({
    products: JSON.parse(JSON.stringify(DEMO_PRODUCTS)),
    lastMentioned: null,
    takeover: false,
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, loading]);

  useEffect(() => {
    if (open) {
      stateRef.current = { products: JSON.parse(JSON.stringify(DEMO_PRODUCTS)), lastMentioned: null, takeover: false };
      setMsgs([{ role: "assistant", content: "สวัสดีค่ะ ดิฉันเป็น AI Sales Assistant 🤖✨\nลองทักทาย, ถามสินค้า, สั่งซื้อ หรือพิมพ์ 'ขอคุยกับแอดมิน' เพื่อดูระบบแจ้งเตือนค่ะ" }]);
    }
  }, [open]);

  const send = () => {
    const text = draft.trim();
    if (!text || loading) return;
    setDraft("");
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    // Track last mentioned product
    const matched = stateRef.current.products.find((p) => text.toLowerCase().includes(p.name.toLowerCase().split(" ")[0]));
    if (matched) stateRef.current.lastMentioned = matched;

    setTimeout(() => {
      const rule = SCRIPT.find((r) => r.match.test(text));
      const reply = rule
        ? rule.reply(stateRef.current)
        : "ขอบคุณค่ะ 🙏 ลองพิมพ์ 'iPhone', 'MacBook', 'ราคา', 'สั่ง' หรือ 'ขอคุยกับแอดมิน' เพื่อดูฟีเจอร์ AI ค่ะ";
      rule?.effect?.(stateRef.current);
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
      setLoading(false);
    }, 700 + Math.random() * 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 h-[600px] flex flex-col overflow-hidden">
        <DialogTitle className="sr-only">AI Demo Chat</DialogTitle>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/40">
          <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="font-display font-semibold leading-none">AI Demo</div>
            <div className="text-xs text-muted-foreground mt-0.5">ตัวอย่าง · ลองคุยได้เลย</div>
          </div>
          <Badge variant="outline" className="text-xs"><Package className="h-3 w-3 mr-1" />{stateRef.current.products.reduce((s, p) => s + p.stock, 0)} stock</Badge>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
          {msgs.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="h-7 w-7 rounded-full bg-gradient-primary grid place-items-center shrink-0">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
              <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
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
          <div className="flex gap-2 mb-2 flex-wrap">
            {["iPhone", "ราคา", "สั่งเลย", "ขอคุยกับแอดมิน"].map((s) => (
              <button key={s} onClick={() => setDraft(s)} className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/70 text-muted-foreground">
                {s}
              </button>
            ))}
          </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
