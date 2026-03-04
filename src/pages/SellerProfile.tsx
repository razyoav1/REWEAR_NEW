import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-bold">Seller Profile</h1>
      </div>

      <div className="flex flex-col items-center px-5 pb-6">
        <Avatar className="w-20 h-20 border-2 border-border mb-3">
          <AvatarFallback className="text-xl">?</AvatarFallback>
        </Avatar>
        <Skeleton className="h-6 w-32 mb-1" />
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <Star className="w-3.5 h-3.5" />
          <Skeleton className="h-3 w-12 inline-block" />
        </div>
        <Button className="mt-4" size="sm">
          <UserPlus className="w-3.5 h-3.5" /> Follow
        </Button>
      </div>

      <div className="flex border-b border-border px-5">
        {["Listings", "Reviews"].map((tab, i) => (
          <button key={tab} className={`flex-1 py-3 text-sm font-semibold ${i === 0 ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 py-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground pb-4">User #{id?.slice(0, 8)}</p>
    </div>
  );
}
