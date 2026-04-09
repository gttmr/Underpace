"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/session";
import { kakaoLogin } from "@/lib/kakao";
import { KakaoIcon } from "@/components/ui/KakaoIcon";

interface MarathonRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SessionUser | null;
  returnTo: string;
}

export default function MarathonRegistrationModal({ isOpen, onClose, user, returnTo }: MarathonRegistrationModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/marathons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, date, startTime, location, link, description }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "등록에 실패했습니다.");
        setSubmitting(false);
        return;
      }

      router.refresh();
      onClose();
      setTitle("");
      setDate("");
      setLocation("");
      setLink("");
      setDescription("");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-brand-text/30 backdrop-blur-sm">
      <div className="bg-brand-surface-elevated rounded-2xl shadow-brand w-full max-w-md overflow-hidden animate-scale-in">
        <div className="px-6 py-4 border-b border-brand-primary-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-brand-text">대회 등록</h2>
          <button onClick={onClose} className="text-brand-text-subtle hover:text-brand-text transition-colors p-1">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-brand-text-subtle mb-1.5 uppercase tracking-widest">대회명 <span className="text-red-400 normal-case">*</span></label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2026 서울마라톤"
              className="brand-input w-full px-4 py-2.5 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-brand-text-subtle mb-1.5 uppercase tracking-widest">날짜 <span className="text-red-400 normal-case">*</span></label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="brand-input w-full px-4 py-2.5 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-brand-text-subtle mb-1.5 uppercase tracking-widest">시작 시간 <span className="text-red-400 normal-case">*</span></label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="brand-input w-full px-4 py-2.5 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-brand-text-subtle mb-1.5 uppercase tracking-widest">장소</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="예: 광화문 광장"
              className="brand-input w-full px-4 py-2.5 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-brand-text-subtle mb-1.5 uppercase tracking-widest">접수 링크 <span className="ml-1 normal-case font-semibold tracking-normal">(선택)</span></label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="brand-input w-full px-4 py-2.5 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-brand-text-subtle mb-1.5 uppercase tracking-widest">메모</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="코스 정보, 참가비 등을 적어주세요."
              rows={2}
              className="brand-input w-full px-4 py-2.5 rounded-xl text-sm resize-none"
            />
          </div>

          <div className="pt-2">
            {!user ? (
              <button
                type="button"
                onClick={() => kakaoLogin(returnTo)}
                className="w-full h-12 rounded-xl bg-kakao hover:bg-kakao-hover text-kakao-text font-black text-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <KakaoIcon />
                카카오로 로그인하고 등록하기
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="brand-button-primary w-full py-3 rounded-xl font-black text-sm transition-colors disabled:opacity-50"
              >
                {submitting ? "등록 중..." : "등록하기"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
