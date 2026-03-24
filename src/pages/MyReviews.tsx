import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Star, Flag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useReviews } from "@/hooks/useReviews";
import { useReports, REPORT_REASONS } from "@/hooks/useReports";
import { getInitials, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function MyReviews() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const { reviews, ratingStats, isLoading } = useReviews(user?.id);
  const { submitReport } = useReports();

  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("inappropriate");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </button>
        <h1 className="text-xl font-bold">{t.myReviewsTitle}</h1>
      </div>

      {isLoading ? (
        <div className="px-5 pt-6 space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <Star className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-bold mb-1">{t.noReviewsYet}</h2>
          <p className="text-muted-foreground text-sm">{t.reviewsWillAppear}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-1 px-5 py-6 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black">{ratingStats.avg.toFixed(1)}</span>
              <div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={cn("w-5 h-5", s <= Math.round(ratingStats.avg) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{ratingStats.count} review{ratingStats.count !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>

          <div className="px-5 pt-4">
            {reviews.map((review, i) => (
              <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="flex gap-3 py-4 border-b border-border last:border-0">
                <button onClick={() => navigate(`/users/${review.reviewer_id}`)}>
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={review.reviewer_avatar ?? undefined} />
                    <AvatarFallback className="text-sm bg-muted">{getInitials(review.reviewer_name)}</AvatarFallback>
                  </Avatar>
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={() => navigate(`/users/${review.reviewer_id}`)} className="font-semibold text-sm hover:underline">
                      {review.reviewer_name}
                    </button>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={cn("w-3.5 h-3.5", s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                    ))}
                  </div>
                  {review.text && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{review.text}</p>}
                </div>
                <button
                  onClick={() => { setReportingReviewId(review.id); setReportReason("inappropriate"); setReportDetails(""); }}
                  className="shrink-0 self-start mt-1 text-muted-foreground/40 hover:text-destructive transition-colors"
                  title="Report review"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Report review dialog */}
      <Dialog open={!!reportingReviewId} onOpenChange={v => !v && setReportingReviewId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.reportReviewTitle}</DialogTitle>
            <DialogDescription>{t.guidelinesViolation}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {REPORT_REASONS.map(r => (
                <button key={r.value} onClick={() => setReportReason(r.value)}
                  className={cn("px-3 py-1.5 rounded-xl border text-sm font-medium transition-all",
                    reportReason === r.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
                  {r.label}
                </button>
              ))}
            </div>
            <Textarea placeholder={t.additionalDetails} value={reportDetails} onChange={e => setReportDetails(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportingReviewId(null)}>{t.cancel}</Button>
            <Button
              disabled={submittingReport}
              onClick={async () => {
                if (!reportingReviewId) return;
                setSubmittingReport(true);
                await submitReport({ entityType: "review", entityId: reportingReviewId, reason: reportReason, details: reportDetails });
                setSubmittingReport(false);
                setReportingReviewId(null);
              }}
            >
              {submittingReport ? t.submitting : t.submitReport}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
