import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminReports() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate("/admin")}><ArrowLeft className="w-4 h-4" /></Button>
        <Flag className="w-4 h-4 text-primary" />
        <h1 className="text-xl font-bold">Reports</h1>
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
    </div>
  );
}
