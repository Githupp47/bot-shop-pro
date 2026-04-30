import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export const SiteHeader = () => {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "glass-strong border-b border-border/40 py-3" : "py-5"}`}>
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">{t("brand")}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">{t("nav.features")}</a>
          <a href="#integrations" className="hover:text-foreground transition-colors">{t("nav.integrations")}</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">{t("nav.pricing")}</a>
          <a href="#faq" className="hover:text-foreground transition-colors">{t("nav.faq")}</a>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <Link to="/auth/login"><Button variant="ghost" size="sm">{t("nav.login")}</Button></Link>
          <Link to="/auth/signup"><Button size="sm" className="bg-gradient-primary hover:opacity-90 shadow-glow">{t("nav.signup")}</Button></Link>
        </div>
      </div>
    </header>
  );
};
