import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const PROVIDERS = [
  { key: "shopify", name: "Shopify", color: "from-emerald-500/20" },
  { key: "woocommerce", name: "WooCommerce", color: "from-purple-500/20" },
  { key: "lazada", name: "Lazada", color: "from-orange-500/20" },
  { key: "shopee", name: "Shopee", color: "from-red-500/20" },
  { key: "line_oa", name: "LINE OA", color: "from-green-500/20" },
  { key: "messenger", name: "Facebook Messenger", color: "from-blue-500/20" },
  { key: "instagram", name: "Instagram DM", color: "from-pink-500/20" },
  { key: "web_widget", name: "Website Chat Widget", color: "from-cyan-500/20" },
] as const;

export default function Integrations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [list, setList] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("integrations").select("*");
    setList(data || []);
  };
  useEffect(() => { load(); }, [user]);

  const toggle = async (key: string, currentlyConnected: boolean) => {
    if (!user) return;
    if (currentlyConnected) {
      await supabase.from("integrations").update({ status: "disconnected", connected_at: null }).eq("user_id", user.id).eq("provider", key);
      toast.success("Disconnected");
    } else {
      await supabase.from("integrations").upsert({ user_id: user.id, provider: key as any, status: "connected", store_name: `${key}-store`, connected_at: new Date().toISOString() }, { onConflict: "user_id,provider" });
      toast.success("Connected!");
    }
    load();
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
                <Button onClick={() => toggle(p.key, connected)} variant={connected ? "outline" : "default"} className={`w-full ${!connected ? "bg-gradient-primary" : ""}`}>
                  {connected ? t("dash.disconnect") : t("dash.connect")}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
