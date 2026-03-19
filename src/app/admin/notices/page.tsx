"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface Notice {
  id: number;
  title: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [form, setForm] = useState({ title: "", body: "", isPinned: false });
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/notices");
    setNotices(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openForm(notice?: Notice) {
    if (notice) {
      setEditingNotice(notice);
      setForm({ title: notice.title, body: notice.body, isPinned: notice.isPinned });
    } else {
      setEditingNotice(null);
      setForm({ title: "", body: "", isPinned: false });
    }
    setShowForm(true);
  }

  async function handleSubmit() {
    if (!form.title.trim()) return;

    if (editingNotice) {
      await fetch(`/api/notices/${editingNotice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, body: form.body, isPinned: form.isPinned }),
      });
    } else {
      await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, body: form.body, isPinned: form.isPinned }),
      });
    }

    setShowForm(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("공지를 삭제하시겠습니까?")) return;
    await fetch(`/api/notices/${id}`, { method: "DELETE" });
    load();
  }

  async function handleTogglePin(notice: Notice) {
    await fetch(`/api/notices/${notice.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !notice.isPinned }),
    });
    load();
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-extrabold text-slate-900">공지사항 관리</h1>
        <button
          onClick={() => openForm()}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
        >
          + 새 공지
        </button>
      </div>

      {/* 공지 작성/수정 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-4">
          <h2 className="font-bold text-slate-800">{editingNotice ? "공지 수정" : "새 공지 작성"}</h2>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">제목 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="공지 제목"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">내용</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="공지 내용을 입력하세요"
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={form.isPinned}
              onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}
              className="w-4 h-4 accent-blue-600"
            />
            <label htmlFor="isPinned" className="text-sm text-slate-700">홈 배너에 고정 표시</label>
            <span className="text-xs text-slate-400">(1개만 고정 가능)</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!form.title.trim()}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-bold transition-colors"
            >
              {editingNotice ? "수정 저장" : "공지 등록"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 공지 목록 */}
      {loading ? (
        <p className="text-sm text-slate-400 text-center py-10">불러오는 중...</p>
      ) : notices.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">등록된 공지사항이 없습니다</p>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div key={n.id} className={`bg-white rounded-xl border p-4 ${n.isPinned ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {n.isPinned && (
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">📌 고정</span>
                    )}
                    <h3 className="font-semibold text-slate-900 text-sm truncate">{n.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    {new Date(n.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => openForm(n)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleTogglePin(n)}
                    className="text-xs text-amber-600 hover:underline"
                  >
                    {n.isPinned ? "고정 해제" : "고정"}
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
