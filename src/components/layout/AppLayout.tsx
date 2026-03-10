import { Outlet, useNavigate } from "react-router-dom";
import { Bell, ShieldAlert } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { CollectionInviteBanner } from "@/components/CollectionInviteBanner";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

function NotificationBell() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <button
      onClick={() => navigate("/notifications")}
      className="fixed top-14 right-5 z-40 w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:border-primary/40 transition-colors"
      aria-label="Notifications"
    >
      <Bell className="w-4 h-4" />
      {unreadCount > 0 && (
        <span className={cn(
          "absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-0.5",
        )}>
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

function AccountStatusBanner() {
  const { profile } = useAuth();
  const status = profile?.account_status;
  if (!status || status === "active") return null;

  const isBanned = status === "banned";
  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-[60] flex items-center gap-2 px-4 py-2.5 text-sm font-semibold",
      isBanned ? "bg-destructive text-destructive-foreground" : "bg-yellow-500 text-black",
    )}>
      <ShieldAlert className="w-4 h-4 shrink-0" />
      <span>
        {isBanned
          ? "Your account has been permanently banned."
          : "Your account is suspended. Some features are restricted."}
      </span>
      {profile?.suspension_reason && (
        <span className="font-normal opacity-80 truncate ml-1">— {profile.suspension_reason}</span>
      )}
    </div>
  );
}

export function AppLayout() {
  const { profile } = useAuth();
  const hasStatusBanner = !!profile?.account_status && profile.account_status !== "active";

  return (
    <div className="relative min-h-screen bg-background">
      <AccountStatusBanner />
      <NotificationBell />
      <main className={cn("page-content", hasStatusBanner && "pt-10")}>
        <Outlet />
      </main>
      <BottomNav />
      <CollectionInviteBanner />
    </div>
  );
}
