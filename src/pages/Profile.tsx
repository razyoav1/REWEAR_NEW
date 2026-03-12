import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Star, Package, Heart, Plus, Loader2, ChevronRight, Edit2, Check, X, Camera, ShieldCheck, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { getInitials, displayPrice } from "@/lib/utils";
import { CONDITION_LABELS, type ListingCondition, type ListingStatus } from "@/types";
import { cn } from "@/lib/utils";
import { useFollows, type FollowUser } from "@/hooks/useFollows";
import { useAdmin } from "@/hooks/useAdmin";
import { useNotifications } from "@/contexts/NotificationsContext";
import imageCompression from "browser-image-compression";

interface MyListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  photos: string[];
  status: ListingStatus;
  condition: ListingCondition;
  created_at: string;
}

const STATUS_STYLES: Record<ListingStatus, string> = {
  available: "bg-secondary/20 text-secondary",
  reserved: "bg-yellow-500/20 text-yellow-400",
  sold: "bg-muted text-muted-foreground",
  hidden: "bg-destructive/20 text-destructive",
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [listings, setListings] = useState<MyListing[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [loadingListings, setLoadingListings] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "sold">("active");

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name ?? "");
  const [savingName, setSavingName] = useState(false);

  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(profile?.bio ?? "");
  const [savingBio, setSavingBio] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { followerCount, followingCount, fetchFollowers, fetchFollowing } = useFollows(user?.id);
  const { isAdmin } = useAdmin();
  const { unreadCount } = useNotifications();
  const [showFollowersSheet, setShowFollowersSheet] = useState(false);
  const [followersTab, setFollowersTab] = useState<"followers" | "following">("followers");

  const name = profile?.name ?? "You";

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoadingListings(true);
      const { data } = await supabase
        .from("clothing_listings")
        .select("id, title, price, currency, photos, status, condition, created_at")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      setListings((data as MyListing[]) ?? []);
      setLoadingListings(false);

      // Count all saved items across every collection (UNIQUE user_id,listing_id ensures no duplicates)
      const { count } = await supabase
        .from("wishlist_items").select("id", { count: "exact", head: true }).eq("user_id", user!.id);
      setSavedCount(count ?? 0);
    }
    load();
  }, [user]);

  async function saveName() {
    if (!user || !nameInput.trim()) return;
    setSavingName(true);
    const { error } = await supabase.from("users").update({ name: nameInput.trim() }).eq("id", user.id);
    if (error) { toast.error("Failed to save name"); } else { await refreshProfile(); setEditingName(false); toast.success(t.save); }
    setSavingName(false);
  }

  async function saveBio() {
    if (!user) return;
    setSavingBio(true);
    const { error } = await supabase.from("users").update({ bio: bioInput.trim() || null }).eq("id", user.id);
    if (error) { toast.error("Failed to save bio"); } else { await refreshProfile(); setEditingBio(false); toast.success("Bio updated!"); }
    setSavingBio(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 512, useWebWorker: true });
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, compressed, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const cacheBusted = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("users").update({ avatar_url: cacheBusted }).eq("id", user.id);
      await refreshProfile();
      toast.success("Avatar updated!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  const activeListings = listings.filter(l => l.status === "available" || l.status === "reserved" || l.status === "hidden");
  const soldListings = listings.filter(l => l.status === "sold");
  const displayedListings = activeTab === "active" ? activeListings : soldListings;

  const ratingAvg = profile?.rating_avg ?? 0;
  const ratingCount = profile?.rating_count ?? 0;
  const bio = profile?.bio;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center pl-5 pr-3 pt-14 pb-2">
        <h1 className="flex-1 text-2xl font-bold">{t.profile}</h1>
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <Settings className="w-5 h-5" />
        </Button>
        <button
          onClick={() => navigate("/notifications")}
          className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-0.5">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center px-5 pt-2 pb-6 gap-3">
        {/* Avatar with upload */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full p-0.5 bg-gradient-to-br from-primary to-secondary">
            <Avatar className="w-full h-full border-2 border-background">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl font-bold bg-muted">{getInitials(name)}</AvatarFallback>
            </Avatar>
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-lg hover:bg-primary/90 transition-colors"
          >
            {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Name */}
        <div className="flex flex-col items-center gap-1">
          <AnimatePresence mode="wait">
            {editingName ? (
              <motion.div key="edit-name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <Input value={nameInput} onChange={e => setNameInput(e.target.value)}
                  className="text-center font-bold text-lg h-9 w-44" autoFocus onKeyDown={e => e.key === "Enter" && saveName()} />
                <button onClick={saveName} disabled={savingName} className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                  {savingName ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Check className="w-4 h-4 text-white" />}
                </button>
                <button onClick={() => { setEditingName(false); setNameInput(profile?.name ?? ""); }}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div key="display-name" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <h2 className="text-2xl font-black tracking-tight">{name}</h2>
                <button onClick={() => { setEditingName(true); setNameInput(name); }} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          <p className="text-muted-foreground text-sm">@{name.toLowerCase().replace(/\s+/g, "")}</p>

          {/* Bio */}
          <AnimatePresence mode="wait">
            {editingBio ? (
              <motion.div key="edit-bio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-2 w-full max-w-xs mt-1">
                <Textarea value={bioInput} onChange={e => setBioInput(e.target.value)} placeholder="A short bio…" className="text-center text-sm min-h-[60px]" maxLength={160} />
                <div className="flex gap-2">
                  <button onClick={saveBio} disabled={savingBio} className="px-4 py-1.5 rounded-full bg-primary text-white text-sm font-semibold">
                    {savingBio ? t.saving : t.save}
                  </button>
                  <button onClick={() => { setEditingBio(false); setBioInput(bio ?? ""); }} className="px-4 py-1.5 rounded-full bg-muted text-sm font-semibold">
                    {t.cancel}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="display-bio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 mt-1">
                {bio ? (
                  <p className="text-sm text-muted-foreground max-w-xs text-center">{bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground/60 italic">{t.addBio}</p>
                )}
                <button onClick={() => { setEditingBio(true); setBioInput(bio ?? ""); }} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0">
                  <Edit2 className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Followers / Following */}
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

        {/* Stats row */}
        <div className="flex items-stretch gap-3 w-full max-w-xs">
          <StatPill icon={<Package className="w-4 h-4" />} value={activeListings.length} label={t.listings} />
          <StatPill
            icon={<Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
            value={ratingCount > 0 ? ratingAvg.toFixed(1) : "—"}
            label={ratingCount > 0 ? `${ratingCount} ${t.reviews}` : t.noReviewsLabel}
            onClick={() => navigate("/my-reviews")}
          />
          <button onClick={() => navigate("/wishlist")}>
            <StatPill icon={<Heart className="w-4 h-4" />} value={savedCount} label={t.savedItems} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full max-w-xs">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/create")}>
            <Plus className="w-4 h-4" /> {t.sellItem}
          </Button>
        </div>
      </motion.div>

      {/* Quick links */}
      <div className="px-5 space-y-2 mb-6">
        {[
          { label: t.messages, to: "/messages" },
        ].map(link => (
          <button key={link.to} onClick={() => navigate(link.to)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-card border border-border hover:bg-muted/50 transition-colors">
            <span className="font-medium text-sm">{link.label}</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
        {isAdmin && (
          <button onClick={() => navigate("/admin")}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm text-primary">{t.adminPanel}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-primary" />
          </button>
        )}
      </div>

      {/* Listings tabs */}
      <div className="px-5">
        <div className="flex border-b border-border mb-4">
          {(["active", "sold"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("flex-1 py-2.5 text-sm font-semibold transition-colors capitalize",
                activeTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground")}>
              {tab === "active" ? `${t.activeTab} (${activeListings.length})` : `${t.soldTab} (${soldListings.length})`}
            </button>
          ))}
        </div>

        {loadingListings ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="w-full aspect-square rounded-xl" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : displayedListings.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-muted-foreground text-sm mb-3">{activeTab === "active" ? t.noActiveListings : t.nothingSold}</p>
            {activeTab === "active" && (
              <Button size="sm" onClick={() => navigate("/create")}><Plus className="w-4 h-4" /> {t.createListingBtn}</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayedListings.map((listing, i) => (
              <motion.div key={listing.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <button onClick={() => navigate(`/listings/${listing.id}`)}
                  className="w-full text-left rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all">
                  <div className="relative aspect-square bg-muted">
                    {listing.photos[0] ? (
                      <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                    )}
                    {listing.status !== "available" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className={cn("rotate-[-20deg] px-3 py-1 rounded-lg border-2 font-black text-sm uppercase tracking-widest select-none",
                          listing.status === "sold" ? "bg-black/60 border-white/80 text-white"
                          : listing.status === "reserved" ? "bg-yellow-500/70 border-yellow-300 text-white"
                          : "bg-black/70 border-destructive text-destructive"
                        )}>
                          {listing.status}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="font-semibold text-sm truncate">{listing.title}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-primary font-bold text-sm">{displayPrice(listing.price, listing.currency, profile?.currency ?? "USD")}</p>
                      <p className="text-[10px] text-muted-foreground">{CONDITION_LABELS[listing.condition]}</p>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Followers / Following sheet */}
      {user && (
        <FollowersSheet
          open={showFollowersSheet}
          onClose={() => setShowFollowersSheet(false)}
          userId={user.id}
          tab={followersTab}
          fetchFollowers={fetchFollowers}
          fetchFollowing={fetchFollowing}
        />
      )}
    </div>
  );
}

function FollowersSheet({
  open, onClose, userId, tab, fetchFollowers, fetchFollowing,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  tab: "followers" | "following";
  fetchFollowers: () => Promise<FollowUser[]>;
  fetchFollowing: () => Promise<FollowUser[]>;
}) {
  const navigate = useNavigate();
  const { t } = useLanguage();
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
        <DialogHeader><DialogTitle>{tab === "followers" ? t.followers : t.following}</DialogTitle></DialogHeader>
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

function StatPill({ icon, value, label, onClick }: { icon: React.ReactNode; value: string | number; label: string; onClick?: () => void }) {
  const cls = "flex-1 flex flex-col items-center gap-0.5 py-3 px-2 rounded-2xl bg-card border border-border";
  const inner = (
    <>
      <div className="text-primary">{icon}</div>
      <span className="font-black text-lg leading-tight">{value}</span>
      <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
    </>
  );
  return onClick ? (
    <button onClick={onClick} className={cn(cls, "hover:border-primary/40 transition-colors")}>{inner}</button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}
