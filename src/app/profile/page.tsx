"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface UserProfile {
  id: number;
  kakaoId: string;
  name: string | null;
  profileImage: string | null;
  phoneNumber: string | null;
  pbFull: string | null;
  pbHalf: string | null;
  pb10k: string | null;
  pb5k: string | null;
  coachingNote: string | null;
  createdAt: string;
  _count: {
    participants: number;
    marathonParticipants: number;
  };
}

// 숫자만 입력하면 자동으로 H:MM:SS 또는 MM:SS 형식으로 변환
// 5자리(15800) 또는 6자리(015800) 모두 1:58:00으로 처리
function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, -2)}:${digits.slice(-2)}`;
  // 5~6자리: H:MM:SS (앞자리 0 자동 제거, 예: 015800 → 1:58:00)
  const hours = parseInt(digits.slice(0, -4), 10);
  return `${hours}:${digits.slice(-4, -2)}:${digits.slice(-2)}`;
}

function TimeInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // 콜론이 포함된 경우 (사용자가 직접 포맷 입력) 그대로 허용
    if (raw.includes(":")) {
      onChange(raw);
      return;
    }
    // 숫자만 입력 시 자동 포맷
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    onChange(formatTimeInput(digits));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 transition-colors"
    />
  );
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.477 2 10.857c0 2.713 1.584 5.1 3.988 6.577L5 21l4.29-2.287C10.145 18.9 11.058 19 12 19c5.523 0 10-3.477 10-7.143C22 6.477 17.523 3 12 3z" />
    </svg>
  );
}

export default function ProfilePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400 text-sm">불러오는 중...</p></div>}>
      <ProfilePage />
    </Suspense>
  );
}

function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get("setup") === "true";
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  // 폼 상태
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pbFull, setPbFull] = useState("");
  const [pbHalf, setPbHalf] = useState("");
  const [pb10k, setPb10k] = useState("");
  const [pb5k, setPb5k] = useState("");
  const [coachingNote, setCoachingNote] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (r.status === 401) { setNotLoggedIn(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setUser(data);
        setName(data.name || "");
        setPhoneNumber(data.phoneNumber || "");
        setPbFull(data.pbFull || "");
        setPbHalf(data.pbHalf || "");
        setPb10k(data.pb10k || "");
        setPb5k(data.pb5k || "");
        setCoachingNote(data.coachingNote || "");
        setLoading(false);
        if (isSetup) setShowSetup(true);
      })
      .catch(() => setLoading(false));
  }, [isSetup]);

  const handleSetupSave = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pbFull, pbHalf, pb10k, pb5k }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
      setShowSetup(false);
      router.replace("/profile");
    }
    setSaving(false);
  }, [name, pbFull, pbHalf, pb10k, pb5k, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phoneNumber, pbFull, pbHalf, pb10k, pb5k, coachingNote }),
    });

    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (notLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-slate-100">
          <div className="text-5xl mb-4">🏃</div>
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">로그인이 필요합니다</h1>
          <p className="text-sm text-slate-500 mb-6">카카오 로그인 후 나의 프로필을 관리할 수 있습니다.</p>
          <button
            onClick={() => window.location.href = `/api/auth/kakao?returnTo=/profile`}
            className="w-full h-12 inline-flex items-center gap-2 bg-[#FEE500] hover:bg-[#f0d800] text-[#3C1E1E] font-bold rounded-xl transition-colors justify-center text-sm"
          >
            <KakaoIcon />
            카카오로 로그인
          </button>
          <Link href="/" className="block mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* 첫 로그인 설정 모달 */}
      {showSetup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🏃‍♂️</div>
              <h2 className="text-xl font-extrabold text-slate-900">환영합니다!</h2>
              <p className="text-sm text-slate-500 mt-1">이름과 기록을 입력해주세요</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">이름(닉네임) <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="동호회에서 사용할 이름"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">풀 마라톤 PB <span className="text-slate-400 font-normal">(선택)</span></label>
                <TimeInput value={pbFull} onChange={setPbFull} placeholder="숫자만 입력 예: 34530 → 3:45:30" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">하프 마라톤 PB <span className="text-slate-400 font-normal">(선택)</span></label>
                <TimeInput value={pbHalf} onChange={setPbHalf} placeholder="숫자만 입력 예: 14215 → 1:42:15" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">10K PB</label>
                  <TimeInput value={pb10k} onChange={setPb10k} placeholder="예: 4830" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">5K PB</label>
                  <TimeInput value={pb5k} onChange={setPb5k} placeholder="예: 2200" />
                </div>
              </div>
            </div>

            <button
              onClick={handleSetupSave}
              disabled={saving || !name.trim()}
              className={`w-full mt-6 py-3 rounded-xl font-bold text-white text-sm transition-all ${
                saving || !name.trim()
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99]"
              }`}
            >
              {saving ? "저장 중..." : "시작하기"}
            </button>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <div className="max-w-lg mx-auto px-4 py-5 flex items-center gap-3">
          <Link href="/" className="text-blue-200 hover:text-white transition-colors text-xl leading-none">←</Link>
          <h1 className="font-bold text-lg">내 프로필</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
            {user?.profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-slate-300">👤</span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">{user?.name || "이름 없음"}</h2>
            <p className="text-xs text-slate-400 mt-1">
              가입일: {user ? new Date(user.createdAt).toLocaleDateString("ko-KR") : ""}
            </p>
            <div className="flex gap-3 mt-2">
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">모임 {user?._count.participants}회</span>
              <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold">대회 {user?._count.marathonParticipants}회</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-lg">📝</span> 기본 정보
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">이름(닉네임)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="동호회에서 사용할 이름"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">연락처 <span className="text-slate-400 font-normal">(선택)</span></label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* 마라톤 PB 기록 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-800 mb-1 flex items-center gap-2">
              <span className="text-lg">🏅</span> 마라톤 PB 기록
            </h3>
            <p className="text-xs text-slate-400 mb-4">자기 최고 기록(Personal Best)을 입력해 보세요!</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">풀 마라톤 (42.195km)</label>
                <TimeInput value={pbFull} onChange={setPbFull} placeholder="예: 34530" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">하프 마라톤 (21km)</label>
                <TimeInput value={pbHalf} onChange={setPbHalf} placeholder="예: 14215" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">10K</label>
                <TimeInput value={pb10k} onChange={setPb10k} placeholder="예: 4830" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">5K</label>
                <TimeInput value={pb5k} onChange={setPb5k} placeholder="예: 2200" />
              </div>
            </div>
          </div>

          {/* 강습 관련 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-800 mb-1 flex items-center gap-2">
              <span className="text-lg">💬</span> 강습 시 바라는 점
            </h3>
            <p className="text-xs text-slate-400 mb-4">코치에게 전달될 내용이에요.</p>
            <textarea
              value={coachingNote}
              onChange={(e) => setCoachingNote(e.target.value.slice(0, 500))}
              placeholder="예: 페이스 유지하는 법을 배우고 싶습니다, 호흡법이 궁금합니다..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 transition-colors resize-none"
            />
            <p className="mt-1 text-xs text-slate-400 text-right">{coachingNote.length}/500</p>
          </div>

          {/* 저장 버튼 */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all ${
              saving
                ? "bg-slate-300 cursor-not-allowed"
                : saved
                ? "bg-green-500"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.99]"
            }`}
          >
            {saving ? "저장 중..." : saved ? "✓ 저장 완료!" : "프로필 저장하기"}
          </button>
        </form>
      </main>
    </div>
  );
}
