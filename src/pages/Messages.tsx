import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow } from "date-fns";

interface ConversationRow {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  created_at: string;
}
interface UserRow { id: string; name: string; avatar_url?: string; }
interface ListingRow { id: string; title: string; photos: string[]; price: number; }
interface MessageRow { id: string; conversation_id: string; sender_id: string; body: string; created_at: string; }
interface ConversationDisplay {
  id: string;
  otherUser: UserRow;
  listing?: ListingRow;
  lastMessage?: MessageRow;
  unread: boolean;
}

function getLastRead(conversationId: string): string | null {
  return localStorage.getItem(`rewear_read_${conversationId}`);
}

export function markConversationRead(conversationId: string) {
  localStorage.setItem(`rewear_read_${conversationId}`, new Date().toISOString());
}

export function getUnreadCount(convs: ConversationDisplay[]): number {
  return convs.filter(c => c.unread).length;
}

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<ConversationDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      const { data: convs } = await supabase
        .from("conversations")
        .select("*")
        .or(`buyer_id.eq.${user!.id},seller_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });

      if (!convs || convs.length === 0) { setLoading(false); return; }

      const userIds = [...new Set((convs as ConversationRow[]).flatMap(c => [c.buyer_id, c.seller_id]))];
      const { data: users } = await supabase.from("users").select("id, name, avatar_url").in("id", userIds);

      const listingIds = (convs as ConversationRow[]).map(c => c.listing_id).filter(Boolean) as string[];
      const { data: listings } = listingIds.length > 0
        ? await supabase.from("clothing_listings").select("id, title, photos, price").in("id", listingIds)
        : { data: [] };

      const convIds = (convs as ConversationRow[]).map(c => c.id);
      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false });

      const lastMessageMap: Record<string, MessageRow> = {};
      (messages as MessageRow[] ?? []).forEach(m => {
        if (!lastMessageMap[m.conversation_id]) lastMessageMap[m.conversation_id] = m;
      });

      const userMap: Record<string, UserRow> = {};
      (users as UserRow[] ?? []).forEach(u => { userMap[u.id] = u; });

      const listingMap: Record<string, ListingRow> = {};
      (listings as ListingRow[] ?? []).forEach(l => { listingMap[l.id] = l; });

      const display: ConversationDisplay[] = (convs as ConversationRow[]).map(c => {
        const otherId = c.buyer_id === user!.id ? c.seller_id : c.buyer_id;
        const lastMsg = lastMessageMap[c.id];
        const lastRead = getLastRead(c.id);
        const unread = !!lastMsg &&
          lastMsg.sender_id !== user!.id &&
          (!lastRead || new Date(lastMsg.created_at) > new Date(lastRead));
        return {
          id: c.id,
          otherUser: userMap[otherId] ?? { id: otherId, name: "Unknown" },
          listing: c.listing_id ? listingMap[c.listing_id] : undefined,
          lastMessage: lastMsg,
          unread,
        };
      });

      setConversations(display);
      setLoading(false);
    }
    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-14 pb-4 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight">{t.inbox}</h1>
      </div>

      {loading ? (
        <div className="flex flex-col divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4">
              <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-2/3" />
              </div>
              <Skeleton className="h-3 w-10 shrink-0" />
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 border border-border flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-primary" />
          </motion.div>
          <p className="font-semibold text-base mb-1">{t.noMessagesYet}</p>
          <p className="text-muted-foreground text-sm">{t.startChatting}</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {conversations.map((conv, i) => (
            <ConversationItem key={conv.id} conv={conv} currentUserId={user?.id} delay={i * 0.05}
              onClick={() => { markConversationRead(conv.id); navigate(`/messages/${conv.id}`); }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationItem({ conv, currentUserId, delay, onClick }: {
  conv: ConversationDisplay; currentUserId?: string; delay: number; onClick: () => void;
}) {
  const { t } = useLanguage();
  const lastMsg = conv.lastMessage;
  const timeAgo = lastMsg ? formatDistanceToNow(new Date(lastMsg.created_at), { addSuffix: false }) : null;

  return (
    <motion.button initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}
      onClick={onClick} className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-muted/50 transition-colors">
      <div className="relative shrink-0">
        {conv.listing?.photos[0] ? (
          <img src={conv.listing.photos[0]} alt={conv.listing.title} className="w-14 h-14 rounded-xl object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl">📦</div>
        )}
        <Avatar className="w-6 h-6 absolute -bottom-1 -right-1 border-2 border-background">
          <AvatarImage src={conv.otherUser.avatar_url} />
          <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-bold">{conv.otherUser.name[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        {conv.unread && <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${conv.unread ? "font-bold" : "font-semibold"}`}>{conv.otherUser.name}</p>
          {timeAgo && <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>}
        </div>
        {conv.listing && <p className="text-xs text-muted-foreground truncate">{conv.listing.title}</p>}
        {lastMsg && (
          <p className={`text-sm truncate mt-0.5 ${conv.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {lastMsg.sender_id === currentUserId && <span className="text-foreground/60 font-normal">{t.you} </span>}
            {lastMsg.body}
          </p>
        )}
      </div>
    </motion.button>
  );
}
