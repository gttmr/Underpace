"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface UserWithCounts {
  id: number;
  kakaoId: string;
  name: string | null;
  profileImage: string | null;
  phoneNumber: string | null;
  role: string;
  createdAt: string;
  _count: {
    participants: number;
    marathonParticipants: number;
  };
}

interface UserDetail extends Omit<UserWithCounts, "_count"> {
  participants: {
    id: number;
    name: string;
    status: string;
    submittedAt: string;
    meeting: { date: string; location: string; startTime: string };
  }[];
  marathonParticipants: {
    id: number;
    name: string;
    status: string;
    submittedAt: string;
    marathon: { title: string; date: string };
  }[];
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "관리자",
  COACH: "코치",
  MEMBER: "일반 회원",
  BANNED: "차단됨",
};
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  COACH: "bg-teal-100 text-teal-700",
  MEMBER: "bg-green-100 text-green-700",
  BANNED: "bg-red-100 text-red-700",
};

export default function AdminMembersPage() {
  const [users, setUsers] = useState<UserWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    fetch("/api/admin/members")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function loadDetail(userId: number) {
    setDetailLoading(true);
    setEditingName(false);
    const res = await fetch(`/api/admin/members/${userId}`);
    const data = await res.json();
    setSelectedUser(data);
    setDetailLoading(false);
  }

  async function handleNameSave() {
    if (!selectedUser || !nameInput.trim()) return;
    await fetch(`/api/admin/members/${selectedUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameInput.trim() }),
    });
    const newName = nameInput.trim();
    setSelectedUser({ ...selectedUser, name: newName });
    setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, name: newName } : u)));
    setEditingName(false);
  }

  async function handleDeleteParticipant(participantId: number) {
    if (!selectedUser) return;
    if (!confirm("이 신청 내역을 삭제하시겠습니까?")) return;
    await fetch(`/api/participants/${participantId}`, { method: "DELETE" });
    setSelectedUser({
      ...selectedUser,
      participants: selectedUser.participants.filter((p) => p.id !== participantId),
    });
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? { ...u, _count: { ...u._count, participants: u._count.participants - 1 } }
          : u
      )
    );
  }

  async function handleRoleChange(userId: number, newRole: string) {
    await fetch(`/api/admin/members/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    // 리스트 갱신
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    if (selectedUser?.id === userId) {
      setSelectedUser({ ...selectedUser, role: newRole });
    }
  }

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.kakaoId.includes(q) ||
      u.phoneNumber?.includes(q)
    );
  });

  const totalCount = users.length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const bannedCount = users.filter((u) => u.role === "BANNED").length;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold text-slate-900">회원 관리</h1>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">전체 {totalCount}</span>
          {adminCount > 0 && <span className="bg-purple-100 text-purple-600 px-2.5 py-1 rounded-full">관리자 {adminCount}</span>}
          {bannedCount > 0 && <span className="bg-red-100 text-red-600 px-2.5 py-1 rounded-full">차단 {bannedCount}</span>}
        </div>
      </div>

      {/* 검색 */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 카카오ID, 연락처로 검색..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* 회원 리스트 */}
        <div className="flex-1">
          {loading ? (
            <div className="text-center py-16 text-slate-400 text-sm">불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
              <div className="text-4xl mb-3">👤</div>
              <p className="text-slate-500 font-medium">등록된 회원이 없습니다</p>
              <p className="text-sm text-slate-400 mt-1">카카오 로그인을 한 사용자가 자동으로 등록됩니다</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 divide-y">
              {filtered.map((user) => (
                <button
                  key={user.id}
                  onClick={() => loadDetail(user.id)}
                  className={`w-full p-4 flex items-center gap-3 text-left hover:bg-blue-50/50 transition-colors ${
                    selectedUser?.id === user.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                  }`}
                >
                  {/* 프로필 이미지 */}
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {user.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-400 text-lg">👤</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-800 text-sm truncate">{user.name || "이름 없음"}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ROLE_COLORS[user.role] || "bg-slate-100 text-slate-500"}`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      모임 {user._count.participants}회 · 대회 {user._count.marathonParticipants}회
                    </p>
                  </div>
                  <span className="text-slate-300 text-sm">›</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 회원 상세 패널 */}
        {selectedUser && (
          <div className="lg:w-96 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-20">
              {detailLoading ? (
                <div className="text-center py-8 text-slate-400 text-sm">불러오는 중...</div>
              ) : (
                <>
                  {/* 프로필 헤드 */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {selectedUser.profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={selectedUser.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl text-slate-300">👤</span>
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
                            onKeyDown={(e) => { if (e.key === "Enter") handleNameSave(); if (e.key === "Escape") setEditingName(false); }}
                            className="flex-1 min-w-0 px-2 py-1 text-sm font-bold border border-blue-400 rounded-lg outline-none"
                          />
                          <button onClick={handleNameSave} className="text-xs bg-blue-600 text-white px-2 py-1 rounded-lg font-bold shrink-0">저장</button>
                          <button onClick={() => setEditingName(false)} className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-bold shrink-0">취소</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mb-1">
                          <h2 className="text-lg font-extrabold text-slate-900">{selectedUser.name || "이름 없음"}</h2>
                          <button
                            onClick={() => { setNameInput(selectedUser.name || ""); setEditingName(true); }}
                            className="text-xs text-slate-400 hover:text-blue-500 transition-colors"
                            title="이름 수정"
                          >✏️</button>
                        </div>
                      )}
                      <p className="text-xs text-slate-400">
                        카카오 ID: {selectedUser.kakaoId}
                      </p>
                      <p className="text-xs text-slate-400">
                        가입일: {new Date(selectedUser.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>

                  {/* 권한 변경 */}
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 mb-2">회원 등급</label>
                    <div className="flex gap-2 flex-wrap">
                      {(["MEMBER", "COACH", "ADMIN", "BANNED"] as const).map((role) => (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(selectedUser.id, role)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                            selectedUser.role === role
                              ? role === "BANNED"
                                ? "bg-red-600 text-white shadow-sm"
                                : role === "ADMIN"
                                ? "bg-purple-600 text-white shadow-sm"
                                : role === "COACH"
                                ? "bg-teal-600 text-white shadow-sm"
                                : "bg-green-600 text-white shadow-sm"
                              : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200"
                          }`}
                        >
                          {ROLE_LABELS[role]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 활동 이력 */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 mb-3">활동 이력</h3>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {selectedUser.participants.length === 0 && selectedUser.marathonParticipants.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">활동 내역이 없습니다</p>
                      ) : (
                        <>
                          {selectedUser.participants.map((p) => (
                            <div key={`m-${p.id}`} className="bg-slate-50 rounded-lg p-3 text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-blue-500 font-bold">정기 모임</span>
                                <span className={`px-1.5 py-0.5 rounded font-bold ${
                                  p.status === "APPROVED" ? "bg-green-100 text-green-600" :
                                  p.status === "WAITLISTED" ? "bg-red-100 text-red-600" :
                                  "bg-yellow-100 text-yellow-600"
                                }`}>
                                  {p.status === "APPROVED" ? "참석" : p.status === "WAITLISTED" ? "대기" : "승인대기"}
                                </span>
                                <button
                                  onClick={() => handleDeleteParticipant(p.id)}
                                  className="ml-auto text-slate-300 hover:text-red-400 transition-colors font-bold"
                                  title="신청 내역 삭제"
                                >✕</button>
                              </div>
                              <p className="text-slate-600">{p.meeting.date} · {p.meeting.startTime} · {p.meeting.location}</p>
                            </div>
                          ))}
                          {selectedUser.marathonParticipants.map((p) => (
                            <div key={`mr-${p.id}`} className="bg-orange-50 rounded-lg p-3 text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-orange-500 font-bold">마라톤</span>
                                <span className="px-1.5 py-0.5 rounded font-bold bg-green-100 text-green-600">참가</span>
                              </div>
                              <p className="text-slate-600">{p.marathon.date} · {p.marathon.title}</p>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
