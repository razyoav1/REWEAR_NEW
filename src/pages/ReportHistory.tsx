import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportHistory() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">Report History</h1>
      </div>
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <Flag className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-bold mb-2">No reports submitted</h2>
        <p className="text-muted-foreground text-sm">Reports you've submitted will appear here.</p>
      </div>
    </div>
  );
}
