import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsers() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate("/admin")}><ArrowLeft className="w-4 h-4" /></Button>
        <Users className="w-4 h-4 text-primary" />
        <h1 className="text-xl font-bold">Users</h1>
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1"><Skeleton className="h-4 w-32 mb-1" /><Skeleton className="h-3 w-24" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
