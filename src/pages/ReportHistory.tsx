import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Flag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useReports, type ReportStatus } from "@/hooks/useReports";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const STATUS_STYLES: Record<ReportStatus, string> = {
  open: "bg-blue-500/20 text-blue-400",
  under_review: "bg-yellow-500/20 text-yellow-400",
  resolved: "bg-secondary/20 text-secondary",
  dismissed: "bg-muted text-muted-foreground",
};

export default function ReportHistory() {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { myReports, isLoading } = useReports();

  const STATUS_LABELS: Record<ReportStatus, string> = {
    open: t.statusOpen,
    under_review: t.statusUnderReview,
    resolved: t.statusResolved,
    dismissed: t.statusDismissed,
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
          <BackIcon className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{t.reportHistoryTitle}</h1>
      </div>

      {isLoading ? (
        <div className="px-5 pt-6 space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : myReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
          <Flag className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-bold mb-1">{t.noReportsSubmitted}</h2>
          <p className="text-muted-foreground text-sm">{t.reportsWillAppear}</p>
        </div>
      ) : (
        <div className="px-5 pt-4 space-y-3">
          {myReports.map((report, i) => (
            <motion.div key={report.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl bg-card border border-border space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm capitalize">{report.entity_type} {t.reportLabel}</p>
                  <p className="text-xs text-muted-foreground capitalize">{report.reason.replace(/_/g, " ")}</p>
                </div>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", STATUS_STYLES[report.status])}>
                  {STATUS_LABELS[report.status]}
                </span>
              </div>
              {report.details && <p className="text-xs text-muted-foreground">{report.details}</p>}
              {report.resolution_note && (
                <div className="text-xs bg-muted/50 rounded-lg p-2">
                  <span className="font-semibold">{t.adminNote}</span>{report.resolution_note}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                {t.submittedLabel} {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
