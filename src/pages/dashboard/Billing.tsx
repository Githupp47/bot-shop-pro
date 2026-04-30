import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Download } from "lucide-react";

const PLANS = [
  { key: "free", name: "Free", price: "฿0", features: ["1,000 messages/mo", "1 channel"] },
  { key: "starter", name: "Starter", price: "฿1,490", features: ["20,000 messages/mo", "3 channels"] },
  { key: "growth", name: "Growth", price: "฿4,990", features: ["Unlimited", "All channels"] },
  { key: "enterprise", name: "Enterprise", price: "Custom", features: ["Custom AI", "SLA 99.9%"] },
];

export default function Billing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [sub, setSub] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setSub(data));
  }, [user]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="font-display text-3xl font-bold">{t("dash.billing")}</h1><p className="text-muted-foreground mt-1">จัดการแพ็กเกจและใบเสร็จ</p></div>

      <Card className="p-6 bg-gradient-primary/10 border-primary/40 shadow-glow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Current plan</div>
            <div className="font-display text-3xl font-bold capitalize">{sub?.plan || "free"}</div>
            <div className="text-sm text-muted-foreground mt-1">Renews {sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}</div>
          </div>
          <Badge className="bg-success/20 text-success border-0">{sub?.status || "active"}</Badge>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((p) => (
          <Card key={p.key} className={`p-6 bg-gradient-card border-border/50 ${sub?.plan === p.key ? "border-primary shadow-glow" : ""}`}>
            <div className="font-display font-bold text-lg">{p.name}</div>
            <div className="font-display text-3xl font-bold my-3">{p.price}</div>
            <ul className="space-y-2 mb-4 text-sm">
              {p.features.map((f) => <li key={f} className="flex items-start gap-2"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />{f}</li>)}
            </ul>
            <Button variant={sub?.plan === p.key ? "outline" : "default"} disabled={sub?.plan === p.key} className={`w-full ${sub?.plan !== p.key ? "bg-gradient-primary" : ""}`}>
              {sub?.plan === p.key ? "Current" : "Upgrade"}
            </Button>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-gradient-card border-border/50">
        <h3 className="font-display font-semibold mb-4">Invoices</h3>
        <div className="text-sm text-muted-foreground">No invoices yet. Stripe integration coming soon.</div>
      </Card>
    </div>
  );
}
