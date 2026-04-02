import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { CollectionInviteBanner } from "@/components/CollectionInviteBanner";
import { ScrollToTop } from "@/components/ScrollToTop";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// Resets viewport scroll when keyboard dismisses on mobile Safari
function useIOSKeyboardScrollFix() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let prevHeight = vv.height;
    const handleResize = () => {
      const currentHeight = vv.height;
      const keyboardClosed = currentHeight > prevHeight;
      prevHeight = currentHeight;
      if (keyboardClosed) {
        requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior }));
      }
    };
    vv.addEventListener("resize", handleResize);
    return () => vv.removeEventListener("resize", handleResize);
  }, []);
}

// Shared wrapper: centers app in a 480px column on desktop, full-width on mobile.
// Used by AppLayout AND full-screen pages (ListingDetail, ChatThread, CreateListing)
// so the whole app looks consistent on web without affecting iOS (phones < 480px).
export function MobileFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative bg-background w-full flex justify-center" style={{ height: '100dvh', overflow: 'hidden' }}>
      <div className="relative bg-background w-full h-full" style={{ maxWidth: '480px' }}>
        {children}
      </div>
    </div>
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
  useIOSKeyboardScrollFix();

  return (
    <MobileFrame>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, height: '100dvh', overflow: 'hidden', paddingTop: 'env(safe-area-inset-top)' }}>
        <AccountStatusBanner />
        <main className={cn("page-content", hasStatusBanner && "pt-10")}>
          <ScrollToTop />
          <Outlet />
        </main>
        <BottomNav />
        <CollectionInviteBanner />
      </div>
    </MobileFrame>
  );
}
