import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function SavedSearches() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">Saved Searches</h1>
      </div>
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>
          <Bookmark className="w-12 h-12 text-primary mb-4" />
        </motion.div>
        <h2 className="text-lg font-bold mb-2">No saved searches</h2>
        <p className="text-muted-foreground text-sm">Save your frequent searches to quickly rerun them.</p>
      </div>
    </div>
  );
}
