"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface UserProfile {
  name: string | null;
  profileImage: string | null;
  pbFull: string | null;
  pbHalf: string | null;
  pb10k: string | null;
  pb5k: string | null;
  coachingNote: string | null;
}

interface ParticipantDetail {
  id: number;
  name: string;
  status: string;
  note: string | null;
  kakaoId: string;
  user: UserProfile | null;
}

interface MeetingWithParticipants {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  maxCapacity: number;
  description: string | null;
  participants: ParticipantDetail[];
}

interface MemberRecord {
  name: string | null;
  profileImage: string | null;
  pbFull: string | null;
  pbHalf: string | null;
  pb10k: string | null;
  pb5k: string | null;
  coachingNote: string | null;
  participants: {
    meeting: {
      date: string;
      startTime: string;
      endTime: string;
      location: string;
    };
  }[];
}

type SortKey = "default" | "pbFull" | "pbHalf" | "pb10k" | "pb5k";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

function PbBadge({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] bg-[#c4ddff] text-brand-text px-1.5 py-0.5 rounded font-bold">
      {label} {value}
    </span>
  );
}

function parseTimeToSeconds(time: string | null): number {
  if (!time) return Infinity;
  const parts = time.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return Infinity;
}

function sortParticipants(participants: ParticipantDetail[], sortKey: SortKey): ParticipantDetail[] {
  if (sortKey === "default") return participants;
  return [...participants].sort((a, b) => {
    const aVal = a.user ? parseTimeToSeconds(a.user[sortKey]) : Infinity;
    const bVal = b.user ? parseTimeToSeconds(b.user[sortKey]) : Infinity;
    return aVal - bVal;
  });
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "신청순" },
  { key: "pbFull", label: "풀마라톤" },
  { key: "pbHalf", label: "하프" },
  { key: "pb10k", label: "10K" },
  { key: "pb5k", label: "5K" },
];

