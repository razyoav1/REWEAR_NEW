import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Share2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Photo placeholder */}
      <div className="relative aspect-[4/5] bg-card">
        <Skeleton className="w-full h-full rounded-none" />

        {/* Overlay actions */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-5 pt-14">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="bg-black/40 backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4 text-white" />
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="bg-black/40 backdrop-blur-sm">
              <Heart className="w-4 h-4 text-white" />
            </Button>
            <Button variant="ghost" size="icon" className="bg-black/40 backdrop-blur-sm">
              <Share2 className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-5 py-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <Skeleton className="h-7 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>

        <div className="flex gap-2">
          <Badge variant="lime">Like New</Badge>
          <Badge variant="outline">Size M</Badge>
          <Badge variant="outline">Nike</Badge>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">Listing #{id?.slice(0, 8)}</p>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 border-t border-border bg-background/95 backdrop-blur-sm" style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="flex-1">
            <Heart className="w-4 h-4" /> Save
          </Button>
          <Button size="lg" className="flex-1">
            <MessageCircle className="w-4 h-4" /> Message
          </Button>
        </div>
      </div>
    </div>
  );
}
