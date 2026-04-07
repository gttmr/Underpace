"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { MeetingWithCounts } from "@/lib/types";
import { kakaoLogin } from "@/lib/kakao";
import { formatSignupOpensAt, isSignupAvailable } from "@/lib/meetingSignup";

interface SessionUser {
  kakaoId: string;
  nickname: string;
  profileImage?: string;
}

interface SignupFormProps {
  meeting: MeetingWithCounts;
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.477 2 10.857c0 2.713 1.584 5.1 3.988 6.577L5 21l4.29-2.287C10.145 18.9 11.058 19 12 19c5.523 0 10-3.477 10-7.143C22 6.477 17.523 3 12 3z" />
    </svg>
  );
}

export function SignupForm({ meeting }: SignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isFull = meeting.approvedCount >= meeting.maxCapacity;
  const isClosed = !meeting.isOpen;
  const isSignupReady = isSignupAvailable(meeting);
  const isWaitingForOpen = !isClosed && !isSignupReady;

  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [profileName, setProfileName] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [duplicate, setDuplicate] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        if (data?.kakaoId) {
          fetch("/api/profile")
            .then((r) => r.ok ? r.json() : null)
            .then((profile) => {
              if (profile?.name) {
                setName(profile.name);
                setProfileName(profile.name);
              } else if (data?.nickname) {
                setName(data.nickname);
              }
            })
            .catch(() => {
              if (data?.nickname) setName(data.nickname);
            });
        }
      })
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (authError) {
      alert(`카카오 로그인 중 오류가 발생했습니다.\n에러 코드: ${authError}\n\n(카카오 디벨로퍼스 설정의 Redirect URI 혹은 앱 키를 확인해주세요)`);
      window.history.replaceState({}, "", `/meeting/${meeting.id}`);
    }
  }, [searchParams, meeting.id]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setName("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setNameError("이름을 입력해주세요"); return; }
    setNameError("");
    setSubmitting(true);
    setServerError("");
    setDuplicate(false);

    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id, name, note }),
      });

      if (res.status === 409) { setDuplicate(true); setSubmitting(false); return; }
      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error ?? "신청 중 오류가 발생했습니다.");
        setSubmitting(false);
        return;
      }

      const data = await res.json();
      router.push(
        `/signup/confirm?status=${data.status}&waitlist=${data.waitlistPosition ?? ""}&meetingId=${meeting.id}&name=${encodeURIComponent(name)}`
      );
    } catch {
      setServerError("네트워크 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  if (isClosed) {
    return (
      <div className="brand-panel-strong rounded-xl p-6 text-center">
        <p className="text-sm font-bold text-brand-text-subtle">이 모임의 신청이 마감되었습니다.</p>
      </div>
    );
  }

  if (isWaitingForOpen) {
    return (
      <div className="bg-brand-surface border border-brand-primary-border rounded-xl p-5 text-center">
        <p className="text-sm font-black text-brand-text">아직 신청 오픈 전입니다</p>
        <p className="text-xs text-brand-text-muted mt-1.5">
          신청은 {formatSignupOpensAt(meeting.signupOpensAt)}부터 가능합니다.
        </p>
      </div>
    );
  }

  if (user === undefined) {
    return <div className="py-8 text-center text-brand-text-subtle text-sm font-medium">불러오는 중...</div>;
  }

  if (!user) {
    const returnTo = `/meeting/${meeting.id}`;
    return (
      <div className="space-y-3">
        {isFull && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-amber-500 text-base shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="font-black text-amber-800 text-sm">정원이 마감되었습니다</p>
              <p className="text-amber-700 text-xs mt-0.5">
                대기자 {meeting.waitlistedCount + 1}번째로 등록됩니다.
              </p>
            </div>
          </div>
        )}
        <div className="brand-panel-strong rounded-xl p-5 text-center space-y-3">
          <p className="text-sm text-brand-text-muted font-medium">카카오 계정으로 간편하게 신청할 수 있습니다</p>
          <button
            type="button"
            onClick={() => kakaoLogin(returnTo)}
            className="w-full h-12 inline-flex items-center gap-2 bg-[#FEE500] hover:bg-[#f0d800] text-[#3C1E1E] font-black rounded-xl transition-colors justify-center text-sm active:scale-[0.98]"
          >
            <KakaoIcon />
            카카오로 로그인하여 신청하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isFull && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-500 text-base shrink-0 mt-0.5">⚠️</span>
          <div>
            <p className="font-black text-amber-800 text-sm">정원이 마감되었습니다</p>
            <p className="text-amber-700 text-xs mt-0.5">대기자 {meeting.waitlistedCount + 1}번째로 등록됩니다.</p>
          </div>
        </div>
      )}

      {duplicate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm font-bold text-amber-800">
          이 모임에 이미 신청하셨습니다.
        </div>
      )}

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm font-bold text-red-700">
          {serverError}
        </div>
      )}

      {/* 이름 */}
      <div>
        <label className="block text-[10px] font-black text-brand-text-subtle mb-1.5 uppercase tracking-widest">
          이름 <span className="text-red-400 normal-case">*</span>
          {!profileName && (
            <span className="ml-1.5 text-amber-500 normal-case font-semibold tracking-normal text-[10px]">프로필에서 이름을 설정해 주세요</span>
          )}
        </label>
        <input
          type="text"
          value={name}
          readOnly={!!profileName}
          onChange={profileName ? undefined : (e) => { setName(e.target.value); setNameError(""); }}
          placeholder="홍길동"
          disabled={submitting}
          className={`w-full px-4 py-2.5 rounded-xl text-sm font-semibold placeholder:font-normal placeholder:text-brand-text-subtle disabled:opacity-60
            ${nameError
              ? "border border-red-400 bg-red-50 outline-none focus:ring-2 focus:ring-red-200"
              : profileName
              ? "brand-input-dimmed"
              : "brand-input"
            }`}
        />
        {nameError && <p className="mt-1 text-xs text-red-500 font-medium">{nameError}</p>}
      </div>

      {/* 메모 */}
      <div>
        <label className="block text-[10px] font-black text-brand-text-subtle mb-1.5 uppercase tracking-widest">
          메모 <span className="ml-1 normal-case font-semibold text-brand-text-subtle tracking-normal">(선택)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 100))}
          placeholder="처음 참가합니다, 주차 문의 등..."
          rows={3}
          disabled={submitting}
          className="brand-input w-full px-4 py-2.5 rounded-xl text-sm resize-none disabled:opacity-60 placeholder:text-brand-text-subtle"
        />
        <p className="mt-1 text-[10px] text-brand-text-subtle text-right font-medium">{note.length}/100</p>
      </div>

      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className={`w-full py-3.5 rounded-xl font-black text-sm transition-all active:scale-[0.98]
          ${submitting || !name.trim()
            ? "bg-brand-dimmed text-brand-dimmed-text cursor-not-allowed"
            : isFull
            ? "bg-brand-primary-soft-strong text-brand-text hover:opacity-90"
            : "brand-button-primary"
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

      <p className="text-[10px] text-brand-text-subtle text-center font-medium">관리자 승인 후 확정됩니다</p>
    </form>
  );
}
