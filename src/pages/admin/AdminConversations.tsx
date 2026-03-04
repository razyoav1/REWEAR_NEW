import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminConversations() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate("/admin")}><ArrowLeft className="w-4 h-4" /></Button>
        <MessageSquare className="w-4 h-4 text-primary" />
        <h1 className="text-xl font-bold">Conversations</h1>
      </div>
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
      </div>
    </div>
  );
}
