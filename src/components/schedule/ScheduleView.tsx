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
      alert(`카카오 로그인 중 오류가 발생했습니다.\n에러 코드: ${authError}\n\n(카카오 디벨로퍼스 설정의 Redirect URI 혹은 앱 키를 확인해주세요)`);
      window.history.replaceState({}, "", pathname || "/");
    }
  }, [pathname, searchParams]);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = meetings.filter((meeting) => meeting.date >= today);
  const past = meetings.filter((meeting) => meeting.date < today).reverse();

  function MeetingRow({ meeting }: { meeting: MeetingForCalendar }) {
    const isClosed = !meeting.isOpen;
    const isFull = meeting.approvedCount >= meeting.maxCapacity;
    const isPast = meeting.date < today;
    const isSignupReady = isSignupAvailable(meeting);
    const isWaitingForOpen = !isClosed && !isSignupReady;
    const date = new Date(meeting.date + "T00:00:00");
    const dayName = DAY_KO[date.getDay()];
    const [, month, day] = meeting.date.split("-");

    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 ${isClosed || isPast ? "opacity-60" : ""}`}>
        <div className="text-center min-w-[52px]">
          <p className="text-xs text-slate-500">{parseInt(month, 10)}월</p>
          <p className="text-2xl font-extrabold text-slate-900 leading-none">{parseInt(day, 10)}</p>
          <p className="text-xs text-slate-500">{dayName}요일</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">
              {meeting.startTime} – {meeting.endTime}
            </span>
            {isClosed && (
              <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">마감</span>
            )}
            {isWaitingForOpen && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">오픈 전</span>
            )}
            {!isClosed && isFull && (
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">정원마감</span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">📍 {meeting.location}</p>
          <div className="mt-2">
            <CapacityBar current={meeting.approvedCount} max={meeting.maxCapacity} showLabel={false} />
            <p className="text-xs text-slate-400 mt-0.5">{meeting.approvedCount}/{meeting.maxCapacity}명</p>
            {isWaitingForOpen && (
              <p className="text-xs text-amber-700 mt-1">신청 시작: {formatSignupOpensAtCompact(meeting.signupOpensAt)}</p>
            )}
          </div>
        </div>
        {!isPast && !isClosed && !isWaitingForOpen && (
          <Link
            href={`/meeting/${meeting.id}`}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors
              ${isFull ? "bg-blue-400 hover:bg-blue-500" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {isFull ? "대기 신청" : "신청"}
          </Link>
        )}
        {!isPast && !isClosed && isWaitingForOpen && (
          <button
            type="button"
            disabled
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400 cursor-not-allowed"
          >
            오픈 전
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
        <div className="flex flex-1 gap-1">
          <button
            onClick={() => setView("calendar")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors
              ${view === "calendar" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <span>📅</span> 달력
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors
              ${view === "list" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <span>☰</span> 목록
          </button>
        </div>
        <button
          onClick={() => setIsMarathonModalOpen(true)}
          className="px-3 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-sm ml-2"
        >
          마라톤 등록
        </button>
      </div>

      {view === "calendar" && <CalendarView meetings={meetings} marathons={marathons} />}

      {view === "list" && (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">예정된 모임</h2>
              <div className="space-y-3">
                {upcoming.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">지난 모임</h2>
              <div className="space-y-3">
                {past.map((meeting) => <MeetingRow key={meeting.id} meeting={meeting} />)}
              </div>
            </section>
          )}
          {meetings.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-medium">등록된 일정이 없습니다</p>
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
