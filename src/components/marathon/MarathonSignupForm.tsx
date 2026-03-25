"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SessionUser } from "@/lib/session";
import { kakaoLogin } from "@/lib/kakao";

interface MarathonParticipant {
  id: number;
  kakaoId: string;
  name: string;
  status: string;
}

interface MarathonSignupFormProps {
  marathon: {
    id: number;
    title: string;
    date: string;
    startTime: string;
    location: string | null;
    description: string | null;
    link: string | null;
    participants: MarathonParticipant[];
  };
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.477 2 10.857c0 2.713 1.584 5.1 3.988 6.577L5 21l4.29-2.287C10.145 18.9 11.058 19 12 19c5.523 0 10-3.477 10-7.143C22 6.477 17.523 3 12 3z" />
    </svg>
  );
}

export function MarathonSignupForm({ marathon }: MarathonSignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      window.history.replaceState({}, "", `/marathon/${marathon.id}`);
    }
  }, [searchParams, marathon.id]);

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
      const res = await fetch(`/api/marathons/${marathon.id}/participate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, note }),
      });

      if (res.status === 409) { setDuplicate(true); setSubmitting(false); return; }
      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error ?? "참가 신청 중 오류가 발생했습니다.");
        setSubmitting(false);
        return;
      }

      alert("대회 참가 신청이 완료되었습니다!");
      router.refresh();
      setSubmitting(false);
    } catch {
      setServerError("네트워크 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  const isAlreadyParticipating = user && marathon.participants.some(p => p.kakaoId === user.kakaoId);

  if (user === undefined) {
    return <div className="py-8 text-center text-slate-400 text-sm">불러오는 중...</div>;
  }

  if (!user) {
    const returnTo = `/marathon/${marathon.id}`;
    return (
      <div className="space-y-4">
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

  if (isAlreadyParticipating || duplicate) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-500 text-xl">
          ✓
        </div>
        <div>
          <p className="font-bold text-green-800">참가 신청이 완료되었습니다</p>
          <p className="text-sm text-green-600 mt-1">대회 당일 뵙겠습니다!</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* 이름 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          참가자 이름 <span className="text-red-500">*</span>
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
            ${nameError ? "border-red-400 bg-red-50" : profileName ? "border-slate-200 bg-slate-50 text-slate-600" : "border-slate-200 focus:border-emerald-500"}
            disabled:bg-slate-50 disabled:text-slate-400`}
        />
        {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
      </div>

      {/* 메모 */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          참여 메모 <span className="text-slate-400 font-normal">(선택)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 100))}
          placeholder="풀코스/하프코스 참여 여부나 기타 메모를 남겨주세요."
          rows={3}
          disabled={submitting}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-emerald-500 transition-colors resize-none disabled:bg-slate-50 disabled:text-slate-400"
        />
        <p className="mt-1 text-xs text-slate-400 text-right">{note.length}/100</p>
      </div>

      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className={`w-full py-3 rounded-xl font-bold text-white text-sm transition-all
          ${submitting || !name.trim()
            ? "bg-slate-300 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99]"
          }`}
      >
        {submitting ? "진행 중..." : "참가 신청하기"}
      </button>
    </form>
  );
}
