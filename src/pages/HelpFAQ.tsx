import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const FAQS = [
  { q: "How do I list an item?", a: "Tap the + button on your profile page, upload photos, add details, and publish." },
  { q: "How do payments work?", a: "Rewear facilitates connections between buyers and sellers. Arrange payments directly through messaging." },
  { q: "Can I return an item?", a: "Returns are handled between buyer and seller directly. Check the seller's policy before buying." },
  { q: "How do I report a user?", a: "Visit the user's profile, tap the three dots menu, and select Report." },
  { q: "How do I delete my account?", a: "Go to Settings → Privacy & Safety → Delete Account." },
];

export default function HelpFAQ() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">Help & FAQ</h1>
      </div>

      <div className="px-5 flex flex-col gap-2">
        {FAQS.map(({ q, a }, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex items-center justify-between w-full px-4 py-4 text-left"
            >
              <span className="font-semibold text-sm">{q}</span>
              <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
              </motion.div>
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 pb-4"
                >
                  <p className="text-sm text-muted-foreground">{a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
