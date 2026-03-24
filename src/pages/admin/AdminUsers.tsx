import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Search, Star, ShieldAlert, ShieldOff } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AdminUser {
  id: string;
  name: string;
  avatar_url: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  account_status: string | null;
  created_at: string;
}

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  active: "bg-secondary/20 text-secondary",
  suspended: "bg-yellow-500/20 text-yellow-400",
  banned: "bg-destructive/20 text-destructive",
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [newStatus, setNewStatus] = useState<"active" | "suspended" | "banned">("suspended");
  const [suspendReason, setSuspendReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("users")
      .select("id, name, avatar_url, rating_avg, rating_count, account_status, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59Z");
    const { data, count } = await q;
    setUsers((data as AdminUser[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [search, page, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => { setPage(1); }, [search, dateFrom, dateTo]);

  async function handleUpdateStatus() {
    if (!selected) return;
    setSaving(true);
    const { error: updateError } = await supabase.from("users").update({
      account_status: newStatus,
      suspension_reason: newStatus !== "active" ? (suspendReason || null) : null,
      suspended_at: newStatus !== "active" ? new Date().toISOString() : null,
    }).eq("id", selected.id);
    if (updateError) { setSaving(false); toast.error("Failed to update user: " + updateError.message); return; }
    // Notify user when suspended or banned
    if (newStatus === "suspended" || newStatus === "banned") {
      await supabase.from("notifications").insert({
        user_id: selected.id,
        type: "account_warning",
        title: newStatus === "banned" ? "Your account has been banned" : "Your account has been suspended",
        body: suspendReason || "",
        data: { status: newStatus, reason: suspendReason },
      });
    }
    setSaving(false);
    setSelected(null);
    setSuspendReason("");
    load();
  }

  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/admin")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Users className="w-4 h-4 text-primary" />
        <h1 className="text-xl font-bold">Users</h1>
        <span className="ml-auto text-xs text-muted-foreground">{total} total</span>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-2 mb-4">
        <Input type="date" className="flex-1 text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <Input type="date" className="flex-1 text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="px-3 text-xs text-muted-foreground hover:text-foreground border border-border rounded-xl">
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">{search ? "No users found." : "No users yet."}</div>
      ) : (
        <>
          <div className="space-y-2">
            {users.map(u => (
              <button key={u.id}
                onClick={() => { setSelected(u); setNewStatus((u.account_status as "active" | "suspended" | "banned") ?? "active"); setSuspendReason(""); }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all text-left"
              >
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">{u.name?.[0]?.toUpperCase() ?? "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{u.name}</p>
                    {u.account_status && u.account_status !== "active" && (
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 capitalize", STATUS_STYLES[u.account_status])}>
                        {u.account_status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate font-mono">{u.id.slice(0, 8)}…</p>
                </div>
                <div className="text-right shrink-0">
                  {(u.rating_avg ?? 0) > 0 && (
                    <div className="flex items-center gap-0.5 justify-end mb-0.5">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold">{u.rating_avg?.toFixed(1)}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</p>
                </div>
              </button>
            ))}
          </div>
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}

      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User</DialogTitle>
            <DialogDescription>{selected?.name} · {selected?.id}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Account Status</p>
              <div className="flex gap-2">
                {(["active", "suspended", "banned"] as const).map(s => (
                  <button key={s} onClick={() => setNewStatus(s)}
                    className={cn("flex-1 py-2 rounded-xl border text-xs font-semibold capitalize transition-all",
                      newStatus === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
                    {s === "active" ? <ShieldOff className="w-3 h-3 inline mr-1" /> : <ShieldAlert className="w-3 h-3 inline mr-1" />}
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {newStatus !== "active" && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Reason (optional)</p>
                <Textarea placeholder="Reason for suspension/ban…" value={suspendReason} onChange={e => setSuspendReason(e.target.value)} />
              </div>
            )}
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(`/users/${selected?.id}`)}>View Profile</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              variant={newStatus === "active" ? "default" : "destructive"}
              onClick={handleUpdateStatus}
              disabled={saving || newStatus === (selected?.account_status ?? "active")}
            >
              {saving ? "Saving…" : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
