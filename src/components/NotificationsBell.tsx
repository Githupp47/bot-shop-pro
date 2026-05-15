import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Package, UserCog, ShoppingCart, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type Notif = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

const ICONS: Record<string, any> = {
  low_stock: Package,
  human_takeover: UserCog,
  new_order: ShoppingCart,
};

export function NotificationsBell() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30);
    setItems((data as Notif[]) || []);
  };

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine"; o.frequency.value = 880;
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      o.start(); o.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase
      .channel("notif-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (p) => {
        const n = p.new as Notif;
        setItems((prev) => [n, ...prev].slice(0, 30));
        playBeep();
        if (n.type === "human_takeover") {
          toast.warning(`🙋 ${n.title}`, {
            description: n.message || undefined,
            duration: 10000,
            action: n.link ? { label: "เปิดแชท", onClick: () => nav(n.link!) } : undefined,
          });
        } else {
          toast.info(n.title, { description: n.message || undefined });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const click = async (n: Notif) => {
    if (!n.read) {
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
    }
    setOpen(false);
    if (n.link) nav(n.link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold grid place-items-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b border-border/40 flex items-center justify-between">
          <span className="font-semibold text-sm">การแจ้งเตือน</span>
          {unread > 0 && (
            <Button size="sm" variant="ghost" onClick={markAllRead} className="text-xs h-7">
              <CheckCheck className="h-3 w-3" />อ่านทั้งหมด
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">ยังไม่มีการแจ้งเตือน</div>
          ) : (
            items.map((n) => {
              const Icon = ICONS[n.type] || Bell;
              return (
                <button
                  key={n.id}
                  onClick={() => click(n)}
                  className={`w-full text-left p-3 border-b border-border/20 hover:bg-card/50 transition flex gap-3 ${!n.read ? "bg-primary/5" : ""}`}
                >
                  <div className={`h-8 w-8 rounded-full grid place-items-center shrink-0 ${n.type === "low_stock" ? "bg-warning/20 text-warning" : n.type === "human_takeover" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{n.title}</div>
                    {n.message && <div className="text-xs text-muted-foreground line-clamp-2">{n.message}</div>}
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
