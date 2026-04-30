import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";

export const AuthLayout = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
  <div className="min-h-screen bg-gradient-hero relative overflow-hidden grid place-items-center p-6">
    <div className="absolute inset-0 grid-bg opacity-40" />
    <div className="glow-orb h-[500px] w-[500px] bg-primary/30 -top-40 -left-40 animate-float" />
    <div className="glow-orb h-[400px] w-[400px] bg-secondary/30 -bottom-20 -right-20 animate-float" style={{ animationDelay: "2s" }} />

    <div className="absolute top-6 left-6">
      <Link to="/" className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display font-bold">AI Commerce Agent</span>
      </Link>
    </div>
    <div className="absolute top-6 right-6"><LanguageSwitcher compact /></div>

    <div className="relative w-full max-w-md glass-strong rounded-2xl p-8 shadow-elegant animate-scale-in">
      <h1 className="font-display text-3xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground text-sm mb-8">{subtitle}</p>
      {children}
    </div>
  </div>
);
