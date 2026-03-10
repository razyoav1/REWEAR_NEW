import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}

export function AdminPagination({ page, pageSize, total, onPage }: AdminPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-1 pt-4">
      <p className="text-xs text-muted-foreground">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className={cn("w-8 h-8 rounded-xl border border-border flex items-center justify-center transition-colors",
            page <= 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-muted")}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold px-2">{page} / {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className={cn("w-8 h-8 rounded-xl border border-border flex items-center justify-center transition-colors",
            page >= totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-muted")}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
