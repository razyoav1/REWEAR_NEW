import { Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Wishlist() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Saved</h1>
        <Button variant="outline" size="icon">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-6"
        >
          <Heart className="w-10 h-10 text-primary" />
        </motion.div>
        <h2 className="text-xl font-bold mb-2">Nothing saved yet</h2>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
          Swipe right or tap the heart on any listing to save it here.
        </p>
        <Button>Start Discovering</Button>
      </div>
    </div>
  );
}
