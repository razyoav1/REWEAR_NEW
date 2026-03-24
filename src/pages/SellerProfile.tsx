import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Star, Package, MessageCircle, UserPlus, UserMinus,
  PenLine, Flag, Ban, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { getInitials, displayPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CONDITION_LABELS, type ListingCondition } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { useFollows, type FollowUser } from "@/hooks/useFollows";
import { useReviews } from "@/hooks/useReviews";
import { useBlocks } from "@/hooks/useBlocks";
import { useReports, REPORT_REASONS } from "@/hooks/useReports";

interface SellerUser {
  id: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  rating_avg?: number;
  rating_count?: number;
  created_at: string;
}

interface SellerListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  photos: string[];
  condition: ListingCondition;
  brand?: string;
  size_value?: string;
  status: string;
  created_at: string;
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onClick={() => onChange?.(s)}
          className={cn("transition-transform", onChange && "hover:scale-110 active:scale-95")}>
          <Star className={cn("w-7 h-7", s <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review, onReport }: { review: ReturnType<typeof useReviews>["reviews"][0]; onReport?: (id: string) => void }) {
  return (
    <div className="flex gap-3 py-3 border-b border-border last:border-0">
      <Avatar className="w-9 h-9 shrink-0">
        <AvatarImage src={review.reviewer_avatar ?? undefined} />
        <AvatarFallback className="text-xs bg-muted">{getInitials(review.reviewer_name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm">{review.reviewer_name}</span>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</span>
            {onReport && (
              <button onClick={() => onReport(review.id)} className="text-muted-foreground/40 hover:text-destructive transition-colors" title="Report review">
                <Flag className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-0.5 my-0.5">
          {[1, 2, 3, 4, 5].map(s => <Star key={s} className={cn("w-3 h-3", s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />)}
        </div>
        {review.text && <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{review.text}</p>}
      </div>
    </div>
  );
}

function FollowersSheet({
  open, onClose, userId, tab,
}: { open: boolean; onClose: () => void; userId: string; tab: "followers" | "following" }) {
  const { fetchFollowers, fetchFollowing } = useFollows(userId);
  const navigate = useNavigate();
  const [list, setList] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const fn = tab === "followers" ? fetchFollowers : fetchFollowing;
    fn().then(data => { setList(data); setLoading(false); });
  }, [open, tab, fetchFollowers, fetchFollowing]);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-h-[70vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{tab === "followers" ? "Followers" : "Following"}</DialogTitle></DialogHeader>
        {loading ? (
          <div className="space-y-3 py-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
        ) : list.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No {tab} yet.</p>
        ) : (
          <div className="space-y-2">
            {list.map(u => (
              <button key={u.id} onClick={() => { onClose(); navigate(`/users/${u.id}`); }}
                className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-muted/50 transition-colors text-left">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={u.avatar_url ?? undefined} />
                  <AvatarFallback className="text-sm bg-muted">{getInitials(u.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{u.name}</p>
                  {(u.rating_count ?? 0) > 0 && (
                    <p className="text-[10px] text-muted-foreground">★ {(u.rating_avg ?? 0).toFixed(1)}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function SellerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t, isRTL } = useLanguage();

  const [seller, setSeller] = useState<SellerUser | null>(null);
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatting, setChatting] = useState(false);

  const { isFollowing, isToggling, followerCount, followingCount, toggleFollow, isLoading: followLoading } = useFollows(id);
  const { reviews, ratingStats, isLoading: reviewsLoading, createReview, updateReview, deleteReview, getExistingReview, checkCanReview, refetch: refetchReviews } = useReviews(id);
  const { blockUser } = useBlocks();
  const { submitReport } = useReports();

  const [showFollowersSheet, setShowFollowersSheet] = useState(false);
  const [followersTab, setFollowersTab] = useState<"followers" | "following">("followers");
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewIsEditable, setReviewIsEditable] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [showDeleteReviewDialog, setShowDeleteReviewDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("scam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportingSubmit, setReportingSubmit] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reviewReportReason, setReviewReportReason] = useState("inappropriate");
  const [reviewReportDetails, setReviewReportDetails] = useState("");
  const [submittingReviewReport, setSubmittingReviewReport] = useState(false);

  const isOwnProfile = user?.id === id;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      const { data: sellerRow } = await supabase
        .from("users").select("id, name, avatar_url, rating_avg, rating_count, created_at")
        .eq("id", id).single();
      if (sellerRow) setSeller(sellerRow as SellerUser);
      const { data: listingRows } = await supabase
        .from("clothing_listings")
        .select("id, title, price, currency, photos, condition, brand, size_value, status, created_at")
        .eq("seller_id", id).in("status", ["available", "reserved", "sold"])
        .order("created_at", { ascending: false });
      setListings((listingRows as SellerListing[]) ?? []);
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!id || isOwnProfile || !user?.id) return;
    checkCanReview(id).then(can => setCanReview(can));
    getExistingReview(id).then(existing => { if (existing) setCanReview(true); });
  }, [id, isOwnProfile, user?.id]);

  async function handleMessage() {
    if (!user || !seller) return;
    if (isOwnProfile) { navigate("/messages"); return; }
    setChatting(true);
    try {
      const { data: existing } = await supabase
        .from("conversations").select("id")
        .eq("buyer_id", user.id).eq("seller_id", seller.id).is("listing_id", null).maybeSingle();
      let convId = existing?.id;
      if (!convId) {
        const { data: created, error } = await supabase
          .from("conversations").insert({ buyer_id: user.id, seller_id: seller.id, listing_id: null })
          .select("id").single();
        if (error) { toast.error(t.cantStartChat); return; }
        convId = created?.id;
      }
      if (convId) navigate(`/messages/${convId}`);
    } finally { setChatting(false); }
  }

  async function handleOpenReviewDialog() {
    if (!id) return;
    const existing = await getExistingReview(id);
    if (existing) {
      setExistingReviewId(existing.id);
      setReviewRating(existing.rating);
      setReviewText(existing.text);
      setIsEditingReview(true);
      setReviewIsEditable(existing.isEditable);
    } else {
      setExistingReviewId(null); setReviewRating(5); setReviewText("");
      setIsEditingReview(false); setReviewIsEditable(true);
    }
    setShowReviewDialog(true);
  }

  async function handleSubmitReview() {
    if (!id) return;
    if (isEditingReview && existingReviewId) {
      if (!reviewIsEditable) { setShowReviewDialog(false); return; }
      await updateReview({ reviewId: existingReviewId, rating: reviewRating, text: reviewText });
    } else {
      await createReview({ revieweeId: id, rating: reviewRating, text: reviewText });
    }
    setShowReviewDialog(false);
    refetchReviews();
  }

  async function handleDeleteReview() {
    if (!existingReviewId) return;
    const ok = await deleteReview(existingReviewId);
    if (ok) { setShowDeleteReviewDialog(false); setShowReviewDialog(false); setExistingReviewId(null); refetchReviews(); }
  }

  async function handleSubmitReport() {
    setReportingSubmit(true);
    await submitReport({ entityType: "user", entityId: id!, reason: reportReason, details: reportDetails });
    setReportingSubmit(false); setShowReportDialog(false); setReportDetails("");
  }

  async function handleBlock() {
    if (!id || !seller) return;
    setBlocking(true);
    const ok = await blockUser(id, seller.name);
    setBlocking(false);
    if (ok) { setShowBlockDialog(false); navigate(-1); }
  }

  const memberSince = seller?.created_at ? formatDistanceToNow(new Date(seller.created_at), { addSuffix: true }) : null;
  const availableCount = listings.filter(l => l.status === "available").length;
  const soldCount = listings.filter(l => l.status === "sold").length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </button>
        <h1 className="text-lg font-bold">{loading ? "Profile" : (seller?.name ?? "Seller")}</h1>
      </div>

      {loading ? (
        <div className="flex flex-col items-center px-5 pt-8 gap-4">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-2 gap-3 w-full mt-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
          </div>
        </div>
      ) : !seller ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground">{t.userNotFound}</p>
          <Button variant="outline" onClick={() => navigate(-1)}>{t.goBack}</Button>
        </div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center px-5 pt-6 pb-4 gap-3">
            <div className="w-24 h-24 rounded-full p-0.5 bg-gradient-to-br from-primary to-secondary">
              <Avatar className="w-full h-full border-2 border-background">
                <AvatarImage src={seller.avatar_url} />
                <AvatarFallback className="text-xl font-bold bg-muted">{getInitials(seller.name)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black tracking-tight">{seller.name}</h2>
              {memberSince && <p className="text-muted-foreground text-xs mt-0.5">{t.memberSince} {memberSince}</p>}
              {seller.bio && <p className="text-sm text-muted-foreground mt-1 max-w-xs">{seller.bio}</p>}
            </div>

            {/* Followers / Following counts */}
            <div className="flex gap-6">
              <button onClick={() => { setFollowersTab("followers"); setShowFollowersSheet(true); }}
                className="flex flex-col items-center hover:opacity-70 transition-opacity">
                <span className="font-black text-lg leading-tight">{followerCount}</span>
                <span className="text-[10px] text-muted-foreground">{t.followers}</span>
              </button>
              <button onClick={() => { setFollowersTab("following"); setShowFollowersSheet(true); }}
                className="flex flex-col items-center hover:opacity-70 transition-opacity">
                <span className="font-black text-lg leading-tight">{followingCount}</span>
                <span className="text-[10px] text-muted-foreground">{t.following}</span>
              </button>
            </div>

            {/* Stats pills */}
            <div className="flex items-stretch gap-3 w-full">
              {[
                { icon: <Package className="w-4 h-4 text-primary" />, value: availableCount, label: t.forSale },
                { icon: <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />, value: ratingStats.count > 0 ? ratingStats.avg.toFixed(1) : "—", label: ratingStats.count > 0 ? `${ratingStats.count} ${t.reviews}` : t.noReviewsLabel },
                { icon: <Package className="w-4 h-4 text-muted-foreground" />, value: soldCount, label: t.soldCount },
              ].map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-2xl bg-card border border-border">
                  {s.icon}
                  <span className="font-black text-base leading-tight">{s.value}</span>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">{s.label}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            {!isOwnProfile ? (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex gap-2">
                  <Button variant={isFollowing ? "outline" : "default"} className="flex-1"
                    onClick={toggleFollow} disabled={isToggling || followLoading}>
                    {isFollowing ? <><UserMinus className="w-4 h-4" /> {t.unfollow}</> : <><UserPlus className="w-4 h-4" /> {t.follow}</>}
                  </Button>
                  <Button className="flex-1" onClick={handleMessage} disabled={chatting}>
                    <MessageCircle className="w-4 h-4" />
                    {chatting ? "Opening…" : `Message ${seller.name.split(" ")[0]}`}
                  </Button>
                </div>
                <Button variant="outline" className="w-full" onClick={handleOpenReviewDialog}
                  disabled={!canReview && !existingReviewId}>
                  <PenLine className="w-4 h-4" />
                  {existingReviewId ? t.editYourReview : t.writeAReview}
                </Button>
                {!canReview && !existingReviewId && (
                  <p className="text-xs text-muted-foreground text-center">{t.messageFirst}</p>
                )}
              </div>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => navigate("/profile")}>{t.viewMyProfile}</Button>
            )}
          </motion.div>

          <div className="px-5">
            <Tabs defaultValue="listings">
              <TabsList>
                <TabsTrigger value="listings">{t.listingsTab} ({listings.length})</TabsTrigger>
                <TabsTrigger value="reviews">{t.reviewsTab} ({ratingStats.count})</TabsTrigger>
              </TabsList>

              <TabsContent value="listings">
                {listings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">{t.noListingsYet}</div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {listings.map((listing, i) => (
                      <motion.div key={listing.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <button onClick={() => navigate(`/listings/${listing.id}`)}
                          className="w-full text-left rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all">
                          <div className="relative aspect-[3/4] bg-muted">
                            {listing.photos[0] ? (
                              <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                            )}
                            {listing.status !== "available" && (
                              <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-muted/80 text-muted-foreground">
                                {listing.status}
                              </span>
                            )}
                          </div>
                          <div className="p-2.5">
                            {listing.brand && <p className="text-[10px] text-muted-foreground truncate">{listing.brand}</p>}
                            <p className="font-semibold text-sm truncate">{listing.title}</p>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-primary font-black text-base">{displayPrice(listing.price, listing.currency, profile?.currency ?? "USD")}</p>
                              <p className="text-[10px] text-muted-foreground">{CONDITION_LABELS[listing.condition]}</p>
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews">
                {reviewsLoading ? (
                  <div className="space-y-3 mt-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">{t.noReviewsTabYet}</div>
                ) : (
                  <div className="mt-3">{reviews.map(r => (
                    <ReviewCard key={r.id} review={r}
                      onReport={!isOwnProfile && r.reviewer_id !== user?.id ? (reviewId) => {
                        setReportingReviewId(reviewId);
                        setReviewReportReason("inappropriate");
                        setReviewReportDetails("");
                      } : undefined}
                    />
                  ))}</div>
                )}
              </TabsContent>
            </Tabs>

            {!isOwnProfile && (
              <div className="flex justify-center gap-6 py-6">
                <button onClick={() => setShowReportDialog(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
                  <Flag className="w-3.5 h-3.5" /> {t.reportUser}
                </button>
                <button onClick={() => setShowBlockDialog(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors">
                  <Ban className="w-3.5 h-3.5" /> {t.blockUser}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Followers/Following sheet */}
      {id && <FollowersSheet open={showFollowersSheet} onClose={() => setShowFollowersSheet(false)} userId={id} tab={followersTab} />}

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={v => !v && setShowReviewDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingReview ? t.yourReview : `${t.writeAReview} — ${seller?.name ?? ""}`}</DialogTitle>
          </DialogHeader>
          {isEditingReview && !reviewIsEditable ? (
            <div className="py-2 space-y-1">
              <p className="text-sm text-muted-foreground">{t.reviewNotEditable}</p>
              <p className="text-xs text-muted-foreground">{t.canDeleteIt}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div><p className="text-sm font-semibold mb-2">{t.rating}</p><StarRating value={reviewRating} onChange={setReviewRating} /></div>
              <div>
                <p className="text-sm font-semibold mb-2">{t.reviewLabel} <span className="text-muted-foreground font-normal">{t.optional}</span></p>
                <Textarea placeholder={t.shareExperience} value={reviewText} onChange={e => setReviewText(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            {isEditingReview && (
              <Button variant="ghost" className="text-destructive mr-auto" onClick={() => setShowDeleteReviewDialog(true)}>
                <Trash2 className="w-4 h-4" /> {t.delete}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>{t.cancel}</Button>
            {(!isEditingReview || reviewIsEditable) && (
              <Button onClick={handleSubmitReview}>{isEditingReview ? t.update : t.submit}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Review Confirm */}
      <Dialog open={showDeleteReviewDialog} onOpenChange={v => !v && setShowDeleteReviewDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.deleteReviewTitle}</DialogTitle>
            <DialogDescription>{t.deleteReviewDesc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteReviewDialog(false)}>{t.cancel}</Button>
            <Button variant="destructive" onClick={handleDeleteReview}>{t.delete}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={v => !v && setShowReportDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.reportUser} — {seller?.name}</DialogTitle>
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

      {/* Block Confirm */}
      <Dialog open={showBlockDialog} onOpenChange={v => !v && setShowBlockDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.blockTitle} {seller?.name}?</DialogTitle>
            <DialogDescription>{t.cantSeeListings}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>{t.cancel}</Button>
            <Button variant="destructive" onClick={handleBlock} disabled={blocking}>{blocking ? t.blocking : t.blockUserBtn}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Review Dialog */}
      <Dialog open={!!reportingReviewId} onOpenChange={v => !v && setReportingReviewId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.reportReviewTitle}</DialogTitle>
            <DialogDescription>{t.guidelinesViolation}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {REPORT_REASONS.map(r => (
                <button key={r.value} onClick={() => setReviewReportReason(r.value)}
                  className={cn("px-3 py-1.5 rounded-xl border text-sm font-medium transition-all",
                    reviewReportReason === r.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
                  {r.label}
                </button>
              ))}
            </div>
            <Textarea placeholder={t.additionalDetails} value={reviewReportDetails} onChange={e => setReviewReportDetails(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportingReviewId(null)}>{t.cancel}</Button>
            <Button
              disabled={submittingReviewReport}
              onClick={async () => {
                if (!reportingReviewId) return;
                setSubmittingReviewReport(true);
                await submitReport({ entityType: "review", entityId: reportingReviewId, reason: reviewReportReason, details: reviewReportDetails });
                setSubmittingReviewReport(false);
                setReportingReviewId(null);
              }}
            >
              {submittingReviewReport ? t.submitting : t.submitReport}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
