import { motion } from "framer-motion";
import { SlidersHorizontal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Placeholder discover page — swipe cards will be built here
export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Discover <span className="gradient-text">Drops</span>
          </h1>
          <p className="text-muted-foreground text-sm">Swipe to find your next fit</p>
        </div>
        <Button variant="outline" size="icon">
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-5 pb-4 overflow-x-auto no-scrollbar">
        {["All", "Tops", "Bottoms", "Shoes", "Accessories"].map((cat, i) => (
          <Badge
            key={cat}
            variant={i === 0 ? "pink" : "outline"}
            className="whitespace-nowrap cursor-pointer text-xs py-1 px-3"
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Swipe card placeholder */}
      <div className="flex items-center justify-center px-5" style={{ height: "calc(100vh - 280px)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-sm aspect-[3/4] rounded-3xl bg-card border border-border overflow-hidden shadow-card flex flex-col items-center justify-center gap-4 text-center p-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">Swipe Cards</h3>
            <p className="text-muted-foreground text-sm">
              The discover feed with swipe-to-like cards will be built here next.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/20 border-2 border-destructive/40 flex items-center justify-center text-lg">✕</div>
            <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-lg">♥</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
