import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Review {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  rating: number;
  text: string | null;
  created_at: string;
}

export function useReviews(userId?: string) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingStats, setRatingStats] = useState({ avg: 0, count: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    const { data } = await supabase
      .from("reviews").select("*").eq("reviewee_id", userId).order("created_at", { ascending: false });
    if (!data?.length) { setReviews([]); setRatingStats({ avg: 0, count: 0 }); setIsLoading(false); return; }

    const reviewerIds = [...new Set(data.map(r => r.reviewer_id))];
    const { data: reviewers } = await supabase
      .from("users").select("id, name, avatar_url").in("id", reviewerIds);
    const map = new Map(reviewers?.map(r => [r.id, r]) ?? []);

    const mapped: Review[] = data.map(r => ({
      id: r.id,
      reviewer_id: r.reviewer_id,
      reviewer_name: map.get(r.reviewer_id)?.name ?? "Unknown",
      reviewer_avatar: map.get(r.reviewer_id)?.avatar_url ?? null,
      rating: r.rating,
      text: r.text,
      created_at: r.created_at,
    }));

    const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
    setReviews(mapped);
    setRatingStats({ avg: Math.round(avg * 10) / 10, count: data.length });
    setIsLoading(false);
  }, [userId]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const getExistingReview = useCallback(async (revieweeId: string) => {
    if (!user?.id) return null;
    const { data } = await supabase
      .from("reviews").select("*").eq("reviewer_id", user.id).eq("reviewee_id", revieweeId).maybeSingle();
    if (!data) return null;
    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return { id: data.id, rating: data.rating, text: data.text ?? "", isEditable: new Date(data.created_at) > sevenDaysAgo };
  }, [user?.id]);

  const checkCanReview = useCallback(async (revieweeId: string): Promise<boolean> => {
    if (!user?.id || user.id === revieweeId) return false;
    const { data } = await supabase
      .from("conversations")
      .select("id")
      .or(`and(buyer_id.eq.${user.id},seller_id.eq.${revieweeId}),and(buyer_id.eq.${revieweeId},seller_id.eq.${user.id})`)
      .limit(1);
    return (data?.length ?? 0) > 0;
  }, [user?.id]);

  const createReview = useCallback(async (params: { revieweeId: string; rating: number; text?: string }) => {
    if (!user?.id) return null;
    try {
      const { data, error } = await supabase.from("reviews")
        .insert({ reviewer_id: user.id, reviewee_id: params.revieweeId, rating: params.rating, text: params.text ?? null })
        .select("id").single();
      if (error) throw error;
      toast.success("Review submitted!");
      await fetchReviews();
      return data.id;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "23505") toast.error("You already reviewed this user");
      else toast.error("Failed to submit review");
      return null;
    }
  }, [user?.id, fetchReviews]);

  const updateReview = useCallback(async (params: { reviewId: string; rating: number; text?: string }) => {
    if (!user?.id) return false;
    try {
      const { error } = await supabase.from("reviews")
        .update({ rating: params.rating, text: params.text ?? null })
        .eq("id", params.reviewId).eq("reviewer_id", user.id);
      if (error) throw error;
      toast.success("Review updated!");
      await fetchReviews();
      return true;
    } catch {
      toast.error("Cannot edit this review (may be older than 7 days)");
      return false;
    }
  }, [user?.id, fetchReviews]);

  const deleteReview = useCallback(async (reviewId: string) => {
    if (!user?.id) return false;
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", reviewId).eq("reviewer_id", user.id);
      if (error) throw error;
      toast.success("Review deleted");
      await fetchReviews();
      return true;
    } catch {
      toast.error("Failed to delete review");
      return false;
    }
  }, [user?.id, fetchReviews]);

  return { reviews, ratingStats, isLoading, createReview, updateReview, deleteReview, getExistingReview, checkCanReview, refetch: fetchReviews };
}
