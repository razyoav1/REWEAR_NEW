import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, SlidersHorizontal, X, MapPin, Star, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useListings } from "@/hooks/useListings";
import { CATEGORIES, GENDERS, CONDITION_LABELS, type ClothingCategory, type ListingCondition } from "@/types";
import { formatDistance } from "@/lib/distance";
import { displayPrice, getInitials } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type SearchMode = "listings" | "people";

interface UserResult {
  id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  listing_count?: number;
}

const ALL_CONDITIONS: { value: ListingCondition; label: string }[] = [
  { value: "new_with_tags", label: "New with tags" },
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

const PRICE_PRESETS = [
  { label: "Under $25", min: undefined as number | undefined, max: 25 },
  { label: "$25–$75", min: 25, max: 75 },
  { label: "$75–$150", min: 75, max: 150 },
  { label: "$150+", min: 150, max: undefined as number | undefined },
];

export default function Search() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<SearchMode>("listings");
  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ClothingCategory | "">("");
  const [condition, setCondition] = useState<ListingCondition | "">("");
  const [priceMin, setPriceMin] = useState<number | undefined>();
  const [priceMax, setPriceMax] = useState<number | undefined>();
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // People search state
  const [users, setUsers] = useState<UserResult[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Debounce search query
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(rawQuery), 400);
    return () => clearTimeout(debounceRef.current);
  }, [rawQuery]);

  // Listing search
  const { listings, isLoading: listingsLoading } = useListings({
    searchQuery: mode === "listings" ? (query || undefined) : undefined,
    category: category || undefined,
    condition: condition || undefined,
    priceMin,
    priceMax,
    genderFilter,
    excludeOwnListings: true,
  });

  // People search
  useEffect(() => {
    if (mode !== "people") return;
    if (!query.trim()) { setUsers([]); return; }

    setUsersLoading(true);
    supabase
      .from("users")
      .select("id, name, avatar_url, bio, rating_avg, rating_count")
      .ilike("name", `%${query.trim()}%`)
      .neq("id", user?.id ?? "")
      .limit(20)
      .then(async ({ data }) => {
        if (!data?.length) { setUsers([]); setUsersLoading(false); return; }

        // Fetch listing counts for each user
        const counts = await Promise.all(
          data.map(u =>
            supabase
              .from("clothing_listings")
              .select("id", { count: "exact", head: true })
              .eq("seller_id", u.id)
              .eq("status", "available")
              .then(({ count }) => ({ id: u.id, count: count ?? 0 }))
          )
        );
        const countMap = Object.fromEntries(counts.map(c => [c.id, c.count]));
        setUsers(data.map(u => ({ ...u, listing_count: countMap[u.id] ?? 0 })));
        setUsersLoading(false);
      });
  }, [query, mode, user?.id]);

  const hasActiveFilters = !!(category || condition || priceMin !== undefined || priceMax !== undefined);
  const activeFilterCount = [category, condition, priceMin !== undefined || priceMax !== undefined ? true : null]
    .filter(Boolean).length;

  function clearFilters() {
    setCategory("");
    setCondition("");
    setPriceMin(undefined);
    setPriceMax(undefined);
  }

  function togglePricePreset(preset: typeof PRICE_PRESETS[number]) {
    if (priceMin === preset.min && priceMax === preset.max) {
      setPriceMin(undefined);
      setPriceMax(undefined);
    } else {
      setPriceMin(preset.min);
      setPriceMax(preset.max);
    }
  }

  function switchMode(m: SearchMode) {
    setMode(m);
    setShowFilters(false);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-5 pt-14 pb-3 space-y-3">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={mode === "people" ? t.searchByName : t.searchPlaceholder}
              className="pl-9 pr-8"
              value={rawQuery}
              onChange={e => setRawQuery(e.target.value)}
            />
            {rawQuery && (
              <button
                onClick={() => setRawQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {mode === "listings" && (
            <Button
              variant={showFilters ? "default" : "outline"}
              size="icon"
              onClick={() => setShowFilters(s => !s)}
              className="relative shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}
        </div>

        {/* Mode tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {(["listings", "people"] as const).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all",
                mode === m
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "listings" ? t.listingsTab2 : t.peopleTab}
            </button>
          ))}
        </div>

        {/* Gender tabs — listings only */}
        {mode === "listings" && (
          <div className="flex gap-1">
            {GENDERS.filter(g => g.value !== "unisex").map(g => (
              <button key={g.value} onClick={() => setGenderFilter(g.value)}
                className={cn("flex-1 py-1.5 rounded-xl text-sm font-bold transition-all",
                  genderFilter === g.value
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground")}>
                {({ all: t.genderAll, women: t.genderWomens, men: t.genderMens, unisex: t.genderUnisex } as Record<string, string>)[g.value] ?? g.label}
              </button>
            ))}
          </div>
        )}

        {/* Category chips — listings only */}
        {mode === "listings" && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            <Badge
              variant={!category ? "pink" : "outline"}
              className="whitespace-nowrap cursor-pointer py-1.5 px-3 shrink-0"
              onClick={() => setCategory("")}
            >
              All
            </Badge>
            {CATEGORIES.map(cat => (
              <Badge
                key={cat}
                variant={category === cat ? "pink" : "outline"}
                className="whitespace-nowrap cursor-pointer py-1.5 px-3 shrink-0"
                onClick={() => setCategory(prev => prev === cat ? "" : cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Filter panel — listings only */}
      <AnimatePresence>
        {showFilters && mode === "listings" && (
          <motion.div
            key="filters"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-border"
          >
            <div className="px-5 py-4 space-y-4 bg-muted/20">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.condition}</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_CONDITIONS.map(c => (
                    <Badge
                      key={c.value}
                      variant={condition === c.value ? "pink" : "outline"}
                      className="cursor-pointer py-1 px-2.5"
                      onClick={() => setCondition(prev => prev === c.value ? "" : c.value)}
                    >
                      {c.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.price}</p>
                <div className="flex flex-wrap gap-2">
                  {PRICE_PRESETS.map(preset => (
                    <Badge
                      key={preset.label}
                      variant={priceMin === preset.min && priceMax === preset.max ? "pink" : "outline"}
                      className="cursor-pointer py-1 px-2.5"
                      onClick={() => togglePricePreset(preset)}
                    >
                      {preset.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-primary font-semibold flex items-center gap-1">
                  <X className="w-3 h-3" /> {t.clearAllFilters}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LISTINGS MODE ── */}
      {mode === "listings" && (
        <div className="px-5 pt-4">
          {!listingsLoading && (query || hasActiveFilters) && (
            <p className="pb-3 text-sm text-muted-foreground">
              {listings.length} {listings.length !== 1 ? t.results : t.result}
              {query ? ` ${t.forQuery} "${query}"` : ""}
            </p>
          )}

          {listingsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[3/4] rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <SearchIcon className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <p className="font-semibold mb-1">{t.noResults}</p>
              <p className="text-muted-foreground text-sm">
                {query || hasActiveFilters ? t.tryAdjusting : t.startTyping}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {listings.map((listing, i) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.25) }}
                >
                  <button
                    onClick={() => navigate(`/listings/${listing.id}`)}
                    className="w-full text-left rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all"
                  >
                    <div className="relative aspect-[3/4] bg-muted">
                      {listing.photos[0] ? (
                        <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                      )}
                    </div>
                    <div className="p-3">
                      {listing.brand && (
                        <p className="text-[10px] text-muted-foreground truncate">{listing.brand}</p>
                      )}
                      <p className="font-semibold text-sm truncate">{listing.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-primary font-black text-base">
                          {displayPrice(listing.price, listing.currency, profile?.currency ?? "USD")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{CONDITION_LABELS[listing.condition]}</p>
                      </div>
                      {listing.distance != null && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistance(listing.distance)}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PEOPLE MODE ── */}
      {mode === "people" && (
        <div className="px-5 pt-4">
          {usersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !query.trim() ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <User className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <p className="font-semibold mb-1">{t.peopleTab}</p>
              <p className="text-muted-foreground text-sm">{t.trySearchingByName}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <User className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <p className="font-semibold mb-1">{t.noUsersFoundSearch}</p>
              <p className="text-muted-foreground text-sm">{t.trySearchingByName}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((u, i) => (
                <motion.button
                  key={u.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/users/${u.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all text-left"
                >
                  <Avatar className="w-12 h-12 shrink-0 border border-border">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">
                      {getInitials(u.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{u.name}</p>
                    {u.bio ? (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{u.bio}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {u.listing_count ?? 0} {t.listingsCount}
                      </p>
                    )}
                  </div>

                  {u.rating_avg != null && u.rating_count && u.rating_count > 0 ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-bold">{u.rating_avg.toFixed(1)}</span>
                      <span className="text-[10px] text-muted-foreground">({u.rating_count})</span>
                    </div>
                  ) : null}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
