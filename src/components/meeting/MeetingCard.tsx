import Link from "next/link";
import { CapacityBar } from "@/components/ui/CapacityBar";
import type { MeetingWithCounts } from "@/lib/types";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  if (diff >= 2 && diff <= 7) return "이번 주";
  return "";
}

interface MeetingCardProps {
  meeting: MeetingWithCounts;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const date = new Date(meeting.date + "T00:00:00");
  const dayName = DAY_KO[date.getDay()];
  const dateLabel = getDateLabel(meeting.date);
  const isFull = meeting.approvedCount >= meeting.maxCapacity;
  const isClosed = !meeting.isOpen;

  const [, month, day] = meeting.date.split("-");

  return (
    <Link
      href={`/meeting/${meeting.id}`}
      className="block bg-brand-surface-elevated rounded-2xl border border-brand-primary-border shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[rgba(0,29,110,0.08)] transition-all duration-200 overflow-hidden active:scale-[0.99]"
    >
      {/* date header */}
      <div className="bg-brand-surface px-5 pt-4 pb-4 flex items-end justify-between">
        <div>
          {dateLabel && (
            <p className="text-[10px] font-black text-brand-text tracking-[0.18em] uppercase mb-1">
              {dateLabel}
            </p>
          )}
          <h2 className="text-2xl font-black text-brand-text leading-tight">
            {parseInt(month, 10)}월 {parseInt(day, 10)}일
          </h2>
          <p className="text-sm font-semibold text-brand-text-muted mt-0.5">
            {dayName}요일 정기 모임
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {isClosed && (
            <span className="text-[10px] font-black bg-brand-dimmed text-brand-dimmed-text px-2 py-1 rounded-lg tracking-wide">
              마감
            </span>
          )}
          {!isClosed && isFull && (
            <span className="text-[10px] font-black bg-brand-dimmed text-brand-dimmed-text px-2 py-1 rounded-lg tracking-wide">
              정원 마감
            </span>
          )}
        </div>
      </div>

      {/* body */}
      <div className="px-5 py-4">
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-sm text-brand-text-muted">
            <svg className="w-3.5 h-3.5 shrink-0 text-brand-primary-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{meeting.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-brand-text-muted">
            <svg className="w-3.5 h-3.5 shrink-0 text-brand-primary-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{meeting.startTime} – {meeting.endTime}</span>
          </div>
        </div>

        {meeting.description && (
          <p className="text-sm text-brand-text-subtle mb-4 bg-brand-surface rounded-xl px-3 py-2.5 line-clamp-2">
            {meeting.description}
          </p>
        )}

        <CapacityBar current={meeting.approvedCount} max={meeting.maxCapacity} waitlisted={meeting.waitlistedCount} />
      </div>
    </Link>
  );
}
