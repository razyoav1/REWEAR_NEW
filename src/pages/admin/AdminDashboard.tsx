import { LayoutDashboard, Users, Package, Flag, MessageSquare, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STATS = [
  { icon: Users, label: "Users", value: "—", to: "/admin/users" },
  { icon: Package, label: "Listings", value: "—", to: "/admin/listings" },
  { icon: Flag, label: "Reports", value: "—", to: "/admin/reports" },
  { icon: MessageSquare, label: "Conversations", value: "—", to: "/admin/conversations" },
  { icon: Star, label: "Reviews", value: "—", to: "/admin/reviews" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-8">
      <div className="flex items-center gap-2 mb-8">
        <LayoutDashboard className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {STATS.map(({ icon: Icon, label, value, to }) => (
          <Card key={label} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(to)}>
            <CardHeader className="pb-2">
              <Icon className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Button variant="outline" className="w-full" onClick={() => navigate("/admin/audit")}>
          View Audit Log
        </Button>
      </div>
    </div>
  );
}
