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

  const [user, setUser] = useState<SessionUser | null | undefined>(undefined); // undefined = 로딩중
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
          // 프로필 이름 가져오기
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
      // Remove query param from URL
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
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-500">
        이 모임의 신청이 마감되었습니다.
      </div>
    );
  }

  if (isWaitingForOpen) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
        <p className="text-sm font-semibold text-blue-800">아직 신청 오픈 전입니다</p>
        <p className="text-sm text-blue-700 mt-1">
          신청은 {formatSignupOpensAt(meeting.signupOpensAt)}부터 가능합니다.
        </p>
      </div>
    );
  }

  // 로딩 중
  if (user === undefined) {
    return <div className="py-8 text-center text-slate-400 text-sm">불러오는 중...</div>;
  }

  // 비로그인 상태
  if (!user) {
    const returnTo = `/meeting/${meeting.id}`;
    return (
      <div className="space-y-4">
        {isFull && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">정원이 마감되었습니다</p>
              <p className="text-amber-700 text-sm mt-0.5">
                대기자 {meeting.waitlistedCount + 1}번째로 등록됩니다.
              </p>
            </div>
          </div>
        )}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-center space-y-3">
          <p className="text-sm text-slate-600">카카오 계정으로 간편하게 신청할 수 있습니다</p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => kakaoLogin(returnTo)}
              className="w-full h-12 inline-flex items-center gap-2 bg-[#FEE500] hover:bg-[#f0d800] text-[#3C1E1E] font-bold rounded-xl transition-colors justify-center text-sm"
            >
              <KakaoIcon />
              카카오로 로그인하여 신청하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 로그인 상태
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isFull && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">정원이 마감되었습니다</p>
            <p className="text-amber-700 text-sm mt-0.5">
              대기자 {meeting.waitlistedCount + 1}번째로 등록됩니다.
            </p>
          </div>
        </div>
      )}

      {duplicate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          이 모임에 이미 신청하셨습니다.
        </div>
      )}

      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* 이름 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          이름 <span className="text-red-500">*</span>
          {profileName ? (
            <span className="font-normal text-slate-400 ml-1 text-xs">(프로필에서 변경 가능)</span>
          ) : (
            <span className="font-normal text-amber-500 ml-1 text-xs">(프로필에서 이름을 설정해 주세요)</span>
          )}
        </label>
        <input
          type="text"
          value={name}
          readOnly={!!profileName}
          onChange={profileName ? undefined : (e) => { setName(e.target.value); setNameError(""); }}
          placeholder="홍길동"
          disabled={submitting}
          className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors
            ${nameError ? "border-red-400 bg-red-50" : profileName ? "border-slate-200 bg-slate-50 text-slate-600" : "border-slate-200 focus:border-blue-500"}
            disabled:bg-slate-50 disabled:text-slate-400`}
        />
        {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
      </div>

      {/* 메모 */}
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
        disabled={submitting || !name.trim()}
        className={`w-full py-3 rounded-xl font-bold text-white text-sm transition-all
          ${submitting || !name.trim()
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

      <p className="text-xs text-slate-400 text-center">ⓘ 관리자 승인 후 확정됩니다</p>
    </form>
  );
}
