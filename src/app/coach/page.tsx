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

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

function PbBadge({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">
      {label} {value}
    </span>
  );
}

export default function CoachDashboardPage() {
  const [meetings, setMeetings] = useState<MeetingWithParticipants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (error === "login") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-slate-100">
          <div className="text-5xl mb-4">🚫</div>
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">접근 권한이 없습니다</h1>
          <p className="text-sm text-slate-500 mb-6">코치 또는 관리자 권한이 필요합니다.</p>
          <Link href="/" className="text-sm text-blue-600 hover:underline">← 홈으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
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

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
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

                {/* 참가자 리스트 (확장 시) */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    {m.participants.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-400">참가 신청자가 없습니다</div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {m.participants.map((p, i) => (
                          <div key={p.id} className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              {/* 순번 + 프로필 */}
                              <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0 text-sm font-bold">
                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                {/* 이름 + 상태 */}
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-slate-800">{p.user?.name || p.name}</span>
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
    </div>
  );
}
