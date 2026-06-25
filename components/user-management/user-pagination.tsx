import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { UsersListMeta } from "@/types/users-api";

export function UserPagination({
  meta,
  page,
  onPageChange,
  disabled,
}: {
  meta: UsersListMeta | null;
  page: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (!meta || meta.totalPages <= 1) return null;

  const start = (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: "16px",
        gap: "12px",
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: "13px", color: "#9C8573" }}>
        Showing {start}–{end} of {meta.total}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 gap-1"
        >
          <ChevronLeft size={14} />
          Previous
        </Button>
        <span style={{ fontSize: "13px", color: "#6B5744", minWidth: "80px", textAlign: "center" }}>
          Page {page} of {meta.totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || page >= meta.totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 gap-1"
        >
          Next
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}
