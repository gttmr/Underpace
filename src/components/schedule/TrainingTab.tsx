"use client";

import { useState, useEffect } from "react";

interface TrainingLog {
  id: number;
  meetingId: number;
  content: string;
  createdAt: string;
  meeting: { date: string; startTime: string; endTime: string };
}

interface MonthlyPlan {
  beginnerContent: string;
  advancedContent: string;
}

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  const day = DAY_KO[new Date(dateStr + "T00:00:00").getDay()];
  return `${parseInt(m)}/${parseInt(d)} (${day})`;
}

export default function TrainingTab() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [classTab, setClassTab] = useState<"beginner" | "advanced">("beginner");
  const [plan, setPlan] = useState<MonthlyPlan | null>(null);
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/monthly-plans?year=${year}&month=${month}`).then((r) => r.json()),
      fetch(`/api/training-logs?year=${year}&month=${month}`).then((r) => r.json()),
    ])
      .then(([planData, logsData]) => {
        setPlan(planData);
        setLogs(Array.isArray(logsData) ? logsData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  const planContent = plan
    ? (classTab === "beginner" ? plan.beginnerContent : plan.advancedContent)
    : null;

  return (
    <div className="space-y-4">
      {/* 월 네비게이터 */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-surface text-brand-text transition-colors text-lg font-black"
        >
          ‹
        </button>
        <span className="font-black text-brand-text text-base">{year}년 {month}월</span>
        <button
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-surface text-brand-text transition-colors text-lg font-black"
        >
          ›
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-brand-text-subtle text-sm">불러오는 중...</div>
      ) : (
        <>
          {/* 월간 훈련 계획 */}
          <div className="bg-white rounded-2xl border border-brand-primary-border overflow-hidden">
            <div className="bg-brand-surface px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-[3px] h-4 bg-brand-primary rounded-full" />
                <p className="text-xs font-black text-brand-text-subtle uppercase tracking-widest">이번 달 훈련 계획</p>
              </div>
              {/* 반 토글 */}
              <div className="flex items-center bg-white rounded-lg p-0.5 border border-brand-primary-border gap-0.5">
                <button
                  onClick={() => setClassTab("beginner")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all ${
                    classTab === "beginner"
                      ? "bg-brand-primary text-white shadow-sm"
                      : "text-brand-text-muted hover:text-brand-text"
                  }`}
                >
                  초중급
                </button>
                <button
                  onClick={() => setClassTab("advanced")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-black transition-all ${
                    classTab === "advanced"
                      ? "bg-brand-primary text-white shadow-sm"
                      : "text-brand-text-muted hover:text-brand-text"
                  }`}
                >
                  고급
                </button>
              </div>
            </div>

            <div className="px-4 py-4">
              {planContent ? (
                <p className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">{planContent}</p>
              ) : (
                <p className="text-sm text-brand-text-subtle text-center py-4 font-medium">
                  이번 달 훈련 계획이 아직 등록되지 않았습니다
                </p>
              )}
            </div>
          </div>

          {/* 훈련 일지 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-0.5">
              <div className="w-[3px] h-4 bg-brand-primary rounded-full" />
              <p className="text-xs font-black text-brand-text-subtle uppercase tracking-widest">훈련 일지</p>
            </div>

            {logs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-brand-primary-border p-8 text-center">
                <p className="text-sm text-brand-text-subtle font-medium">이번 달 훈련 일지가 없습니다</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-brand-primary-border divide-y divide-brand-divider overflow-hidden">
                {logs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    className="w-full text-left px-4 py-3.5 transition-colors hover:bg-brand-surface"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="shrink-0 text-xs font-black text-brand-text-subtle">
                          {formatDate(log.meeting.date)}
                        </span>
                        <span className="text-xs text-brand-text-muted truncate">
                          {log.content.split("\n")[0]}
                        </span>
                      </div>
                      <svg
                        className={`shrink-0 w-4 h-4 text-brand-text-subtle transition-transform ${expandedId === log.id ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {expandedId === log.id && (
                      <p className="mt-3 text-sm text-brand-text leading-relaxed whitespace-pre-wrap border-t border-brand-divider pt-3">
                        {log.content}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
