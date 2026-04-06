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
    if (!confirm("알림을 삭제하시겠습니까?")) return;
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
        <h1 className="text-xl font-extrabold text-slate-900">알림 관리</h1>
        <button
          onClick={() => openForm()}
          className="px-4 py-2 rounded-lg bg-[#001d6e] hover:bg-[#00277a] text-white text-sm font-semibold transition-colors"
        >
          + 새 알림
        </button>
      </div>

      {/* 알림 작성/수정 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl border border-[#7fb5ff] p-5 mb-6 space-y-4">
          <h2 className="font-bold text-[#001d6e]">{editingNotice ? "알림 수정" : "새 알림 작성"}</h2>
          <div>
            <label className="text-[10px] font-black text-[rgba(0,29,110,0.5)] uppercase tracking-widest block mb-1.5">제목 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="알림 제목"
              className="w-full px-3 py-2.5 rounded-xl border border-[#7fb5ff] text-sm outline-none focus:border-[#001d6e] focus:ring-2 focus:ring-[rgba(127,181,255,0.25)] text-[#001d6e] font-semibold transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-[rgba(0,29,110,0.5)] uppercase tracking-widest block mb-1.5">내용</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="알림 내용을 입력하세요"
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-[#7fb5ff] text-sm outline-none focus:border-[#001d6e] focus:ring-2 focus:ring-[rgba(127,181,255,0.25)] text-[rgba(0,29,110,0.74)] transition-all resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={form.isPinned}
              onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}
              className="w-4 h-4 accent-[#001d6e]"
            />
            <label htmlFor="isPinned" className="text-sm text-[rgba(0,29,110,0.74)] font-semibold">중요 알림으로 표시</label>
            <span className="text-xs text-[rgba(0,29,110,0.35)]">(1개만 고정 가능)</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!form.title.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[#001d6e] hover:bg-[#00277a] disabled:bg-[#e5e7eb] disabled:text-[#9ca3af] text-white text-sm font-bold transition-colors"
            >
              {editingNotice ? "수정 저장" : "알림 등록"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl border border-[#7fb5ff] text-[rgba(0,29,110,0.6)] text-sm hover:bg-[#f5f8ff] transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 알림 목록 */}
      {loading ? (
        <p className="text-sm text-[rgba(0,29,110,0.4)] text-center py-10">불러오는 중...</p>
      ) : notices.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-12 h-12 rounded-full bg-[#f0f5ff] flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-[rgba(0,29,110,0.3)]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="text-sm text-[rgba(0,29,110,0.4)] font-semibold">등록된 알림이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div
              key={n.id}
              className={`bg-white rounded-xl border p-4 relative overflow-hidden ${
                n.isPinned ? "border-amber-300" : "border-[#7fb5ff]"
              }`}
            >
              {n.isPinned && (
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-400 rounded-r" />
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 pl-1">
                  <div className="flex items-center gap-2 mb-1">
                    {n.isPinned && (
                      <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded uppercase tracking-wide">고정</span>
                    )}
                    <h3 className="font-black text-[#001d6e] text-sm truncate">{n.title}</h3>
                  </div>
                  {n.body && <p className="text-xs text-[rgba(0,29,110,0.55)] line-clamp-2 leading-relaxed">{n.body}</p>}
                  <p className="text-[10px] text-[rgba(0,29,110,0.3)] mt-1.5 font-medium">
                    {new Date(n.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0 items-end">
                  <button onClick={() => openForm(n)} className="text-xs text-[#001d6e] font-bold hover:underline">
                    수정
                  </button>
                  <button onClick={() => handleTogglePin(n)} className="text-xs text-amber-600 font-bold hover:underline">
                    {n.isPinned ? "고정 해제" : "고정"}
                  </button>
                  <button onClick={() => handleDelete(n.id)} className="text-xs text-red-500 font-bold hover:underline">
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
