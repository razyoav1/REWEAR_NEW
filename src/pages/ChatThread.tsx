import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatThread() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-14 pb-4 border-b border-border">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 shrink-0" />
        <div>
          <p className="font-semibold text-sm">Conversation #{id?.slice(0, 6)}</p>
          <p className="text-xs text-muted-foreground">Active now</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        <p className="text-center text-xs text-muted-foreground">Messages will appear here</p>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border" style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}>
        <Input placeholder="Message…" className="flex-1" />
        <Button size="icon">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
