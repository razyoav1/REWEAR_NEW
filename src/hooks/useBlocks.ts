import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BlockedUser {
  id: string;
  name: string;
  avatar_url: string | null;
  blocked_at: string;
}

export function useBlocks() {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlocks = useCallback(async () => {
    if (!user?.id) { setIsLoading(false); return; }
    setIsLoading(true);
    const { data: blocks } = await supabase
      .from("blocks").select("blocked_id, created_at").eq("blocker_id", user.id);
    if (!blocks?.length) { setBlockedUsers([]); setIsLoading(false); return; }
    const ids = blocks.map(b => b.blocked_id);
    const { data: users } = await supabase.from("users").select("id, name, avatar_url").in("id", ids);
    const map = new Map(users?.map(u => [u.id, u]) ?? []);
    setBlockedUsers(blocks.map(b => ({
      id: b.blocked_id,
      name: map.get(b.blocked_id)?.name ?? "Unknown",
      avatar_url: map.get(b.blocked_id)?.avatar_url ?? null,
      blocked_at: b.created_at,
    })));
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  const blockUser = useCallback(async (blockedId: string, blockedName: string) => {
    if (!user?.id || blockedId === user.id) return false;
    if (blockedUsers.some(u => u.id === blockedId)) { toast.info("Already blocked"); return true; }
    try {
      const { error } = await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: blockedId });
      if (error) throw error;
      toast.success(`Blocked ${blockedName}`);
      await fetchBlocks();
      return true;
    } catch {
      toast.error("Failed to block user");
      return false;
    }
  }, [user?.id, blockedUsers, fetchBlocks]);

  const unblockUser = useCallback(async (blockedId: string) => {
    if (!user?.id) return false;
    try {
      const { error } = await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", blockedId);
      if (error) throw error;
      toast.success("User unblocked");
      await fetchBlocks();
      return true;
    } catch {
      toast.error("Failed to unblock user");
      return false;
    }
  }, [user?.id, fetchBlocks]);

  const isUserBlocked = useCallback((id: string) => blockedUsers.some(u => u.id === id), [blockedUsers]);

  return { blockedUsers, isLoading, blockUser, unblockUser, isUserBlocked, refetch: fetchBlocks };
}
