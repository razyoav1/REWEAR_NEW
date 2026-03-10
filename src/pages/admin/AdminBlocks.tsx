import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Ban } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { formatDistanceToNow } from "date-fns";

interface AdminBlock {
  id: string;
  blocker_id: string;
  blocker_name?: string;
  blocked_id: string;
  blocked_name?: string;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function AdminBlocks() {
  const navigate = useNavigate();
  const [blocks, setBlocks] = useState<AdminBlock[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from("blocks")
      .select("id, blocker_id, blocked_id, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    setTotal(count ?? 0);
    if (!data?.length) { setBlocks([]); setLoading(false); return; }
    const userIds = [...new Set([...data.map(b => b.blocker_id), ...data.map(b => b.blocked_id)])];
    const { data: users } = await supabase.from("users").select("id, name").in("id", userIds);
    const map = new Map(users?.map(u => [u.id, u.name]) ?? []);
    setBlocks(data.map(b => ({ ...b, blocker_name: map.get(b.blocker_id) ?? "Unknown", blocked_name: map.get(b.blocked_id) ?? "Unknown" })));
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/admin")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Ban className="w-4 h-4 text-primary" />
        <h1 className="text-xl font-bold">Blocks</h1>
        <span className="ml-auto text-xs text-muted-foreground">{total} total</span>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
      ) : blocks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No blocks recorded.</div>
      ) : (
        <>
          <div className="space-y-2">
            {blocks.map(b => (
              <div key={b.id} className="p-4 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{b.blocker_name}</span>
                  <Ban className="w-3.5 h-3.5 text-destructive shrink-0" />
                  <span className="font-semibold">{b.blocked_name}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}</p>
              </div>
            ))}
          </div>
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
