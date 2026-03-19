"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CapacityBar } from "@/components/ui/CapacityBar";
import { Toast, useToast } from "@/components/ui/Toast";
import type { ParticipantStatus } from "@/lib/types";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

interface Participant {
  id: number;
  name: string;
  contact: string;
  note: string | null;
  status: ParticipantStatus;
  waitlistPosition: number | null;
  rejectionNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
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
  participants: Participant[];
  approvedCount: number;
  pendingCount: number;
  waitlistedCount: number;
}

type Tab = "pending" | "approved" | "waitlisted" | "rejected" | "all";

const TAB_LABELS: Record<Tab, string> = {
  pending: "대기 중",
  approved: "승인됨",
  waitlisted: "대기자",
  rejected: "거절됨",
  all: "전체",
};

function MaskedContact({ contact }: { contact: string }) {
  const [revealed, setRevealed] = useState(false);
  const masked = contact.length > 8
    ? contact.slice(0, 3) + "-****-" + contact.slice(-4)
    : contact.slice(0, 2) + "****";

  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="font-mono">{revealed ? contact : masked}</span>
      <button
        onClick={() => setRevealed((v) => !v)}
        className="text-slate-400 hover:text-slate-600 text-xs"
        title={revealed ? "숨기기" : "전체 보기"}
      >
        {revealed ? "🙈" : "👁"}
      </button>
    </span>
  );
}

export default function AdminMeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();

  async function load() {
    const res = await fetch(`/api/meetings/${id}`);
    const data = await res.json();
    setMeeting(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleAction(participantId: number, action: string, extra?: Record<string, unknown>) {
    const res = await fetch(`/api/participants/${participantId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });

    if (res.ok) {
      const actionLabels: Record<string, string> = {
        approve: "승인되었습니다",
        reject: "거절되었습니다",
        pending: "대기 중으로 변경되었습니다",
      };
      addToast(actionLabels[action] || "업데이트되었습니다", "success");
      load();
    } else {
      addToast("오류가 발생했습니다", "error");
    }
  }

  async function handleToggleOpen() {
    await fetch(`/api/meetings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOpen: !meeting?.isOpen }),
    });
    load();
  }

  if (loading || !meeting) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-16 text-slate-400">불러오는 중...</div>
      </AdminLayout>
    );
  }

  const d = new Date(meeting.date + "T00:00:00");
  const [, month, day] = meeting.date.split("-");
  const displayDate = `${parseInt(month)}월 ${parseInt(day)}일 (${DAY_KO[d.getDay()]})`;

  const filteredParticipants = meeting.participants.filter((p) => {
    if (activeTab === "all") return true;
    return p.status.toLowerCase() === activeTab.toUpperCase() ||
      (activeTab === "pending" && p.status === "PENDING") ||
      (activeTab === "approved" && p.status === "APPROVED") ||
      (activeTab === "waitlisted" && p.status === "WAITLISTED") ||
      (activeTab === "rejected" && p.status === "REJECTED");
  });

  const counts: Record<Tab, number> = {
    pending: meeting.participants.filter((p) => p.status === "PENDING").length,
    approved: meeting.participants.filter((p) => p.status === "APPROVED").length,
    waitlisted: meeting.participants.filter((p) => p.status === "WAITLISTED").length,
    rejected: meeting.participants.filter((p) => p.status === "REJECTED").length,
    all: meeting.participants.length,
  };

  return (
    <AdminLayout>
      {/* 상단 정보 */}
      <div className="flex items-start gap-3 mb-4">
        <Link href="/admin/meetings" className="text-slate-400 hover:text-slate-600 text-xl mt-0.5">←</Link>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-slate-900">{displayDate}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {meeting.startTime}–{meeting.endTime} · {meeting.location}
          </p>
        </div>
        <button
          onClick={handleToggleOpen}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
            ${meeting.isOpen
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
        >
          {meeting.isOpen ? "신청 마감하기" : "신청 열기"}
        </button>
      </div>

      <div className="mb-6">
        <CapacityBar current={meeting.approvedCount} max={meeting.maxCapacity} />
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4 overflow-x-auto">
        {(["pending", "approved", "waitlisted", "rejected", "all"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors
              ${activeTab === tab ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
          >
            {TAB_LABELS[tab]} {counts[tab] > 0 && `(${counts[tab]})`}
          </button>
        ))}
      </div>

      {/* 신청자 목록 */}
      <div className="space-y-3">
        {/* 대기 중 탭에서 전체 승인 버튼 */}
        {activeTab === "pending" && counts.pending > 1 && (
          <button
            onClick={async () => {
              const pendingOnes = meeting.participants.filter((p) => p.status === "PENDING");
              for (const p of pendingOnes) {
                await fetch(`/api/participants/${p.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "approve" }),
                });
              }
              addToast(`${pendingOnes.length}명을 일괄 승인했습니다`, "success");
              load();
            }}
            className="w-full py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm font-semibold hover:bg-green-100 transition-colors"
          >
            대기 중 {counts.pending}명 전체 승인
          </button>
        )}

        {filteredParticipants.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">해당 상태의 신청자가 없습니다</p>
        ) : (
          filteredParticipants.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">{p.name}</span>
                    <StatusBadge status={p.status} waitlistPosition={p.waitlistPosition} size="sm" />
                  </div>
                  <MaskedContact contact={p.contact} />
                  {p.note && (
                    <p className="text-xs text-slate-500 mt-1 bg-slate-50 rounded px-2 py-1">{p.note}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(p.submittedAt).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {/* 액션 버튼 */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  {p.status !== "APPROVED" && (
                    <button
                      onClick={() => handleAction(p.id, "approve")}
                      className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors"
                    >
                      승인
                    </button>
                  )}
                  {p.status !== "REJECTED" && (
                    <button
                      onClick={() => setRejectingId(rejectingId === p.id ? null : p.id)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
                    >
                      거절
                    </button>
                  )}
                  {p.status === "APPROVED" && (
                    <button
                      onClick={() => handleAction(p.id, "pending")}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs transition-colors"
                    >
                      취소
                    </button>
                  )}
                </div>
              </div>

              {/* 거절 사유 입력 */}
              {rejectingId === p.id && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <input
                    type="text"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="거절 사유 (선택)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-red-400 mb-2"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleAction(p.id, "reject", { rejectionNote: rejectNote });
                        setRejectingId(null);
                        setRejectNote("");
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
                    >
                      거절 확인
                    </button>
                    <button
                      onClick={() => { setRejectingId(null); setRejectNote(""); }}
                      className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs hover:bg-slate-50 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 토스트 */}
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </AdminLayout>
  );
}
