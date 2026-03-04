import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/types";

export default function Preferences() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">Preferences</h1>
      </div>

      <div className="px-5 flex flex-col gap-6">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Categories</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Badge key={cat} variant="outline" className="cursor-pointer py-1.5 px-3 text-sm">
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Sizes</p>
          <p className="text-sm text-muted-foreground">Size preferences will be configurable here.</p>
        </div>
      </div>
    </div>
  );
}
