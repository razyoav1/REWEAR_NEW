import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { MapPin, Star, ChevronLeft, ChevronRight, X, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, displayPrice } from "@/lib/utils";
import { formatDistance } from "@/lib/distance";
import type { Listing } from "@/types";
import { CONDITION_LABELS } from "@/types";

const CATEGORY_ICONS: Record<string, string> = {
  Tops: "👕",
  Bottoms: "👖",
  Dresses: "👗",
  Outerwear: "🧥",
  Activewear: "🏃",
  Sports: "⚽",
  Shoes: "👟",
  Accessories: "👜",
  Kids: "🧒",
  Babies: "🍼",
  Other: "📦",
};

interface SwipeCardProps {
  listing: Listing;
  userCurrency: string;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onTap: () => void;
  isTop: boolean;
}

export function SwipeCard({ listing, userCurrency, onSwipeLeft, onSwipeRight, onTap, isTop }: SwipeCardProps) {
  const { t } = useLanguage();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);
  const hasDragged = useRef(false);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-20, 20]);
  const opacity = useTransform(x, [-250, -80, 0, 80, 250], [0, 1, 1, 1, 0]);

  // Swipe indicators
  const saveRightOpacity = useTransform(x, [0, 80, 180], [0, 0.9, 1]);
  const skipOpacity = useTransform(x, [-180, -80, 0], [1, 0.9, 0]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 100) {
      setExitDir("right");
      onSwipeRight();
    } else if (info.offset.x < -100) {
      setExitDir("left");
      onSwipeLeft();
    }
  }

  function handleClick() {
    if (!hasDragged.current && isTop) onTap();
  }

  const exitAnim =
    exitDir === "right" ? { x: 600, rotate: 30, opacity: 0 } :
    exitDir === "left"  ? { x: -600, rotate: -30, opacity: 0 } :
    {};

  const photos = listing.photos.length > 0 ? listing.photos : [];

  return (
    <motion.div
      className={cn("absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing", !isTop && "pointer-events-none")}
      style={{ x, rotate, opacity }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragStart={() => { hasDragged.current = false; }}
      onDrag={(_, info) => { if (Math.abs(info.offset.x) > 8 || Math.abs(info.offset.y) > 8) hasDragged.current = true; }}
      onDragEnd={handleDragEnd}
      animate={exitAnim}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
      onClick={handleClick}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-card border border-border shadow-card">
        {/* Photo */}
        <div className="absolute inset-0">
          {photos[photoIndex] ? (
            <img
              src={photos[photoIndex]}
              alt={listing.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-6xl">
              {CATEGORY_ICONS[listing.category] ?? "📦"}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        </div>

        {/* Photo dots */}
        {photos.length > 1 && (
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <div key={i} className={cn("h-1 rounded-full transition-all", i === photoIndex ? "w-6 bg-white" : "w-3 bg-white/40")} />
            ))}
          </div>
        )}

        {/* Photo nav */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setPhotoIndex((p) => Math.max(0, p - 1)); }}
              className="absolute left-0 top-0 bottom-32 w-1/3 flex items-center justify-start pl-3 opacity-0 hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-7 h-7 text-white drop-shadow" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setPhotoIndex((p) => Math.min(photos.length - 1, p + 1)); }}
              className="absolute right-0 top-0 bottom-32 w-1/3 flex items-center justify-end pr-3 opacity-0 hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-7 h-7 text-white drop-shadow" />
            </button>
          </>
        )}

        {/* Swipe indicators */}
        {isTop && (
          <>
            {/* Swipe right = save */}
            <motion.div
              className="absolute top-16 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary border-2 border-primary"
              style={{ opacity: saveRightOpacity }}
            >
              <Heart className="w-5 h-5 text-white fill-white" />
              <span className="text-white font-black text-base tracking-wide">SAVE</span>
            </motion.div>
            {/* Swipe left = skip */}
            <motion.div
              className="absolute top-16 left-5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive border-2 border-destructive"
              style={{ opacity: skipOpacity }}
            >
              <X className="w-5 h-5 text-white" strokeWidth={3} />
              <span className="text-white font-black text-base tracking-wide">SKIP</span>
            </motion.div>
</>
        )}

        {/* Top badges */}
        <div className="absolute top-10 left-4 right-4 flex justify-between items-start">
          <Badge variant="muted" className="backdrop-blur-sm bg-black/40 text-white border-white/20">
            {CATEGORY_ICONS[listing.category] ?? "📦"} {listing.category}
          </Badge>
          <Badge variant="muted" className="backdrop-blur-sm bg-black/40 text-white border-white/20">
            {CONDITION_LABELS[listing.condition]}
          </Badge>
        </div>

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
          {listing.seller && (
            <div className="flex items-center gap-2.5">
              <div className="relative shrink-0">
                <Avatar className="w-9 h-9 border-2 border-white/30">
                  <AvatarImage src={listing.seller.avatarUrl} />
                  <AvatarFallback className="bg-primary/30 text-white text-sm font-bold">
                    {listing.seller.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Activity dot */}
                <span className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white/70",
                  listing.seller.lastSeenAt && (Date.now() - new Date(listing.seller.lastSeenAt).getTime()) < 48 * 60 * 60 * 1000
                    ? "bg-green-400"
                    : "bg-neutral-400"
                )} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-none">{listing.seller.name}</p>
                {(listing.seller.ratingAvg ?? 0) > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-white/80 text-xs">{listing.seller.ratingAvg?.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-end justify-between gap-2">
            <div className="flex-1 min-w-0">
              {listing.brand && <p className="text-white/70 text-xs font-medium mb-0.5">{listing.brand}</p>}
              <h2 className="text-white font-black text-2xl leading-tight truncate">{listing.title}</h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {listing.sizeValue && (
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-md font-semibold backdrop-blur-sm">
                    Size {listing.sizeValue}
                  </span>
                )}
                {(listing.colors?.length ?? 0) > 0 && (
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
                    {listing.colors![0]}
                  </span>
                )}
                {listing.distance != null && (
                  <span className="flex items-center gap-0.5 text-xs text-white/70 ml-auto">
                    <MapPin className="w-3 h-3" />
                    {formatDistance(listing.distance)}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-white font-black text-3xl leading-none">{displayPrice(listing.price, listing.currency, userCurrency)}</p>
              {listing.priceFlexible === true && (
                <span className="text-[10px] font-semibold bg-white/20 text-white px-1.5 py-0.5 rounded-md backdrop-blur-sm">{t.priceFlexibleBadge}</span>
              )}
              {listing.priceFlexible === false && (
                <span className="text-[10px] font-semibold bg-white/20 text-white px-1.5 py-0.5 rounded-md backdrop-blur-sm">{t.priceFixed}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
