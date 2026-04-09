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
        <h1 className="text-xl font-extrabold text-brand-text">알림 관리</h1>
        <button
          onClick={() => openForm()}
          className="brand-button-primary px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          + 새 알림
        </button>
      </div>

      {showForm && (
        <div className="brand-panel-strong rounded-xl p-5 mb-6 space-y-4">
          <h2 className="font-bold text-brand-text">{editingNotice ? "알림 수정" : "새 알림 작성"}</h2>
          <div>
            <label className="text-[10px] font-black text-brand-text-subtle uppercase tracking-widest block mb-1.5">제목 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="알림 제목"
              className="brand-input w-full px-3 py-2.5 rounded-xl text-sm font-semibold"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-brand-text-subtle uppercase tracking-widest block mb-1.5">내용</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="알림 내용을 입력하세요"
              rows={4}
              className="brand-input w-full px-3 py-2.5 rounded-xl text-sm text-brand-text-muted resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={form.isPinned}
              onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}
              className="w-4 h-4 accent-brand-primary"
            />
            <label htmlFor="isPinned" className="text-sm text-brand-text-muted font-semibold">중요 알림으로 표시</label>
            <span className="text-xs text-brand-text-subtle">(1개만 고정 가능)</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!form.title.trim()}
              className="brand-button-primary flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
            >
              {editingNotice ? "수정 저장" : "알림 등록"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="brand-button-secondary px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-brand-text-subtle text-center py-10">불러오는 중...</p>
      ) : notices.length === 0 ? (
        <div className="text-center py-14">
          <div className="w-12 h-12 rounded-full bg-brand-surface flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-brand-text-subtle">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <p className="text-sm text-brand-text-subtle font-semibold">등록된 알림이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <div
              key={n.id}
              className={`bg-brand-surface-elevated rounded-xl border p-4 relative overflow-hidden ${
                n.isPinned ? "border-amber-300" : "border-brand-primary-border"
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
                    <h3 className="font-black text-brand-text text-sm truncate">{n.title}</h3>
                  </div>
                  {n.body && <p className="text-xs text-brand-text-muted line-clamp-2 leading-relaxed">{n.body}</p>}
                  <p className="text-[10px] text-brand-text-subtle mt-1.5 font-medium">
                    {new Date(n.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0 items-end">
                  <button onClick={() => openForm(n)} className="text-xs text-brand-text font-bold hover:underline">
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
