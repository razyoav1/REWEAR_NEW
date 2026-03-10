import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ShieldOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlocks } from "@/hooks/useBlocks";
import { useLanguage } from "@/contexts/LanguageContext";
import { getInitials } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

export default function BlockedUsers() {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { blockedUsers, isLoading, unblockUser } = useBlocks();
  const [unblocking, setUnblocking] = useState<string | null>(null);

  async function handleUnblock(id: string) {
    setUnblocking(id);
    await unblockUser(id);
    setUnblocking(null);
  }

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          <BackIcon className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{t.blockedUsersTitle}</h1>
      </div>

      {isLoading ? (
        <div className="px-5 pt-6 space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : blockedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <ShieldOff className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-bold mb-1">{t.noBlockedUsers}</h2>
          <p className="text-muted-foreground text-sm">{t.usersYouBlock}</p>
        </div>
      ) : (
        <div className="px-5 pt-4 space-y-2">
          {blockedUsers.map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
              <Avatar className="w-11 h-11 shrink-0">
                <AvatarFallback className="text-sm bg-muted">{getInitials(u.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{u.name}</p>
                <p className="text-[10px] text-muted-foreground">{t.blockedAgo} {formatDistanceToNow(new Date(u.blocked_at), { addSuffix: true })}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleUnblock(u.id)} disabled={unblocking === u.id}>
                {unblocking === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t.unblock}
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
