import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AuthLayout } from "@/components/AuthLayout";
import { Loader2 } from "lucide-react";

export default function Signup() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: fullName, company_name: company },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created!");
    nav("/dashboard");
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) toast.error(String(result.error));
  };

  return (
    <AuthLayout title={t("auth.signupTitle")} subtitle={t("auth.signupSub")}>
      <Button type="button" variant="outline" className="w-full mb-4" onClick={onGoogle}>{t("auth.google")}</Button>
      <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground uppercase">{t("auth.or")}</span></div></div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div><Label>{t("auth.fullName")}</Label><Input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" /></div>
        <div><Label>{t("auth.company")}</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} className="mt-1.5" /></div>
        <div><Label>{t("auth.email")}</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" /></div>
        <div><Label>{t("auth.password")}</Label><Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" /></div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-primary hover:opacity-90 shadow-glow">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{t("auth.signupCta")}
        </Button>
      </form>
      <p className="text-sm text-center text-muted-foreground mt-6">{t("auth.haveAccount")} <Link to="/auth/login" className="text-primary hover:underline font-medium">{t("auth.signinCta")}</Link></p>
    </AuthLayout>
  );
}
