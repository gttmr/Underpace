"use client";

import { useState } from "react";
import Link from "next/link";

const DAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];

export type MeetingForCalendar = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxCapacity: number;
  isOpen: boolean;
  approvedCount: number;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarView({ meetings }: { meetings: MeetingForCalendar[] }) {
  const today = new Date().toISOString().split("T")[0];
  const todayDate = new Date();

  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(today);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // meetings grouped by date
  const meetingsByDate = meetings.reduce<Record<string, MeetingForCalendar[]>>((acc, m) => {
    acc[m.date] = acc[m.date] ?? [];
    acc[m.date].push(m);
    return acc;
  }, {});

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  // build calendar cells: nulls for leading empty days, then day numbers
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedMeetings = selectedDate ? (meetingsByDate[selectedDate] ?? []) : [];

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function MeetingDots({ day }: { day: number }) {
    const ds = dateStr(day);
    const ms = meetingsByDate[ds];
    if (!ms) return null;
    return (
      <div className="flex justify-center gap-0.5 mt-0.5 flex-wrap">
        {ms.map((m) => {
          const isFull = m.approvedCount >= m.maxCapacity;
          const isClosed = !m.isOpen;
          const isPast = ds < today;
          const color = isPast || isClosed
            ? "bg-slate-300"
            : isFull
            ? "bg-red-400"
            : "bg-blue-500";
          return <span key={m.id} className={`w-1.5 h-1.5 rounded-full ${color}`} />;
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          ‹
        </button>
        <span className="font-bold text-slate-800 text-base">
          {year}년 {month + 1}월
        </span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center">
        {DAY_HEADERS.map((d, i) => (
          <div
            key={d}
            className={`text-xs font-semibold py-1 ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-slate-400"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const ds = dateStr(day);
          const isToday = ds === today;
          const isSelected = ds === selectedDate;
          const hasMeeting = !!meetingsByDate[ds];
          const col = idx % 7;

          return (
            <button
              key={ds}
              onClick={() => setSelectedDate(isSelected ? null : ds)}
              className={`flex flex-col items-center py-1.5 rounded-lg transition-colors
                ${isSelected ? "bg-blue-600 text-white" : isToday ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50"}
                ${col === 0 && !isSelected ? "text-red-500" : ""}
                ${col === 6 && !isSelected ? "text-blue-500" : ""}
              `}
            >
              <span className={`text-sm font-semibold leading-none ${isToday && !isSelected ? "underline underline-offset-2" : ""}`}>
                {day}
              </span>
              {hasMeeting && !isSelected && <MeetingDots day={day} />}
              {hasMeeting && isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs text-slate-400 px-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />신청 가능</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />정원마감</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />마감/종료</span>
      </div>

      {/* Selected date meetings */}
      {selectedDate && (
        <div className="border-t border-slate-100 pt-4 space-y-2">
          {selectedMeetings.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">이 날 일정이 없습니다</p>
          ) : (
            <>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {selectedDate.slice(5).replace("-", "월 ")}일 모임
              </h3>
              {selectedMeetings.map((m) => {
                const isFull = m.approvedCount >= m.maxCapacity;
                const isClosed = !m.isOpen;
                const isPast = selectedDate < today;
                return (
                  <div
                    key={m.id}
                    className={`bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 ${isPast || isClosed ? "opacity-60" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-slate-800">
                          {m.startTime} – {m.endTime}
                        </span>
                        {isClosed && (
                          <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">마감</span>
                        )}
                        {!isClosed && isFull && (
                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">정원마감</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">📍 {m.location}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{m.approvedCount}/{m.maxCapacity}명</p>
                    </div>
                    {!isPast && !isClosed && (
                      <Link
                        href={`/meeting/${m.id}`}
                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors
                          ${isFull ? "bg-blue-400 hover:bg-blue-500" : "bg-blue-600 hover:bg-blue-700"}`}
                      >
                        {isFull ? "대기 신청" : "신청"}
                      </Link>
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
