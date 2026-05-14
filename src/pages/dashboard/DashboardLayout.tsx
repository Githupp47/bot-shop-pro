import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Plug, ToggleRight, GraduationCap, MessagesSquare,
  BarChart3, CreditCard, Shield, LogOut, Sparkles, Rocket, ShoppingBag, Package,
} from "lucide-react";
import { NotificationsBell } from "@/components/NotificationsBell";

function AppSidebar() {
  const { t } = useTranslation();
  const { user, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const items = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dash.overview"), end: true },
    { to: "/dashboard/getting-started", icon: Rocket, label: "Getting Started" },
    { to: "/dashboard/integrations", icon: Plug, label: t("dash.integrations") },
    { to: "/dashboard/products", icon: Package, label: "สินค้าของร้าน" },
    { to: "/dashboard/shopify", icon: ShoppingBag, label: "Shopify" },
    { to: "/dashboard/features", icon: ToggleRight, label: t("dash.features") },
    { to: "/dashboard/training", icon: GraduationCap, label: t("dash.training") },
    { to: "/dashboard/livechat", icon: MessagesSquare, label: t("dash.livechat") },
    { to: "/dashboard/analytics", icon: BarChart3, label: t("dash.analytics") },
    { to: "/dashboard/billing", icon: CreditCard, label: t("dash.billing") },
  ];

  const handleSignOut = async () => { await signOut(); nav("/"); };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="h-9 w-9 rounded-lg bg-gradient-primary grid place-items-center shadow-glow shrink-0">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-display font-bold">AI Commerce</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.to}>
                  <SidebarMenuButton asChild tooltip={it.label}>
                    <NavLink
                      to={it.to}
                      end={it.end}
                      className={({ isActive }) =>
                        `flex items-center gap-3 ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`
                      }
                    >
                      <it.icon className="h-4 w-4" />
                      <span>{it.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={t("dash.admin")}>
                    <NavLink to="/dashboard/admin" className={({ isActive }) => `flex items-center gap-3 ${isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}>
                      <Shield className="h-4 w-4" />
                      <span>{t("dash.admin")}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {!collapsed && <div className="px-3 py-1 text-xs text-sidebar-foreground/60 truncate">{user?.email}</div>}
        <div className="flex items-center justify-between px-1">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={handleSignOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border/40 px-2 sticky top-0 bg-background/80 backdrop-blur z-10">
            <SidebarTrigger />
            <div className="ml-auto pr-2"><NotificationsBell /></div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
