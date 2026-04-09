"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { MarathonDetail } from "@/lib/types";
import { kakaoLogin } from "@/lib/kakao";
import { KakaoIcon } from "@/components/ui/KakaoIcon";
import { useUserSession } from "@/lib/hooks/useUserSession";

interface MarathonSignupFormProps {
  marathon: MarathonDetail;
}

export function MarathonSignupForm({ marathon }: MarathonSignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, name, profileName, setName } = useUserSession();

  const [note, setNote] = useState("");
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [duplicate, setDuplicate] = useState(false);

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (authError) {
      alert(`카카오 로그인 중 오류가 발생했습니다.\n에러 코드: ${authError}\n\n(카카오 디벨로퍼스 설정의 Redirect URI 혹은 앱 키를 확인해주세요)`);
      window.history.replaceState({}, "", `/marathon/${marathon.id}`);
    }
  }, [searchParams, marathon.id]);

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

  const isAlreadyParticipating = user && marathon.participants.some((p) => p.kakaoId === user.kakaoId);

  if (user === undefined) {
    return <div className="py-8 text-center text-brand-text-subtle text-sm font-medium">불러오는 중...</div>;
  }

  if (!user) {
    return (
      <div className="brand-panel-strong rounded-xl p-5 text-center space-y-3">
        <p className="text-sm text-brand-text-muted font-medium">카카오 계정으로 간편하게 신청할 수 있습니다</p>
        <button
          type="button"
          onClick={() => kakaoLogin(`/marathon/${marathon.id}`)}
          className="w-full h-12 inline-flex items-center gap-2 bg-kakao hover:bg-kakao-hover text-kakao-text font-black rounded-xl transition-colors justify-center text-sm active:scale-[0.98]"
        >
          <KakaoIcon />
          카카오로 로그인하여 신청하기
        </button>
      </div>
    );
  }

  if (isAlreadyParticipating || duplicate) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-500 text-xl">
          ✓
        </div>
        <div>
          <p className="font-black text-emerald-800">참가 신청이 완료되었습니다</p>
          <p className="text-sm text-emerald-600 mt-1">대회 당일 뵙겠습니다!</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm font-bold text-red-700">
          {serverError}
        </div>
      )}

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

      <div>
        <label className="block text-[10px] font-black text-brand-text-subtle mb-1.5 uppercase tracking-widest">
          메모 <span className="ml-1 normal-case font-semibold text-brand-text-subtle tracking-normal">(선택)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 100))}
          placeholder="풀코스/하프코스 참여 여부나 기타 메모를 남겨주세요."
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
            : "brand-button-primary"
          }`}
      >
        {submitting ? "처리 중..." : "참가 신청하기"}
      </button>
    </form>
  );
}
