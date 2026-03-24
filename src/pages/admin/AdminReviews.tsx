import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Trash2, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AdminReview {
  id: string;
  reviewer_id: string;
  reviewer_name?: string;
  reviewee_id: string;
  reviewee_name?: string;
  rating: number;
  text: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function AdminReviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminReview | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from("reviews")
      .select("id, reviewer_id, reviewee_id, rating, text, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    setTotal(count ?? 0);
    if (!data?.length) { setReviews([]); setLoading(false); return; }
    const userIds = [...new Set([...data.map(r => r.reviewer_id), ...data.map(r => r.reviewee_id)])];
    const { data: users } = await supabase.from("users").select("id, name").in("id", userIds);
    const map = new Map(users?.map(u => [u.id, u.name]) ?? []);
    setReviews(data.map(r => ({ ...r, reviewer_name: map.get(r.reviewer_id) ?? "Unknown", reviewee_name: map.get(r.reviewee_id) ?? "Unknown" })));
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    const { error } = await supabase.from("reviews").delete().eq("id", selected.id);
    setDeleting(false);
    if (error) { toast.error("Failed to delete review: " + error.message); return; }
    setSelected(null);
    load();
  }

  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/admin")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Star className="w-4 h-4 text-primary" />
        <h1 className="text-xl font-bold">Reviews</h1>
        <span className="ml-auto text-xs text-muted-foreground">{total} total</span>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No reviews yet.</div>
      ) : (
        <>
          <div className="space-y-2">
            {reviews.map(r => (
              <button key={r.id} onClick={() => setSelected(r)}
                className="w-full text-left p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      <span>{r.reviewer_name}</span>
                      <span className="text-muted-foreground font-normal"> → </span>
                      <span>{r.reviewee_name}</span>
                    </p>
                    {r.text && <p className="text-xs text-muted-foreground truncate mt-0.5">{r.text}</p>}
                  </div>
                  <div className="shrink-0 flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn("w-3 h-3", s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
              </button>
            ))}
          </div>
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}

      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Detail</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} className={cn("w-5 h-5", s <= selected.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                ))}
              </div>
              <p className="text-sm">
                <span className="font-semibold">{selected.reviewer_name}</span>
                <span className="text-muted-foreground"> reviewed </span>
                <span className="font-semibold">{selected.reviewee_name}</span>
              </p>
              {selected.text && <p className="text-sm text-muted-foreground p-3 rounded-xl bg-muted/40">{selected.text}</p>}
              <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Delete</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
