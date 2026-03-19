"use client";

import { useState } from "react";
import Link from "next/link";
import { CapacityBar } from "@/components/ui/CapacityBar";
import CalendarView, { type MeetingForCalendar } from "./CalendarView";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

type View = "calendar" | "list";

export default function ScheduleView({ meetings }: { meetings: MeetingForCalendar[] }) {
  const [view, setView] = useState<View>("calendar");

  const today = new Date().toISOString().split("T")[0];
  const upcoming = meetings.filter((m) => m.date >= today);
  const past = meetings.filter((m) => m.date < today).reverse();

  function MeetingRow({ m }: { m: MeetingForCalendar }) {
    const isClosed = !m.isOpen;
    const isFull = m.approvedCount >= m.maxCapacity;
    const isPast = m.date < today;
    const date = new Date(m.date + "T00:00:00");
    const dayName = DAY_KO[date.getDay()];
    const [, month, day] = m.date.split("-");

    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 ${isClosed || isPast ? "opacity-60" : ""}`}>
        <div className="text-center min-w-[52px]">
          <p className="text-xs text-slate-500">{parseInt(month)}월</p>
          <p className="text-2xl font-extrabold text-slate-900 leading-none">{parseInt(day)}</p>
          <p className="text-xs text-slate-500">{dayName}요일</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
          <div className="mt-2">
            <CapacityBar current={m.approvedCount} max={m.maxCapacity} showLabel={false} />
            <p className="text-xs text-slate-400 mt-0.5">{m.approvedCount}/{m.maxCapacity}명</p>
          </div>
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
  }

  return (
    <>
      {/* View toggle */}
      <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
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

      {/* Calendar view */}
      {view === "calendar" && <CalendarView meetings={meetings} />}

      {/* List view */}
      {view === "list" && (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">예정된 모임</h2>
              <div className="space-y-3">
                {upcoming.map((m) => <MeetingRow key={m.id} m={m} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">지난 모임</h2>
              <div className="space-y-3">
                {past.map((m) => <MeetingRow key={m.id} m={m} />)}
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
    </>
  );
}
