import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn, displayPrice } from "@/lib/utils";

interface ListingRow {
  id: string;
  title: string;
  price: number;
  currency: string;
  photos: string[];
  status: string;
}

interface SeenRow {
  listing_id: string;
  seen_date: string;
  listing: ListingRow | ListingRow[] | null;
}

function getListingRow(listing: ListingRow | ListingRow[] | null): ListingRow | null {
  if (!listing) return null;
  if (Array.isArray(listing)) return listing[0] ?? null;
  return listing;
}

export default function RecentlySeen() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t, isRTL } = useLanguage();
  const [items, setItems] = useState<SeenRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayStr = todayStart.toISOString();

      // Delete rows older than today
      await supabase
        .from("recently_seen")
        .delete()
        .eq("user_id", user!.id)
        .lt("seen_date", todayStr);

      const { data } = await supabase
        .from("recently_seen")
        .select("listing_id, seen_date, listing:listing_id(id, title, price, currency, photos, status)")
        .eq("user_id", user!.id)
        .gte("seen_date", todayStr)
        .order("seen_date", { ascending: false })
        .limit(60);
      setItems((data as unknown as SeenRow[]) ?? []);
      setLoading(false);
    }
    load();
  }, [user]);

  const visible = items.filter(i => {
    const l = getListingRow(i.listing);
    return l && l.status !== "hidden";
  });

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <BackIcon className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{t.recentlySeenTitle}</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 px-5 pt-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-[3/4] rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <Eye className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-bold mb-1">{t.nothingSeenYet}</h2>
          <p className="text-muted-foreground text-sm">{t.viewOnDiscover}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5 pt-5">
          {visible.map((item, i) => {
            const l = getListingRow(item.listing)!;
            return (
              <motion.div key={item.listing_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <button onClick={() => navigate(`/listings/${l.id}`)}
                  className="w-full text-left rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all">
                  <div className="relative aspect-[3/4] bg-muted">
                    {l.photos[0] ? (
                      <img src={l.photos[0]} alt={l.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                    )}
                    {l.status === "sold" && (
                      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted/80 text-muted-foreground">{t.soldBadge}</span>
                    )}
                    {l.status === "reserved" && (
                      <span className={cn("absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400")}>{t.reservedBadge}</span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="font-semibold text-sm truncate">{l.title}</p>
                    <p className="text-primary font-bold text-sm mt-0.5">{displayPrice(l.price, l.currency, profile?.currency ?? "USD")}</p>
                  </div>
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
