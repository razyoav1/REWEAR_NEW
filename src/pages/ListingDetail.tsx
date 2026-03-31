import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Heart, Share2, MessageCircle, Star, MapPin, ChevronLeft, ChevronRight, Flag, Pencil, Trash2, Loader2, EyeOff, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { CONDITION_LABELS } from "@/types";
import { formatDistance } from "@/lib/distance";
import { calculateDistanceKm } from "@/lib/distance";
import { cn, displayPrice } from "@/lib/utils";
import { useReports, REPORT_REASONS } from "@/hooks/useReports";
import { SaveToCollectionSheet } from "@/components/SaveToCollectionSheet";

interface FullListing {
  id: string;
  title: string;
  description?: string;
  category: string;
  brand?: string;
  sizeValue?: string;
  condition: string;
  colors: string[];
  price: number;
  currency: string;
  photos: string[];
  status: string;
  distance?: number;
  sellerId: string;
  seller: {
    id: string;
    name: string;
    avatarUrl?: string;
    ratingAvg?: number;
    ratingCount?: number;
  };
  createdAt: string;
}

function PhotoViewer({ photos, initialIndex, onClose }: {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const lastTapRef = useRef(0);

  function prev() { if (index > 0) { setIndex(i => i - 1); setScale(1); } }
  function next() { if (index < photos.length - 1) { setIndex(i => i + 1); setScale(1); } }

  function handleTap() {
    const now = Date.now();
    if (now - lastTapRef.current < 300) setScale(s => s > 1 ? 1 : 2.5);
    lastTapRef.current = now;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2 shrink-0">
        <span className="text-white/50 text-sm font-medium">{index + 1} / {photos.length}</span>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Swipeable photo area */}
      <motion.div
        className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) next();
          else if (info.offset.x > 60) prev();
        }}
        onClick={handleTap}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={photos[index]}
            alt=""
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0, scale }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.15 }}
            className="max-w-full max-h-full object-contain select-none pointer-events-none"
          />
        </AnimatePresence>
      </motion.div>

      {/* Dots + hint */}
      <div className="shrink-0 pb-12 pt-3 flex flex-col items-center gap-2">
        {photos.length > 1 && (
          <div className="flex gap-2">
            {photos.map((_, i) => (
              <button key={i} onClick={() => { setIndex(i); setScale(1); }}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/40"}`}
              />
            ))}
          </div>
        )}
        <p className="text-white/30 text-[10px]">Double-tap to zoom</p>
      </div>
    </motion.div>
  );
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t, isRTL } = useLanguage();
  const [listing, setListing] = useState<FullListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const { submitReport } = useReports();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("scam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportingSubmit, setReportingSubmit] = useState(false);

  // Owner controls
  const [ownerAction, setOwnerAction] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleStatusChange(status: string) {
    if (!id || !listing) return;
    setOwnerAction(true);
    const { error } = await supabase.from("clothing_listings").update({ status }).eq("id", id);
    setOwnerAction(false);
    if (error) { toast.error("Failed to update listing status"); return; }
    // Update local state so UI reflects the change without a page refresh
    setListing(prev => prev ? { ...prev, status } : prev);
    toast.success(`Listing marked as ${status}`);

    // When relisting, notify users who have this item wishlisted
    if (status === "available" && listing.status !== "available") {
      const { data: wishlistItems } = await supabase
        .from("wishlist_items")
        .select("user_id:added_by_user_id")
        .eq("listing_id", id);
      const wishers = [...new Set((wishlistItems ?? [])
        .map((w: { user_id: string }) => w.user_id)
        .filter(uid => uid && uid !== user?.id))];
      if (wishers.length) {
        await supabase.from("notifications").insert(
          wishers.map(uid => ({
            user_id: uid,
            type: "listing_relisted",
            title: "A saved item is available again",
            body: listing.title,
            data: { listing_id: id, listing_title: listing.title },
          }))
        );
      }
    }

    navigate("/profile");
  }

  async function handleDelete() {
    if (!id) return;
    setOwnerAction(true);
    const { error } = await supabase.from("clothing_listings").delete().eq("id", id);
    setOwnerAction(false);
    if (error) { toast.error(t.failedToDeleteListing); return; }
    setShowDeleteConfirm(false);
    toast.success(t.listingDeleted);
    navigate("/profile");
  }

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      const { data: row } = await supabase
        .from("clothing_listings").select("*").eq("id", id).single();
      if (!row) { setLoading(false); return; }

      const { data: seller } = await supabase
        .from("users").select("id, name, avatar_url, rating_avg, rating_count, location_lat, location_lng")
        .eq("id", row.seller_id).single();

      let distance: number | undefined;
      if (profile?.location_lat && profile?.location_lng && seller?.location_lat && seller?.location_lng) {
        distance = calculateDistanceKm(profile.location_lat, profile.location_lng, seller.location_lat, seller.location_lng);
      }

      setListing({
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        brand: row.brand,
        sizeValue: row.size_value,
        condition: row.condition,
        colors: row.colors ?? [],
        price: parseFloat(row.price),
        currency: row.currency,
        photos: row.photos ?? [],
        status: row.status,
        distance,
        sellerId: row.seller_id,
        seller: {
          id: seller?.id ?? row.seller_id,
          name: seller?.name ?? "Unknown",
          avatarUrl: seller?.avatar_url,
          ratingAvg: seller?.rating_avg,
          ratingCount: seller?.rating_count,
        },
        createdAt: row.created_at,
      });
      setLoading(false);

      // Track view (fire-and-forget; skip if owner)
      if (user && user.id !== row.seller_id) {
        supabase.from("listing_views").upsert(
          { listing_id: row.id, viewer_id: user.id },
          { onConflict: "listing_id,viewer_id" }
        ).then(() => {});
      }

      // Fetch view count for the listing owner
      if (user && user.id === row.seller_id) {
        supabase.from("listing_views")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", row.id)
          .then(({ count }) => setViewCount(count ?? 0));
      }
    }
    load();
  }, [id, profile?.location_lat, profile?.location_lng, user]);

  function markListingSaved(listingId: string) {
    // Write to localStorage immediately so Discover excludes it even before DB write completes
    try {
      const saved: string[] = JSON.parse(localStorage.getItem("rewear_saved_ids") || "[]");
      if (!saved.includes(listingId)) {
        localStorage.setItem("rewear_saved_ids", JSON.stringify([...saved, listingId]));
      }
    } catch { /* ignore */ }
    // Also write to DB (fire and forget)
    if (user) {
      supabase.from("listing_interactions").upsert(
        { user_id: user.id, listing_id: listingId, action: "seen" },
        { onConflict: "user_id,listing_id" }
      ).then(() => {});
    }
  }

  async function handleSave() {
    if (!user || !listing) return;

    // Mark immediately so Discover excludes it regardless of which path completes
    markListingSaved(listing.id);

    // Fetch all collections the user belongs to (owned + invited)
    const { data: memberRows } = await supabase
      .from("wishlist_members").select("wishlist_id").eq("user_id", user.id);
    const wishlistIds = (memberRows ?? []).map((r: { wishlist_id: string }) => r.wishlist_id);
    const { data: colsData } = wishlistIds.length
      ? await supabase.from("wishlists").select("id, name").in("id", wishlistIds).order("created_at", { ascending: true })
      : { data: [] };

    if ((colsData?.length ?? 0) > 1) {
      setShowSaveSheet(true);
      return;
    }

    let wishlistId = (colsData as { id: string; name: string }[] | null)?.[0]?.id;
    if (!wishlistId) {
      const { data: created } = await supabase
        .from("wishlists")
        .insert({ name: "Saved", user_id: user.id, created_by_user_id: user.id })
        .select("id").single();
      wishlistId = created?.id;
    }
    if (wishlistId) {
      const { error } = await supabase.from("wishlist_items").upsert(
        { wishlist_id: wishlistId, listing_id: listing.id, added_by_user_id: user.id, user_id: user.id },
        { onConflict: "user_id,listing_id" }
      );
      if (error) { toast.error(t.cantSaveItem); return; }
      // Notify seller (fire-and-forget)
      if (listing.sellerId !== user.id) {
        supabase.from("notifications").insert({
          user_id: listing.sellerId,
          type: "listing_saved",
          title: `${profile?.name ?? "Someone"} saved your listing`,
          body: listing.title,
          data: { listing_id: listing.id, listing_title: listing.title, saver_id: user.id, saver_name: profile?.name },
        }).then(() => {});
      }
    }
    setSaved(true);
    toast.success(t.saved, { description: listing.title });
  }

  async function handleChat() {
    if (!user || !listing) return;
    if (listing.sellerId === user.id) { toast.error(t.ownListingError); return; }
    setChatting(true);
    try {
      const { data: existing } = await supabase
        .from("conversations").select("id").eq("listing_id", listing.id).eq("buyer_id", user.id).maybeSingle();
      let conversationId = existing?.id;
      if (!conversationId) {
        const { data: created, error } = await supabase
          .from("conversations").insert({ listing_id: listing.id, buyer_id: user.id, seller_id: listing.sellerId })
          .select("id").single();
        if (error) { toast.error(t.cantStartChat); return; }
        conversationId = created?.id;
      }
      if (conversationId) navigate(`/messages/${conversationId}`);
    } finally {
      setChatting(false);
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/l/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: listing?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success(t.linkCopied);
      }
    } catch (err) {
      // User dismissed the share sheet — not an error
      if ((err as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(url);
        toast.success(t.linkCopied);
      }
    }
  }

  async function handleSubmitReport() {
    if (!id) return;
    setReportingSubmit(true);
    await submitReport({ entityType: "listing", entityId: id, reason: reportReason, details: reportDetails });
    setReportingSubmit(false); setShowReportDialog(false); setReportDetails("");
  }

  const isOwnListing = listing?.sellerId === user?.id;

  return (
    <div className="min-h-screen bg-background pb-28">
      {loading ? (
        <>
          <Skeleton className="w-full aspect-[4/5] rounded-none" />
          <div className="p-5 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        </>
      ) : !listing ? (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-muted-foreground">{t.listingNotFound}</p>
          <Button onClick={() => navigate(-1)}>{t.goBack}</Button>
        </div>
      ) : (
        <>
          {/* Photo carousel */}
          <div className="relative bg-card" style={{ aspectRatio: "4/5", maxHeight: "80vh" }}>
            {listing.photos.length > 0 ? (
              <img
                src={listing.photos[photoIndex]}
                alt={listing.title}
                onClick={() => { setViewerIndex(photoIndex); setViewerOpen(true); }}
                className="w-full h-full object-cover cursor-zoom-in"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center text-6xl">📦</div>
            )}

            {/* Photo dots */}
            {listing.photos.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                {listing.photos.map((_, i) => (
                  <button key={i} onClick={() => setPhotoIndex(i)}
                    className={`h-1.5 rounded-full transition-all ${i === photoIndex ? "w-6 bg-white" : "w-2 bg-white/50"}`}
                  />
                ))}
              </div>
            )}

            {/* Photo nav arrows */}
            {listing.photos.length > 1 && (
              <>
                <button onClick={() => setPhotoIndex(p => Math.max(0, p - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button onClick={() => setPhotoIndex(p => Math.min(listing.photos.length - 1, p + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </>
            )}

            {/* Status overlay — centered, angled stamp */}
            {listing.status !== "available" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`rotate-[-20deg] px-8 py-3 rounded-xl border-4 font-black text-4xl uppercase tracking-widest select-none ${
                  listing.status === "sold"
                    ? "bg-black/60 border-white/80 text-white"
                    : listing.status === "reserved"
                    ? "bg-yellow-500/70 border-yellow-300 text-white"
                    : "bg-black/70 border-destructive text-destructive"
                }`}>
                  {listing.status === "sold" ? "SOLD" : listing.status === "reserved" ? "RESERVED" : "HIDDEN"}
                </div>
              </div>
            )}

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 pt-12">
              <button onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                {isRTL ? <ArrowRight className="w-5 h-5 text-white" /> : <ArrowLeft className="w-5 h-5 text-white" />}
              </button>
              <button onClick={handleShare}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-5 pt-5 space-y-5"
          >
            {/* Title + price */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {listing.brand && <p className="text-muted-foreground text-sm font-medium mb-0.5">{listing.brand}</p>}
                <h1 className="text-2xl font-black tracking-tight leading-tight">{listing.title}</h1>
              </div>
              <div className="text-right shrink-0">
                <p className="text-3xl font-black gradient-text">{displayPrice(listing.price, listing.currency, profile?.currency ?? "USD")}</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="default">{CONDITION_LABELS[listing.condition as keyof typeof CONDITION_LABELS] ?? listing.condition}</Badge>
              {listing.sizeValue && <Badge variant="outline">{t.sizeLabel} {listing.sizeValue}</Badge>}
              {listing.colors.map(c => <Badge key={c} variant="muted">{c}</Badge>)}
              <Badge variant="muted">{listing.category}</Badge>
              {listing.distance != null && (
                <Badge variant="muted" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />{formatDistance(listing.distance)} {t.awayLabel}
                </Badge>
              )}
              {isOwnListing && viewCount !== null && (
                <Badge variant="muted" className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />{viewCount} {t.viewsCount}
                </Badge>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <p className="text-muted-foreground text-sm leading-relaxed">{listing.description}</p>
            )}

            {/* Seller */}
            <button
              onClick={() => navigate(`/users/${listing.seller.id}`)}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-muted hover:bg-muted/80 transition-colors text-left"
            >
              <Avatar className="w-11 h-11 border-2 border-border">
                <AvatarImage src={listing.seller.avatarUrl} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                  {listing.seller.name[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">{listing.seller.name}</p>
                {(listing.seller.ratingAvg ?? 0) > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">
                      {listing.seller.ratingAvg?.toFixed(1)} · {listing.seller.ratingCount} {t.reviews}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{t.viewProfile}</span>
            </button>

            {/* Report listing */}
            {!isOwnListing && (
              <div className="flex justify-center pb-2">
                <button onClick={() => setShowReportDialog(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
                  <Flag className="w-3.5 h-3.5" /> {t.reportListing}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Fixed CTA */}
      {!loading && listing && (
        <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-border bg-background/95 backdrop-blur-sm"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
          {isOwnListing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                {listing.status !== "reserved" && listing.status !== "sold" && (
                  <Button variant="outline" size="sm" className="flex-1 text-yellow-400 border-yellow-400/40 hover:bg-yellow-400/10"
                    disabled={ownerAction} onClick={() => handleStatusChange("reserved")}>
                    {ownerAction ? <Loader2 className="w-4 h-4 animate-spin" /> : t.reserve}
                  </Button>
                )}
                {listing.status !== "sold" && (
                  <Button variant="outline" size="sm" className="flex-1 text-secondary border-secondary/40 hover:bg-secondary/10"
                    disabled={ownerAction} onClick={() => handleStatusChange("sold")}>
                    {ownerAction ? <Loader2 className="w-4 h-4 animate-spin" /> : t.markSold}
                  </Button>
                )}
                {listing.status === "hidden" ? (
                  <Button variant="outline" size="sm" className="flex-1 text-primary border-primary/40 hover:bg-primary/10"
                    disabled={ownerAction} onClick={() => handleStatusChange("available")}>
                    <Eye className="w-4 h-4" /> {t.unhide}
                  </Button>
                ) : listing.status !== "sold" && (
                  <Button variant="outline" size="sm" className="flex-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                    disabled={ownerAction} onClick={() => handleStatusChange("hidden")}>
                    <EyeOff className="w-4 h-4" /> {t.hide}
                  </Button>
                )}
                {(listing.status === "sold" || listing.status === "reserved") && (
                  <Button variant="outline" size="sm" className="flex-1"
                    disabled={ownerAction} onClick={() => handleStatusChange("available")}>
                    {t.relist}
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/create?edit=${id}`)}>
                  <Pencil className="w-4 h-4" /> {t.edit}
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={() => setShowDeleteConfirm(true)}>
                  <Trash2 className="w-4 h-4" /> {t.delete}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={handleSave} disabled={saved}>
                <Heart className={`w-4 h-4 ${saved ? "fill-primary text-primary" : ""}`} />
                {saved ? t.saved : t.save}
              </Button>
              <Button size="lg" className="flex-1" onClick={handleChat} disabled={chatting}>
                <MessageCircle className="w-4 h-4" />
                {chatting ? t.opening : t.messageSeller}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Delete confirm */}
      <Dialog open={showDeleteConfirm} onOpenChange={v => !v && setShowDeleteConfirm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteListingTitle}</DialogTitle>
            <DialogDescription>{t.deleteListingDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>{t.cancel}</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={ownerAction}>
              {ownerAction ? <Loader2 className="w-4 h-4 animate-spin" /> : t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SaveToCollectionSheet
        open={showSaveSheet}
        listing={listing ? { id: listing.id, title: listing.title } : null}
        userId={user?.id ?? ""}
        onClose={() => setShowSaveSheet(false)}
        onSaved={() => { setSaved(true); setShowSaveSheet(false); }}
      />

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={v => !v && setShowReportDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.reportListingTitle}</DialogTitle>
            <DialogDescription>{t.selectReason}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {REPORT_REASONS.map(r => (
                <button key={r.value} onClick={() => setReportReason(r.value)}
                  className={cn("px-3 py-1.5 rounded-xl border text-sm font-medium transition-all",
                    reportReason === r.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
                  {r.label}
                </button>
              ))}
            </div>
            <Textarea placeholder={t.additionalDetails} value={reportDetails} onChange={e => setReportDetails(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>{t.cancel}</Button>
            <Button onClick={handleSubmitReport} disabled={reportingSubmit}>{reportingSubmit ? t.submitting : t.submitReport}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen photo viewer */}
      <AnimatePresence>
        {viewerOpen && listing && listing.photos.length > 0 && (
          <PhotoViewer
            photos={listing.photos}
            initialIndex={viewerIndex}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
