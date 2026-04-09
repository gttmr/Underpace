"use client";

import { useState } from "react";
import type { UserDetail } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

interface MemberDetailProps {
  user: UserDetail;
  loading: boolean;
  onNameSave: (name: string) => Promise<void>;
  onRoleChange: (role: string) => Promise<void>;
  onDeleteParticipant: (participantId: number) => Promise<void>;
}

const ROLE_ACTIVE_COLORS: Record<string, string> = {
  BANNED: "bg-red-600 text-white shadow-sm",
  ADMIN: "bg-purple-600 text-white shadow-sm",
  COACH: "bg-teal-600 text-white shadow-sm",
  MEMBER: "bg-green-600 text-white shadow-sm",
};

export function MemberDetail({ user, loading, onNameSave, onRoleChange, onDeleteParticipant }: MemberDetailProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  async function handleNameSave() {
    if (!nameInput.trim()) return;
    await onNameSave(nameInput.trim());
    setEditingName(false);
  }

  if (loading) {
    return (
      <div className="lg:w-96 shrink-0">
        <div className="bg-brand-surface-elevated rounded-2xl shadow-sm border border-brand-primary-border p-6 sticky top-20">
          <div className="text-center py-8 text-brand-text-subtle text-sm">불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:w-96 shrink-0">
      <div className="bg-brand-surface-elevated rounded-2xl shadow-sm border border-brand-primary-border p-6 sticky top-20">
        {/* 프로필 헤드 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-brand-surface flex items-center justify-center overflow-hidden shrink-0">
            {user.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-brand-text-subtle">👤</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-1.5 mb-1">
                <input
                  autoFocus
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNameSave();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="flex-1 min-w-0 px-2 py-1 text-sm font-bold border border-brand-primary-border rounded-lg outline-none"
                />
                <button onClick={handleNameSave} className="text-xs bg-brand-primary text-white px-2 py-1 rounded-lg font-bold shrink-0">저장</button>
                <button onClick={() => setEditingName(false)} className="text-xs bg-brand-surface text-brand-text-subtle px-2 py-1 rounded-lg font-bold shrink-0">취소</button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mb-1">
                <h2 className="text-lg font-extrabold text-brand-text">{user.name || "이름 없음"}</h2>
                <button
                  onClick={() => { setNameInput(user.name || ""); setEditingName(true); }}
                  className="text-xs text-brand-text-subtle hover:text-brand-text transition-colors"
                  title="이름 수정"
                >✏️</button>
              </div>
            )}
            <p className="text-xs text-brand-text-subtle">카카오 ID: {user.kakaoId}</p>
            <p className="text-xs text-brand-text-subtle">가입일: {new Date(user.createdAt).toLocaleDateString("ko-KR")}</p>
          </div>
        </div>

        {/* 권한 변경 */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-brand-text-subtle mb-2">회원 등급</label>
          <div className="flex gap-2 flex-wrap">
            {(["MEMBER", "COACH", "ADMIN", "BANNED"] as const).map((role) => (
              <button
                key={role}
                onClick={() => onRoleChange(role)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  user.role === role
                    ? (ROLE_ACTIVE_COLORS[role] ?? "bg-green-600 text-white shadow-sm")
                    : "bg-brand-surface text-brand-text-subtle hover:bg-brand-surface border border-brand-primary-border"
                }`}
              >
                {ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>

        {/* 활동 이력 */}
        <div>
          <h3 className="text-xs font-bold text-brand-text-subtle mb-3">활동 이력</h3>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {user.participants.length === 0 && user.marathonParticipants.length === 0 ? (
              <p className="text-xs text-brand-text-subtle text-center py-4">활동 내역이 없습니다</p>
            ) : (
              <>
                {user.participants.map((p) => (
                  <div key={`m-${p.id}`} className="bg-brand-surface rounded-lg p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-brand-text font-bold">정기 모임</span>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        p.status === "APPROVED" ? "bg-green-100 text-green-600" :
                        p.status === "WAITLISTED" ? "bg-red-100 text-red-600" :
                        "bg-yellow-100 text-yellow-600"
                      }`}>
                        {p.status === "APPROVED" ? "참석" : p.status === "WAITLISTED" ? "대기" : "승인대기"}
                      </span>
                      <button
                        onClick={() => onDeleteParticipant(p.id)}
                        className="ml-auto text-brand-text-subtle hover:text-red-400 transition-colors font-bold"
                        title="신청 내역 삭제"
                      >✕</button>
                    </div>
                    <p className="text-brand-text-muted">{p.meeting.date} · {p.meeting.startTime} · {p.meeting.location}</p>
                  </div>
                ))}
                {user.marathonParticipants.map((p) => (
                  <div key={`mr-${p.id}`} className="bg-orange-50 rounded-lg p-3 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-orange-500 font-bold">마라톤</span>
                      <span className="px-1.5 py-0.5 rounded font-bold bg-green-100 text-green-600">참가</span>
                    </div>
                    <p className="text-brand-text-muted">{p.marathon.date} · {p.marathon.title}</p>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
