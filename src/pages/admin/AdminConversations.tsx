import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AdminConversation {
  id: string;
  listing_id: string | null;
  listing_title?: string;
  buyer_id: string;
  buyer_name?: string;
  seller_id: string;
  seller_name?: string;
  created_at: string;
}

interface ThreadMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  created_at: string;
}

const PAGE_SIZE = 20;

export default function AdminConversations() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [selectedConv, setSelectedConv] = useState<AdminConversation | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, count } = await supabase
      .from("conversations")
      .select("id, listing_id, buyer_id, seller_id, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (!data?.length) { setConversations([]); setTotal(0); setLoading(false); return; }

    const userIds = [...new Set([...data.map(c => c.buyer_id), ...data.map(c => c.seller_id)])];
    const listingIds = [...new Set(data.filter(c => c.listing_id).map(c => c.listing_id as string))];

    const [{ data: users }, { data: listings }] = await Promise.all([
      supabase.from("users").select("id, name").in("id", userIds),
      listingIds.length ? supabase.from("clothing_listings").select("id, title").in("id", listingIds) : Promise.resolve({ data: [] }),
    ]);

    const userMap = new Map(users?.map(u => [u.id, u.name]) ?? []);
    const listingMap = new Map((listings ?? []).map(l => [l.id, l.title]));

    setConversations(data.map(c => ({
      ...c,
      buyer_name: userMap.get(c.buyer_id) ?? "Unknown",
      seller_name: userMap.get(c.seller_id) ?? "Unknown",
      listing_title: c.listing_id ? (listingMap.get(c.listing_id) ?? "Unknown listing") : "Direct message",
    })));
    setTotal(count ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function openThread(conv: AdminConversation) {
    setSelectedConv(conv);
    setLoadingThread(true);
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    if (!data?.length) { setThread([]); setLoadingThread(false); return; }
    const senderIds = [...new Set(data.map(m => m.sender_id))];
    const { data: users } = await supabase.from("users").select("id, name").in("id", senderIds);
    const map = new Map(users?.map(u => [u.id, u.name]) ?? []);
    setThread(data.map(m => ({ ...m, sender_name: map.get(m.sender_id) ?? "Unknown" })));
    setLoadingThread(false);
  }

  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/admin")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <MessageSquare className="w-4 h-4 text-primary" />
        <h1 className="text-xl font-bold">Conversations</h1>
        <span className="ml-auto text-xs text-muted-foreground">{total} total</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No conversations yet.</div>
      ) : (
        <>
          <div className="space-y-2">
            {conversations.map(c => (
              <button key={c.id} onClick={() => openThread(c)}
                className="w-full p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all text-left space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm truncate flex-1">{c.listing_title}</p>
                  <Eye className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{c.buyer_name}</span>
                  <span>→</span>
                  <span className="font-medium text-foreground">{c.seller_name}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</p>
              </button>
            ))}
          </div>
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}

      {/* Thread view dialog */}
      <Dialog open={!!selectedConv} onOpenChange={v => !v && setSelectedConv(null)}>
        <DialogContent className="max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm truncate">{selectedConv?.listing_title}</DialogTitle>
            <p className="text-xs text-muted-foreground">{selectedConv?.buyer_name} → {selectedConv?.seller_name}</p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            {loadingThread ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
            ) : thread.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No messages in this conversation.</p>
            ) : (
              thread.map(m => {
                const isBuyer = m.sender_id === selectedConv?.buyer_id;
                return (
                  <div key={m.id} className={cn("flex gap-2", isBuyer ? "flex-row" : "flex-row-reverse")}>
                    <div className={cn("max-w-[80%] px-3 py-2 rounded-2xl text-sm",
                      isBuyer ? "bg-muted text-foreground rounded-tl-sm" : "bg-primary/20 text-foreground rounded-tr-sm")}>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">{m.sender_name}</p>
                      <p>{m.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
                        {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="pt-2 border-t border-border">
            <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedConv(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
