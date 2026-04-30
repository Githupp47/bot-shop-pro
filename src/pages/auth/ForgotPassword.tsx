import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/AuthLayout";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/auth/reset" });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Check your email for the reset link");
  };

  return (
    <AuthLayout title={t("auth.forgotTitle")} subtitle={t("auth.forgotSub")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div><Label>{t("auth.email")}</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" /></div>
        <Button type="submit" disabled={loading} className="w-full bg-gradient-primary hover:opacity-90 shadow-glow">{t("auth.forgotCta")}</Button>
      </form>
      <Link to="/auth/login" className="text-sm text-primary hover:underline mt-6 block text-center">{t("auth.backToLogin")}</Link>
    </AuthLayout>
  );
}
