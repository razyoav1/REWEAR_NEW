import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Package, Flag, MessageSquare, Star, Ban, ScrollText, ArrowLeft, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  users: number;
  listings: number;
  listings_available: number;
  listings_sold: number;
  open_reports: number;
  conversations: number;
  reviews: number;
  blocks: number;
  open_tickets: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        { count: users }, { count: listings }, { count: avail }, { count: sold },
        { count: open_reports }, { count: conversations }, { count: reviews }, { count: blocks },
        { count: open_tickets },
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("clothing_listings").select("*", { count: "exact", head: true }),
        supabase.from("clothing_listings").select("*", { count: "exact", head: true }).eq("status", "available"),
        supabase.from("clothing_listings").select("*", { count: "exact", head: true }).eq("status", "sold"),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("conversations").select("*", { count: "exact", head: true }),
        supabase.from("reviews").select("*", { count: "exact", head: true }),
        supabase.from("blocks").select("*", { count: "exact", head: true }),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
      ]);
      setStats({ users: users ?? 0, listings: listings ?? 0, listings_available: avail ?? 0, listings_sold: sold ?? 0, open_reports: open_reports ?? 0, conversations: conversations ?? 0, reviews: reviews ?? 0, blocks: blocks ?? 0, open_tickets: open_tickets ?? 0 });
      setLoading(false);
    }
    load();
  }, []);

  const tiles = [
    { icon: Users, label: "Users", value: stats?.users, to: "/admin/users", color: "text-blue-400" },
    { icon: Package, label: "Listings", value: stats?.listings, sub: `${stats?.listings_available ?? "—"} available · ${stats?.listings_sold ?? "—"} sold`, to: "/admin/listings", color: "text-secondary" },
    { icon: Flag, label: "Open Reports", value: stats?.open_reports, to: "/admin/reports", color: "text-destructive", urgent: (stats?.open_reports ?? 0) > 0 },
    { icon: MessageSquare, label: "Conversations", value: stats?.conversations, to: "/admin/conversations", color: "text-primary" },
    { icon: Star, label: "Reviews", value: stats?.reviews, to: "/admin/reviews", color: "text-yellow-400" },
    { icon: Ban, label: "Blocks", value: stats?.blocks, to: "/admin/blocks", color: "text-muted-foreground" },
    { icon: LifeBuoy, label: "Support Tickets", value: stats?.open_tickets, to: "/admin/support", color: "text-cyan-400", urgent: (stats?.open_tickets ?? 0) > 0 },
  ];

  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-10">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <LayoutDashboard className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold">Admin</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {tiles.map(({ icon: Icon, label, value, sub, to, color, urgent }) => (
          <button key={label} onClick={() => navigate(to)}
            className={`text-left p-4 rounded-2xl bg-card border transition-all hover:border-primary/40 ${urgent ? "border-destructive/40" : "border-border"}`}>
            <Icon className={`w-5 h-5 mb-2 ${color}`} />
            {loading ? <Skeleton className="h-7 w-12 mb-1" /> : <p className="text-2xl font-black">{value}</p>}
            <p className="text-xs text-muted-foreground">{label}</p>
            {sub && !loading && <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>}
          </button>
        ))}
      </div>

      <Button variant="outline" className="w-full" onClick={() => navigate("/admin/audit")}>
        <ScrollText className="w-4 h-4" /> View Audit Log
      </Button>
    </div>
  );
}
