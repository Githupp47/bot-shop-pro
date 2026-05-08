import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";
import { Loader2 } from "lucide-react";

export default function ResetPassword() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1) PKCE flow: ?code=...
        const code = params.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          // strip code from URL
          window.history.replaceState({}, "", window.location.pathname);
        } else if (window.location.hash.includes("access_token")) {
          // 2) Implicit flow: #access_token=...&type=recovery — supabase-js auto-handles
          await new Promise((r) => setTimeout(r, 200));
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่");
        }
        if (!cancelled) setReady(true);
      } catch (e: any) {
        if (!cancelled) setErrorMsg(e.message || "ไม่สามารถยืนยันลิงก์รีเซ็ตได้");
      }
    })();
    return () => { cancelled = true; };
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("รหัสผ่านไม่ตรงกัน");
    if (password.length < 8) return toast.error("รหัสผ่านอย่างน้อย 8 ตัวอักษร");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
    nav("/dashboard");
  };

  return (
    <AuthLayout title={t("auth.resetTitle")} subtitle="ตั้งรหัสผ่านใหม่ของคุณ">
      {errorMsg ? (
        <div className="space-y-4">
          <div className="text-sm text-destructive">{errorMsg}</div>
          <Button onClick={() => nav("/auth/forgot")} className="w-full bg-gradient-primary">ขอลิงก์ใหม่</Button>
        </div>
      ) : !ready ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> กำลังตรวจสอบลิงก์...
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>{t("auth.password")}</Label>
            <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>ยืนยันรหัสผ่าน</Label>
            <Input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1.5" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-primary hover:opacity-90 shadow-glow">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth.resetCta")}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
