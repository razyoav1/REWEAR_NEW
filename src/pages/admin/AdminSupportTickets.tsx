import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketType = "bug" | "issue" | "feature_request" | "other";

interface Ticket {
  id: string;
  user_id: string | null;
  type: TicketType;
  title: string;
  description: string;
  status: TicketStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
}

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-destructive/20 text-destructive",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  resolved: "bg-secondary/20 text-secondary",
  closed: "bg-muted text-muted-foreground",
};

const TYPE_STYLES: Record<TicketType, string> = {
  bug: "bg-red-500/10 text-red-400",
  issue: "bg-orange-500/10 text-orange-400",
  feature_request: "bg-blue-500/10 text-blue-400",
  other: "bg-muted text-muted-foreground",
};

const STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];
const PAGE_SIZE = 20;

export default function AdminSupportTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<TicketStatus | "all">("open");
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [newStatus, setNewStatus] = useState<TicketStatus>("in_progress");
  const [adminNote, setAdminNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("support_tickets")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (filterStatus !== "all") q = q.eq("status", filterStatus);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59Z");

    const { data, count } = await q;
    setTotal(count ?? 0);

    if (!data?.length) {
      setTickets([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data.map((t) => t.user_id).filter(Boolean))];
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", userIds);

    const nameMap = new Map(users?.map((u) => [u.id, u.name]) ?? []);
    const emailMap = new Map(users?.map((u) => [u.id, u.email]) ?? []);

    setTickets(
      data.map((t) => ({
        ...t,
        user_name: t.user_id ? (nameMap.get(t.user_id) ?? "Unknown") : "Guest",
        user_email: t.user_id ? (emailMap.get(t.user_id) ?? "") : "",
      }))
    );
    setLoading(false);
  }, [filterStatus, page, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filterStatus, dateFrom, dateTo]);

  async function handleUpdate() {
    if (!selected) return;
    setSaving(true);
    await supabase
      .from("support_tickets")
      .update({ status: newStatus, admin_note: adminNote || null })
      .eq("id", selected.id);

    // Notify the user if resolved
    if (selected.user_id && (newStatus === "resolved" || newStatus === "closed")) {
      await supabase.from("notifications").insert({
        user_id: selected.user_id,
        type: "system",
        title: `Your support ticket has been ${newStatus}`,
        body: adminNote || `We've ${newStatus} your ticket: "${selected.title}"`,
        data: { ticket_id: selected.id },
      });
    }

    setSaving(false);
    setSelected(null);
    setAdminNote("");
    load();
  }

  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate("/admin")}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <LifeBuoy className="w-4 h-4 text-primary" />
        <h1 className="text-xl font-bold">Support Tickets</h1>
        <span className="ml-auto text-xs text-muted-foreground">{total} total</span>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 transition-all",
              filterStatus === s
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            )}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Date filter */}
      <div className="flex gap-2 mb-4">
        <Input type="date" className="flex-1 text-xs" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <Input type="date" className="flex-1 text-xs" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(""); setDateTo(""); }}
            className="px-3 text-xs text-muted-foreground hover:text-foreground border border-border rounded-xl"
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No {filterStatus === "all" ? "" : filterStatus} tickets.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelected(t); setNewStatus(t.status); setAdminNote(t.admin_note ?? ""); }}
                className="w-full text-left p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by {t.user_name} · {formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", STATUS_STYLES[t.status])}>
                    {t.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", TYPE_STYLES[t.type])}>
                    {t.type.replace("_", " ")}
                  </span>
                  <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                </div>
              </button>
            ))}
          </div>
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}

      {/* Detail / update dialog */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex gap-2 flex-wrap">
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", TYPE_STYLES[selected.type])}>
                  {selected.type.replace("_", " ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selected.user_name}
                  {selected.user_email ? ` · ${selected.user_email}` : ""}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })}
                </span>
              </div>

              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.description}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Update Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setNewStatus(s)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all",
                        newStatus === s
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Admin note <span className="font-normal">(sent to user on resolve/close)</span>
                </p>
                <Textarea
                  placeholder="Describe what was done or any next steps…"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? "Saving…" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
