import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ScrollText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AuditEntry {
  id: string;
  action: string;
  actor_id: string | null;
  actor_name?: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: "text-secondary",
  update: "text-yellow-400",
  delete: "text-destructive",
  block: "text-destructive",
  unblock: "text-muted-foreground",
  report: "text-orange-400",
  follow: "text-primary",
  unfollow: "text-muted-foreground",
};

function actionColor(action: string) {
  const key = Object.keys(ACTION_COLORS).find(k => action.toLowerCase().includes(k));
  return key ? ACTION_COLORS[key] : "text-muted-foreground";
}

const PAGE_SIZE = 50;

export default function AdminAuditLog() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("audit_log")
      .select("id, action, actor_id, entity_type, entity_id, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59Z");
    const { data, count, error } = await q;
    if (error) { import.meta.env.DEV && console.error("Audit log fetch failed:", error.message); setLoading(false); return; }
    setTotal(count ?? 0);
    if (!data?.length) { setEntries([]); setLoading(false); return; }
    const actorIds = [...new Set(data.filter(e => e.actor_id).map(e => e.actor_id as string))];
    let nameMap = new Map<string, string>();
    if (actorIds.length) {
      const { data: users } = await supabase.from("users").select("id, name").in("id", actorIds);
      nameMap = new Map(users?.map(u => [u.id, u.name]) ?? []);
    }
    setEntries(data.map(e => ({ ...e, actor_name: e.actor_id ? (nameMap.get(e.actor_id) ?? "Unknown") : "System" })));
    setLoading(false);
  }, [page, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [dateFrom, dateTo]);

  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/admin")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <ScrollText className="w-4 h-4 text-primary" />
        <h1 className="text-xl font-bold">Audit Log</h1>
        <span className="ml-auto text-xs text-muted-foreground">{total} total</span>
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
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-2.5 border-b border-border">
              <Skeleton className="h-4 w-20 shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No audit log entries.</div>
      ) : (
        <>
          <div className="divide-y divide-border">
            {entries.map(e => (
              <div key={e.id} className="py-2.5 flex items-start gap-3">
                <span className={cn("text-xs font-bold uppercase shrink-0 w-20 pt-0.5 truncate", actionColor(e.action))}>
                  {e.action}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">
                    <span className="font-semibold">{e.actor_name}</span>
                    {e.entity_type && <span className="text-muted-foreground"> · {e.entity_type}</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}</p>
                </div>
              </div>
            ))}
          </div>
          <AdminPagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
