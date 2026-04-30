import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Plug, GraduationCap, ToggleRight, Code2, Rocket, Sparkles } from "lucide-react";

type Step = {
  id: string;
  icon: any;
  title: string;
  desc: string;
  href: string;
  cta: string;
  done: boolean;
};

export default function GettingStarted() {
  const { user } = useAuth();
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: integ }, { data: docs }, { data: feats }, { data: orders }] = await Promise.all([
        supabase.from("integrations").select("status").eq("status", "connected").limit(1),
        supabase.from("training_documents").select("id").limit(1),
        supabase.from("bot_features").select("enabled").eq("enabled", true).limit(1),
        supabase.from("orders").select("id").limit(1),
      ]);

      setSteps([
        {
          id: "connect",
          icon: Plug,
          title: "1. เชื่อมร้านค้า / ช่องทางขาย",
          desc: "เชื่อม Shopify, LINE OA, Messenger, Instagram หรือเว็บไซต์ของคุณ",
          href: "/dashboard/integrations",
          cta: "เชื่อมต่อร้าน",
          done: !!integ?.length,
        },
        {
          id: "train",
          icon: GraduationCap,
          title: "2. เทรน AI ด้วยข้อมูลร้านคุณ",
          desc: "อัปโหลด catalog, FAQ, brand voice เพื่อให้ AI ตอบเหมือนพนักงานร้านคุณจริงๆ",
          href: "/dashboard/training",
          cta: "เพิ่มข้อมูลเทรน",
          done: !!docs?.length,
        },
        {
          id: "features",
          icon: ToggleRight,
          title: "3. เปิดฟีเจอร์ AI Bot",
          desc: "เลือกเปิด/ปิดความสามารถ เช่น แนะนำสินค้า, ปิดออเดอร์, ตอบ FAQ, recover cart",
          href: "/dashboard/features",
          cta: "ตั้งค่า Bot",
          done: !!feats?.length,
        },
        {
          id: "embed",
          icon: Code2,
          title: "4. ติดตั้ง Widget บนเว็บคุณ",
          desc: "วาง snippet 1 บรรทัดบนเว็บไซต์ลูกค้าจะเห็นปุ่มแชทมุมขวาล่างทันที",
          href: "/dashboard/integrations#widget",
          cta: "คัดลอกโค้ด embed",
          done: false,
        },
        {
          id: "test",
          icon: Rocket,
          title: "5. ทดสอบและไป Live",
          desc: "ทดลองคุยกับ AI ในหน้า Live Chat, ดูยอดขายใน Analytics แล้วเปิดให้ลูกค้าจริง",
          href: "/dashboard/livechat",
          cta: "ทดลองคุยกับ AI",
          done: !!orders?.length,
        },
      ]);
      setLoading(false);
    })();
  }, [user]);

  const completed = steps.filter((s) => s.done).length;
  const pct = steps.length ? Math.round((completed / steps.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-primary font-medium">Onboarding</span>
        </div>
        <h1 className="font-display text-3xl font-bold">เริ่มต้นใช้งานใน 5 ขั้นตอน</h1>
        <p className="text-muted-foreground mt-1">ทำตามขั้นตอนเพื่อเปิดร้านอัจฉริยะของคุณภายใน 10 นาที</p>
      </div>

      <Card className="p-6 bg-gradient-card border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="font-display font-semibold">ความคืบหน้า</div>
          <div className="text-sm text-muted-foreground">{completed}/{steps.length} เสร็จแล้ว</div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <Card className="p-12 text-center text-muted-foreground">กำลังโหลด...</Card>
        ) : (
          steps.map((s) => (
            <Card key={s.id} className={`p-6 bg-gradient-card border-border/50 flex items-start gap-4 ${s.done ? "border-success/40" : ""}`}>
              <div className={`h-12 w-12 rounded-xl grid place-items-center shrink-0 ${s.done ? "bg-success/15 text-success" : "bg-primary/15 text-primary"}`}>
                {s.done ? <Check className="h-6 w-6" /> : <s.icon className="h-6 w-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold">{s.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.desc}</div>
              </div>
              <Link to={s.href}>
                <Button variant={s.done ? "outline" : "default"} className={s.done ? "" : "bg-gradient-primary"}>
                  {s.done ? "แก้ไข" : s.cta}
                </Button>
              </Link>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
