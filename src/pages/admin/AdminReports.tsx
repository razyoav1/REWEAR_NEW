import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type Status = "open" | "under_review" | "resolved" | "dismissed";

interface Report {
  id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: Status;
  resolution_note: string | null;
  created_at: string;
  reporter_name?: string;
}

const STATUS_STYLES: Record<Status, string> = {
  open: "bg-destructive/20 text-destructive",
  under_review: "bg-yellow-500/20 text-yellow-400",
  resolved: "bg-secondary/20 text-secondary",
  dismissed: "bg-muted text-muted-foreground",
};

const STATUSES: Status[] = ["open", "under_review", "resolved", "dismissed"];
const PAGE_SIZE = 20;

export default function AdminReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<Status | "all">("open");
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState<Status>("resolved");
  const [resolutionNote, setResolutionNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("reports").select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (filterStatus !== "all") q = q.eq("status", filterStatus);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59Z");
    const { data, count } = await q;
    setTotal(count ?? 0);
    if (!data?.length) { setReports([]); setLoading(false); return; }
    const reporterIds = [...new Set(data.map(r => r.reporter_id))];
    const { data: users } = await supabase.from("users").select("id, name").in("id", reporterIds);
    const map = new Map(users?.map(u => [u.id, u.name]) ?? []);
    setReports(data.map(r => ({ ...r, reporter_name: map.get(r.reporter_id) ?? "Unknown" })));
    setLoading(false);
  }, [filterStatus, page, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filterStatus, dateFrom, dateTo]);

  async function handleUpdateStatus() {
    if (!selected) return;
    setSaving(true);
    await supabase.from("reports").update({ status: newStatus, resolution_note: resolutionNote || null }).eq("id", selected.id);
    // Notify the reporter when status changes to resolved or dismissed
    if (newStatus === "resolved" || newStatus === "dismissed") {
      await supabase.from("notifications").insert({
        user_id: selected.reporter_id,
        type: "report_resolved",
        title: `Your report has been ${newStatus}`,
        body: resolutionNote || "",
        data: { report_id: selected.id, status: newStatus, admin_note: resolutionNote },
      });
    }
    setSaving(false);
    setSelected(null);
    setResolutionNote("");
    load();
  }

  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/admin")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"><ArrowLeft className="w-5 h-5" /></button>
        <Flag className="w-4 h-4 text-primary" />
        <h1 className="text-xl font-bold">Reports</h1>
        <span className="ml-auto text-xs text-muted-foreground">{total} total</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar">
        {(["all", ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={cn("px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 transition-all",
              filterStatus === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
            {s === "all" ? "All" : s.replace("_", " ")}
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
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No {filterStatus === "all" ? "" : filterStatus} reports.</div>
      ) : (
        <>
          <div className="space-y-3">
            {reports.map(r => (
              <button key={r.id} onClick={() => { setSelected(r); setNewStatus(r.status); setResolutionNote(r.resolution_note ?? ""); }}
                className="w-full text-left p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm capitalize">{r.entity_type} · <span className="text-muted-foreground font-normal">{r.reason.replace(/_/g, " ")}</span></p>
                    <p className="text-xs text-muted-foreground">by {r.reporter_name} · {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", STATUS_STYLES[r.status])}>
                    {r.status.replace("_", " ")}
                  </span>
                </div>
                {r.details && <p className="text-xs text-muted-foreground truncate">{r.details}</p>}
              </button>
            ))}
          </div>
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}

      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update Report</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Status</p>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setNewStatus(s)}
                    className={cn("px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all",
                      newStatus === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Resolution note (optional)</p>
              <Textarea placeholder="Explain your decision…" value={resolutionNote} onChange={e => setResolutionNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={saving}>{saving ? "Saving…" : "Update"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
