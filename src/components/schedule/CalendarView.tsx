"use client";

import { useState } from "react";
import Link from "next/link";
import { formatSignupOpensAtCompact, isSignupAvailable } from "@/lib/meetingSignup";

const DAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];

export type MeetingForCalendar = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxCapacity: number;
  isOpen: boolean;
  signupOpensAt: string | null;
  approvedCount: number;
  waitlistedCount: number;
};

export type MarathonForCalendar = {
  id: number;
  title: string;
  date: string;
  startTime: string;
  location: string | null;
  link: string | null;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarView({
  meetings,
  marathons = [],
}: {
  meetings: MeetingForCalendar[];
  marathons?: MarathonForCalendar[];
}) {
  const today = new Date().toISOString().split("T")[0];
  const todayDate = new Date();

  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(today);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const meetingsByDate = meetings.reduce<Record<string, MeetingForCalendar[]>>((acc, m) => {
    acc[m.date] = acc[m.date] ?? [];
    acc[m.date].push(m);
    return acc;
  }, {});

  const marathonsByDate = marathons.reduce<Record<string, MarathonForCalendar[]>>((acc, m) => {
    acc[m.date] = acc[m.date] ?? [];
    acc[m.date].push(m);
    return acc;
  }, {});

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedMeetings = selectedDate ? (meetingsByDate[selectedDate] ?? []) : [];
  const selectedMarathons = selectedDate ? (marathonsByDate[selectedDate] ?? []) : [];

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function EventDots({ day }: { day: number }) {
    const ds = dateStr(day);
    const dayMeetings = meetingsByDate[ds];
    const dayMarathons = marathonsByDate[ds];
    if (!dayMeetings && !dayMarathons) return null;
    return (
      <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
        {dayMarathons?.map((m) => (
          <span key={`mar-${m.id}`} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        ))}
        {dayMeetings?.map((m) => {
          const isClosed = !m.isOpen;
          const isPast = ds < today;
          const isReady = isSignupAvailable(m);
          const color = isPast || isClosed
            ? "bg-brand-divider"
            : !isReady
            ? "bg-amber-400"
            : "bg-brand-primary";
          return <span key={`meet-${m.id}`} className={`w-1.5 h-1.5 rounded-full ${color}`} />;
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* month navigator */}
      <div className="relative flex items-center justify-between px-1">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-surface text-brand-text transition-colors text-lg font-black"
        >
          ‹
        </button>

        <div className="relative flex-1 flex justify-center">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 font-black text-brand-text text-base hover:bg-brand-surface px-3 py-1.5 rounded-xl transition-colors"
          >
            {year}년 {month + 1}월
            <svg
              className={`w-4 h-4 text-brand-text-subtle transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute top-full mt-1 bg-white border border-brand-primary-border rounded-2xl shadow-xl shadow-[rgba(0,29,110,0.12)] p-3 z-50 flex gap-4 w-max">
                {/* year */}
                <div className="flex flex-col h-48 overflow-y-auto pr-1">
                  <div className="text-[10px] font-black text-brand-text-subtle mb-2 px-2 uppercase tracking-widest sticky top-0 bg-white">연도</div>
                  {Array.from({ length: 11 }, (_, i) => todayDate.getFullYear() - 5 + i).map((v) => (
                    <button
                      key={v}
                      onClick={() => setYear(v)}
                      className={`text-sm px-3 py-1.5 rounded-lg text-left transition-colors font-semibold ${
                        year === v ? "bg-brand-surface text-brand-text font-black" : "text-brand-text-muted hover:bg-brand-surface"
                      }`}
                    >
                      {v}년
                    </button>
                  ))}
                </div>
                {/* month */}
                <div>
                  <div className="text-[10px] font-black text-brand-text-subtle mb-2 px-1 uppercase tracking-widest">월</div>
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 12 }, (_, i) => i).map((v) => (
                      <button
                        key={v}
                        onClick={() => { setMonth(v); setIsDropdownOpen(false); }}
                        className={`text-sm w-11 py-2 rounded-lg transition-colors font-semibold ${
                          month === v ? "bg-brand-primary text-white font-black" : "text-brand-text-muted hover:bg-brand-surface"
                        }`}
                      >
                        {v + 1}월
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-surface text-brand-text transition-colors text-lg font-black"
        >
          ›
        </button>
      </div>

      {/* day-of-week headers */}
      <div className="grid grid-cols-7 text-center">
        {DAY_HEADERS.map((d, i) => (
          <div
            key={d}
            className={`text-[10px] font-black py-1 tracking-wider uppercase ${
              i === 0 ? "text-red-400" : i === 6 ? "text-brand-text" : "text-brand-text-subtle"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* calendar cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;

          const ds = dateStr(day);
          const isToday = ds === today;
          const isSelected = ds === selectedDate;
          const hasMeeting = !!meetingsByDate[ds] || !!marathonsByDate[ds];
          const col = idx % 7;

          const baseTextColor =
            col === 0 ? "text-red-400" :
            col === 6 ? "text-brand-text" :
            "text-brand-text-muted";

          return (
            <button
              key={ds}
              onClick={() => setSelectedDate(isSelected ? null : ds)}
              className="flex flex-col items-center py-0.5 transition-colors rounded-xl hover:bg-[rgba(0,29,110,0.04)]"
            >
              {/* circular number */}
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150
                  ${isSelected
                    ? "bg-brand-primary shadow-md shadow-[rgba(0,29,110,0.25)]"
                    : isToday
                    ? "ring-2 ring-brand-primary"
                    : ""}`}
              >
                <span
                  className={`text-sm font-bold leading-none ${
                    isSelected ? "text-white" :
                    isToday ? "text-brand-text font-black" :
                    baseTextColor
                  }`}
                >
                  {day}
                </span>
              </div>

              {/* event dots */}
              {hasMeeting && !isSelected && <EventDots day={day} />}
              {hasMeeting && isSelected && (
                <span className="w-1 h-1 rounded-full bg-brand-primary-border mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* legend */}
      <div className="flex gap-4 text-[10px] text-brand-text-subtle px-1 font-semibold">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />대회
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />신청예정
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-brand-primary inline-block" />정규신청
        </span>
      </div>

      {/* selected date detail */}
      {selectedDate && (
        <div className="border-t border-brand-divider pt-4 space-y-2 animate-fade-in">
          {selectedMeetings.length === 0 && selectedMarathons.length === 0 ? (
            <p className="text-sm text-brand-text-subtle text-center py-5 font-medium">이 날 일정이 없습니다</p>
          ) : (
            <>
              <p className="text-[10px] font-black text-brand-text-subtle uppercase tracking-widest px-0.5">
                {selectedDate.slice(5).replace("-", "월 ")}일 일정
              </p>

              {selectedMarathons.map((marathon) => (
                <Link
                  key={`m-${marathon.id}`}
                  href={`/marathon/${marathon.id}`}
                  className="block bg-white rounded-xl border border-emerald-200 p-4 relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-400" />
                  <div className="pl-2 flex justify-between items-center">
                    <div className="flex-1 pr-3">
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md mb-1.5 uppercase tracking-wide">
                        대회
                      </span>
                      <h4 className="font-black text-brand-text text-sm mb-1">{marathon.title}</h4>
                      <div className="flex items-center text-[11px] text-brand-text-subtle gap-3">
                        <span>{marathon.startTime}</span>
                        {marathon.location && <span className="truncate max-w-[100px]">{marathon.location}</span>}
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-brand-text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}

              {selectedMeetings.map((meeting) => {
                const isFull = meeting.approvedCount >= meeting.maxCapacity;
                const isClosed = !meeting.isOpen;
                const isPast = selectedDate < today;
                const isSignupReady = isSignupAvailable(meeting);
                const isWaitingForOpen = !isClosed && !isSignupReady;

                return (
                  <div
                    key={`meet-${meeting.id}`}
                    className={`bg-white border border-brand-primary-border rounded-xl p-4 flex items-center gap-3 relative overflow-hidden ${isPast || isClosed ? "opacity-50" : ""}`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${isPast || isClosed ? "bg-brand-divider" : "bg-brand-primary"}`} />
                    <div className="pl-2 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-sm font-bold text-brand-text">
                          {meeting.startTime} – {meeting.endTime}
                        </span>
                        {isClosed && (
                          <span className="text-[10px] font-bold bg-brand-dimmed text-brand-dimmed-text px-1.5 py-0.5 rounded-full">마감</span>
                        )}
                        {isWaitingForOpen && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">오픈 전</span>
                        )}
                      </div>
                      <p className="text-xs text-brand-text-subtle truncate">📍 {meeting.location}</p>
                      <p className="text-[10px] text-brand-text-subtle mt-0.5">
                        {meeting.approvedCount}/{meeting.maxCapacity}명
                        {meeting.waitlistedCount > 0 && (
                          <span className="ml-1.5 text-amber-600">· 대기 {meeting.waitlistedCount}명</span>
                        )}
                      </p>
                      {isWaitingForOpen && (
                        <p className="text-[10px] text-amber-700 mt-0.5">신청 시작: {formatSignupOpensAtCompact(meeting.signupOpensAt)}</p>
                      )}
                    </div>
                    {!isPast && !isClosed && !isWaitingForOpen && (
                      <Link
                        href={`/meeting/${meeting.id}`}
                        className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-black text-white transition-all active:scale-95
                          ${isFull ? "bg-brand-primary-soft-strong hover:opacity-90" : "bg-brand-primary hover:bg-brand-primary-hover"}`}
                      >
                        {isFull ? "대기" : "신청"}
                      </Link>
                    )}
                    {!isPast && !isClosed && isWaitingForOpen && (
                      <button
                        disabled
                        className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-dimmed text-brand-dimmed-text cursor-not-allowed"
                      >
                        오픈 전
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
