"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { MemberList } from "@/components/admin/MemberList";
import { MemberDetail } from "@/components/admin/MemberDetail";
import type { UserWithCounts, UserDetail } from "@/lib/types";

export default function AdminMembersPage() {
  const [users, setUsers] = useState<UserWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/members")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function loadDetail(userId: number) {
    setDetailLoading(true);
    const res = await fetch(`/api/admin/members/${userId}`);
    const data = await res.json();
    setSelectedUser(data);
    setDetailLoading(false);
  }

  async function handleNameSave(name: string) {
    if (!selectedUser) return;
    await fetch(`/api/admin/members/${selectedUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSelectedUser({ ...selectedUser, name });
    setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, name } : u)));
  }

  async function handleRoleChange(role: string) {
    if (!selectedUser) return;
    await fetch(`/api/admin/members/${selectedUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setSelectedUser({ ...selectedUser, role });
    setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, role } : u)));
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

  const totalCount = users.length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const bannedCount = users.filter((u) => u.role === "BANNED").length;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold text-brand-text">회원 관리</h1>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="bg-brand-surface text-brand-text-muted px-2.5 py-1 rounded-full">전체 {totalCount}</span>
          {adminCount > 0 && <span className="bg-purple-100 text-purple-600 px-2.5 py-1 rounded-full">관리자 {adminCount}</span>}
          {bannedCount > 0 && <span className="bg-red-100 text-red-600 px-2.5 py-1 rounded-full">차단 {bannedCount}</span>}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <MemberList
          users={users}
          loading={loading}
          selectedId={selectedUser?.id ?? null}
          search={search}
          onSearchChange={setSearch}
          onSelect={loadDetail}
        />

        {selectedUser && (
          <MemberDetail
            user={selectedUser}
            loading={detailLoading}
            onNameSave={handleNameSave}
            onRoleChange={handleRoleChange}
            onDeleteParticipant={handleDeleteParticipant}
          />
        )}
      </div>
    </AdminLayout>
  );
}
