import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Send, Loader2, MoreVertical, Flag, Ban, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";
import { cn, displayPrice } from "@/lib/utils";
import { useBlocks } from "@/hooks/useBlocks";
import { useReports, REPORT_REASONS } from "@/hooks/useReports";
import { useReviews } from "@/hooks/useReviews";
import { Star } from "lucide-react";

interface OtherUser { id: string; name: string; avatarUrl?: string; }
interface ChatListing { id: string; title: string; photos: string[]; price: number; currency: string; status: string; }
interface Message { id: string; senderId: string; body: string; createdAt: Date; }

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(s => (
        <button key={s} type="button" onClick={() => onChange(s)} className="hover:scale-110 transition-transform active:scale-95">
          <Star className={cn("w-7 h-7", s <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
        </button>
      ))}
    </div>
  );
}

export default function ChatThread() {
  const { id: conversationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t, isRTL } = useLanguage();

  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [listing, setListing] = useState<ChatListing | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Report
  const { submitReport } = useReports();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("scam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportingSubmit, setReportingSubmit] = useState(false);

  // Block
  const { blockUser } = useBlocks();
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blocking, setBlocking] = useState(false);

  // Review
  const { createReview, updateReview, getExistingReview, checkCanReview } = useReviews(otherUser?.id);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [canReview, setCanReview] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mark as read when opened/new messages arrive
  useEffect(() => {
    if (conversationId) localStorage.setItem(`rewear_read_${conversationId}`, new Date().toISOString());
  }, [conversationId, messages.length]);

  useEffect(() => {
    if (!conversationId || !user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: conv } = await supabase.from("conversations").select("*").eq("id", conversationId).single();
      if (cancelled) return;
      if (!conv) { setLoading(false); return; }
      const otherId = conv.buyer_id === user!.id ? conv.seller_id : conv.buyer_id;
      const { data: otherUserRow } = await supabase.from("users").select("id, name, avatar_url").eq("id", otherId).single();
      if (cancelled) return;
      if (otherUserRow) setOtherUser({ id: otherUserRow.id, name: otherUserRow.name, avatarUrl: otherUserRow.avatar_url });
      if (conv.listing_id) {
        const { data: listingRow } = await supabase.from("clothing_listings")
          .select("id, title, photos, price, currency, status").eq("id", conv.listing_id).single();
        if (!cancelled && listingRow) setListing({ id: listingRow.id, title: listingRow.title, photos: listingRow.photos ?? [], price: parseFloat(listingRow.price), currency: listingRow.currency, status: listingRow.status });
      }
      // Limit to last 100 messages to avoid loading entire long conversations
      const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(100);
      if (cancelled) return;
      setMessages((msgs ?? []).map(mapMessage));
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [conversationId, user]);

  // Check review eligibility — keep these separate to avoid getExistingReview overriding checkCanReview(false)
  useEffect(() => {
    if (!otherUser?.id || !user?.id) return;
    checkCanReview(otherUser.id).then(can => setCanReview(can));
  }, [otherUser?.id, user?.id, checkCanReview]);

  useEffect(() => {
    if (!otherUser?.id || !user?.id) return;
    getExistingReview(otherUser.id).then(existing => {
      if (existing) {
        setExistingReviewId(existing.id ?? null);
        setIsEditingReview(true);
        setReviewRating(existing.rating ?? 5);
        setReviewText(existing.text ?? "");
        // Only allow editing an existing review — don't re-enable canReview if checkCanReview said false
      }
    });
  }, [otherUser?.id, user?.id, getExistingReview]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase.channel(`messages:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const msg = mapMessage(payload.new as Record<string, unknown>);
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function mapMessage(row: Record<string, unknown>): Message {
    return { id: row.id as string, senderId: row.sender_id as string, body: row.body as string, createdAt: new Date(row.created_at as string) };
  }

  async function handleSend() {
    if (!messageText.trim() || !conversationId || !user) return;
    setSending(true);
    const body = messageText.trim();
    setMessageText("");
    // Optimistic update — show immediately without waiting for realtime
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = { id: tempId, senderId: user.id, body, createdAt: new Date() };
    setMessages(prev => [...prev, optimistic]);
    try {
      const { data, error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: user.id, body }).select("id").single();
      if (error) {
        toast.error("Failed to send message");
        setMessageText(body);
        setMessages(prev => prev.filter(m => m.id !== tempId));
      } else if (data) {
        // Replace temp with real ID so realtime dedup works correctly
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m));
      }
    } finally { setSending(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function formatTime(date: Date) {
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return "Yesterday " + format(date, "h:mm a");
    return format(date, "MMM d, h:mm a");
  }

  async function handleOpenReview() {
    if (!otherUser?.id) return;
    const existing = await getExistingReview(otherUser.id);
    if (existing) {
      setExistingReviewId(existing.id); setReviewRating(existing.rating); setReviewText(existing.text); setIsEditingReview(true);
    } else {
      setExistingReviewId(null); setReviewRating(5); setReviewText(""); setIsEditingReview(false);
    }
    setShowMenu(false);
    setShowReviewDialog(true);
  }

  async function handleSubmitReview() {
    if (!otherUser?.id) return;
    if (isEditingReview && existingReviewId) {
      await updateReview({ reviewId: existingReviewId, rating: reviewRating, text: reviewText });
    } else {
      await createReview({ revieweeId: otherUser.id, rating: reviewRating, text: reviewText });
    }
    setShowReviewDialog(false);
  }

  async function handleSubmitReport() {
    if (!conversationId) return;
    setReportingSubmit(true);
    await submitReport({ entityType: "conversation", entityId: conversationId, reason: reportReason, details: reportDetails });
    setReportingSubmit(false); setShowReportDialog(false); setReportDetails("");
  }

  async function handleBlock() {
    if (!otherUser) return;
    setBlocking(true);
    const ok = await blockUser(otherUser.id, otherUser.name);
    setBlocking(false);
    if (ok) { setShowBlockDialog(false); navigate("/messages"); }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <button onClick={() => navigate("/messages")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
            {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </button>

          {loading ? (
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-9 h-9 rounded-full" /><Skeleton className="h-4 w-28" />
            </div>
          ) : (
            <button onClick={() => otherUser && navigate(`/users/${otherUser.id}`)} className="flex items-center gap-3 flex-1 text-left">
              <Avatar className="w-9 h-9 border border-border">
                <AvatarImage src={otherUser?.avatarUrl} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">{otherUser?.name[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{otherUser?.name ?? "…"}</p>
                {listing && <p className="text-xs text-muted-foreground truncate">{listing.title}</p>}
              </div>
            </button>
          )}

          {/* Menu */}
          {!loading && otherUser && (
            <div className="relative">
              <button onClick={() => setShowMenu(s => !s)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-11 z-50 w-44 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                  {canReview && (
                    <button onClick={handleOpenReview} className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-muted/50 transition-colors text-left">
                      <PenLine className="w-4 h-4 text-muted-foreground" /> {existingReviewId ? t.editReview : t.writeReview}
                    </button>
                  )}
                  <button onClick={() => { setShowMenu(false); setShowReportDialog(true); }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-muted/50 transition-colors text-left">
                    <Flag className="w-4 h-4 text-muted-foreground" /> {t.reportConversation}
                  </button>
                  <button onClick={() => { setShowMenu(false); setShowBlockDialog(true); }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left">
                    <Ban className="w-4 h-4" /> {t.block} {otherUser.name.split(" ")[0]}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {listing && (
          <>
            {(listing.status === "sold" || listing.status === "hidden" || listing.status === "reserved") && (
              <div className={cn("px-4 py-2 text-xs font-semibold text-center border-t border-border",
                listing.status === "sold" ? "bg-muted/80 text-muted-foreground" :
                listing.status === "hidden" ? "bg-destructive/10 text-destructive" :
                "bg-yellow-500/10 text-yellow-400")}>
                {listing.status === "sold" ? t.itemSold :
                 listing.status === "hidden" ? t.listingUnavailable :
                 t.itemReserved}
              </div>
            )}
            <button onClick={() => navigate(`/listings/${listing.id}`)}
              className="w-full flex items-center gap-3 px-4 py-2.5 bg-muted/60 border-t border-border hover:bg-muted transition-colors text-left">
              {listing.photos[0] && <img src={listing.photos[0]} alt={listing.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{listing.title}</p>
                <p className="text-sm font-bold text-primary">{displayPrice(listing.price, listing.currency, profile?.currency ?? "USD")}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{t.viewListing}</span>
            </button>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" onClick={() => setShowMenu(false)}>
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12"><p className="text-muted-foreground text-sm">{t.sayHello}</p></div>
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.senderId === user?.id;
            const showAvatar = !isOwn && (i === 0 || messages[i - 1].senderId !== msg.senderId);
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={cn("flex items-end gap-2", isOwn && "justify-end")}>
                {!isOwn && (
                  <div className="w-7 shrink-0">
                    {showAvatar && otherUser && (
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={otherUser.avatarUrl} />
                        <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-bold">{otherUser.name[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                )}
                <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5", isOwn ? "bg-primary text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                  <p className="text-sm whitespace-pre-wrap break-words" dir="auto">{msg.body}</p>
                  <p className={cn("text-[10px] mt-1", isOwn ? "text-white/60" : "text-muted-foreground")}>{formatTime(msg.createdAt)}</p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-border bg-background/95 backdrop-blur-sm"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        <Input placeholder={t.messagePlaceholder} value={messageText} onChange={e => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown} disabled={sending} className="flex-1" />
        <Button size="icon" onClick={handleSend} disabled={!messageText.trim() || sending} className="shrink-0">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={v => !v && setShowReviewDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingReview ? t.editReviewTitle : `${t.writeReview} ${otherUser?.name}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold mb-2">{t.rating}</p><StarRating value={reviewRating} onChange={setReviewRating} /></div>
            <div>
              <p className="text-sm font-semibold mb-2">{t.reviewLabel} <span className="text-muted-foreground font-normal">{t.optional}</span></p>
              <Textarea placeholder={t.shareExperience} value={reviewText} onChange={e => setReviewText(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>{t.cancel}</Button>
            <Button onClick={handleSubmitReview}>{isEditingReview ? t.update : t.submit}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={v => !v && setShowReportDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.reportConversationTitle}</DialogTitle>
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
            <DialogTitle>{t.blockTitle} {otherUser?.name}?</DialogTitle>
            <DialogDescription>{t.cantMessageAnymore}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>{t.cancel}</Button>
            <Button variant="destructive" onClick={handleBlock} disabled={blocking}>{blocking ? t.blocking : t.block}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
