import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, Compass, DollarSign, MapPin, Clock, Settings, RotateCcw, Search, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SwipeCard } from "@/components/SwipeCard";
import { ActionButtons } from "@/components/ActionButtons";
import { SaveToCollectionSheet } from "@/components/SaveToCollectionSheet";
import { useListings, type ListingSort } from "@/hooks/useListings";
import { useBlocks } from "@/hooks/useBlocks";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GENDERS } from "@/types";
import type { Listing } from "@/types";

const CATEGORIES = ["All", "Tops", "Bottoms", "Dresses", "Outerwear", "Shoes", "Accessories"];

const UNDO_LIMIT_KEY = "rewear_undo_limit";
const UNDO_MAX = 10;

function getUndoData(): { date: string; count: number } {
  try {
    const raw = localStorage.getItem(UNDO_LIMIT_KEY);
    const data = raw ? JSON.parse(raw) : { date: "", count: 0 };
    const today = new Date().toISOString().split("T")[0];
    if (data.date !== today) return { date: today, count: 0 };
    return data;
  } catch { return { date: new Date().toISOString().split("T")[0], count: 0 }; }
}

function incrementUndoCount() {
  const data = getUndoData();
  localStorage.setItem(UNDO_LIMIT_KEY, JSON.stringify({ ...data, count: data.count + 1 }));
}

// SORT_OPTIONS defined inside component to use translations

type SwipeAction = "skip" | "save" | "chat";
interface HistoryEntry { listing: Listing; action: SwipeAction }

