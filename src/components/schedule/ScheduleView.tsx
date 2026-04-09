"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CapacityBar } from "@/components/ui/CapacityBar";
import CalendarView, { type MeetingForCalendar, type MarathonForCalendar } from "./CalendarView";
import TrainingTab from "./TrainingTab";
import type { SessionUser } from "@/lib/session";
import { formatSignupOpensAtCompact, isSignupAvailable } from "@/lib/meetingSignup";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

type View = "calendar" | "list" | "training";

export default function ScheduleView({
  meetings,
  marathons = [],
  user,
  isCoachOrAdmin = false,
}: {
  meetings: MeetingForCalendar[];
  marathons?: MarathonForCalendar[];
  user: SessionUser | null;
  isCoachOrAdmin?: boolean;
}) {
  const [view, setView] = useState<View>("calendar");
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (authError) {
      alert(`카카오 로그인 중 오류가 발생했습니다.\n에러 코드: ${authError}`);
      window.history.replaceState({}, "", pathname || "/");
    }
  }, [pathname, searchParams]);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = meetings.filter((m) => m.date >= today);
  const past = meetings.filter((m) => m.date < today).reverse();

  function MeetingRow({ meeting, index }: { meeting: MeetingForCalendar; index: number }) {
    const isClosed = !meeting.isOpen;
    const isFull = meeting.approvedCount >= meeting.maxCapacity;
    const isPast = meeting.date < today;
    const isSignupReady = isSignupAvailable(meeting);
    const isWaitingForOpen = !isClosed && !isSignupReady;
    const date = new Date(meeting.date + "T00:00:00");
    const dayName = DAY_KO[date.getDay()];
    const [, month, day] = meeting.date.split("-");
    const isDisabled = isClosed || isPast;

    return (
      <Link
        href={`/meeting/${meeting.id}`}
        className={`animate-fade-up block bg-brand-surface-elevated rounded-2xl border border-brand-primary-border overflow-hidden
                    transition-all duration-200
                    ${isDisabled ? "opacity-50" : "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[rgba(0,29,110,0.08)] active:scale-[0.99]"}`}
        style={{ animationDelay: `${index * 55}ms` }}
      >
        <div className="flex items-stretch px-4 py-4 gap-4">
          {/* date column — race-bib style */}
          <div className="flex flex-col justify-center text-center min-w-[46px] shrink-0">
            <span className="text-[10px] font-black text-brand-text-subtle tracking-widest uppercase leading-none">
              {parseInt(month, 10)}월
            </span>
            <span className={`text-[32px] font-black leading-none my-0.5 ${isDisabled ? "text-brand-text-subtle" : "text-brand-text"}`}>
              {parseInt(day, 10)}
            </span>
            <span className="text-[10px] font-medium text-brand-text-subtle leading-none">
              {dayName}
            </span>
          </div>

          {/* thin divider */}
          <div className="w-px bg-brand-divider shrink-0 self-stretch my-0.5" />

          {/* info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-brand-text">
                {meeting.startTime} – {meeting.endTime}
              </span>
              {isClosed && (
                <span className="text-[10px] font-bold bg-brand-dimmed text-brand-dimmed-text px-1.5 py-0.5 rounded-full tracking-wide">마감</span>
              )}
              {isWaitingForOpen && (
                <span className="text-[10px] font-bold bg-brand-dimmed text-brand-dimmed-text px-1.5 py-0.5 rounded-full">오픈 전</span>
              )}
            </div>

            <p className="text-xs text-brand-text-subtle truncate">📍 {meeting.location}</p>

            <div>
              <CapacityBar current={meeting.approvedCount} max={meeting.maxCapacity} showLabel={false} />
              <p className="text-[10px] text-brand-text-subtle mt-0.5">
                {meeting.approvedCount}/{meeting.maxCapacity}명
                {meeting.waitlistedCount > 0 && (
                  <span className="ml-1.5 brand-chip-soft px-1.5 py-0.5 rounded-full">대기 {meeting.waitlistedCount}명</span>
                )}
              </p>
              {isWaitingForOpen && (
                <p className="text-[10px] text-brand-text-subtle mt-0.5">신청 시작: {formatSignupOpensAtCompact(meeting.signupOpensAt)}</p>
              )}
            </div>
          </div>

          {/* chevron */}
          <div className="shrink-0 flex items-center">
            <svg className="w-4 h-4 text-brand-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    );
  }


  return (
    <>
      {/* tab bar */}
      <div className="flex bg-brand-surface rounded-xl p-1 gap-1">
        {(["calendar", "list", "training"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-bold transition-all duration-150
              ${view === v
                ? "bg-white text-brand-text shadow-sm"
                : "text-brand-text-muted hover:text-brand-text"}`}
          >
            {v === "calendar" ? "달력" : v === "list" ? "목록" : "훈련"}
          </button>
        ))}
      </div>

      {view === "calendar" && <CalendarView meetings={meetings} marathons={marathons} />}

      {view === "training" && <TrainingTab isCoach={isCoachOrAdmin} />}

      {view === "list" && (
        <div className="space-y-3 animate-fade-in">
          {upcoming.map((meeting, i) => (
            <MeetingRow key={meeting.id} meeting={meeting} index={i} />
          ))}
          {past.map((meeting, i) => (
            <MeetingRow key={meeting.id} meeting={meeting} index={i} />
          ))}
          {meetings.length === 0 && (
            <div className="text-center py-20 text-brand-text-subtle">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-bold">등록된 일정이 없습니다</p>
            </div>
          )}
        </div>
      )}

    </>
  );
}
