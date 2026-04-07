import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Mail, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const FAQS = [
  { q: "How do I list an item?", a: "Tap the + button on your profile page, upload photos, add details, and publish." },
  { q: "How do payments work?", a: "Rewear facilitates connections between buyers and sellers. Arrange payments directly through messaging." },
  { q: "Can I return an item?", a: "Returns are handled between buyer and seller directly. Check the seller's policy before buying." },
  { q: "How do I report a user?", a: "Visit the user's profile, tap the three dots menu, and select Report." },
  { q: "How do I delete my account?", a: "Go to Settings → Privacy & Safety → Delete Account." },
];

const TICKET_TYPES = [
  { value: "bug", label: "🐛 Bug" },
  { value: "issue", label: "⚠️ Issue" },
  { value: "feature_request", label: "💡 Feature Request" },
  { value: "other", label: "📝 Other" },
] as const;

type TicketType = "bug" | "issue" | "feature_request" | "other";

export default function HelpFAQ() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState<number | null>(null);

  // Bug/issue form
  const [ticketType, setTicketType] = useState<TicketType>("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmitTicket() {
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in both the title and description.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user?.id ?? null,
      type: ticketType,
      title: title.trim(),
      description: description.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit. Please try again.");
      return;
    }
    setSubmitted(true);
    setTitle("");
    setDescription("");
    setTicketType("bug");
  }

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold">Help & FAQ</h1>
      </div>

      <div className="px-5 flex flex-col gap-4 pb-10">
        {/* Contact Support */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <h2 className="font-bold text-base mb-1">Contact Support</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Have a question or need help? Reach out to our support team and we'll get back to you as soon as possible.
          </p>
          <a
            href="mailto:yoavassafapp@gmail.com"
            className="flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <Mail className="w-4 h-4" />
            yoavassafapp@gmail.com
          </a>
        </div>

        {/* Bug / Issue Report Form */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Bug className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-base">Report a Bug or Issue</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Found something that's not working right? Let us know and we'll look into it.
          </p>

          {submitted ? (
            <div className="text-center py-4">
              <p className="text-2xl mb-2">✅</p>
              <p className="font-semibold text-sm">Report submitted!</p>
              <p className="text-xs text-muted-foreground mt-1">Thanks for helping us improve Rewear.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-3 text-xs text-primary underline"
              >
                Submit another
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Type selector */}
              <div className="flex gap-2 flex-wrap">
                {TICKET_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTicketType(value)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      ticketType === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <Input
                placeholder="Short title (e.g. 'App crashes on swipe')"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />

              <Textarea
                placeholder="Describe what happened and how to reproduce it…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={2000}
              />

              {!user && (
                <p className="text-xs text-muted-foreground">
                  You're not logged in — your report will be submitted anonymously.
                </p>
              )}

              <Button
                className="w-full"
                onClick={handleSubmitTicket}
                disabled={submitting || !title.trim() || !description.trim()}
              >
                {submitting ? "Submitting…" : "Submit Report"}
              </Button>
            </div>
          )}
        </div>

        {/* FAQs */}
        <h2 className="font-bold text-base px-1">Frequently Asked Questions</h2>
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