export default function Index() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<ListingSort>("newest");
  const [showFilters, setShowFilters] = useState(false);

  const SORT_OPTIONS: { value: ListingSort; label: string; icon: React.ReactNode }[] = [
    { value: "newest", label: t.newest, icon: <Clock className="w-3.5 h-3.5" /> },
    { value: "price_asc", label: t.priceAsc, icon: <DollarSign className="w-3.5 h-3.5" /> },
    { value: "price_desc", label: t.priceDesc, icon: <DollarSign className="w-3.5 h-3.5" /> },
    { value: "nearest", label: t.nearest, icon: <MapPin className="w-3.5 h-3.5" /> },
  ];
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [interactedIdsLoading, setInteractedIdsLoading] = useState(true);
  const [listingToSave, setListingToSave] = useState<Listing | null>(null);
  const [feedReady, setFeedReady] = useState(false);

  const { blockedUsers, isLoading: blocksLoading } = useBlocks();
  const blockedSellerIds = blockedUsers.map(u => u.id);

  // Load ALL previously seen/saved listing IDs before showing the feed.
  // Queries BOTH listing_interactions AND wishlist_items — this way a listing
  // already in the wishlist (saved via any path, including ListingDetail or
  // direct wishlist add) is never shown in discover again.
  useEffect(() => {
    if (!user) { setInteractedIdsLoading(false); return; }
    setInteractedIdsLoading(true);
    const localSaved: string[] = JSON.parse(localStorage.getItem("rewear_saved_ids") || "[]");
    Promise.all([
      supabase.from("listing_interactions").select("listing_id").eq("user_id", user.id),
      supabase.from("wishlist_items").select("listing_id").eq("user_id", user.id),
    ]).then(([interactions, wishlist]) => {
      const interactionIds = (interactions.data ?? []).map((r: { listing_id: string }) => r.listing_id);
      const wishlistIds = (wishlist.data ?? []).map((r: { listing_id: string }) => r.listing_id);
      setSeenIds([...new Set([...localSaved, ...interactionIds, ...wishlistIds])]);
      setInteractedIdsLoading(false);
    });
  }, [user?.id]);

  const { listings: raw, isLoading, refetch } = useListings({
    excludeOwnListings: true,
    // Don't fetch until blocks are loaded — prevents blocked sellers briefly appearing in feed
    excludeSellerIds: blocksLoading ? ["__placeholder__"] : blockedSellerIds,
    status: ["available"],
    category,
    genderFilter,
    sortBy,
    userLat: profile?.location_lat,
    userLng: profile?.location_lng,
  });

  useEffect(() => {
    if (!isLoading && !interactedIdsLoading && !blocksLoading) {
      // Small delay to let React settle all state updates
      const t = setTimeout(() => setFeedReady(true), 100);
      return () => clearTimeout(t);
    } else {
      setFeedReady(false);
    }
  }, [isLoading, interactedIdsLoading, blocksLoading]);

  // Use a Set for O(1) lookups — seenIds array can grow large
  const seenSet = useMemo(() => new Set(seenIds), [seenIds]);
  const listings = raw.filter((l) => !doneIds.has(l.id) && !seenSet.has(l.id));
  const current = listings[0];
  const next = listings[1];

  // Record impression
  const lastSeenRef = useRef<string | null>(null);
  useEffect(() => {
    if (!current || !user || current.id === lastSeenRef.current) return;
    lastSeenRef.current = current.id;
    supabase.from("recently_seen").upsert(
      { user_id: user.id, listing_id: current.id, seller_id: current.sellerId, seen_date: new Date().toISOString().split("T")[0] },
      { onConflict: "user_id,listing_id,seen_date" }
    ).then(() => {});
  }, [current?.id, user?.id]);

  function dismiss(listing: Listing, action: SwipeAction) {
    // Track ALL actions in history so any swipe can be undone
    setHistory((h) => [...h.slice(-(UNDO_MAX - 1)), { listing, action }]);
    setDoneIds((s) => new Set([...s, listing.id]));
    // Also add to seenIds so item doesn't reappear after feed refresh
    setSeenIds((prev) => [...prev, listing.id]);
  }

  const handleSkip = useCallback(() => {
    if (!current || !user) return;
    dismiss(current, "skip");
    supabase.from("listing_interactions").upsert(
      { user_id: user.id, listing_id: current.id, action: "declined" },
      { onConflict: "user_id,listing_id" }
    ).then(({ error }) => {
      if (error) import.meta.env.DEV && console.error("interaction write failed:", error.message);
    });
  }, [current, user]);

  const handleSave = useCallback(async () => {
    if (!current || !user) return;
    dismiss(current, "save");
    supabase.from("listing_interactions").upsert(
      { user_id: user.id, listing_id: current.id, action: "saved" },
      { onConflict: "user_id,listing_id" }
    ).then(({ error }) => {
      if (error) import.meta.env.DEV && console.error("interaction write failed:", error.message);
    });

    // Show collection picker only when user has custom collections (>1 total)
    const { data: colsData } = await supabase
      .from("wishlists").select("id, name").eq("created_by_user_id", user.id);

    if ((colsData?.length ?? 0) > 1) {
      setListingToSave(current);
      return;
    }

    // Single or no collection — save directly to "Saved"
    let wishlistId = colsData?.[0]?.id;
    if (!wishlistId) {
      const { data: created } = await supabase
        .from("wishlists")
        .insert({ name: "Saved", user_id: user.id, created_by_user_id: user.id })
        .select("id").single();
      wishlistId = created?.id;
    }
    if (wishlistId) {
      const { error } = await supabase.from("wishlist_items").upsert(
        { wishlist_id: wishlistId, listing_id: current.id, added_by_user_id: user.id, user_id: user.id },
        { onConflict: "user_id,listing_id" }
      );
      if (error) { toast.error(t.cantSaveItem); return; }
    }
    toast.success(t.saved, { description: current.title });
  }, [current, user, t]);

  const handleChat = useCallback(async () => {
    if (!current || !user) return;
    if (current.sellerId === user.id) { toast.error(t.ownListingError); return; }
    dismiss(current, "chat");
    supabase.from("listing_interactions").upsert(
      { user_id: user.id, listing_id: current.id, action: "seen" },
      { onConflict: "user_id,listing_id" }
    ).then(({ error }) => {
      if (error) import.meta.env.DEV && console.error("interaction write failed:", error.message);
    });
    const { data: existing } = await supabase
      .from("conversations").select("id")
      .eq("listing_id", current.id).eq("buyer_id", user.id).maybeSingle();
    let conversationId = existing?.id;
    if (!conversationId) {
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({ listing_id: current.id, buyer_id: user.id, seller_id: current.sellerId })
        .select("id").single();
      if (error) { toast.error(t.cantStartChat); return; }
      conversationId = created?.id;
    }
    if (conversationId) navigate(`/messages/${conversationId}`);
  }, [current, user, navigate]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const undoData = getUndoData();
    if (undoData.count >= UNDO_MAX) {
      toast.error(t.undoLimitReached);
      return;
    }
    const last = history[history.length - 1];
    // Remove from doneIds and seenIds so the card reappears
    setDoneIds((s) => { const n = new Set(s); n.delete(last.listing.id); return n; });
    setSeenIds((prev) => prev.filter(id => id !== last.listing.id));
    // Delete the interaction record so it doesn't get filtered again on next load
    if (user?.id) {
      supabase.from("listing_interactions")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", last.listing.id)
        .then(() => {});
    }
    setHistory((h) => h.slice(0, -1));
    incrementUndoCount();
    const remaining = UNDO_MAX - undoData.count - 1;
    toast(`Undone (${remaining} undo${remaining !== 1 ? "s" : ""} left today)`);
  }, [history, user?.id]);

  return (
    <div className="discover-page">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            RE<span className="gradient-text">-WEAR</span>
          </h1>
          <p className="text-muted-foreground text-sm">{t.swipeToFind}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("/search")}>
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate("/wishlist")}>
            <Heart className="w-4 h-4" />
          </Button>
          <Button variant={showFilters ? "default" : "outline"} size="icon" onClick={() => setShowFilters(s => !s)}>
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Sort filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            key="sort-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => { setSortBy(opt.value); setDoneIds(new Set()); }}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all",
                    sortBy === opt.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gender tab strip */}
      <div className="flex gap-1 px-5 pb-3">
        {GENDERS.filter(g => g.value !== "unisex").map(g => (
          <button key={g.value} onClick={() => { setGenderFilter(g.value); setDoneIds(new Set()); }}
            className={cn("flex-1 py-2 rounded-xl text-sm font-bold transition-all",
              genderFilter === g.value
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:text-foreground")}>
            {({ all: t.genderAll, women: t.genderWomens, men: t.genderMens, unisex: t.genderUnisex } as Record<string, string>)[g.value] ?? g.label}
          </button>
        ))}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => {
          const active = cat === "All" ? !category : category === cat;
          return (
            <Badge key={cat} variant={active ? "pink" : "outline"}
              className="whitespace-nowrap cursor-pointer text-xs py-1.5 px-3 transition-all shrink-0"
              onClick={() => { setCategory(cat === "All" ? undefined : cat); setDoneIds(new Set()); }}>
              {cat}
            </Badge>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col px-4 gap-3 pb-3" style={{ minHeight: 0 }}>
        <div className="relative" style={{ flex: '1 1 0', minHeight: '200px' }}>
          {!feedReady ? (
            <Skeleton className="absolute inset-0 rounded-3xl" />
          ) : current ? (
            <AnimatePresence>
              {next && (
                <motion.div key={`bg-${next.id}`} className="absolute inset-0"
                  initial={{ scale: 0.94, opacity: 0.4 }} animate={{ scale: 0.96, opacity: 0.6 }} style={{ zIndex: 0 }}>
                  <div className="w-full h-full rounded-3xl overflow-hidden bg-card border border-border">
                    {next.photos[0] && <img src={next.photos[0]} alt="" className="w-full h-full object-cover opacity-40" />}
                  </div>
                </motion.div>
              )}
              <SwipeCard key={current.id} listing={current}
                userCurrency={profile?.currency ?? "USD"}
                onSwipeLeft={handleSkip} onSwipeRight={handleSave}
                onTap={() => navigate(`/listings/${current.id}`)} isTop={true} />
            </AnimatePresence>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center p-8 rounded-3xl border border-border bg-card">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <Compass className="w-10 h-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">{t.seenItAll}</h3>
                <p className="text-muted-foreground text-sm">{t.noMoreItems}</p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                <Button onClick={() => { setDoneIds(new Set()); setSeenIds([]); refetch(); }}>{t.refreshFeed}</Button>
                <Button variant="outline" onClick={() => navigate("/settings")} className="flex items-center gap-2">
                  <Settings className="w-4 h-4" /> {t.increaseRadius}
                </Button>
              </div>
              {history.length > 0 && (
                <Button variant="ghost" onClick={handleUndo} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <RotateCcw className="w-4 h-4" /> {t.undoLastSwipe}
                </Button>
              )}
            </motion.div>
          )}
        </div>

        {feedReady && current && (
          <ActionButtons onSkip={handleSkip} onSave={handleSave} onChat={handleChat}
            onUndo={handleUndo} canUndo={history.length > 0} />
        )}
      </div>

      <SaveToCollectionSheet
        open={!!listingToSave}
        listing={listingToSave ? { id: listingToSave.id, title: listingToSave.title } : null}
        userId={user?.id ?? ""}
        onClose={() => setListingToSave(null)}
        onSaved={() => setListingToSave(null)}
      />
    </div>
  );
}
