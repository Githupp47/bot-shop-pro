import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Play, ShoppingBag, MessageSquare, Search, TrendingUp, Package,
  Headphones, BarChart3, Sparkles, Zap, Shield, Globe, Check, Star,
  Wrench, Languages, RefreshCw, AlertTriangle, Users, Target, RotateCcw,
  TrendingDown, Megaphone, ShoppingCart, Boxes, Bot, Clock, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.6, ease: "easeOut" as const } };

import { useState } from "react";
import { DemoChatDialog } from "@/components/DemoChatDialog";

const Landing = () => {
  const { t } = useTranslation();
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SiteHeader />

      {/* HERO */}
      <section className="relative pt-36 pb-24 md:pt-44 md:pb-32 bg-gradient-hero">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="glow-orb h-[500px] w-[500px] bg-primary/30 -top-20 -left-20 animate-float" />
        <div className="glow-orb h-[400px] w-[400px] bg-secondary/30 top-40 right-0 animate-float" style={{ animationDelay: "2s" }} />

        <div className="container relative">
          <motion.div {...fadeUp} className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-6 glass border-primary/30 text-primary px-4 py-1.5">
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              {t("hero.badge")}
            </Badge>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[1.05]">
              <span className="text-gradient">{t("hero.title1")}</span>
              <br />
              <span className="text-foreground">{t("hero.title2")}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
              <Link to="/auth/signup">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow text-base h-12 px-8 group">
                  {t("hero.ctaPrimary")}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-12 px-8 glass border-border/60" onClick={() => setDemoOpen(true)}>
                <Play className="mr-2 h-4 w-4" /> {t("hero.ctaSecondary")}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">{t("hero.socialProof")}</p>
          </motion.div>

          {/* Stat strip */}
          <motion.div {...fadeUp} transition={{ delay: 0.3, duration: 0.6 }} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-border/40 rounded-2xl overflow-hidden glass max-w-5xl mx-auto">
            <Stat value="+30%" label={t("stats.revenue")} icon={<TrendingUp className="h-5 w-5" />} />
            <Stat value="10x" label={t("stats.response")} icon={<Zap className="h-5 w-5" />} />
            <Stat value="-65%" label={t("stats.cost")} icon={<DollarSign className="h-5 w-5" />} />
            <Stat value="24/7" label={t("stats.coverage")} icon={<Clock className="h-5 w-5" />} />
          </motion.div>
        </div>
      </section>

      {/* INTEGRATIONS MARQUEE */}
      <section id="integrations" className="py-16 border-y border-border/40">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground mb-8 uppercase tracking-widest">เชื่อมต่อได้ทุกแพลตฟอร์ม · Connect everywhere</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-muted-foreground">
            {["Shopify", "WooCommerce", "Lazada", "Shopee", "LINE OA", "Messenger", "Instagram", "Web Widget"].map((n) => (
              <div key={n} className="font-display text-xl md:text-2xl font-semibold opacity-60 hover:opacity-100 hover:text-foreground transition">{n}</div>
            ))}
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="py-24">
        <div className="container">
          <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">{t("pain.title")}</h2>
            <p className="text-lg text-muted-foreground">{t("pain.subtitle")}</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(t("pain.items", { returnObjects: true }) as Array<{ t: string; d: string }>).map((p, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.08, duration: 0.5 }}>
                <Card className="p-6 h-full bg-gradient-card border-border/50 hover:border-destructive/50 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-destructive/15 text-destructive grid place-items-center mb-4">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold mb-2">{p.t}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.d}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 relative">
        <div className="glow-orb h-[400px] w-[400px] bg-primary/15 top-40 left-1/2 -translate-x-1/2" />
        <div className="container relative">
          <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center mb-16">
            <Badge variant="outline" className="mb-4 glass border-primary/30 text-primary">Features</Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">{t("features.title")}</h2>
            <p className="text-lg text-muted-foreground">{t("features.subtitle")}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <FeatureGroup
              title={t("features.sales")}
              icon={<ShoppingBag className="h-5 w-5" />}
              gradient="from-primary/20 to-transparent"
              items={[
                { i: <Search className="h-4 w-4" />, t: "Search สินค้า" },
                { i: <Sparkles className="h-4 w-4" />, t: "Recommend สินค้า" },
                { i: <TrendingUp className="h-4 w-4" />, t: "Cross-sell / Upsell" },
                { i: <Boxes className="h-4 w-4" />, t: "Bundle Suggestion" },
                { i: <DollarSign className="h-4 w-4" />, t: "Dynamic Pricing" },
              ]}
            />
            <FeatureGroup
              title={t("features.cs")}
              icon={<Headphones className="h-5 w-5" />}
              gradient="from-secondary/20 to-transparent"
              items={[
                { i: <MessageSquare className="h-4 w-4" />, t: "ตอบแชท 24/7" },
                { i: <Package className="h-4 w-4" />, t: "เช็คออเดอร์" },
                { i: <Globe className="h-4 w-4" />, t: "Tracking พัสดุ" },
                { i: <Bot className="h-4 w-4" />, t: "FAQ Auto Reply" },
                { i: <Languages className="h-4 w-4" />, t: "Multi-language" },
              ]}
            />
            <FeatureGroup
              title={t("features.ops")}
              icon={<Wrench className="h-5 w-5" />}
              gradient="from-accent/20 to-transparent"
              items={[
                { i: <Boxes className="h-4 w-4" />, t: "Check Stock" },
                { i: <ShoppingCart className="h-4 w-4" />, t: "Process Order" },
                { i: <Shield className="h-4 w-4" />, t: "Warranty Claim" },
                { i: <RefreshCw className="h-4 w-4" />, t: "Auto Reorder" },
                { i: <AlertTriangle className="h-4 w-4" />, t: "Fraud Detection" },
              ]}
            />
            <FeatureGroup
              title={t("features.mkt")}
              icon={<Megaphone className="h-5 w-5" />}
              gradient="from-primary/20 to-secondary/20"
              items={[
                { i: <Users className="h-4 w-4" />, t: "Segment ลูกค้า" },
                { i: <Target className="h-4 w-4" />, t: "Personalized Promo" },
                { i: <RotateCcw className="h-4 w-4" />, t: "Cart Recovery" },
                { i: <TrendingDown className="h-4 w-4" />, t: "Predict Churn" },
                { i: <BarChart3 className="h-4 w-4" />, t: "Ads Audience AI" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* RESULTS */}
      <section className="py-24">
        <div className="container">
          <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">{t("results.title")}</h2>
            <p className="text-lg text-muted-foreground">{t("results.subtitle")}</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <ResultCard big="+42%" label="Revenue uplift" sub="เฉลี่ยใน 90 วันแรก" />
            <ResultCard big="3.2x" label="Conversion rate" sub="เทียบกับก่อนใช้" />
            <ResultCard big="-78%" label="Response time" sub="ตอบลูกค้าเร็วกว่าเดิม" />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 relative">
        <div className="container">
          <motion.h2 {...fadeUp} className="font-display text-4xl md:text-5xl font-bold text-center mb-16">{t("testimonials.title")}</motion.h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {(t("testimonials.items", { returnObjects: true }) as Array<{ name: string; role: string; quote: string }>).map((tm, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1, duration: 0.5 }}>
                <Card className="p-8 h-full bg-gradient-card border-border/50">
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-warning text-warning" />)}
                  </div>
                  <p className="text-foreground/90 mb-6 leading-relaxed">"{tm.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-primary grid place-items-center font-semibold text-primary-foreground">
                      {tm.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{tm.name}</div>
                      <div className="text-xs text-muted-foreground">{tm.role}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 relative">
        <div className="glow-orb h-[400px] w-[600px] bg-primary/15 top-40 left-1/2 -translate-x-1/2" />
        <div className="container relative">
          <motion.div {...fadeUp} className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">{t("pricing.title")}</h2>
            <p className="text-lg text-muted-foreground">{t("pricing.subtitle")}</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {(["free", "starter", "growth", "enterprise"] as const).map((k, i) => {
              const plan = t(`pricing.plans.${k}`, { returnObjects: true }) as { name: string; price: string; desc: string; features: string[] };
              const popular = k === "growth";
              return (
                <motion.div key={k} {...fadeUp} transition={{ delay: i * 0.08, duration: 0.5 }}>
                  <Card className={`p-6 h-full flex flex-col relative ${popular ? "bg-gradient-primary/10 border-primary/50 shadow-glow" : "bg-gradient-card border-border/50"}`}>
                    {popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary border-0">{t("pricing.popular")}</Badge>}
                    <div className="mb-4">
                      <div className="font-display text-xl font-bold mb-1">{plan.name}</div>
                      <p className="text-sm text-muted-foreground">{plan.desc}</p>
                    </div>
                    <div className="mb-6">
                      <span className="font-display text-4xl font-bold">{plan.price}</span>
                      {plan.price !== "Custom" && <span className="text-muted-foreground text-sm ml-1">{t("pricing.monthly")}</span>}
                    </div>
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to="/auth/signup">
                      <Button className={`w-full ${popular ? "bg-gradient-primary hover:opacity-90" : ""}`} variant={popular ? "default" : "outline"}>
                        {t("pricing.cta")}
                      </Button>
                    </Link>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="container max-w-3xl">
          <motion.h2 {...fadeUp} className="font-display text-4xl md:text-5xl font-bold text-center mb-12">{t("faq.title")}</motion.h2>
          <Accordion type="single" collapsible className="space-y-3">
            {(t("faq.items", { returnObjects: true }) as Array<{ q: string; a: string }>).map((item, i) => (
              <AccordionItem key={i} value={`i${i}`} className="bg-gradient-card border border-border/50 rounded-xl px-6">
                <AccordionTrigger className="text-left hover:no-underline font-semibold">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24">
        <div className="container">
          <motion.div {...fadeUp} className="relative overflow-hidden rounded-3xl bg-gradient-primary p-12 md:p-20 text-center shadow-glow">
            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="relative">
              <h2 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground mb-4">{t("cta.title")}</h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">{t("cta.subtitle")}</p>
              <Link to="/auth/signup">
                <Button size="lg" variant="secondary" className="h-12 px-8 bg-background text-foreground hover:bg-background/90">
                  {t("cta.button")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
      <DemoChatDialog open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
};

const Stat = ({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) => (
  <div className="bg-card/50 p-6 md:p-8 text-center">
    <div className="inline-flex h-10 w-10 rounded-lg bg-primary/15 text-primary items-center justify-center mb-3">{icon}</div>
    <div className="font-display text-3xl md:text-4xl font-bold text-gradient mb-1">{value}</div>
    <div className="text-sm text-muted-foreground">{label}</div>
  </div>
);

const FeatureGroup = ({ title, icon, items, gradient }: { title: string; icon: React.ReactNode; gradient: string; items: { i: React.ReactNode; t: string }[] }) => (
  <motion.div {...fadeUp}>
    <Card className={`p-8 h-full bg-gradient-card border-border/50 hover:border-primary/40 transition-all duration-300 hover:shadow-glow relative overflow-hidden`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50`} />
      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">{icon}</div>
          <h3 className="font-display text-2xl font-bold">{title}</h3>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((it, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-foreground/90">
              <div className="h-7 w-7 rounded-md bg-card grid place-items-center text-primary">{it.i}</div>
              {it.t}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  </motion.div>
);

const ResultCard = ({ big, label, sub }: { big: string; label: string; sub: string }) => (
  <motion.div {...fadeUp}>
    <Card className="p-10 text-center bg-gradient-card border-border/50 hover:border-primary/40 transition-colors">
      <div className="font-display text-6xl md:text-7xl font-bold text-gradient mb-2">{big}</div>
      <div className="font-semibold mb-1">{label}</div>
      <div className="text-sm text-muted-foreground">{sub}</div>
    </Card>
  </motion.div>
);

export default Landing;
