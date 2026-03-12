import { Outlet } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { CollectionInviteBanner } from "@/components/CollectionInviteBanner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

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
      <main className={cn("page-content", hasStatusBanner && "pt-10")}>
        <Outlet />
      </main>
      <BottomNav />
      <CollectionInviteBanner />
    </div>
  );
}
