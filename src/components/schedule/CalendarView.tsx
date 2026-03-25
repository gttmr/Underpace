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

  const meetingsByDate = meetings.reduce<Record<string, MeetingForCalendar[]>>((acc, meeting) => {
    acc[meeting.date] = acc[meeting.date] ?? [];
    acc[meeting.date].push(meeting);
    return acc;
  }, {});

  const marathonsByDate = marathons.reduce<Record<string, MarathonForCalendar[]>>((acc, marathon) => {
    acc[marathon.date] = acc[marathon.date] ?? [];
    acc[marathon.date].push(marathon);
    return acc;
  }, {});

  function prevMonth() {
    if (month === 0) {
      setYear((currentYear) => currentYear - 1);
      setMonth(11);
    } else {
      setMonth((currentMonth) => currentMonth - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear((currentYear) => currentYear + 1);
      setMonth(0);
    } else {
      setMonth((currentMonth) => currentMonth + 1);
    }
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const selectedMeetings = selectedDate ? (meetingsByDate[selectedDate] ?? []) : [];
  const selectedMarathons = selectedDate ? (marathonsByDate[selectedDate] ?? []) : [];

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function EventDots({ day }: { day: number }) {
    const ds = dateStr(day);
    const dayMeetings = meetingsByDate[ds];
    const dayMarathons = marathonsByDate[ds];

    if (!dayMeetings && !dayMarathons) {
      return null;
    }

    return (
      <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
        {dayMarathons?.map((marathon) => (
          <span key={`mar-${marathon.id}`} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        ))}
        {dayMeetings?.map((meeting) => {
          const isFull = meeting.approvedCount >= meeting.maxCapacity;
          const isClosed = !meeting.isOpen;
          const isSignupReady = isSignupAvailable(meeting);
          const isPast = ds < today;
          const color = isPast || isClosed
            ? "bg-slate-300"
            : !isSignupReady
            ? "bg-amber-400"
            : "bg-blue-500";

          return <span key={`meet-${meeting.id}`} className={`w-1.5 h-1.5 rounded-full ${color}`} />;
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative flex items-center justify-between px-1">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          ‹
        </button>

        <div className="relative flex-1 flex justify-center">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 font-bold text-slate-800 text-base hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            {year}년 {month + 1}월
            <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 flex gap-4 w-max animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col h-48 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="text-xs font-semibold text-slate-400 mb-2 px-2 sticky top-0 bg-white">연도</div>
                  {Array.from({ length: 11 }, (_, index) => todayDate.getFullYear() - 5 + index).map((value) => (
                    <button
                      key={value}
                      onClick={() => setYear(value)}
                      className={`text-sm px-3 py-1.5 rounded-md text-left transition-colors ${year === value ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      {value}년
                    </button>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-2 px-1">월</div>
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 12 }, (_, index) => index).map((value) => (
                      <button
                        key={value}
                        onClick={() => {
                          setMonth(value);
                          setIsDropdownOpen(false);
                        }}
                        className={`text-sm w-12 py-2 rounded-md transition-colors ${month === value ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50"}`}
                      >
                        {value + 1}월
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
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 text-center">
        {DAY_HEADERS.map((day, index) => (
          <div
            key={day}
            className={`text-xs font-semibold py-1 ${
              index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-slate-400"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} />;
          }

          const ds = dateStr(day);
          const isToday = ds === today;
          const isSelected = ds === selectedDate;
          const hasMeeting = !!meetingsByDate[ds] || !!marathonsByDate[ds];
          const column = index % 7;

          return (
            <button
              key={ds}
              onClick={() => setSelectedDate(isSelected ? null : ds)}
              className={`flex flex-col items-center py-1.5 rounded-lg transition-colors
                ${isSelected ? "bg-blue-600 text-white" : isToday ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"}
                ${column === 0 && !isSelected ? "text-red-500" : ""}
                ${column === 6 && !isSelected ? "text-blue-500" : ""}
              `}
            >
              <span className={`text-sm font-semibold leading-none ${isToday && !isSelected ? "underline underline-offset-2" : ""}`}>
                {day}
              </span>
              {hasMeeting && !isSelected && <EventDots day={day} />}
              {hasMeeting && isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 text-xs text-slate-400 px-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />대회</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />신청예정</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />정규신청</span>
      </div>

      {selectedDate && (
        <div className="border-t border-slate-100 pt-4 space-y-2">
          {selectedMeetings.length === 0 && selectedMarathons.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">이 날 일정이 없습니다</p>
          ) : (
            <>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {selectedDate.slice(5).replace("-", "월 ")}일 일정
              </h3>

              {selectedMarathons.map((marathon) => (
                <Link
                  key={`m-${marathon.id}`}
                  href={`/marathon/${marathon.id}`}
                  className="block mt-3 bg-white p-4 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden transition-transform active:scale-[0.98] hover:shadow-md"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400" />
                  <div className="flex justify-between items-center">
                    <div className="flex-1 pr-4">
                      <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded mb-1.5">
                        대회
                      </span>
                      <h4 className="font-bold text-slate-800 text-[15px] mb-1">
                        {marathon.title}
                      </h4>
                      <div className="flex items-center text-xs text-slate-500 space-x-3 mt-2">
                        <span className="flex items-center">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {marathon.startTime}
                        </span>
                        {marathon.location && (
                          <span className="flex items-center truncate max-w-[120px]">
                            <svg className="w-3.5 h-3.5 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{marathon.location}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
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
                    className={`bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 ${isPast || isClosed ? "opacity-60" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-slate-800">
                          {meeting.startTime} – {meeting.endTime}
                        </span>
                        {isClosed && (
                          <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">마감</span>
                        )}
                        {isWaitingForOpen && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">오픈 전</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">📍 {meeting.location}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        정원 {meeting.approvedCount}/{meeting.maxCapacity}명
                        {meeting.waitlistedCount > 0 && (
                          <span className="ml-1.5 text-amber-600">· 대기 {meeting.waitlistedCount}명</span>
                        )}
                      </p>
                      {isWaitingForOpen && (
                        <p className="text-xs text-amber-700 mt-1">신청 시작: {formatSignupOpensAtCompact(meeting.signupOpensAt)}</p>
                      )}
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
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
