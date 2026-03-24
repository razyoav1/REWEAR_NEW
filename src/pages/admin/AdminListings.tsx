import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { cn, formatPrice } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type ListingStatus = "available" | "sold" | "hidden";

interface AdminListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  status: ListingStatus;
  photos: string[];
  seller_id: string;
  seller_name?: string;
  created_at: string;
}

const STATUS_STYLES: Record<ListingStatus, string> = {
  available: "bg-secondary/20 text-secondary",
  sold: "bg-muted text-muted-foreground",
  hidden: "bg-destructive/20 text-destructive",
};

const STATUSES: ListingStatus[] = ["available", "sold", "hidden"];
const PAGE_SIZE = 20;

export default function AdminListings() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ListingStatus | "all">("available");
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<AdminListing | null>(null);
  const [newStatus, setNewStatus] = useState<ListingStatus>("available");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("clothing_listings")
      .select("id, title, price, currency, status, photos, seller_id, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (filterStatus !== "all") q = q.eq("status", filterStatus);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59Z");
    const { data, count } = await q;
    if (!data?.length) { setListings([]); setTotal(0); setLoading(false); return; }
    const sellerIds = [...new Set(data.map(r => r.seller_id))];
    const { data: users } = await supabase.from("users").select("id, name").in("id", sellerIds);
    const map = new Map(users?.map(u => [u.id, u.name]) ?? []);
    setListings(data.map(r => ({ ...r, price: parseFloat(r.price), seller_name: map.get(r.seller_id) ?? "Unknown" })));
    setTotal(count ?? 0);
    setLoading(false);
  }, [filterStatus, page, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filterStatus, dateFrom, dateTo]);

  async function handleUpdateStatus() {
    if (!selected) return;
    setSaving(true);
    const { error: updateError } = await supabase.from("clothing_listings").update({ status: newStatus }).eq("id", selected.id);
    if (updateError) { setSaving(false); toast.error("Failed to update listing: " + updateError.message); return; }
    // Notify seller when listing is hidden by admin
    if (newStatus === "hidden" && selected.status !== "hidden") {
      await supabase.from("notifications").insert({
        user_id: selected.seller_id,
        type: "listing_removed",
        title: "Your listing was hidden by an admin",
        body: selected.title,
        data: { listing_id: selected.id, listing_title: selected.title },
      });
    }
    setSaving(false);
    setSelected(null);
    load();
  }

  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/admin")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Package className="w-4 h-4 text-primary" />
        <h1 className="text-xl font-bold">Listings</h1>
        <span className="ml-auto text-xs text-muted-foreground">{total} total</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar">
        {(["all", ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={cn("px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 transition-all",
              filterStatus === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <Input type="date" className="flex-1 text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <Input type="date" className="flex-1 text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="px-3 text-xs text-muted-foreground hover:text-foreground border border-border rounded-xl">Clear</button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No {filterStatus === "all" ? "" : filterStatus} listings.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {listings.map(l => (
              <button key={l.id} onClick={() => { setSelected(l); setNewStatus(l.status); }}
                className="text-left rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all">
                <div className="relative aspect-[3/4] bg-muted">
                  {l.photos?.[0] ? (
                    <img src={l.photos[0]} alt={l.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                  )}
                  <span className={cn("absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full", STATUS_STYLES[l.status])}>
                    {l.status}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="font-semibold text-xs truncate">{l.title}</p>
                  <p className="text-primary font-black text-sm">{formatPrice(l.price, l.currency)}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{l.seller_name}</p>
                </div>
              </button>
            ))}
          </div>
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}

      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Listing</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3">
              <p className="text-sm font-semibold truncate">{selected.title}</p>
              <p className="text-xs text-muted-foreground">by {selected.seller_name} · {formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })}</p>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button key={s} onClick={() => setNewStatus(s)}
                      className={cn("px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all",
                        newStatus === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/listings/${selected.id}`)}>View Listing</Button>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={saving || newStatus === selected?.status}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
