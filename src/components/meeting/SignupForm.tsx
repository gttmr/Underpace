"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MeetingWithCounts } from "@/lib/types";

interface SignupFormProps {
  meeting: MeetingWithCounts;
}

function formatContact(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function SignupForm({ meeting }: SignupFormProps) {
  const router = useRouter();
  const isFull = meeting.approvedCount >= meeting.maxCapacity;
  const isClosed = !meeting.isOpen;

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ name?: string; contact?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [duplicate, setDuplicate] = useState(false);

  function validate() {
    const e: { name?: string; contact?: string } = {};
    if (!name.trim()) e.name = "이름을 입력해주세요";
    if (!contact.trim()) e.contact = "연락처를 입력해주세요";
    else if (contact.replace(/\D/g, "").length < 10) e.contact = "올바른 연락처를 입력해주세요";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError("");
    setDuplicate(false);

    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id, name, contact, note }),
      });

      if (res.status === 409) {
        setDuplicate(true);
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        setServerError("신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      router.push(`/signup/confirm?status=${data.status}&waitlist=${data.waitlistPosition ?? ""}&meetingId=${meeting.id}&name=${encodeURIComponent(name)}`);
    } catch {
      setServerError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      setSubmitting(false);
    }
  }

  if (isClosed) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500">
        이 모임의 신청이 마감되었습니다.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isFull && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">정원이 마감되었습니다</p>
            <p className="text-amber-700 text-sm mt-0.5">
              현재 대기자 {meeting.waitlistedCount + 1}번째로 등록됩니다.
            </p>
          </div>
        </div>
      )}

      {duplicate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          이미 이 모임에 신청하셨습니다.
        </div>
      )}

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => !name.trim() && setErrors((p) => ({ ...p, name: "이름을 입력해주세요" }))}
          placeholder="홍길동"
          disabled={submitting}
          className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors
            ${errors.name ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-blue-500"}
            disabled:bg-slate-50 disabled:text-slate-400`}
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          연락처 <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={contact}
          onChange={(e) => setContact(formatContact(e.target.value))}
          onBlur={() => {
            if (!contact.trim()) setErrors((p) => ({ ...p, contact: "연락처를 입력해주세요" }));
            else if (contact.replace(/\D/g, "").length < 10) setErrors((p) => ({ ...p, contact: "올바른 연락처를 입력해주세요" }));
          }}
          placeholder="010-0000-0000"
          disabled={submitting}
          className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors
            ${errors.contact ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-blue-500"}
            disabled:bg-slate-50 disabled:text-slate-400`}
        />
        {errors.contact && <p className="mt-1 text-xs text-red-500">{errors.contact}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          메모 <span className="text-slate-400 font-normal">(선택)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 100))}
          placeholder="처음 참가합니다, 주차 문의 등..."
          rows={3}
          disabled={submitting}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-500 transition-colors resize-none disabled:bg-slate-50 disabled:text-slate-400"
        />
        <p className="mt-1 text-xs text-slate-400 text-right">{note.length}/100</p>
      </div>

      <button
        type="submit"
        disabled={submitting || !name.trim() || !contact.trim()}
        className={`w-full py-3 rounded-xl font-bold text-white text-sm transition-all
          ${submitting || !name.trim() || !contact.trim()
            ? "bg-slate-300 cursor-not-allowed"
            : isFull
              ? "bg-blue-500 hover:bg-blue-600 active:scale-[0.99]"
              : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99]"
          }`}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            처리 중...
          </span>
        ) : isFull ? "대기자로 신청하기" : "신청하기"}
      </button>

      <p className="text-xs text-slate-400 text-center">
        ⓘ 관리자 승인 후 확정됩니다
      </p>
    </form>
  );
}
