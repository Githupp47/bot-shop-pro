import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Code2, Copy, ExternalLink, Settings, Eye, EyeOff, Trash2, ShoppingBag } from "lucide-react";
import { ChannelSetupDialog } from "@/components/ChannelSetupDialog";
import { Link } from "react-router-dom";
import { SHOPIFY_STORE_PERMANENT_DOMAIN, SHOPIFY_STOREFRONT_TOKEN } from "@/integrations/shopify/client";

const PROVIDERS = [
  { key: "shopify", name: "Shopify", color: "from-emerald-500/20" },
  { key: "woocommerce", name: "WooCommerce", color: "from-purple-500/20" },
  { key: "line_oa", name: "LINE OA", color: "from-green-500/20" },
  { key: "messenger", name: "Facebook Messenger", color: "from-blue-500/20" },
  { key: "instagram", name: "Instagram DM", color: "from-pink-500/20" },
  { key: "web_widget", name: "Website Chat Widget", color: "from-cyan-500/20" },
] as const;

export default function Integrations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [setupProvider, setSetupProvider] = useState<"line_oa" | "messenger" | "instagram" | null>(null);
  const [showToken, setShowToken] = useState(false);

  const SETUP_KEYS = new Set(["line_oa", "messenger", "instagram"]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("integrations").select("*");
    setList(data || []);
  };
  useEffect(() => { load(); }, [user]);

  const toggle = async (key: string, currentlyConnected: boolean) => {
    if (!user) return;
    if (currentlyConnected) {
      await supabase.from("integrations").update({ status: "disconnected", connected_at: null }).eq("user_id", user.id).eq("provider", key as any);
      toast.success("Disconnected");
    } else {
      await supabase.from("integrations").upsert({ user_id: user.id, provider: key as any, status: "connected", store_name: `${key}-store`, connected_at: new Date().toISOString() }, { onConflict: "user_id,provider" });
      toast.success("Connected!");
    }
    load();
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const embedSnippet = user
    ? `<script src="${origin}/widget.js" data-bot="${user.id}" defer></script>`
    : "";
  const widgetUrl = user ? `${origin}/widget/${user.id}` : "";

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold">{t("dash.integrations")}</h1>
        <p className="text-muted-foreground mt-1">เชื่อมต่อร้านค้าและช่องทางการขายของคุณ</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROVIDERS.map((p) => {
          const item = list.find((i) => i.provider === p.key);
          const connected = item?.status === "connected";
          return (
            <Card key={p.key} className={`relative overflow-hidden p-6 bg-gradient-card border-border/50 ${connected ? "border-primary/50 shadow-glow" : ""}`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${p.color} to-transparent opacity-50`} />
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-display font-semibold text-lg">{p.name}</div>
                    {item?.store_name && <div className="text-xs text-muted-foreground mt-0.5">{item.store_name}</div>}
                  </div>
                  {connected && <Badge variant="outline" className="border-success/40 text-success"><Check className="h-3 w-3 mr-1" />{t("dash.connected")}</Badge>}
                </div>
                {p.key === "shopify" ? (
                  <div className="flex gap-2">
                    <Link to="/dashboard/shopify" className="flex-1">
                      <Button variant={connected ? "outline" : "default"} className={`w-full ${!connected ? "bg-gradient-primary" : ""}`}>
                        จัดการสินค้า →
                      </Button>
                    </Link>
                    {connected && (
                      <Button onClick={() => toggle(p.key, true)} variant="ghost" size="icon" title="ยกเลิกการเชื่อม Shopify">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ) : SETUP_KEYS.has(p.key) ? (
                  <div className="flex gap-2">
                    <Button onClick={() => setSetupProvider(p.key as any)} variant={connected ? "outline" : "default"} className={`flex-1 ${!connected ? "bg-gradient-primary" : ""}`}>
                      <Settings className="h-4 w-4" /> {connected ? "แก้ไข" : "ตั้งค่า"}
                    </Button>
                    {connected && (
                      <Button onClick={() => toggle(p.key, true)} variant="ghost" size="sm">×</Button>
                    )}
                  </div>
                ) : (
                  <Button onClick={() => toggle(p.key, connected)} variant={connected ? "outline" : "default"} className={`w-full ${!connected ? "bg-gradient-primary" : ""}`}>
                    {connected ? t("dash.disconnect") : t("dash.connect")}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Shopify credentials card */}
      <Card className="p-6 bg-gradient-card border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/15 grid place-items-center">
            <ShoppingBag className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="font-display font-semibold text-lg">Shopify Store ของคุณ</div>
            <div className="text-xs text-muted-foreground">ข้อมูลร้านที่เชื่อมต่อกับระบบ AI</div>
          </div>
          <a href={`https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/admin`} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline"><ExternalLink className="h-4 w-4" /> Shopify Admin</Button>
          </a>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Store Domain</div>
            <div className="flex items-center gap-2 bg-background/60 border border-border/50 rounded-lg p-2 font-mono text-xs">
              <span className="flex-1 truncate">{SHOPIFY_STORE_PERMANENT_DOMAIN}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(SHOPIFY_STORE_PERMANENT_DOMAIN)}><Copy className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Storefront API Token</div>
            <div className="flex items-center gap-2 bg-background/60 border border-border/50 rounded-lg p-2 font-mono text-xs">
              <span className="flex-1 truncate">
                {showToken ? SHOPIFY_STOREFRONT_TOKEN : "•".repeat(28) + SHOPIFY_STOREFRONT_TOKEN.slice(-4)}
              </span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowToken(!showToken)}>
                {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(SHOPIFY_STOREFRONT_TOKEN)}><Copy className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          💡 ร้านนี้เป็น sandbox store (ฟรี) — พิมพ์ <code className="bg-muted px-1 rounded">Claim Store</code> ในแชท Lovable เพื่อรับ trial 30 วันและเข้า Shopify Admin จริง
        </div>
      </Card>

      {/* Web widget embed */}
      <Card id="widget" className="p-6 bg-gradient-card border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Code2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-display font-semibold text-lg">Web Chat Widget</div>
            <div className="text-xs text-muted-foreground">วาง snippet นี้ก่อนปิด &lt;/body&gt; บนเว็บไซต์ของคุณ</div>
          </div>
        </div>

        <div className="bg-background/60 border border-border/50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
          {embedSnippet || "loading..."}
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <Button size="sm" onClick={() => copy(embedSnippet)} disabled={!embedSnippet}>
            <Copy className="h-4 w-4" /> Copy snippet
          </Button>
          <a href={widgetUrl} target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline" disabled={!widgetUrl}>
              <ExternalLink className="h-4 w-4" /> Preview widget
            </Button>
          </a>
        </div>

        <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm text-muted-foreground">
          <div><span className="text-foreground font-semibold">1.</span> ลูกค้าเข้าเว็บคุณ</div>
          <div><span className="text-foreground font-semibold">2.</span> เห็นปุ่มแชทมุมขวาล่าง</div>
          <div><span className="text-foreground font-semibold">3.</span> AI ตอบทันที 24/7</div>
        </div>
      </Card>

      <ChannelSetupDialog
        open={!!setupProvider}
        onOpenChange={(v) => !v && setSetupProvider(null)}
        provider={setupProvider}
        onSaved={load}
      />
    </div>
  );
}
