import { useNavigate } from "react-router-dom";
import { ArrowLeft, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAuditLog() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate("/admin")}><ArrowLeft className="w-4 h-4" /></Button>
        <ScrollText className="w-4 h-4 text-primary" />
        <h1 className="text-xl font-bold">Audit Log</h1>
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3 py-2 border-b border-border">
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
