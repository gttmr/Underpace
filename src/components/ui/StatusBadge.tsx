import type { ParticipantStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: ParticipantStatus;
  waitlistPosition?: number | null;
  size?: "sm" | "md";
}

const STATUS_CONFIG: Record<ParticipantStatus, { label: string; bg: string; text: string; dot: string }> = {
  PENDING: {
    label: "검토 중",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  APPROVED: {
    label: "승인됨",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  WAITLISTED: {
    label: "대기자",
    bg: "bg-brand-surface",
    text: "text-brand-text",
    dot: "bg-brand-primary",
  },
  REJECTED: {
    label: "거절됨",
    bg: "bg-slate-100",
    text: "text-slate-500",
    dot: "bg-slate-400",
  },
};

export function StatusBadge({ status, waitlistPosition, size = "md" }: StatusBadgeProps) {
  const c = STATUS_CONFIG[status];
  const label =
    status === "WAITLISTED" && waitlistPosition ? `대기 ${waitlistPosition}번째` : c.label;

  const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold border border-[rgba(0,0,0,0.06)] ${c.bg} ${c.text} ${sizeClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {label}
    </span>
  );
}
