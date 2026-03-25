"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { formatSignupOpensAt } from "@/lib/meetingSignup";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

interface Schedule {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  maxCapacity: number;
  description: string | null;
  signupOpenDayOfWeek: number | null;
  signupOpenTime: string | null;
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
  signupOpensAt: string | null;
  scheduleId: number | null;
  approvedCount: number;
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  const hour = String(kst.getUTCHours()).padStart(2, "0");
  const minute = String(kst.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
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
  const [useSignupWindow, setUseSignupWindow] = useState(
    initial?.signupOpenDayOfWeek !== null &&
      initial?.signupOpenDayOfWeek !== undefined &&
      initial?.signupOpenTime !== null &&
      initial?.signupOpenTime !== undefined,
  );
  const [form, setForm] = useState({
    dayOfWeek: initial?.dayOfWeek ?? 6,
    startTime: initial?.startTime ?? "10:00",
    endTime: initial?.endTime ?? "12:00",
    location: initial?.location ?? "",
    maxCapacity: initial?.maxCapacity ?? 20,
    description: initial?.description ?? "",
    signupOpenDayOfWeek: initial?.signupOpenDayOfWeek ?? initial?.dayOfWeek ?? 6,
    signupOpenTime: initial?.signupOpenTime ?? "00:00",
  });

  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">요일</label>
          <select
            value={form.dayOfWeek}
            onChange={(e) => {
              const nextDayOfWeek = parseInt(e.target.value, 10);
              setForm((current) => ({
                ...current,
                dayOfWeek: nextDayOfWeek,
                signupOpenDayOfWeek: Math.min(current.signupOpenDayOfWeek, nextDayOfWeek),
              }));
            }}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
          >
            {DAY_KO.map((day, index) => (
              <option key={index} value={index}>{day}요일</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">최대 정원</label>
          <input
            type="number"
            value={form.maxCapacity}
            onChange={(e) => setForm((current) => ({ ...current, maxCapacity: parseInt(e.target.value, 10) }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">시작 시간</label>
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm((current) => ({ ...current, startTime: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">종료 시간</label>
          <input
            type="time"
            value={form.endTime}
            onChange={(e) => setForm((current) => ({ ...current, endTime: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-1">장소</label>
        <input
          type="text"
          value={form.location}
          onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
          placeholder="강남구민체육관 3코트"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-600 block mb-1">설명 (선택)</label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
          placeholder="추가 안내사항"
          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={useSignupWindow}
          onChange={(e) => setUseSignupWindow(e.target.checked)}
          className="w-4 h-4 accent-blue-600"
        />
        이 주의 특정 시각부터 신청 오픈
      </label>
      {useSignupWindow && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">신청 시작 요일</label>
            <select
              value={form.signupOpenDayOfWeek}
              onChange={(e) => setForm((current) => ({ ...current, signupOpenDayOfWeek: parseInt(e.target.value, 10) }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
            >
              {DAY_KO.slice(0, form.dayOfWeek + 1).map((day, index) => (
                <option key={index} value={index}>{day}요일</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">신청 시작 시간</label>
            <input
              type="time"
              value={form.signupOpenTime}
              onChange={(e) => setForm((current) => ({ ...current, signupOpenTime: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() =>
            onSave({
              ...form,
              signupOpenDayOfWeek: useSignupWindow ? form.signupOpenDayOfWeek : null,
              signupOpenTime: useSignupWindow ? form.signupOpenTime : null,
            })
          }
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
    signupOpensAt: toDateTimeLocalValue(meeting.signupOpensAt),
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
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((current) => ({ ...current, startTime: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">종료 시간</label>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((current) => ({ ...current, endTime: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">장소</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">최대 정원</label>
          <input
            type="number"
            value={form.maxCapacity}
            onChange={(e) => setForm((current) => ({ ...current, maxCapacity: parseInt(e.target.value, 10) }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">설명</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-600">신청 시작 시각</label>
            <button
              type="button"
              onClick={() => setForm((current) => ({ ...current, signupOpensAt: "" }))}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              항상 오픈으로 초기화
            </button>
          </div>
          <input
            type="datetime-local"
            value={form.signupOpensAt}
            onChange={(e) => setForm((current) => ({ ...current, signupOpensAt: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
          />
          <p className="text-xs text-slate-400 mt-1">비워두면 언제든 신청할 수 있습니다.</p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isOpen"
            checked={form.isOpen}
            onChange={(e) => setForm((current) => ({ ...current, isOpen: e.target.checked }))}
            className="w-4 h-4 accent-blue-600"
          />
          <label htmlFor="isOpen" className="text-sm text-slate-700">신청 오픈</label>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              onSave({
                ...form,
                signupOpensAt: form.signupOpensAt ? new Date(form.signupOpensAt).toISOString() : null,
              })
            }
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
          >
            저장
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
          >
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
    const [schedulesResponse, meetingsResponse] = await Promise.all([
      fetch("/api/schedules"),
      fetch("/api/meetings"),
    ]);
    setSchedules(await schedulesResponse.json());
    setMeetings(await meetingsResponse.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

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

  const today = new Date();
  const calendarDates: { date: string; meetings: Meeting[] }[] = [];
  for (let offset = 0; offset < 60; offset++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + offset);
    const dateStr = targetDate.toISOString().split("T")[0];
    const dayMeetings = meetings.filter((meeting) => meeting.date === dateStr);
    if (dayMeetings.length > 0) {
      calendarDates.push({ date: dateStr, meetings: dayMeetings });
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

      {showForm && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-700 mb-2">새 반복 일정 등록</h2>
          <ScheduleForm onSave={handleCreateSchedule} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-sm font-bold text-slate-700 mb-3">반복 일정</h2>
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div key={schedule.id}>
              {editingId === schedule.id ? (
                <ScheduleForm
                  initial={schedule}
                  onSave={(data) => handleUpdateSchedule(schedule.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div className={`bg-white rounded-xl border p-4 flex items-start justify-between gap-3 ${!schedule.isActive ? "opacity-50" : "border-slate-200"}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800 text-sm">
                        매주 {DAY_KO[schedule.dayOfWeek]}요일
                      </span>
                      {!schedule.isActive && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">비활성</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {schedule.startTime}–{schedule.endTime} | {schedule.location} | 최대 {schedule.maxCapacity}명
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      신청: {schedule.signupOpenDayOfWeek !== null && schedule.signupOpenTime
                        ? `매주 ${DAY_KO[schedule.signupOpenDayOfWeek]}요일 ${schedule.signupOpenTime}`
                        : "항상 오픈"}
                    </p>
                    {schedule.description && <p className="text-xs text-slate-400 mt-0.5">{schedule.description}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setEditingId(schedule.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleToggleActive(schedule)}
                      className="text-xs text-slate-500 hover:underline"
                    >
                      {schedule.isActive ? "비활성화" : "활성화"}
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

      <section>
        <h2 className="text-sm font-bold text-slate-700 mb-3">향후 모임 일정</h2>
        <div className="space-y-2">
          {calendarDates.map(({ date, meetings: dayMeetings }) => {
            const dayDate = new Date(date + "T00:00:00");
            const [, month, day] = date.split("-");
            return (
              <div key={date} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-slate-800">
                    {parseInt(month, 10)}월 {parseInt(day, 10)}일 ({DAY_KO[dayDate.getDay()]})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {dayMeetings.map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between text-sm gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-slate-600">{meeting.startTime}–{meeting.endTime}</span>
                          <span className="text-slate-400 text-xs truncate max-w-[120px]">{meeting.location}</span>
                          {meeting.isOverridden && (
                            <span className="text-xs text-amber-600" title="반복 일정에서 수정됨">⚙</span>
                          )}
                          {!meeting.isOpen && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">마감</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">신청: {formatSignupOpensAt(meeting.signupOpensAt)}</p>
                      </div>
                      <button
                        onClick={() => setSelectedMeeting(meeting)}
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
          {calendarDates.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">예정된 모임이 없습니다</p>
          )}
        </div>
      </section>

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
