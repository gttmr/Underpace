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

  const [year, month, day] = meeting.date.split("-");
  const displayDate = `${parseInt(month)}월 ${parseInt(day)}일 (${dayName})`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {dateLabel && (
            <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {dateLabel}
            </span>
          )}
          {isClosed && (
            <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
              신청 마감됨
            </span>
          )}
          {!isClosed && isFull && (
            <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              정원 마감
            </span>
          )}
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-3">
        {displayDate} 모임
      </h2>

      <div className="space-y-1.5 mb-4 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <span>📍</span>
          <span>{meeting.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🕐</span>
          <span>{meeting.startTime} – {meeting.endTime}</span>
        </div>
      </div>

      {meeting.description && (
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">{meeting.description}</p>
      )}

      <CapacityBar current={meeting.approvedCount} max={meeting.maxCapacity} waitlisted={meeting.waitlistedCount} />

      <div className="mt-4 flex flex-col gap-2">
        {isClosed ? (
          <button disabled className="w-full py-2.5 rounded-lg bg-slate-100 text-slate-400 font-semibold text-sm cursor-not-allowed">
            신청 마감됨
          </button>
        ) : isFull ? (
          <>
            <button disabled className="w-full py-2.5 rounded-lg bg-slate-100 text-slate-400 font-semibold text-sm cursor-not-allowed">
              정원 마감
            </button>
            <Link
              href={`/meeting/${meeting.id}`}
              className="w-full text-center py-2.5 rounded-lg border border-blue-600 text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-colors"
            >
              대기자로 신청하기
            </Link>
          </>
        ) : (
          <Link
            href={`/meeting/${meeting.id}`}
            className={`w-full text-center py-2.5 rounded-lg font-semibold text-sm text-white transition-colors
              ${meeting.approvedCount / meeting.maxCapacity >= 0.85
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-blue-600 hover:bg-blue-700"
              }`}
          >
            신청하기
          </Link>
        )}
      </div>
    </div>
  );
}
