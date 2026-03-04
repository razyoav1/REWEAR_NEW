import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function Messages() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
      </div>

      {/* Conversation skeletons */}
      <div className="flex flex-col divide-y divide-border">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>

      {/* Empty hint */}
      <div className="flex flex-col items-center justify-center px-8 py-10 text-center">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/10 border border-border flex items-center justify-center mb-4"
        >
          <MessageCircle className="w-8 h-8 text-primary" />
        </motion.div>
        <p className="text-muted-foreground text-sm">
          Your conversations will appear here.
        </p>
      </div>
    </div>
  );
}
