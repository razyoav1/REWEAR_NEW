import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ReportEntityType = "listing" | "user" | "review" | "conversation";

export const REPORT_REASONS = [
  { value: "scam", label: "Scam / Fraud" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misleading", label: "Misleading information" },
  { value: "harassment", label: "Harassment" },
  { value: "spam", label: "Spam" },
  { value: "counterfeit", label: "Counterfeit item" },
  { value: "other", label: "Other" },
];

export interface MyReport {
  id: string;
  entity_type: ReportEntityType;
  entity_id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
}

// The reports table uses separate FK columns per entity type (not a generic entity_id).
function buildReportRow(userId: string, entityType: ReportEntityType, entityId: string, reason: string, details?: string) {
  const base = { reporter_id: userId, reason, details: details ?? null };
  switch (entityType) {
    case "listing":      return { ...base, listing_id: entityId };
    case "user":         return { ...base, reported_user_id: entityId };
    case "review":       return { ...base, review_id: entityId };
    case "conversation": return { ...base, conversation_id: entityId };
    default:             return base;
  }
}

export function useReports() {
  const { user } = useAuth();
  const [myReports, setMyReports] = useState<MyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyReports = useCallback(async () => {
    if (!user?.id) { setIsLoading(false); return; }
    setIsLoading(true);
    const { data } = await supabase
      .from("reports").select("*").eq("reporter_id", user.id).order("created_at", { ascending: false });
    // Normalize raw rows to a UI-friendly shape
    const normalized: MyReport[] = (data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      entity_type: (r.listing_id ? "listing" : r.reported_user_id ? "user" : r.review_id ? "review" : "conversation") as ReportEntityType,
      entity_id: (r.listing_id ?? r.reported_user_id ?? r.review_id ?? r.conversation_id ?? "") as string,
      reason: r.reason as string,
      details: r.details as string | null,
      status: "open",
      created_at: r.created_at as string,
    }));
    setMyReports(normalized);
    setIsLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchMyReports(); }, [fetchMyReports]);

  const submitReport = useCallback(async (params: {
    entityType: ReportEntityType;
    entityId: string;
    reason: string;
    details?: string;
  }) => {
    if (!user?.id) { toast.error("Please sign in"); return false; }
    try {
      const row = buildReportRow(user.id, params.entityType, params.entityId, params.reason, params.details);
      const { error } = await supabase.from("reports").insert(row);
      if (error) throw error;
      toast.success("Report submitted. Thank you!");
      return true;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report");
      return false;
    }
  }, [user?.id]);

  return { myReports, isLoading, submitReport, refetch: fetchMyReports };
}
