import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, ArrowRight, Bell, MessageCircle, UserPlus, Heart, Star, Tag, ShieldAlert, AlertTriangle, RefreshCw, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications, type AppNotification } from "@/contexts/NotificationsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const TYPE_META: Record<string, { icon: React.ElementType; color: string }> = {
  message_received:  { icon: MessageCircle, color: "text-blue-400" },
  listing_inquiry:   { icon: MessageCircle, color: "text-blue-400" },
  new_follower:      { icon: UserPlus,      color: "text-secondary" },
  collection_invite: { icon: Heart,         color: "text-primary" },
  listing_saved:     { icon: Heart,         color: "text-primary" },
  listing_price_drop:{ icon: Tag,           color: "text-secondary" },
  listing_relisted:  { icon: RefreshCw,     color: "text-secondary" },
  review_received:   { icon: Star,          color: "text-yellow-400" },
  report_resolved:   { icon: ShieldAlert,   color: "text-blue-400" },
  listing_removed:   { icon: AlertTriangle, color: "text-destructive" },
  account_warning:   { icon: AlertTriangle, color: "text-destructive" },
};

function notificationHref(n: AppNotification): string | null {
  const d = n.data;
  switch (n.type) {
    case "message_received":
    case "listing_inquiry":
      return d.conversation_id ? `/messages/${d.conversation_id}` : "/messages";
    case "new_follower":
      return d.follower_id ? `/users/${d.follower_id}` : null;
    case "collection_invite":
      return "/wishlist";
    case "listing_saved":
    case "listing_price_drop":
    case "listing_relisted":
    case "listing_removed":
      return d.listing_id ? `/listings/${d.listing_id}` : null;
    case "review_received":
      return d.listing_id ? `/listings/${d.listing_id}` : "/my-reviews";
    case "report_resolved":
      return "/settings/reports";
    case "account_warning":
      return "/settings";
    default:
      return null;
  }
}

export default function Notifications() {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { notifications, loading, markRead, markAllRead } = useNotifications();
  const unread = notifications.filter(n => !n.read).length;

  async function handleTap(n: AppNotification) {
    if (!n.read) await markRead(n.id);
    const href = notificationHref(n);
    if (href) navigate(href);
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-border">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </button>
        <h1 className="text-xl font-bold flex-1">{t.notificationsTitle}</h1>
        {unread > 0 && (
          <Button size="sm" variant="ghost" onClick={markAllRead} className="text-xs gap-1.5">
            <CheckCheck className="w-4 h-4" /> {t.markAllRead}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-px">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-4">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-4"
          >
            <Bell className="w-8 h-8 text-primary" />
          </motion.div>
          <p className="font-semibold text-base mb-1">{t.noNotificationsYet}</p>
          <p className="text-muted-foreground text-sm">{t.notificationsWillAppear}</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {notifications.map((n, i) => {
            const meta = TYPE_META[n.type] ?? { icon: Bell, color: "text-muted-foreground" };
            const Icon = meta.icon;
            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => handleTap(n)}
                className={cn(
                  "w-full flex items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40",
                  !n.read && "bg-primary/5"
                )}
              >
                {/* Icon badge */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-border",
                  !n.read ? "bg-card" : "bg-muted"
                )}>
                  <Icon className={cn("w-5 h-5", meta.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm leading-snug", !n.read ? "font-semibold text-foreground" : "text-foreground/80")}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
