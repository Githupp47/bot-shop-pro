import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Admin() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("subscriptions").select("*"),
    ]).then(([u, s]) => { setUsers(u.data || []); setSubs(s.data || []); });
  }, []);

  const mrr = subs.reduce((acc, s) => acc + Number(s.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="font-display text-3xl font-bold">{t("dash.admin")}</h1><p className="text-muted-foreground mt-1">ภาพรวมแพลตฟอร์ม</p></div>
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-card border-border/50"><div className="text-xs text-muted-foreground">Total users</div><div className="font-display text-3xl font-bold mt-2">{users.length}</div></Card>
        <Card className="p-5 bg-gradient-card border-border/50"><div className="text-xs text-muted-foreground">Active subs</div><div className="font-display text-3xl font-bold mt-2">{subs.filter((s) => s.status === "active").length}</div></Card>
        <Card className="p-5 bg-gradient-card border-border/50"><div className="text-xs text-muted-foreground">MRR</div><div className="font-display text-3xl font-bold mt-2">฿{mrr.toLocaleString()}</div></Card>
        <Card className="p-5 bg-gradient-card border-border/50"><div className="text-xs text-muted-foreground">ARR</div><div className="font-display text-3xl font-bold mt-2">฿{(mrr * 12).toLocaleString()}</div></Card>
      </div>

      <Card className="p-6 bg-gradient-card border-border/50">
        <h3 className="font-display font-semibold mb-4">All customers</h3>
        <div className="space-y-2">
          {users.map((u) => {
            const s = subs.find((x) => x.user_id === u.id);
            return (
              <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/40">
                <div className="h-9 w-9 rounded-full bg-gradient-primary grid place-items-center font-semibold text-primary-foreground">{u.email?.[0]?.toUpperCase()}</div>
                <div className="flex-1"><div className="font-medium text-sm">{u.full_name || u.email}</div><div className="text-xs text-muted-foreground">{u.email}</div></div>
                <Badge variant="outline" className="capitalize">{s?.plan || "free"}</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
