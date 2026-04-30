import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, ExternalLink } from "lucide-react";

type Provider = "line_oa" | "messenger" | "instagram";

const FIELDS: Record<Provider, { key: string; label: string; help: string; placeholder?: string }[]> = {
  line_oa: [
    {
      key: "access_token",
      label: "Channel Access Token",
      help: "หาได้ที่ developers.line.biz → Channel ของคุณ → Messaging API → Channel Access Token (long-lived)",
      placeholder: "e.g. xXxXxXxXxXxXxXxXxXxX...",
    },
    {
      key: "channel_secret",
      label: "Channel Secret (optional)",
      help: "ใช้สำหรับ verify signature (แนะนำ)",
    },
  ],
  messenger: [
    {
      key: "page_access_token",
      label: "Page Access Token",
      help: "Meta App → Messenger → Settings → Generate token จาก Page ของคุณ",
    },
    {
      key: "verify_token",
      label: "Verify Token",
      help: "ตั้งค่าอะไรก็ได้ ต้องตรงกับที่กรอกใน Meta App webhook subscription",
      placeholder: "เช่น mysecret123",
    },
  ],
  instagram: [
    {
      key: "page_access_token",
      label: "Page Access Token (Instagram-linked Page)",
      help: "Instagram Business Account ต้องเชื่อมกับ Facebook Page",
    },
    { key: "verify_token", label: "Verify Token", help: "เหมือน Messenger" },
  ],
};

const TITLES: Record<Provider, string> = {
  line_oa: "ตั้งค่า LINE OA",
  messenger: "ตั้งค่า Facebook Messenger",
  instagram: "ตั้งค่า Instagram DM",
};

export function ChannelSetupDialog({
  open,
  onOpenChange,
  provider,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  provider: Provider | null;
  onSaved?: () => void;
}) {
  const { user } = useAuth();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !provider || !user) return;
    supabase
      .from("integrations")
      .select("config")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .maybeSingle()
      .then(({ data }) => setConfig((data?.config as any) || {}));
  }, [open, provider, user]);

  if (!provider) return null;

  const fields = FIELDS[provider];
  const projectUrl = import.meta.env.VITE_SUPABASE_URL;
  const webhookFunction = provider === "line_oa" ? "line-webhook" : "meta-webhook";
  const webhookUrl = user ? `${projectUrl}/functions/v1/${webhookFunction}?owner=${user.id}` : "";

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  const save = async () => {
    if (!user || !provider) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("integrations").upsert(
        {
          user_id: user.id,
          provider: provider as any,
          status: "connected",
          store_name: provider === "line_oa" ? "LINE OA" : provider === "messenger" ? "Facebook Page" : "Instagram",
          connected_at: new Date().toISOString(),
          config,
        },
        { onConflict: "user_id,provider" },
      );
      if (error) throw error;
      toast.success("บันทึกเรียบร้อย — AI Bot พร้อมตอบลูกค้าแล้ว");
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{TITLES[provider]}</DialogTitle>
          <DialogDescription>กรอกข้อมูลจาก developer console แล้ว AI Bot จะตอบลูกค้าใน channel นี้อัตโนมัติ</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Webhook URL (วางในช่อง Webhook ของ developer console)</Label>
            <div className="flex gap-2 mt-1">
              <Input value={webhookUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copy(webhookUrl)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {fields.map((f) => (
            <div key={f.key}>
              <Label>{f.label}</Label>
              <Input
                value={config[f.key] || ""}
                onChange={(e) => setConfig((c) => ({ ...c, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="mt-1"
              />
              <div className="text-xs text-muted-foreground mt-1">{f.help}</div>
            </div>
          ))}

          {provider === "line_oa" && (
            <a href="https://developers.line.biz/console" target="_blank" rel="noreferrer" className="text-sm text-primary inline-flex items-center gap-1">
              เปิด LINE Developers Console <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {(provider === "messenger" || provider === "instagram") && (
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-sm text-primary inline-flex items-center gap-1">
              เปิด Meta for Developers <ExternalLink className="h-3 w-3" />
            </a>
          )}

          <Button onClick={save} disabled={saving} className="w-full bg-gradient-primary">
            {saving ? "กำลังบันทึก..." : "บันทึกและเชื่อมต่อ"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
