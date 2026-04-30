import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export const LanguageSwitcher = ({ compact = false }: { compact?: boolean }) => {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith("th") ? "th" : "en";

  useEffect(() => { document.body.setAttribute("lang", current); }, [current]);

  const toggle = () => i18n.changeLanguage(current === "th" ? "en" : "th");

  return (
    <Button variant="ghost" size={compact ? "icon" : "sm"} onClick={toggle} className="text-muted-foreground hover:text-foreground">
      <Globe className="h-4 w-4" />
      {!compact && <span className="ml-2 font-medium">{current === "th" ? "TH" : "EN"}</span>}
    </Button>
  );
};
