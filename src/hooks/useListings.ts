import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Listing, User, ClothingCategory, ListingCondition } from "@/types";
import { calculateDistanceKm } from "@/lib/distance";

export type ListingSort = "newest" | "price_asc" | "price_desc" | "nearest";

interface UseListingsOptions {
  excludeOwnListings?: boolean;
  excludeSellerIds?: string[];
  status?: string[];
  userLat?: number | null;
  userLng?: number | null;
  sellerId?: string;
  searchQuery?: string;
  category?: string;
  condition?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: ListingSort;
}

function dbRowToListing(row: any, seller?: User, userLat?: number | null, userLng?: number | null): Listing {
  let distance: number | undefined;
  if (userLat && userLng && row.location_lat && row.location_lng) {
    distance = calculateDistanceKm(userLat, userLng, row.location_lat, row.location_lng);
  }

  return {
    id: row.id,
    sellerId: row.seller_id,
    seller: seller ?? {
      id: row.seller_id,
      name: "Unknown",
      verificationStatus: "unverified",
      createdAt: row.created_at,
    },
    title: row.title,
    description: row.description,
    category: row.category as ClothingCategory,
    brand: row.brand,
    sizeValue: row.size_value,
    condition: row.condition as ListingCondition,
    colors: row.colors ?? [],
    price: parseFloat(row.price),
    currency: row.currency,
    photos: row.photos ?? [],
    locationLat: row.location_lat,
    locationLng: row.location_lng,
    distance,
    status: row.status,
    tags: row.tags ?? [],
    createdAt: row.created_at,
  };
}

export function useListings(options: UseListingsOptions = {}) {
  const { user, profile, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isFetchingRef = useRef(false);

  const fetchListings = useCallback(async (showLoading = true) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (showLoading) setIsLoading(true);
    setError(null);

    try {
      const sort = options.sortBy ?? "newest";
      let query = supabase
        .from("clothing_listings")
        .select("*")
        .order(sort === "price_asc" || sort === "price_desc" ? "price" : "created_at", {
          ascending: sort === "price_asc",
        });

      const statuses = options.status ?? ["available"];
      query = query.in("status", statuses);

      if (options.sellerId) query = query.eq("seller_id", options.sellerId);
      if (options.excludeOwnListings && user?.id) query = query.neq("seller_id", user.id);
      if (options.excludeSellerIds?.length) query = query.not("seller_id", "in", `(${options.excludeSellerIds.join(",")}`);
      if (options.searchQuery?.trim()) {
        query = query.or(`title.ilike.%${options.searchQuery.trim()}%,brand.ilike.%${options.searchQuery.trim()}%`);
      }
      if (options.category) query = query.eq("category", options.category);
      if (options.condition) query = query.eq("condition", options.condition);
      if (options.priceMin) query = query.gte("price", options.priceMin);
      if (options.priceMax) query = query.lte("price", options.priceMax);

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setListings([]);
        return;
      }

      // Fetch sellers
      const sellerIds = [...new Set(data.map((l) => l.seller_id))];
      const { data: sellers } = await supabase.from("users").select("*").in("id", sellerIds);

      const sellerMap = new Map<string, User>(
        sellers?.map((s) => [
          s.id,
          {
            id: s.id,
            name: s.name,
            avatarUrl: s.avatar_url ?? undefined,
            locationLat: s.location_lat ?? undefined,
            locationLng: s.location_lng ?? undefined,
            defaultRadiusKm: s.default_radius_km ?? undefined,
            verificationStatus: "unverified" as const,
            ratingAvg: s.rating_avg ?? undefined,
            ratingCount: s.rating_count ?? undefined,
            lastSeenAt: s.last_seen_at ?? undefined,
            createdAt: s.created_at,
          },
        ]) ?? []
      );

      const userLat = options.userLat ?? profile?.location_lat ?? null;
      const userLng = options.userLng ?? profile?.location_lng ?? null;

      let mapped = data.map((row) => dbRowToListing(row, sellerMap.get(row.seller_id), userLat, userLng));
      if (sort === "nearest") mapped = mapped.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
      setListings(mapped);
    } catch (err) {
      console.error("Error fetching listings:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [user?.id, profile?.location_lat, profile?.location_lng, options.userLat, options.userLng, options.sellerId, options.excludeOwnListings, options.excludeSellerIds?.join(","), options.status?.join(","), options.searchQuery, options.category, options.condition, options.priceMin, options.priceMax, options.sortBy]);

  useEffect(() => {
    if (!authLoading) fetchListings();
  }, [authLoading, fetchListings]);

  return { listings, isLoading, error, refetch: () => fetchListings(false) };
}
