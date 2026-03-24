import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface FollowUser {
  id: string;
  name: string;
  avatar_url: string | null;
  rating_avg: number | null;
  rating_count: number | null;
}

export function useFollows(userId?: string) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const fetchCounts = useCallback(async () => {
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    const [{ count: fc }, { count: ing }] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    ]);
    setFollowerCount(fc ?? 0);
    setFollowingCount(ing ?? 0);
    if (user && user.id !== userId) {
      const { data } = await supabase
        .from("follows").select("follower_id")
        .eq("follower_id", user.id).eq("following_id", userId).maybeSingle();
      setIsFollowing(!!data);
    }
    setIsLoading(false);
  }, [userId, user]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const toggleFollow = useCallback(async () => {
    if (!user || !userId || user.id === userId) return;
    setIsToggling(true);
    try {
      if (isFollowing) {
        const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
        if (error) throw error;
        setIsFollowing(false);
        setFollowerCount(c => Math.max(0, c - 1));
        toast.success("Unfollowed");
      } else {
        const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: userId });
        if (error) throw error;
        setIsFollowing(true);
        setFollowerCount(c => c + 1);
        toast.success("Following!");
        // Fetch follower name to include in notification
        const { data: followerData } = await supabase
          .from("users").select("name").eq("id", user.id).single();
        await supabase.from("notifications").insert({
          user_id: userId,
          type: "new_follower",
          title: `${followerData?.name ?? "Someone"} started following you`,
          body: "",
          data: { follower_id: user.id, follower_name: followerData?.name },
        });
      }
    } catch {
      toast.error("Failed to update follow status");
    } finally {
      setIsToggling(false);
    }
  }, [user, userId, isFollowing]);

  const fetchFollowers = useCallback(async (): Promise<FollowUser[]> => {
    if (!userId) return [];
    const { data: rows } = await supabase
      .from("follows").select("follower_id").eq("following_id", userId).order("created_at", { ascending: false });
    if (!rows?.length) return [];
    const ids = rows.map(r => r.follower_id);
    const { data: users } = await supabase
      .from("users").select("id, name, avatar_url, rating_avg, rating_count").in("id", ids);
    return (users as FollowUser[]) ?? [];
  }, [userId]);

  const fetchFollowing = useCallback(async (): Promise<FollowUser[]> => {
    if (!userId) return [];
    const { data: rows } = await supabase
      .from("follows").select("following_id").eq("follower_id", userId).order("created_at", { ascending: false });
    if (!rows?.length) return [];
    const ids = rows.map(r => r.following_id);
    const { data: users } = await supabase
      .from("users").select("id, name, avatar_url, rating_avg, rating_count").in("id", ids);
    return (users as FollowUser[]) ?? [];
  }, [userId]);

  return { isFollowing, isLoading, isToggling, followerCount, followingCount, toggleFollow, fetchFollowers, fetchFollowing, refetch: fetchCounts };
}
