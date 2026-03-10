import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Rss } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { displayPrice } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface ActivityListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  photos: string[];
  created_at: string;
  seller_id: string;
  seller_name: string;
  seller_avatar?: string;
}

export default function Activity() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t, isRTL } = useLanguage();

  const [listings, setListings] = useState<ActivityListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [noFollows, setNoFollows] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);

      // Get who the current user follows
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user!.id);

      const ids = (follows ?? []).map((f: { following_id: string }) => f.following_id);
      if (!ids.length) {
        setNoFollows(true);
        setLoading(false);
        return;
      }

      // Fetch their recent available listings
      const { data: rows } = await supabase
        .from("clothing_listings")
        .select("id, title, price, currency, photos, created_at, seller_id")
        .in("seller_id", ids)
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(60);

      if (!rows?.length) { setListings([]); setLoading(false); return; }

      // Batch-fetch seller info
      const sellerIds = [...new Set(rows.map((r: { seller_id: string }) => r.seller_id))];
      const { data: sellers } = await supabase
        .from("users")
        .select("id, name, avatar_url")
        .in("id", sellerIds);

      const sellerMap: Record<string, { name: string; avatar_url?: string }> = {};
      (sellers ?? []).forEach((s: { id: string; name: string; avatar_url?: string }) => {
        sellerMap[s.id] = s;
      });

      setListings(rows.map((r: { id: string; title: string; price: number; currency: string; photos: string[]; created_at: string; seller_id: string }) => ({
        id: r.id,
        title: r.title,
        price: r.price,
        currency: r.currency,
        photos: r.photos ?? [],
        created_at: r.created_at,
        seller_id: r.seller_id,
        seller_name: sellerMap[r.seller_id]?.name ?? "Unknown",
        seller_avatar: sellerMap[r.seller_id]?.avatar_url,
      })));
      setLoading(false);
    }
    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-border">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </button>
        <h1 className="text-xl font-bold flex-1">{t.activityTitle}</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 p-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border">
              <Skeleton className="aspect-square w-full" />
              <div className="p-2.5 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : noFollows || listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-24 text-center gap-4">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center"
          >
            <Rss className="w-8 h-8 text-primary" />
          </motion.div>
          <div>
            <p className="font-semibold text-base mb-1">{t.activityEmpty}</p>
            <p className="text-muted-foreground text-sm">{t.activityEmptyHint}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-5">
          {listings.map((listing, i) => (
            <motion.button
              key={listing.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => navigate(`/listings/${listing.id}`)}
              className="rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/40 transition-all text-left"
            >
              {/* Photo */}
              <div className="relative aspect-square bg-muted overflow-hidden">
                {listing.photos[0] ? (
                  <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                )}
                {/* Seller chip */}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full pl-0.5 pr-2 py-0.5">
                  <Avatar className="w-5 h-5 shrink-0">
                    <AvatarImage src={listing.seller_avatar} />
                    <AvatarFallback className="text-[8px] font-bold bg-primary/30 text-primary">
                      {listing.seller_name[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white text-[10px] font-semibold truncate max-w-[70px]">{listing.seller_name}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5">
                <p className="text-sm font-semibold leading-tight truncate">{listing.title}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-primary font-black text-base">
                    {displayPrice(listing.price, listing.currency, profile?.currency ?? "USD")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
