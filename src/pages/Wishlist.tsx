import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Plus, Trash2, Loader2, Lock, Globe, Pencil, Check, X, UserPlus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { CONDITION_LABELS, type ListingCondition } from "@/types";
import { cn, displayPrice } from "@/lib/utils";

interface Collection {
  id: string;
  name: string;
  is_shared: boolean;
  isOwned: boolean;
  itemCount: number;
}

interface SavedListing {
  wishlistItemId: string;
  id: string;
  title: string;
  price: number;
  currency: string;
  photos: string[];
  condition: ListingCondition;
  brand?: string;
  size_value?: string;
}

export default function Wishlist() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useLanguage();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, setItems] = useState<SavedListing[]>([]);
  const [loadingCols, setLoadingCols] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  // Create collection sheet
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // Collection options sheet
  const [showOptions, setShowOptions] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [savingRename, setSavingRename] = useState(false);

  // Move item
  const [movingItem, setMovingItem] = useState<SavedListing | null>(null);
  const [moving, setMoving] = useState(false);

  // Invite
  const [showInvite, setShowInvite] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteResults, setInviteResults] = useState<{ id: string; name: string }[]>([]);
  const [inviting, setInviting] = useState<string | null>(null);

  const activeCollection = collections.find(c => c.id === activeId);
  const otherCollections = collections.filter(c => c.id !== activeId);

  async function loadCollections() {
    if (!user) return;
    setLoadingCols(true);

    // Fetch all wishlists the user is a member of (owned + invited)
    const { data: memberRows } = await supabase
      .from("wishlist_members")
      .select("wishlist_id")
      .eq("user_id", user.id);

    const wishlistIds = (memberRows ?? []).map((r: { wishlist_id: string }) => r.wishlist_id);

    if (!wishlistIds.length) {
      setCollections([]);
      setActiveId(null);
      setLoadingCols(false);
      return;
    }

    const { data } = await supabase
      .from("wishlists")
      .select("id, name, is_shared, created_by_user_id")
      .in("id", wishlistIds)
      .order("created_at", { ascending: true });

    const cols = data ?? [];

    const withCounts: Collection[] = await Promise.all(
      cols.map(async (w: { id: string; name: string; is_shared?: boolean; created_by_user_id: string }) => {
        const { count } = await supabase
          .from("wishlist_items")
          .select("id", { count: "exact", head: true })
          .eq("wishlist_id", w.id);
        return {
          id: w.id,
          name: w.name,
          is_shared: w.is_shared ?? false,
          isOwned: w.created_by_user_id === user.id,
          itemCount: count ?? 0,
        };
      })
    );

    // "Saved" shows all items — set its count to the total across all collections
    const finalCounts = withCounts.length > 1
      ? withCounts.map(c => c.name === "Saved"
          ? { ...c, itemCount: withCounts.reduce((sum, x) => sum + x.itemCount, 0) }
          : c)
      : withCounts;

    setCollections(finalCounts);
    setActiveId(prev => {
      if (prev && withCounts.find(c => c.id === prev)) return prev;
      const saved = withCounts.find(c => c.name === "Saved");
      return saved?.id ?? withCounts[0]?.id ?? null;
    });
    setLoadingCols(false);
  }

  async function loadItems(collectionId: string, cols: Collection[]) {
    setLoadingItems(true);

    // "Saved" = virtual view of ALL items across every collection the user owns
    const col = cols.find(c => c.id === collectionId);
    const isSavedView = col?.name === "Saved" && cols.length > 1;

    const { data: wItems } = isSavedView
      ? await supabase
          .from("wishlist_items")
          .select("id, listing_id")
          .in("wishlist_id", cols.map(c => c.id))
          .order("created_at", { ascending: false })
      : await supabase
          .from("wishlist_items")
          .select("id, listing_id")
          .eq("wishlist_id", collectionId)
          .order("created_at", { ascending: false });

    if (!wItems?.length) { setItems([]); setLoadingItems(false); return; }

    const listingIds = wItems.map((wi: { id: string; listing_id: string }) => wi.listing_id);
    const { data: listings } = await supabase
      .from("clothing_listings")
      .select("id, title, price, currency, photos, condition, brand, size_value")
      .in("id", listingIds);

    type RawListing = Omit<SavedListing, "wishlistItemId">;
    const listingMap: Record<string, RawListing> = {};
    (listings ?? []).forEach((l: RawListing) => { listingMap[l.id] = l; });

    setItems(
      wItems
        .filter((wi: { id: string; listing_id: string }) => listingMap[wi.listing_id])
        .map((wi: { id: string; listing_id: string }) => ({ wishlistItemId: wi.id, ...listingMap[wi.listing_id] }))
    );
    setLoadingItems(false);
  }

  useEffect(() => { loadCollections(); }, [user?.id]);
  useEffect(() => { if (activeId) loadItems(activeId, collections); else setItems([]); }, [activeId, collections]);

  async function createCollection() {
    if (!user || !newName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("wishlists")
      .insert({ name: newName.trim(), user_id: user.id, created_by_user_id: user.id, is_shared: false })
      .select("id")
      .single();
    if (error) {
      toast.error(t.failedCreateCollection);
    } else {
      toast.success(`"${newName.trim()}" created`);
      setNewName("");
      setShowCreate(false);
      await loadCollections();
      if (data?.id) setActiveId(data.id);
    }
    setCreating(false);
  }

  async function saveRename() {
    if (!renamingId || !renameInput.trim()) return;
    setSavingRename(true);
    const { error } = await supabase.from("wishlists").update({ name: renameInput.trim() }).eq("id", renamingId);
    if (error) {
      toast.error(t.failedCreateCollection);
      setSavingRename(false);
      return;
    }
    setCollections(prev => prev.map(c => c.id === renamingId ? { ...c, name: renameInput.trim() } : c));
    toast.success(t.collectionRenamed);
    setRenamingId(null);
    setSavingRename(false);
  }

  async function toggleShare(col: Collection) {
    const next = !col.is_shared;
    const { error } = await supabase.from("wishlists").update({ is_shared: next }).eq("id", col.id);
    if (error) {
      toast.error(t.failedCreateCollection);
      return;
    }
    if (next) {
      const url = `${window.location.origin}/wishlist?col=${col.id}`;
      await navigator.clipboard.writeText(url);
      toast.success(t.collectionPublicMsg);
    } else {
      toast.success(t.collectionPrivateMsg);
    }
    setCollections(prev => prev.map(c => c.id === col.id ? { ...c, is_shared: next } : c));
  }

  async function handleRemove(e: React.MouseEvent, wishlistItemId: string) {
    e.stopPropagation();
    setRemoving(wishlistItemId);
    await supabase.from("wishlist_items").delete().eq("id", wishlistItemId);
    setItems(prev => prev.filter(i => i.wishlistItemId !== wishlistItemId));
    // Decrement the active collection and the "Saved" total (not all collections)
    setCollections(prev => prev.map(c => {
      if (c.id === activeId || c.name === "Saved") return { ...c, itemCount: Math.max(0, c.itemCount - 1) };
      return c;
    }));
    setRemoving(null);
    toast.success(t.removed);
  }

  async function handleMove(targetCollectionId: string) {
    if (!movingItem) return;
    setMoving(true);
    await supabase.from("wishlist_items").update({ wishlist_id: targetCollectionId }).eq("id", movingItem.wishlistItemId);

    const inSavedView = activeCollection?.name === "Saved";
    // In "Saved" view the item stays visible (Saved shows all collections)
    if (!inSavedView) {
      setItems(prev => prev.filter(i => i.wishlistItemId !== movingItem.wishlistItemId));
    }
    // Update counts: source collection loses 1, target gains 1 (Saved total stays same)
    setCollections(prev => prev.map(c => {
      if (!inSavedView && c.id === activeId) return { ...c, itemCount: c.itemCount - 1 };
      if (c.id === targetCollectionId) return { ...c, itemCount: c.itemCount + 1 };
      return c;
    }));
    toast.success(`Moved to "${collections.find(c => c.id === targetCollectionId)?.name}"`);
    setMovingItem(null);
    setMoving(false);
  }

  async function deleteCollection(col: Collection) {
    const { error } = await supabase.from("wishlists").delete().eq("id", col.id);
    if (error) {
      toast.error(t.failedCreateCollection);
      return;
    }
    const remaining = collections.filter(c => c.id !== col.id);
    setCollections(remaining);
    const saved = remaining.find(c => c.name === "Saved");
    setActiveId(saved?.id ?? remaining[0]?.id ?? null);
    toast.success(`"${col.name}" deleted`);
    setShowOptions(false);
  }

  useEffect(() => {
    if (!inviteSearch.trim()) { setInviteResults([]); return; }
    const tid = setTimeout(async () => {
      if (!user) return;
      // Only search among users the current user follows
      const { data: followData } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = (followData ?? []).map((f: { following_id: string }) => f.following_id);
      if (!followingIds.length) { setInviteResults([]); return; }

      const { data } = await supabase
        .from("users")
        .select("id, name")
        .in("id", followingIds)
        .ilike("name", `%${inviteSearch.trim()}%`)
        .limit(5);
      setInviteResults(data ?? []);
    }, 300);
    return () => clearTimeout(tid);
  }, [inviteSearch, user?.id]);

  async function handleInvite(invitedUserId: string, _invitedUserName: string) {
    if (!activeId || !user) return;
    setInviting(invitedUserId);
    const { error } = await supabase.from("wishlist_invites").upsert(
      { wishlist_id: activeId, invited_user_id: invitedUserId, invited_by_user_id: user.id, status: "pending" },
      { onConflict: "wishlist_id,invited_user_id" }
    );
    if (error) {
      toast.error(t.failedSendInvite);
    } else {
      toast.success(t.inviteSent);
      // Fire collection_invite notification
      await supabase.from("notifications").insert({
        user_id: invitedUserId,
        type: "collection_invite",
        title: `${profile?.name ?? "Someone"} invited you to a collection`,
        body: `"${activeCollection?.name}"`,
        data: {
          wishlist_id: activeId,
          wishlist_name: activeCollection?.name,
          inviter_id: user.id,
          inviter_name: profile?.name,
        },
      });
    }
    setInviting(null);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.wishlist}</h1>
          {activeCollection && (
            <p className="text-muted-foreground text-sm mt-0.5">
              {activeCollection.itemCount} {activeCollection.itemCount !== 1 ? t.items : t.item}
              {activeCollection.is_shared && <span className="text-secondary ml-1.5">· {t.public}</span>}
            </p>
          )}
        </div>
        {activeCollection && (
          <button onClick={() => setShowOptions(true)}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collection chips */}
      {loadingCols ? (
        <div className="flex gap-2 px-5 pb-4 overflow-x-auto no-scrollbar">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />)}
        </div>
      ) : (
        <div className="flex gap-2 px-5 pb-4 overflow-x-auto no-scrollbar">
          {collections.map(col => (
            <button key={col.id} onClick={() => setActiveId(col.id)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all",
                activeId === col.id
                  ? "bg-primary border-primary text-white"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}>
              {col.name}
            </button>
          ))}
          <button onClick={() => setShowCreate(true)}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-all">
            <Plus className="w-3.5 h-3.5" /> {t.newCollection}
          </button>
        </div>
      )}

      {/* Items grid */}
      {!activeId && !loadingCols ? (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-primary" />
          </motion.div>
          <h2 className="text-xl font-bold mb-2">{t.nothingSavedYet}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">{t.startSwiping}</p>
          <Button onClick={() => navigate("/")}>{t.browseListings}</Button>
        </div>
      ) : loadingItems ? (
        <div className="grid grid-cols-2 gap-3 px-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <p className="text-muted-foreground text-sm mb-4">{t.collectionEmpty}</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>{t.browseListings}</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5">
          {items.map((item, i) => (
            <motion.div key={item.wishlistItemId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <button onClick={() => navigate(`/listings/${item.id}`)}
                className="w-full text-left rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all group">
                <div className="relative aspect-square bg-muted">
                  {item.photos[0]
                    ? <img src={item.photos[0]} alt={item.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>}
                  <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {otherCollections.length > 0 && (
                      <button onClick={e => { e.stopPropagation(); setMovingItem(item); }}
                        className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                    <button onClick={e => handleRemove(e, item.wishlistItemId)} disabled={removing === item.wishlistItemId}
                      className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      {removing === item.wishlistItemId
                        ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                        : <Trash2 className="w-3 h-3 text-white" />}
                    </button>
                  </div>
                </div>
                <div className="p-2.5">
                  {item.brand && <p className="text-[10px] text-muted-foreground truncate">{item.brand}</p>}
                  <p className="font-semibold text-sm truncate">{item.title}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-primary font-bold text-sm">{displayPrice(item.price, item.currency, profile?.currency ?? "USD")}</p>
                    <p className="text-[10px] text-muted-foreground">{CONDITION_LABELS[item.condition]}</p>
                  </div>
                  {item.size_value && <p className="text-[10px] text-muted-foreground mt-0.5">Size {item.size_value}</p>}
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create collection sheet */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40" onClick={() => { setShowCreate(false); setNewName(""); }} />
            <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl p-6 border-t border-border"
              style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
              <h3 className="text-lg font-bold mb-4">{t.newCollectionTitle}</h3>
              <Input placeholder="e.g. Summer looks, Grail list…" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createCollection()} autoFocus className="mb-4" />
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => { setShowCreate(false); setNewName(""); }}>{t.cancel}</Button>
                <Button className="flex-1" disabled={!newName.trim() || creating} onClick={createCollection}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : t.create}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Collection options sheet */}
      <AnimatePresence>
        {showOptions && activeCollection && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40" onClick={() => { setShowOptions(false); setRenamingId(null); }} />
            <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border"
              style={{ paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" }}>
              <div className="w-10 h-1 rounded-full bg-border mx-auto mt-3 mb-2" />
              <div className="px-6 pb-6">
                <p className="font-bold text-base mb-4 text-center">{activeCollection.name}</p>

                {/* Rename */}
                {activeCollection.isOwned && activeCollection.name !== "Saved" && (
                  renamingId === activeId ? (
                    <div className="flex gap-2 mb-3">
                      <Input value={renameInput} onChange={e => setRenameInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && saveRename()} autoFocus className="flex-1 h-9 text-sm" />
                      <button onClick={saveRename} disabled={savingRename}
                        className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                        {savingRename ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <button onClick={() => setRenamingId(null)}
                        className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { setRenamingId(activeId); setRenameInput(activeCollection.name); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 text-left mb-2">
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t.rename}</span>
                    </button>
                  )
                )}

                {/* Share toggle + Invite — owned only */}
                {activeCollection.isOwned && (
                  <>
                    <button onClick={() => toggleShare(activeCollection)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 text-left mb-2">
                      {activeCollection.is_shared
                        ? <Globe className="w-4 h-4 text-secondary" />
                        : <Lock className="w-4 h-4 text-muted-foreground" />}
                      <div className="flex-1">
                        <span className="text-sm font-medium">{activeCollection.is_shared ? t.makePrivate : t.shareCollection}</span>
                        {activeCollection.is_shared && <p className="text-xs text-muted-foreground">{t.copiedLinkHint}</p>}
                      </div>
                      {activeCollection.is_shared && <span className="text-xs text-secondary font-semibold">{t.public}</span>}
                    </button>

                    <button onClick={() => { setShowOptions(false); setShowInvite(true); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/50 text-left mb-2">
                      <UserPlus className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t.inviteSomeone}</span>
                    </button>
                  </>
                )}

                {/* Delete (non-Saved only, owned only) */}
                {activeCollection.isOwned && activeCollection.name !== "Saved" && (
                  <button onClick={() => deleteCollection(activeCollection)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-destructive/30 hover:bg-destructive/10 text-left">
                    <Trash2 className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">{t.deleteCollection}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Move item dialog */}
      <Dialog open={!!movingItem} onOpenChange={v => !v && setMovingItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.moveToCollection}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {otherCollections.map(col => (
              <button key={col.id} onClick={() => handleMove(col.id)} disabled={moving}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 bg-card transition-all text-left">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{col.name}</p>
                  <p className="text-xs text-muted-foreground">{col.itemCount} {t.items}</p>
                </div>
                {moving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovingItem(null)}>{t.cancel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite member dialog */}
      <Dialog open={showInvite} onOpenChange={v => !v && setShowInvite(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t.inviteTo} "{activeCollection?.name}"</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground -mt-1">{t.onlyFollowersCanBeInvited}</p>
          <Input placeholder={t.searchByName} value={inviteSearch} onChange={e => setInviteSearch(e.target.value)} autoFocus />
          <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
            {inviteResults.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl border border-border bg-card">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {u.name[0]?.toUpperCase()}
                </div>
                <p className="flex-1 text-sm font-medium truncate">{u.name}</p>
                <Button size="sm" variant="outline" disabled={!!inviting} onClick={() => handleInvite(u.id, u.name)}>
                  {inviting === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : t.invite}
                </Button>
              </div>
            ))}
            {inviteSearch && inviteResults.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">{t.noUsersFound}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowInvite(false); setInviteSearch(""); setInviteResults([]); }}>{t.done}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
