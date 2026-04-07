"use client";

import { useState, useEffect, useCallback } from "react";

interface TrainingLog {
  id: number;
  meetingId: number;
  content: string;
  createdAt: string;
  meeting: { date: string; startTime: string; endTime: string; classType: string | null };
}

interface MonthlyPlan {
  beginnerContent: string;
  advancedContent: string;
}

interface Meeting {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  classType: string | null;
}

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  const day = DAY_KO[new Date(dateStr + "T00:00:00").getDay()];
  return `${parseInt(m)}월 ${parseInt(d)}일 (${day})`;
}

export default function TrainingTab({ isCoach = false }: { isCoach?: boolean }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const [plan, setPlan] = useState<MonthlyPlan | null>(null);
  const [logs, setLogs] = useState<TrainingLog[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 코치 편집 상태
  const [beginnerEdit, setBeginnerEdit] = useState("");
  const [advancedEdit, setAdvancedEdit] = useState("");
  const [planSaving, setPlanSaving] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  const [logEdits, setLogEdits] = useState<Record<number, string>>({});
  const [logSaving, setLogSaving] = useState<Record<number, boolean>>({});
  const [logSaved, setLogSaved] = useState<Record<number, boolean>>({});

  const load = useCallback(() => {
    setLoading(true);
    const pad = (n: number) => String(n).padStart(2, "0");
    const prefix = `${year}-${pad(month)}`;

    const fetches: Promise<unknown>[] = [
      fetch(`/api/monthly-plans?year=${year}&month=${month}`).then((r) => r.json()),
      fetch(`/api/training-logs?year=${year}&month=${month}`).then((r) => r.json()),
      fetch("/api/meetings").then((r) => r.json()),
    ];

    Promise.all(fetches)
      .then(([planData, logsData, allMeetings]) => {
        const p = planData as MonthlyPlan | null;
        setPlan(p);
        setBeginnerEdit(p?.beginnerContent ?? "");
        setAdvancedEdit(p?.advancedContent ?? "");

        const logsArr = Array.isArray(logsData) ? (logsData as TrainingLog[]) : [];
        setLogs(logsArr);
        const edits: Record<number, string> = {};
        logsArr.forEach((l) => { edits[l.meetingId] = l.content; });
        setLogEdits(edits);

        const monthMeetings = Array.isArray(allMeetings)
          ? (allMeetings as Meeting[]).filter((m) => m.date.startsWith(prefix))
          : [];
        setMeetings(monthMeetings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  async function savePlan() {
    setPlanSaving(true);
    await fetch("/api/monthly-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month, beginnerContent: beginnerEdit, advancedContent: advancedEdit }),
    });
    setPlanSaving(false);
    setPlanSaved(true);
    setTimeout(() => { setPlanSaved(false); load(); }, 1500);
  }

  async function saveLog(meetingId: number) {
    const content = logEdits[meetingId] ?? "";
    if (!content.trim()) return;
    setLogSaving((p) => ({ ...p, [meetingId]: true }));
    await fetch("/api/training-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId, content }),
    });
    setLogSaving((p) => ({ ...p, [meetingId]: false }));
    setLogSaved((p) => ({ ...p, [meetingId]: true }));
    setTimeout(() => { setLogSaved((p) => ({ ...p, [meetingId]: false })); load(); }, 1500);
  }

  const logMap = new Map(logs.map((l) => [l.meetingId, l]));

  // 코치: 이번 달 전체 모임 표시 / 일반: 일지 있는 모임만
  const logItems = isCoach
    ? meetings.map((m) => ({ meetingId: m.id, date: m.date, startTime: m.startTime, endTime: m.endTime, classType: m.classType, log: logMap.get(m.id) }))
    : logs.map((l) => ({ meetingId: l.meetingId, date: l.meeting.date, startTime: l.meeting.startTime, endTime: l.meeting.endTime, classType: l.meeting.classType, log: l }));

  return (
    <div className="space-y-3">
      {/* 월 네비게이터 */}
      <div className="flex items-center justify-between px-1">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-surface text-brand-text transition-colors text-lg font-black">‹</button>
        <span className="font-black text-brand-text text-base">{year}년 {month}월</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-surface text-brand-text transition-colors text-lg font-black">›</button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-brand-text-subtle text-sm">불러오는 중...</div>
      ) : (
        <>
          {/* 월간 훈련 계획 */}
          <div className="bg-white rounded-2xl border border-brand-primary-border overflow-hidden">
            <div className="bg-brand-surface px-4 py-3 flex items-center justify-between">
              <p className="text-xs font-black text-brand-text-subtle uppercase tracking-widest">이번 달 훈련 계획</p>
              {isCoach && (
                <button
                  onClick={savePlan}
                  disabled={planSaving}
                  className="px-3 py-1 rounded-lg text-xs font-black bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
                >
                  {planSaved ? "저장됨 ✓" : planSaving ? "저장 중..." : "저장"}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 divide-x divide-brand-divider">
              {/* 초중급반 */}
              <div className="px-4 py-3 flex flex-col gap-2">
                <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest">초중급반</p>
                {isCoach ? (
                  <textarea
                    value={beginnerEdit}
                    onChange={(e) => setBeginnerEdit(e.target.value)}
                    rows={5}
                    placeholder={"1주차: 페이스 런 5K\n2주차: 인터벌 4×1K"}
                    className="brand-input w-full px-3 py-2 rounded-xl text-sm resize-none placeholder:text-brand-text-subtle"
                  />
                ) : plan?.beginnerContent ? (
                  <p className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">{plan.beginnerContent}</p>
                ) : (
                  <p className="text-xs text-brand-text-subtle py-2">미등록</p>
                )}
              </div>
              {/* 고급반 */}
              <div className="px-4 py-3 flex flex-col gap-2">
                <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">고급반</p>
                {isCoach ? (
                  <textarea
                    value={advancedEdit}
                    onChange={(e) => setAdvancedEdit(e.target.value)}
                    rows={5}
                    placeholder={"1주차: 스피드워크 6×800m\n2주차: 마라톤 페이스 런"}
                    className="brand-input w-full px-3 py-2 rounded-xl text-sm resize-none placeholder:text-brand-text-subtle"
                  />
                ) : plan?.advancedContent ? (
                  <p className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">{plan.advancedContent}</p>
                ) : (
                  <p className="text-xs text-brand-text-subtle py-2">미등록</p>
                )}
              </div>
            </div>
          </div>

          {/* 훈련 일지 */}
          <div className="bg-white rounded-2xl border border-brand-primary-border overflow-hidden">
            <div className="bg-brand-surface px-4 py-3">
              <p className="text-xs font-black text-brand-text-subtle uppercase tracking-widest">훈련 일지</p>
            </div>
            {logItems.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-brand-text-subtle font-medium">이번 달 훈련 일지가 없습니다</p>
              </div>
            ) : (
              <div className="divide-y divide-brand-divider">
                {logItems.map((item) => {
                  const isExpanded = expandedId === item.meetingId;
                  return (
                    <div key={item.meetingId}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.meetingId)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-brand-page transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-brand-text">{formatDate(item.date)}</span>
                          {item.classType === "BEGINNER" && (
                            <span className="text-[9px] font-black bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full">초중급</span>
                          )}
                          {item.classType === "ADVANCED" && (
                            <span className="text-[9px] font-black bg-brand-primary text-white px-1.5 py-0.5 rounded-full">고급</span>
                          )}
                          {!item.log && isCoach && (
                            <span className="text-[9px] text-brand-text-subtle border border-brand-divider px-1.5 py-0.5 rounded-full">미작성</span>
                          )}
                        </div>
                        <svg className={`w-4 h-4 text-brand-text-subtle transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* 미확장 시 미리보기 */}
                      {!isExpanded && item.log && (
                        <div className="px-4 pb-3">
                          <p className="text-sm text-brand-text-muted truncate">{item.log.content.split("\n")[0]}</p>
                        </div>
                      )}

                      {/* 확장 시 */}
                      {isExpanded && (
                        <div className="px-4 pb-4">
                          {isCoach ? (
                            <div className="space-y-2">
                              <textarea
                                value={logEdits[item.meetingId] ?? ""}
                                onChange={(e) => setLogEdits((p) => ({ ...p, [item.meetingId]: e.target.value }))}
                                rows={4}
                                placeholder="오늘 훈련 내용을 입력하세요 (예: 인터벌 5×1K @ 4:30/km, 총 8K)"
                                className="brand-input w-full px-3 py-2 rounded-xl text-sm resize-none placeholder:text-brand-text-subtle"
                              />
                              <div className="flex justify-end">
                                <button
                                  onClick={() => saveLog(item.meetingId)}
                                  disabled={logSaving[item.meetingId] || !logEdits[item.meetingId]?.trim()}
                                  className="px-4 py-1.5 rounded-lg text-xs font-black bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
                                >
                                  {logSaved[item.meetingId] ? "저장됨 ✓" : logSaving[item.meetingId] ? "저장 중..." : "저장"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">{item.log?.content}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