export default function CoachDashboardPage() {
  const [meetings, setMeetings] = useState<MeetingWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("default");

  // 개별 회원 기록 모달
  const [memberRecord, setMemberRecord] = useState<MemberRecord | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // 월간 플랜
  const now = new Date();
  const [planYear] = useState(now.getFullYear());
  const [planMonth] = useState(now.getMonth() + 1);
  const [beginnerContent, setBeginnerContent] = useState("");
  const [advancedContent, setAdvancedContent] = useState("");
  const [planSaving, setPlanSaving] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);

  // 훈련 일지 (meetingId → content)
  const [trainingContents, setTrainingContents] = useState<Record<number, string>>({});
  const [trainingSaving, setTrainingSaving] = useState<Record<number, boolean>>({});
  const [trainingSaved, setTrainingSaved] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch("/api/coach/meetings")
      .then((r) => {
        if (r.status === 401) { setError("login"); return null; }
        if (r.status === 403) { setError("forbidden"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setMeetings(data);
        setLoading(false);
      })
      .catch(() => { setError("network"); setLoading(false); });
  }, []);

  // 월간 플랜 로드
  useEffect(() => {
    fetch(`/api/monthly-plans?year=${planYear}&month=${planMonth}`)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setBeginnerContent(data.beginnerContent ?? "");
          setAdvancedContent(data.advancedContent ?? "");
        }
      })
      .catch(() => {});
  }, [planYear, planMonth]);

  // 훈련 일지 로드 (이번 달)
  useEffect(() => {
    fetch(`/api/training-logs?year=${planYear}&month=${planMonth}`)
      .then((r) => r.json())
      .then((logs: { meetingId: number; content: string }[]) => {
        if (Array.isArray(logs)) {
          const map: Record<number, string> = {};
          logs.forEach((l) => { map[l.meetingId] = l.content; });
          setTrainingContents(map);
        }
      })
      .catch(() => {});
  }, [planYear, planMonth]);

  async function savePlan() {
    setPlanSaving(true);
    await fetch("/api/monthly-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: planYear, month: planMonth, beginnerContent, advancedContent }),
    });
    setPlanSaving(false);
    setPlanSaved(true);
    setTimeout(() => setPlanSaved(false), 2000);
  }

  async function saveTrainingLog(meetingId: number) {
    setTrainingSaving((p) => ({ ...p, [meetingId]: true }));
    await fetch("/api/training-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingId, content: trainingContents[meetingId] ?? "" }),
    });
    setTrainingSaving((p) => ({ ...p, [meetingId]: false }));
    setTrainingSaved((p) => ({ ...p, [meetingId]: true }));
    setTimeout(() => setTrainingSaved((p) => ({ ...p, [meetingId]: false })), 2000);
  }

  function openMemberRecord(kakaoId: string) {
    setMemberLoading(true);
    setShowMemberModal(true);
    setMemberRecord(null);
    fetch(`/api/coach/members?kakaoId=${kakaoId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) setMemberRecord(data);
        setMemberLoading(false);
      })
      .catch(() => setMemberLoading(false));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-page flex items-center justify-center">
        <p className="text-slate-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (error === "login") {
    return (
      <div className="min-h-screen bg-brand-page flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-slate-100">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">로그인이 필요합니다</h1>
          <p className="text-sm text-slate-500 mb-6">코치 계정으로 로그인해 주세요.</p>
          <button
            onClick={() => window.location.href = `/api/auth/kakao?returnTo=/coach`}
            className="w-full h-12 inline-flex items-center gap-2 bg-[#FEE500] hover:bg-[#f0d800] text-[#3C1E1E] font-bold rounded-xl transition-colors justify-center text-sm"
          >
            카카오로 로그인
          </button>
        </div>
      </div>
    );
  }

  if (error === "forbidden") {
    return (
      <div className="min-h-screen bg-brand-page flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-slate-100">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">접근 권한이 없습니다</h1>
          <p className="text-sm text-slate-500 mb-6">코치 또는 관리자 권한이 필요합니다.</p>
          <Link href="/" className="text-sm text-brand-text hover:underline">← 홈으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-page pb-24">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-teal-600 to-teal-500 text-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-teal-200 hover:text-white transition-colors text-sm">← 홈</Link>
            <span className="text-teal-300">|</span>
            <span className="font-bold text-lg">🏃 코치 대시보드</span>
          </div>
          <span className="text-teal-200 text-xs">예정 모임 {meetings.length}건</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* 월간 훈련 계획 에디터 */}
        <div className="bg-white rounded-2xl border border-brand-primary-border overflow-hidden">
          <div className="bg-brand-surface px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-4 bg-brand-primary rounded-full" />
              <p className="text-xs font-black text-brand-text-subtle uppercase tracking-widest">
                {planYear}년 {planMonth}월 훈련 계획
              </p>
            </div>
            <button
              onClick={savePlan}
              disabled={planSaving}
              className="px-3 py-1.5 rounded-lg text-xs font-black bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
            >
              {planSaved ? "저장됨 ✓" : planSaving ? "저장 중..." : "저장"}
            </button>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-brand-text-subtle uppercase tracking-widest mb-1.5">초중급반</label>
              <textarea
                value={beginnerContent}
                onChange={(e) => setBeginnerContent(e.target.value)}
                rows={5}
                placeholder={"1주차: 페이스 런 5K\n2주차: 인터벌 4×1K\n3주차: LSD 10K\n4주차: 템포 런"}
                className="brand-input w-full px-3 py-2.5 rounded-xl text-sm resize-none placeholder:text-brand-text-subtle"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-brand-text-subtle uppercase tracking-widest mb-1.5">고급반</label>
              <textarea
                value={advancedContent}
                onChange={(e) => setAdvancedContent(e.target.value)}
                rows={5}
                placeholder={"1주차: 스피드워크 6×800m\n2주차: 마라톤 페이스 런\n3주차: LSD 20K\n4주차: 레이스 시뮬레이션"}
                className="brand-input w-full px-3 py-2.5 rounded-xl text-sm resize-none placeholder:text-brand-text-subtle"
              />
            </div>
          </div>
        </div>

        {/* 모임 목록 */}
        {meetings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-slate-500 font-medium">예정된 모임이 없습니다</p>
          </div>
        ) : (
          meetings.map((m) => {
            const d = new Date(m.date + "T00:00:00");
            const [, month, day] = m.date.split("-");
            const displayDate = `${parseInt(month)}월 ${parseInt(day)}일 (${DAY_KO[d.getDay()]})`;
            const isExpanded = expandedId === m.id;
            const approvedCount = m.participants.filter((p) => p.status === "APPROVED").length;
            const sorted = sortParticipants(m.participants, sortKey);

            return (
              <div key={m.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* 모임 헤더 — 클릭으로 참가자 펼치기/접기 */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-extrabold text-slate-900">{displayDate}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{m.startTime}–{m.endTime} · {m.location}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-teal-50 text-teal-700 text-sm font-bold px-3 py-1 rounded-full">
                      {approvedCount}/{m.maxCapacity}명
                    </span>
                    <span className={`text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                  </div>
                </button>

                {/* 훈련 일지 (항상 표시) */}
                <div className="border-t border-slate-100 px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-black text-brand-text-subtle uppercase tracking-widest">훈련 일지</p>
                    <button
                      onClick={() => saveTrainingLog(m.id)}
                      disabled={trainingSaving[m.id]}
                      className="px-3 py-1 rounded-lg text-xs font-black bg-brand-primary text-white hover:bg-brand-primary-hover transition-colors disabled:opacity-50"
                    >
                      {trainingSaved[m.id] ? "저장됨 ✓" : trainingSaving[m.id] ? "저장 중..." : "저장"}
                    </button>
                  </div>
                  <textarea
                    value={trainingContents[m.id] ?? ""}
                    onChange={(e) => setTrainingContents((p) => ({ ...p, [m.id]: e.target.value }))}
                    rows={3}
                    placeholder="오늘 훈련 내용을 입력하세요 (예: 인터벌 5×1K @ 4:30/km, 총 8K)"
                    className="brand-input w-full px-3 py-2.5 rounded-xl text-sm resize-none placeholder:text-brand-text-subtle"
                  />
                </div>

                {/* 참가자 리스트 (확장 시) */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {/* 정렬 옵션 */}
                    {m.participants.length > 0 && (
                      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
                        <span className="text-xs text-slate-500 shrink-0 font-medium">정렬:</span>
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => setSortKey(sortKey === opt.key ? "default" : opt.key)}
                            className={`text-xs px-2.5 py-1 rounded-full font-bold transition-colors shrink-0 ${
                              sortKey === opt.key
                                ? "bg-teal-600 text-white"
                                : "bg-white text-slate-500 border border-slate-200 hover:border-teal-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {m.participants.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-400">참가 신청자가 없습니다</div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {sorted.map((p, i) => (
                          <div key={p.id} className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              {/* 순번 + 프로필 */}
                              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 text-sm font-bold">
                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                {/* 이름 + 상태 + 기록 보기 */}
                                <div className="flex items-center gap-2 mb-1">
                                  <button
                                    onClick={() => openMemberRecord(p.kakaoId)}
                                    className="font-bold text-slate-800 hover:text-teal-600 hover:underline transition-colors"
                                  >
                                    {p.user?.name || p.name}
                                  </button>
                                  {p.status === "APPROVED" ? (
                                    <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-bold">참석</span>
                                  ) : (
                                    <span className="text-[10px] bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded font-bold">승인대기</span>
                                  )}
                                </div>

                                {/* PB 기록 배지들 */}
                                {p.user && (p.user.pbFull || p.user.pbHalf || p.user.pb10k || p.user.pb5k) && (
                                  <div className="flex flex-wrap gap-1 mb-1.5">
                                    <PbBadge label="풀" value={p.user.pbFull} />
                                    <PbBadge label="하프" value={p.user.pbHalf} />
                                    <PbBadge label="10K" value={p.user.pb10k} />
                                    <PbBadge label="5K" value={p.user.pb5k} />
                                  </div>
                                )}

                                {/* 강습 시 바라는 점 */}
                                {p.user?.coachingNote && (
                                  <div className="bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-800 mt-1">
                                    <span className="font-bold text-amber-600">💬 바라는 점:</span>{" "}
                                    {p.user.coachingNote}
                                  </div>
                                )}

                                {/* 신청 메모 */}
                                {p.note && (
                                  <p className="text-xs text-slate-400 mt-1">📝 {p.note}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      {/* 회원 기록 모달 */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowMemberModal(false)}>
          <div
            className="bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {memberLoading ? (
              <div className="p-12 text-center text-slate-400 text-sm">불러오는 중...</div>
            ) : memberRecord ? (
              <>
                {/* 모달 헤더 */}
                <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center overflow-hidden shrink-0">
                      {memberRecord.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={memberRecord.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl text-slate-300">👤</span>
                      )}
                    </div>
                    <h2 className="font-extrabold text-slate-900 text-lg">{memberRecord.name || "이름 없음"}</h2>
                  </div>
                  <button onClick={() => setShowMemberModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
                </div>

                <div className="px-5 py-4 space-y-5">
                  {/* PB 기록 */}
                  {(memberRecord.pbFull || memberRecord.pbHalf || memberRecord.pb10k || memberRecord.pb5k) && (
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-700 mb-2">🏅 마라톤 PB 기록</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {memberRecord.pbFull && (
                          <div className="bg-[#c4ddff] rounded-xl px-3 py-2.5">
                            <p className="text-[10px] text-brand-text font-bold">풀마라톤</p>
                            <p className="text-sm font-extrabold text-brand-text">{memberRecord.pbFull}</p>
                          </div>
                        )}
                        {memberRecord.pbHalf && (
                          <div className="bg-[#c4ddff] rounded-xl px-3 py-2.5">
                            <p className="text-[10px] text-brand-text font-bold">하프마라톤</p>
                            <p className="text-sm font-extrabold text-brand-text">{memberRecord.pbHalf}</p>
                          </div>
                        )}
                        {memberRecord.pb10k && (
                          <div className="bg-[#c4ddff] rounded-xl px-3 py-2.5">
                            <p className="text-[10px] text-brand-text font-bold">10K</p>
                            <p className="text-sm font-extrabold text-brand-text">{memberRecord.pb10k}</p>
                          </div>
                        )}
                        {memberRecord.pb5k && (
                          <div className="bg-[#c4ddff] rounded-xl px-3 py-2.5">
                            <p className="text-[10px] text-brand-text font-bold">5K</p>
                            <p className="text-sm font-extrabold text-brand-text">{memberRecord.pb5k}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 바라는 점 */}
                  {memberRecord.coachingNote && (
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-700 mb-2">💬 강습 시 바라는 점</h3>
                      <div className="bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-800">
                        {memberRecord.coachingNote}
                      </div>
                    </div>
                  )}

                  {/* 참가 기록 */}
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-700 mb-2">📋 최근 참가 기록 ({memberRecord.participants.length}회)</h3>
                    {memberRecord.participants.length === 0 ? (
                      <p className="text-sm text-slate-400">참가 기록이 없습니다.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {memberRecord.participants.map((rec, i) => {
                          const rd = new Date(rec.meeting.date + "T00:00:00");
                          const [, rm, rday] = rec.meeting.date.split("-");
                          return (
                            <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2 text-sm">
                              <span className="text-slate-400 font-mono text-xs w-6 text-right shrink-0">{i + 1}</span>
                              <span className="font-bold text-slate-700">
                                {parseInt(rm)}월 {parseInt(rday)}일 ({DAY_KO[rd.getDay()]})
                              </span>
                              <span className="text-slate-500 text-xs">{rec.meeting.startTime}–{rec.meeting.endTime}</span>
                              <span className="text-slate-400 text-xs truncate">{rec.meeting.location}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400 text-sm">회원 정보를 불러올 수 없습니다.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
