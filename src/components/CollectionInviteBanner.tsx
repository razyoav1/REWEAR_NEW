import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

interface PendingInvite {
  id: string;
  wishlist_id: string;
  invited_by_user_id: string;
  created_at: string;
  wishlist_name: string;
  inviter_name: string;
  inviter_avatar?: string;
}

export function CollectionInviteBanner() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [current, setCurrent] = useState<PendingInvite | null>(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function loadPendingInvites() {
      const { data } = await supabase
        .from("wishlist_invites")
        .select("id, wishlist_id, invited_by_user_id, created_at")
        .eq("invited_user_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (!data?.length) return;

      // Fetch wishlist names and inviter names
      const wishlistIds = data.map(d => d.wishlist_id);
      const inviterIds = data.map(d => d.invited_by_user_id);

      const [{ data: wishlists }, { data: inviters }] = await Promise.all([
        supabase.from("wishlists").select("id, name").in("id", wishlistIds),
        supabase.from("users").select("id, name, avatar_url").in("id", inviterIds),
      ]);

      const wishlistMap: Record<string, string> = {};
      (wishlists ?? []).forEach((w: { id: string; name: string }) => { wishlistMap[w.id] = w.name; });

      const inviterMap: Record<string, { name: string; avatar_url?: string }> = {};
      (inviters ?? []).forEach((u: { id: string; name: string; avatar_url?: string }) => { inviterMap[u.id] = u; });

      const enriched: PendingInvite[] = data.map(d => ({
        id: d.id,
        wishlist_id: d.wishlist_id,
        invited_by_user_id: d.invited_by_user_id,
        created_at: d.created_at,
        wishlist_name: wishlistMap[d.wishlist_id] ?? "a collection",
        inviter_name: inviterMap[d.invited_by_user_id]?.name ?? "Someone",
        inviter_avatar: inviterMap[d.invited_by_user_id]?.avatar_url,
      }));

      setInvites(enriched);
      setCurrent(enriched[0]);
    }

    // Slight delay so the main app content loads first
    const tid = setTimeout(loadPendingInvites, 1500);
    return () => clearTimeout(tid);
  }, [user?.id]);

  async function respond(invite: PendingInvite, accept: boolean) {
    setResponding(true);
    const newStatus = accept ? "accepted" : "declined";

    const { error } = await supabase
      .from("wishlist_invites")
      .update({ status: newStatus })
      .eq("id", invite.id);

    if (!error && accept) {
      // Add user as a wishlist member (upsert to safely handle duplicates)
      await supabase
        .from("wishlist_members")
        .upsert(
          { wishlist_id: invite.wishlist_id, user_id: user!.id },
          { onConflict: "wishlist_id,user_id", ignoreDuplicates: true }
        );
      toast.success(`${t.joinedCollection} "${invite.wishlist_name}"`);
      // If already on the wishlist page, force a remount so it re-fetches
      if (location.pathname === "/wishlist") {
        navigate("/wishlist", { replace: true });
      }
    } else if (!error) {
      toast.success(t.inviteDeclined);
    }

    // Advance to next invite
    const remaining = invites.filter(i => i.id !== invite.id);
    setInvites(remaining);
    setCurrent(remaining[0] ?? null);
    setResponding(false);
  }

  return (
    <AnimatePresence>
      {current && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border px-6 py-8"
            style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
          >
            {/* Dismiss */}
            <button
              onClick={() => respond(current, false)}
              className="absolute top-4 right-5 w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                <Heart className="w-8 h-8 text-primary" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-1">{t.collectionInviteTitle}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                <span className="text-foreground font-semibold">{current.inviter_name}</span>{" "}
                {t.invitedYouTo}{" "}
                <span className="text-primary font-semibold">"{current.wishlist_name}"</span>
              </p>
              {invites.length > 1 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {invites.length - 1} {t.moreInvites}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={responding}
                onClick={() => respond(current, false)}
              >
                {t.decline}
              </Button>
              <Button
                className="flex-1"
                disabled={responding}
                onClick={() => respond(current, true)}
              >
                {responding
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : t.acceptInvite}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
