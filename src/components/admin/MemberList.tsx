"use client";

import type { UserWithCounts } from "@/lib/types";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/types";

interface MemberListProps {
  users: UserWithCounts[];
  loading: boolean;
  selectedId: number | null;
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (id: number) => void;
}

export function MemberList({ users, loading, selectedId, search, onSearchChange, onSelect }: MemberListProps) {
  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.kakaoId.includes(q) ||
      u.phoneNumber?.includes(q)
    );
  });

  return (
    <div className="flex-1">
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="이름, 카카오ID, 연락처로 검색..."
          className="w-full px-4 py-2.5 rounded-xl border border-brand-primary-border text-sm outline-none focus:border-brand-primary-border-strong transition-colors"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-brand-text-subtle text-sm">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-brand-surface-elevated rounded-2xl p-8 text-center border border-brand-primary-border">
          <div className="text-4xl mb-3">👤</div>
          <p className="text-brand-text-subtle font-medium">등록된 회원이 없습니다</p>
          <p className="text-sm text-brand-text-subtle mt-1">카카오 로그인을 한 사용자가 자동으로 등록됩니다</p>
        </div>
      ) : (
        <div className="bg-brand-surface-elevated rounded-2xl overflow-hidden shadow-sm border border-brand-primary-border divide-y">
          {filtered.map((user) => (
            <button
              key={user.id}
              onClick={() => onSelect(user.id)}
              className={`w-full p-4 flex items-center gap-3 text-left hover:bg-[rgba(196,221,255,0.5)] transition-colors ${
                selectedId === user.id ? "bg-[rgba(196,221,255,1)] border-l-4 border-l-[#001d6e]" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-brand-surface flex items-center justify-center shrink-0 overflow-hidden">
                {user.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-brand-text-subtle text-lg">👤</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-brand-text text-sm truncate">{user.name || "이름 없음"}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ROLE_COLORS[user.role] || "bg-brand-surface text-brand-text-subtle"}`}>
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                </div>
                <p className="text-xs text-brand-text-subtle">
                  모임 {user._count.participants}회 · 대회 {user._count.marathonParticipants}회
                </p>
              </div>
              <span className="text-brand-text-subtle text-sm">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
