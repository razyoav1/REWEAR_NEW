import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MyReviews() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">My Reviews</h1>
      </div>
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <Star className="w-12 h-12 text-primary mb-4" />
        <h2 className="text-lg font-bold mb-2">No reviews yet</h2>
        <p className="text-muted-foreground text-sm">Reviews from your buyers and sellers will appear here.</p>
      </div>
    </div>
  );
}
