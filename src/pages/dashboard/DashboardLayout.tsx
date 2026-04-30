import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Plug, ToggleRight, GraduationCap, MessagesSquare,
  BarChart3, CreditCard, Shield, LogOut, Sparkles, Rocket
} from "lucide-react";

export default function DashboardLayout() {
  const { t } = useTranslation();
  const { user, isAdmin, signOut } = useAuth();
  const nav = useNavigate();

  const items = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dash.overview"), end: true },
    { to: "/dashboard/getting-started", icon: Rocket, label: "Getting Started" },
    { to: "/dashboard/integrations", icon: Plug, label: t("dash.integrations") },
    { to: "/dashboard/features", icon: ToggleRight, label: t("dash.features") },
    { to: "/dashboard/training", icon: GraduationCap, label: t("dash.training") },
    { to: "/dashboard/livechat", icon: MessagesSquare, label: t("dash.livechat") },
    { to: "/dashboard/analytics", icon: BarChart3, label: t("dash.analytics") },
    { to: "/dashboard/billing", icon: CreditCard, label: t("dash.billing") },
  ];

  const handleSignOut = async () => { await signOut(); nav("/"); };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r border-sidebar-border bg-sidebar p-4 flex flex-col">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold">AI Commerce</span>
        </div>
        <nav className="flex-1 space-y-1">
          {items.map((it) => (
            <NavLink
              key={it.to} to={it.to} end={it.end}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-card" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"}`}
            >
              <it.icon className="h-4 w-4" /> {it.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/dashboard/admin" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"}`}>
              <Shield className="h-4 w-4" /> {t("dash.admin")}
            </NavLink>
          )}
        </nav>
        <div className="border-t border-sidebar-border pt-3 mt-3 space-y-1">
          <div className="px-3 py-2 text-xs text-sidebar-foreground/60 truncate">{user?.email}</div>
          <div className="flex items-center justify-between px-1">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto"><div className="p-8 max-w-7xl mx-auto"><Outlet /></div></main>
    </div>
  );
}
