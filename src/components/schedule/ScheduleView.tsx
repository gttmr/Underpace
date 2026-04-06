"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CapacityBar } from "@/components/ui/CapacityBar";
import CalendarView, { type MeetingForCalendar, type MarathonForCalendar } from "./CalendarView";
import MarathonRegistrationModal from "@/components/marathon/MarathonRegistrationModal";
import type { SessionUser } from "@/lib/session";
import { formatSignupOpensAtCompact, isSignupAvailable } from "@/lib/meetingSignup";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

type View = "calendar" | "list";

export default function ScheduleView({
  meetings,
  marathons = [],
  user,
}: {
  meetings: MeetingForCalendar[];
  marathons?: MarathonForCalendar[];
  user: SessionUser | null;
}) {
  const [view, setView] = useState<View>("calendar");
  const [isMarathonModalOpen, setIsMarathonModalOpen] = useState(false);
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
      <div
        className={`animate-fade-up relative bg-white rounded-2xl border border-[#7fb5ff] overflow-hidden
                    transition-all duration-200
                    ${isDisabled ? "opacity-50" : "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[rgba(0,29,110,0.08)]"}`}
        style={{ animationDelay: `${index * 55}ms` }}
      >
        {/* left accent bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${isDisabled ? "bg-[rgba(0,29,110,0.15)]" : "bg-[#001d6e]"}`} />

        <div className="flex items-stretch pl-5 pr-4 py-4 gap-4">
          {/* date column — race-bib style */}
          <div className="flex flex-col justify-center text-center min-w-[46px] shrink-0">
            <span className="text-[10px] font-black text-[rgba(0,29,110,0.45)] tracking-widest uppercase leading-none">
              {parseInt(month, 10)}월
            </span>
            <span className={`text-[32px] font-black leading-none my-0.5 ${isDisabled ? "text-[rgba(0,29,110,0.3)]" : "text-[#001d6e]"}`}>
              {parseInt(day, 10)}
            </span>
            <span className="text-[10px] font-medium text-[rgba(0,29,110,0.45)] leading-none">
              {dayName}
            </span>
          </div>

          {/* thin divider */}
          <div className="w-px bg-[rgba(0,29,110,0.1)] shrink-0 self-stretch my-0.5" />

          {/* info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-bold text-[#001d6e]">
                {meeting.startTime} – {meeting.endTime}
              </span>
              {isClosed && (
                <span className="text-[10px] font-bold bg-[#e5e7eb] text-[#6b7280] px-1.5 py-0.5 rounded-full tracking-wide">마감</span>
              )}
              {isWaitingForOpen && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">오픈 전</span>
              )}
            </div>

            <p className="text-xs text-[rgba(0,29,110,0.55)] truncate">📍 {meeting.location}</p>

            <div>
              <CapacityBar current={meeting.approvedCount} max={meeting.maxCapacity} showLabel={false} />
              <p className="text-[10px] text-[rgba(0,29,110,0.45)] mt-0.5">
                {meeting.approvedCount}/{meeting.maxCapacity}명
                {meeting.waitlistedCount > 0 && (
                  <span className="ml-1.5 text-amber-600">· 대기 {meeting.waitlistedCount}명</span>
                )}
              </p>
              {isWaitingForOpen && (
                <p className="text-[10px] text-amber-700 mt-0.5">신청 시작: {formatSignupOpensAtCompact(meeting.signupOpensAt)}</p>
              )}
            </div>
          </div>

          {/* action */}
          <div className="shrink-0 flex items-center">
            {!isPast && !isClosed && !isWaitingForOpen && (
              <Link
                href={`/meeting/${meeting.id}`}
                className={`px-3.5 py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95
                  ${isFull ? "bg-[#7fb5ff] hover:bg-[#6aa3f0]" : "bg-[#001d6e] hover:bg-[#00277a]"}`}
              >
                {isFull ? "대기" : "신청"}
              </Link>
            )}
            {!isPast && !isClosed && isWaitingForOpen && (
              <button
                type="button"
                disabled
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed"
              >
                오픈 전
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 bg-[#001d6e] rounded-full shrink-0" />
        <h2 className="text-xs font-black text-[rgba(0,29,110,0.55)] uppercase tracking-widest">{children}</h2>
      </div>
    );
  }

  return (
    <>
      {/* tab bar */}
      <div className="flex bg-[#c4ddff] rounded-xl p-1 gap-1">
        <div className="flex flex-1 gap-1">
          <button
            onClick={() => setView("calendar")}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-bold transition-all duration-150
              ${view === "calendar"
                ? "bg-white text-[#001d6e] shadow-sm"
                : "text-[rgba(0,29,110,0.5)] hover:text-[#001d6e]"}`}
          >
            달력
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg text-sm font-bold transition-all duration-150
              ${view === "list"
                ? "bg-white text-[#001d6e] shadow-sm"
                : "text-[rgba(0,29,110,0.5)] hover:text-[#001d6e]"}`}
          >
            목록
          </button>
        </div>
        <button
          onClick={() => setIsMarathonModalOpen(true)}
          className="px-3 flex items-center justify-center py-2 rounded-lg text-sm font-black bg-emerald-500 text-white hover:bg-emerald-600 transition-colors ml-1 active:scale-95"
        >
          대회 등록
        </button>
      </div>

      {view === "calendar" && <CalendarView meetings={meetings} marathons={marathons} />}

      {view === "list" && (
        <div className="space-y-8 animate-fade-in">
          {upcoming.length > 0 && (
            <section>
              <SectionLabel>예정된 모임</SectionLabel>
              <div className="space-y-3">
                {upcoming.map((meeting, i) => (
                  <MeetingRow key={meeting.id} meeting={meeting} index={i} />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <SectionLabel>지난 모임</SectionLabel>
              <div className="space-y-3">
                {past.map((meeting, i) => (
                  <MeetingRow key={meeting.id} meeting={meeting} index={i} />
                ))}
              </div>
            </section>
          )}
          {meetings.length === 0 && (
            <div className="text-center py-20 text-[rgba(0,29,110,0.35)]">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-bold">등록된 일정이 없습니다</p>
            </div>
          )}
        </div>
      )}

      <MarathonRegistrationModal
        isOpen={isMarathonModalOpen}
        onClose={() => setIsMarathonModalOpen(false)}
        user={user}
        returnTo={pathname || "/"}
      />
    </>
  );
}
