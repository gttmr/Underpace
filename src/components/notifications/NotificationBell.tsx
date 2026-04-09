"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Notice {
  id: number;
  title: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
}

const STORAGE_KEY = "underpace_read_notifications";

function getReadIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

export default function NotificationBell({ light = false }: { light?: boolean }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setReadIds(getReadIds());
    fetch("/api/notices")
      .then((r) => r.json())
      .then(setNotices)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSelectedId(null);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const unreadCount = notices.filter((n) => !readIds.has(n.id)).length;

  const markRead = useCallback((id: number) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    const next = new Set(notices.map((n) => n.id));
    saveReadIds(next);
    setReadIds(next);
  }, [notices]);

  function handleSelect(n: Notice) {
    setSelectedId(n.id);
    markRead(n.id);
  }

  const selectedNotice = notices.find((n) => n.id === selectedId);
  const iconColor = light ? "text-brand-text" : "text-white";
  const ringColor = light ? "ring-white" : "ring-brand-primary";

  return (
    <div className="relative">
      {/* Bell button — 배경/테두리 없음, 아이콘만 */}
      <button
        ref={buttonRef}
        onClick={() => { setOpen((v) => !v); setSelectedId(null); }}
        aria-label={`알림 ${unreadCount > 0 ? `(${unreadCount}개 새 알림)` : ""}`}
        className="relative w-9 h-9 flex items-center justify-center transition-all active:scale-95 hover:opacity-70"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-5 h-5 ${iconColor}`}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            className={`absolute top-1 right-1 w-2 h-2 rounded-full bg-red-400 ring-2 ${ringColor} animate-pulse`}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-11 w-80 max-h-[480px] flex flex-col bg-brand-surface-elevated rounded-2xl border border-brand-primary-border shadow-xl shadow-[rgba(0,29,110,0.15)] overflow-hidden z-50 animate-scale-in origin-top-right"
        >
          {/* 상세 뷰 */}
          {selectedNotice ? (
            <>
              <div className="bg-brand-primary px-4 py-3 flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-[rgba(196,221,255,0.8)] hover:text-white transition-colors text-lg leading-none font-black"
                >
                  ←
                </button>
                <span className="text-white font-black text-sm flex-1 truncate">{selectedNotice.title}</span>
              </div>
              <div className="overflow-y-auto flex-1 p-4 space-y-2">
                {selectedNotice.isPinned && (
                  <span className="inline-block text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                    고정
                  </span>
                )}
                <p className="text-xs text-brand-text-subtle font-medium">{relativeTime(selectedNotice.createdAt)}</p>
                <p className="text-sm text-brand-text leading-relaxed whitespace-pre-wrap">{selectedNotice.body}</p>
              </div>
            </>
          ) : (
            <>
              {/* 리스트 헤더 */}
              <div className="bg-brand-primary px-4 py-3 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-sm">알림</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-400 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-bold text-[rgba(196,221,255,0.8)] hover:text-[#c4ddff] transition-colors"
                  >
                    모두 읽음
                  </button>
                )}
              </div>

              {/* 리스트 */}
              <div className="overflow-y-auto flex-1">
                {notices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-brand-surface flex items-center justify-center mb-3">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-brand-text-subtle">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-brand-text-subtle">알림이 없습니다</p>
                  </div>
                ) : (
                  notices.map((n) => {
                    const isRead = readIds.has(n.id);
                    return (
                      <button
                        key={n.id}
                        onClick={() => handleSelect(n)}
                        className={`w-full text-left px-4 py-3.5 border-b border-brand-divider last:border-0 relative transition-colors ${
                          isRead ? "bg-brand-surface-elevated hover:bg-brand-page" : "bg-brand-page hover:bg-[rgba(196,221,255,0.2)]"
                        }`}
                      >
                        {!isRead && (
                          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-primary rounded-r" />
                        )}
                        <div className="flex items-start gap-2.5">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isRead ? "bg-brand-divider" : "bg-brand-primary"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {n.isPinned && (
                                <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1 py-0.5 rounded uppercase tracking-wide leading-none">
                                  고정
                                </span>
                              )}
                              <p className={`text-sm leading-snug truncate ${isRead ? "font-semibold text-brand-text-muted" : "font-black text-brand-text"}`}>
                                {n.title}
                              </p>
                            </div>
                            {n.body && (
                              <p className={`text-xs line-clamp-2 leading-relaxed ${isRead ? "text-brand-text-subtle" : "text-brand-text-muted"}`}>
                                {n.body}
                              </p>
                            )}
                            <p className="text-[10px] text-brand-text-subtle mt-1 font-medium">{relativeTime(n.createdAt)}</p>
                          </div>
                          <svg className="w-3.5 h-3.5 text-brand-text-subtle shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
