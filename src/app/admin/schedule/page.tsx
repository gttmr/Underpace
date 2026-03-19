"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

interface Schedule {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  maxCapacity: number;
  description: string | null;
  isActive: boolean;
}

interface Meeting {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxCapacity: number;
  description: string | null;
  isOpen: boolean;
  isOverridden: boolean;
  scheduleId: number | null;
  approvedCount: number;
}

function ScheduleForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Schedule>;
  onSave: (data: Partial<Schedule>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    dayOfWeek: initial?.dayOfWeek ?? 6,
    startTime: initial?.startTime ?? "10:00",
    endTime: initial?.endTime ?? "12:00",
    location: initial?.location ?? "",
    maxCapacity: initial?.maxCapacity ?? 20,
    description: initial?.description ?? "",
  });

  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">요일</label>
          <select
            value={form.dayOfWeek}
            onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
          >
            {DAY_KO.map((d, i) => (
              <option key={i} value={i}>{d}요일</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">최대 정원</label>
          <input
            type="number"
            value={form.maxCapacity}
            onChange={(e) => setForm((f) => ({ ...f, maxCapacity: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">시작 시간</label>
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">종료 시간</label>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-1">장소</label>
        <input
          type="text"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
          placeholder="강남구민체육관 3코트"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-1">설명 (선택)</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="추가 안내사항"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(form)}
          disabled={!form.location}
          className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-semibold transition-colors"
        >
          저장
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}

function MeetingOverrideModal({
  meeting,
  onSave,
  onClose,
}: {
  meeting: Meeting;
  onSave: (data: Partial<Meeting>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    location: meeting.location,
    maxCapacity: meeting.maxCapacity,
    description: meeting.description ?? "",
    isOpen: meeting.isOpen,
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">특정 날 수정</h3>
          <span className="text-sm text-slate-500">{meeting.date}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">시작 시간</label>
            <input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">종료 시간</label>
            <input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">장소</label>
          <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">최대 정원</label>
          <input type="number" value={form.maxCapacity} onChange={(e) => setForm((f) => ({ ...f, maxCapacity: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500" />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">설명</label>
          <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="isOpen" checked={form.isOpen} onChange={(e) => setForm((f) => ({ ...f, isOpen: e.target.checked }))}
            className="w-4 h-4 accent-blue-600" />
          <label htmlFor="isOpen" className="text-sm text-slate-700">신청 오픈</label>
        </div>

        <div className="flex gap-2">
          <button onClick={() => onSave(form)} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors">
            저장
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors">
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [sRes, mRes] = await Promise.all([
      fetch("/api/schedules"),
      fetch("/api/meetings"),
    ]);
    setSchedules(await sRes.json());
    const meetingsData = await mRes.json();
    setMeetings(meetingsData);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreateSchedule(data: Partial<Schedule>) {
    await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowForm(false);
    load();
  }

  async function handleUpdateSchedule(id: number, data: Partial<Schedule>) {
    await fetch(`/api/schedules/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setEditingId(null);
    load();
  }

  async function handleToggleActive(schedule: Schedule) {
    await fetch(`/api/schedules/${schedule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !schedule.isActive }),
    });
    load();
  }

  async function handleSaveMeetingOverride(meetingId: number, data: Partial<Meeting>) {
    await fetch(`/api/meetings/${meetingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSelectedMeeting(null);
    load();
  }

  // 이번 달 + 다음달 캘린더
  const today = new Date();
  const calDates: { date: string; meetings: Meeting[] }[] = [];
  for (let d = 0; d < 60; d++) {
    const dt = new Date(today);
    dt.setDate(today.getDate() + d);
    const dateStr = dt.toISOString().split("T")[0];
    const dayMeetings = meetings.filter((m) => m.date === dateStr);
    if (dayMeetings.length > 0) {
      calDates.push({ date: dateStr, meetings: dayMeetings });
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-16 text-slate-400">불러오는 중...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold text-slate-900">일정 관리</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        >
          + 새 반복 일정
        </button>
      </div>

      {/* 반복 일정 등록 폼 */}
      {showForm && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-700 mb-2">새 반복 일정 등록</h2>
          <ScheduleForm onSave={handleCreateSchedule} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* 반복 일정 목록 */}
      <section className="mb-8">
        <h2 className="text-sm font-bold text-slate-700 mb-3">반복 일정</h2>
        <div className="space-y-3">
          {schedules.map((s) => (
            <div key={s.id}>
              {editingId === s.id ? (
                <ScheduleForm
                  initial={s}
                  onSave={(data) => handleUpdateSchedule(s.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className={`bg-white rounded-xl border p-4 flex items-start justify-between gap-3 ${!s.isActive ? "opacity-50" : "border-slate-200"}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800 text-sm">
                        매주 {DAY_KO[s.dayOfWeek]}요일
                      </span>
                      {!s.isActive && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">비활성</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {s.startTime}–{s.endTime} | {s.location} | 최대 {s.maxCapacity}명
                    </p>
                    {s.description && <p className="text-xs text-slate-400 mt-0.5">{s.description}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setEditingId(s.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleToggleActive(s)}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      {s.isActive ? "비활성화" : "활성화"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {schedules.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">등록된 반복 일정이 없습니다</p>
          )}
        </div>
      </section>

      {/* 모임 캘린더 */}
      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3">향후 모임 일정</h2>
        <div className="space-y-2">
          {calDates.map(({ date, meetings: dayMeetings }) => {
            const d = new Date(date + "T00:00:00");
            const [, month, day] = date.split("-");
            return (
              <div key={date} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-slate-800">
                    {parseInt(month)}월 {parseInt(day)}일 ({DAY_KO[d.getDay()]})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {dayMeetings.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">{m.startTime}–{m.endTime}</span>
                        <span className="text-slate-400 text-xs truncate max-w-[120px]">{m.location}</span>
                        {m.isOverridden && (
                          <span className="text-xs text-amber-600" title="반복 일정에서 수정됨">⚙</span>
                        )}
                        {!m.isOpen && (
                          <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">마감</span>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedMeeting(m)}
                        className="text-xs text-blue-600 hover:underline shrink-0"
                      >
                        수정
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {calDates.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">예정된 모임이 없습니다</p>
          )}
        </div>
      </section>

      {/* 특정 날 수정 모달 */}
      {selectedMeeting && (
        <MeetingOverrideModal
          meeting={selectedMeeting}
          onSave={(data) => handleSaveMeetingOverride(selectedMeeting.id, data)}
          onClose={() => setSelectedMeeting(null)}
        />
      )}
    </AdminLayout>
  );
}
