import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, FileSpreadsheet, HelpCircle, Globe, Mic, Tag, Plus } from "lucide-react";

const TYPES = [
  { type: "pdf", icon: FileText, label: "PDF Documents" },
  { type: "excel", icon: FileSpreadsheet, label: "Excel Catalog" },
  { type: "faq", icon: HelpCircle, label: "FAQ" },
  { type: "url", icon: Globe, label: "Website URL" },
  { type: "tone", icon: Mic, label: "Tone of Voice" },
  { type: "promo", icon: Tag, label: "Promotion Rules" },
];

export default function Training() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("faq");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("training_documents").select("*").order("created_at", { ascending: false });
    setDocs(data || []);
  };
  useEffect(() => { load(); }, [user]);

  const add = async () => {
    if (!user || !title) return;
    await supabase.from("training_documents").insert({ user_id: user.id, doc_type: type, title, content });
    setTitle(""); setContent("");
    toast.success("Added to training");
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="font-display text-3xl font-bold">{t("dash.training")}</h1><p className="text-muted-foreground mt-1">สอนบอทให้รู้จักสินค้า แบรนด์ และวิธีตอบของคุณ</p></div>

      <div className="grid md:grid-cols-3 gap-3">
        {TYPES.map((t) => (
          <Card key={t.type} onClick={() => setType(t.type)} className={`p-4 cursor-pointer transition bg-gradient-card border-border/50 hover:border-primary/40 ${type === t.type ? "border-primary shadow-glow" : ""}`}>
            <div className="flex items-center gap-3"><t.icon className="h-5 w-5 text-primary" /><span className="font-medium text-sm">{t.label}</span></div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-gradient-card border-border/50">
        <h3 className="font-display font-semibold mb-4">เพิ่มข้อมูล</h3>
        <div className="space-y-4">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" placeholder="e.g. คำถามพบบ่อย v4" /></div>
          <div><Label>Content / Notes</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="mt-1.5" /></div>
          <Button onClick={add} className="bg-gradient-primary"><Plus className="h-4 w-4 mr-2" />Add</Button>
        </div>
      </Card>

      <Card className="p-6 bg-gradient-card border-border/50">
        <h3 className="font-display font-semibold mb-4">ไฟล์ที่สอนแล้ว ({docs.length})</h3>
        <div className="space-y-2">
          {docs.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>}
          {docs.map((d) => {
            const T = TYPES.find((t) => t.type === d.doc_type) || TYPES[0];
            return (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/40">
                <T.icon className="h-4 w-4 text-primary" />
                <div className="flex-1 font-medium text-sm">{d.title}</div>
                <Badge variant="outline">{d.doc_type}</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
