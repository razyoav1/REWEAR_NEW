import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Compass, Search, Plus, User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

function getLastRead(conversationId: string): string | null {
  return localStorage.getItem(`rewear_read_${conversationId}`);
}

function useUnreadCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    async function check() {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id")
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`);
      if (!convs?.length) { setCount(0); return; }

      const { data: messages } = await supabase
        .from("messages")
        .select("conversation_id, sender_id, created_at")
        .in("conversation_id", convs.map(c => c.id))
        .neq("sender_id", user!.id)
        .order("created_at", { ascending: false });

      const latestPerConv: Record<string, string> = {};
      (messages ?? []).forEach((m: { conversation_id: string; created_at: string }) => {
        if (!latestPerConv[m.conversation_id]) latestPerConv[m.conversation_id] = m.created_at;
      });

      let unread = 0;
      for (const [convId, msgTime] of Object.entries(latestPerConv)) {
        const lastRead = getLastRead(convId);
        if (!lastRead || new Date(msgTime) > new Date(lastRead)) unread++;
      }
      setCount(unread);
    }
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return count;
}

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile } = useAuth();
  const unreadCount = useUnreadCount();

  const NAV_ITEMS = [
    { to: "/", icon: Compass, label: t.discover },
    { to: "/search", icon: Search, label: t.search },
    { to: "/wishlist", icon: Heart, label: t.wishlist },
    { to: "/profile", icon: User, label: t.me },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {NAV_ITEMS.slice(0, 2).map(({ to, icon: Icon, label }) => {
          const isActive = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} className="relative flex flex-col items-center justify-center gap-0.5 w-12 h-full group">
              <div className="relative flex flex-col items-center">
                {isActive && <motion.div layoutId="nav-indicator" className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                <Icon className={cn("w-5 h-5 transition-all duration-200", isActive ? "text-primary stroke-[2.5px]" : "text-muted-foreground stroke-[1.5px] group-hover:text-foreground")} />
                <span className={cn("text-[10px] font-semibold mt-0.5 transition-all duration-200", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>{label}</span>
              </div>
            </NavLink>
          );
        })}

        {/* Center Create button */}
        <button
          onClick={() => {
            const status = profile?.account_status;
            if (status === "suspended" || status === "banned") {
              toast.error(status === "banned" ? "Your account has been banned." : "Your account is suspended and cannot create listings.");
              return;
            }
            navigate("/create");
          }}
          className="flex flex-col items-center justify-center w-12 h-full group"
        >
          <motion.div whileTap={{ scale: 0.9 }} className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-pink">
            <Plus className="w-5 h-5 text-white stroke-[2.5px]" />
          </motion.div>
        </button>

        {NAV_ITEMS.slice(2).map(({ to, icon: Icon, label }) => {
          const isActive = pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} className="relative flex flex-col items-center justify-center gap-0.5 w-12 h-full group">
              <div className="relative flex flex-col items-center">
                {isActive && <motion.div layoutId="nav-indicator" className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                <Icon className={cn("w-5 h-5 transition-all duration-200", isActive ? "text-primary stroke-[2.5px]" : "text-muted-foreground stroke-[1.5px] group-hover:text-foreground")} />
                <span className={cn("text-[10px] font-semibold mt-0.5 transition-all duration-200", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}>{label}</span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export { useUnreadCount };
