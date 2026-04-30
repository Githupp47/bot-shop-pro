import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";

export const SiteFooter = () => {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border/50 py-16 mt-24 relative overflow-hidden">
      <div className="glow-orb h-[300px] w-[600px] bg-primary/10 -bottom-40 left-1/2 -translate-x-1/2" />
      <div className="container relative">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg">{t("brand")}</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">{t("footer.tagline")}</p>
          </div>
          <FooterCol title={t("footer.product")} items={["Features", "Pricing", "Integrations", "Changelog"]} />
          <FooterCol title={t("footer.company")} items={["About", "Blog", "Careers", "Contact"]} />
          <FooterCol title={t("footer.legal")} items={["Privacy", "Terms", "PDPA", "Security"]} />
        </div>
        <div className="border-t border-border/50 pt-6 text-sm text-muted-foreground">{t("footer.rights")}</div>
      </div>
    </footer>
  );
};

const FooterCol = ({ title, items }: { title: string; items: string[] }) => (
  <div>
    <h4 className="font-semibold mb-4 text-sm">{title}</h4>
    <ul className="space-y-2 text-sm text-muted-foreground">
      {items.map((i) => <li key={i}><a href="#" className="hover:text-foreground transition-colors">{i}</a></li>)}
    </ul>
  </div>
);
