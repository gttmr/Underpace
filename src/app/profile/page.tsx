"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { KakaoIcon } from "@/components/ui/KakaoIcon";

interface UserProfile {
  id: number;
  kakaoId: string;
  name: string | null;
  region: string | null;
  profileImage: string | null;
  phoneNumber: string | null;
  pbFull: string | null;
  pbHalf: string | null;
  pb10k: string | null;
  pb5k: string | null;
  coachingNote: string | null;
  createdAt: string;
  _count: { participants: number; marathonParticipants: number };
}

function formatTimeInput(digits: string): string {
  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) {
    const mins = parseInt(digits.slice(0, -2), 10);
    return `${mins}:${digits.slice(-2)}`;
  }
  const hours = parseInt(digits.slice(0, -4), 10);
  return `${hours}:${digits.slice(-4, -2)}:${digits.slice(-2)}`;
}

function TimeInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    onChange(formatTimeInput(digits));
  };
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-xl border border-brand-primary-border bg-white text-sm outline-none focus:border-brand-primary-border-strong focus:ring-2 focus:ring-brand-ring transition-all text-brand-text font-semibold placeholder:font-normal placeholder:text-brand-text-subtle"
    />
  );
}


export default function ProfilePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-brand-text-subtle text-sm">불러오는 중...</p></div>}>
      <ProfilePage />
    </Suspense>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-brand-surface-elevated rounded-2xl border border-brand-primary-border shadow-sm overflow-hidden">
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="px-5 py-4 border-b border-brand-primary-border">
      <div className="flex items-center gap-2 mb-0.5">
        <span>{icon}</span>
        <h3 className="text-sm font-black text-brand-text">{title}</h3>
      </div>
      {sub && <p className="text-xs text-brand-text-subtle ml-6">{sub}</p>}
    </div>
  );
}

function FormInput({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-black text-brand-text-subtle mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-red-400 normal-case">*</span>}
      </label>
      {children}
    </div>
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

  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
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
        setRegion(data.region || "");
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
      body: JSON.stringify({ name, region, pbFull, pbHalf, pb10k, pb5k }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
      setShowSetup(false);
      router.replace("/profile");
    }
    setSaving(false);
  }, [name, region, pbFull, pbHalf, pb10k, pb5k, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, region, phoneNumber, pbFull, pbHalf, pb10k, pb5k, coachingNote }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-brand-primary-border bg-white text-sm outline-none focus:border-brand-primary-border-strong focus:ring-2 focus:ring-brand-ring transition-all text-brand-text font-semibold placeholder:font-normal placeholder:text-brand-text-subtle";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-brand-text-subtle text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (notLoggedIn) {
    return (
      <div className="min-h-screen bg-brand-page flex flex-col items-center px-6 pt-[20vh]">
        <div className="bg-brand-surface-elevated rounded-2xl p-8 max-w-sm w-full text-center shadow-sm border border-brand-primary-border">
          <div className="text-5xl mb-4">🏃</div>
          <h1 className="text-xl font-black text-brand-text mb-2">로그인이 필요합니다</h1>
          <p className="text-sm text-brand-text-subtle mb-6">카카오 로그인 후 나의 프로필을 관리할 수 있습니다.</p>
          <button
            onClick={() => window.location.href = `/api/auth/kakao?returnTo=/profile`}
            className="w-full h-12 inline-flex items-center gap-2 bg-kakao hover:bg-kakao-hover text-kakao-text font-black rounded-xl transition-colors justify-center text-sm active:scale-[0.97]"
          >
            <KakaoIcon />
            카카오로 로그인
          </button>
          <Link href="/" className="block mt-4 text-xs text-brand-text-subtle hover:text-brand-text transition-colors font-semibold">
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-page pb-24">
      {/* setup modal */}
      {showSetup && (
        <div className="fixed inset-0 bg-brand-text/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-brand-surface-elevated rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-in">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🏃‍♂️</div>
              <h2 className="text-xl font-black text-brand-text">환영합니다!</h2>
              <p className="text-sm text-brand-text-subtle mt-1">이름과 기록을 입력해주세요</p>
            </div>
            <div className="space-y-4">
              <FormInput label="이름" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="동호회에서 사용할 이름"
                  className={inputClass}
                  autoFocus
                />
              </FormInput>
              <FormInput label="지역">
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="예: 서울, 경기"
                  className={inputClass}
                />
              </FormInput>
              <FormInput label="풀마라톤 PB">
                <TimeInput value={pbFull} onChange={setPbFull} placeholder="예: 34530 → 3:45:30" />
              </FormInput>
              <FormInput label="하프마라톤 PB">
                <TimeInput value={pbHalf} onChange={setPbHalf} placeholder="예: 14215 → 1:42:15" />
              </FormInput>
              <div className="grid grid-cols-2 gap-3">
                <FormInput label="10K PB">
                  <TimeInput value={pb10k} onChange={setPb10k} placeholder="예: 4830" />
                </FormInput>
                <FormInput label="5K PB">
                  <TimeInput value={pb5k} onChange={setPb5k} placeholder="예: 2200" />
                </FormInput>
              </div>
            </div>
            <button
              onClick={handleSetupSave}
              disabled={saving || !name.trim()}
              className={`w-full mt-6 py-3.5 rounded-xl font-black text-white text-sm transition-all active:scale-[0.98] ${
                saving || !name.trim() ? "bg-brand-dimmed cursor-not-allowed text-brand-dimmed-text" : "bg-brand-primary hover:bg-brand-primary-hover"
              }`}
            >
              {saving ? "저장 중..." : "시작하기"}
            </button>
          </div>
        </div>
      )}

      {/* header */}
      <header className="bg-white shadow-[0_1px_12px_rgba(0,0,0,0.07)] sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 h-14 grid grid-cols-[1fr_auto_1fr] items-center">
          <Link href="/" className="text-brand-text-subtle hover:text-brand-text transition-colors text-sm font-bold">
            ←
          </Link>
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="Underpace"
              width={140}
              height={40}
              className="object-contain"
              priority
            />
          </Link>
          <div />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* profile card */}
        <SectionCard>
          <div className="p-5 flex items-center gap-4">
            {/* avatar */}
            <div className="w-16 h-16 rounded-full ring-2 ring-brand-primary-border ring-offset-2 bg-brand-surface flex items-center justify-center overflow-hidden shrink-0">
              {user?.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-brand-text leading-tight">{user?.name || "이름 없음"}</h2>
              <p className="text-xs text-brand-text-subtle mt-0.5 font-medium">
                가입일: {user ? new Date(user.createdAt).toLocaleDateString("ko-KR") : ""}
              </p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-brand-surface text-brand-text px-2 py-0.5 rounded-full font-black">
                  모임 {user?._count.participants}회
                </span>
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-black">
                  대회 {user?._count.marathonParticipants}회
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        <form onSubmit={handleSave} className="space-y-4">
          {/* basic info */}
          <SectionCard>
            <SectionHeader icon="📝" title="기본 정보" />
            <div className="p-5 space-y-4">
              <FormInput label="이름" required>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="동호회에서 사용할 이름"
                  className={inputClass}
                />
              </FormInput>
              <FormInput label="지역">
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="예: 서울, 경기"
                  className={inputClass}
                />
              </FormInput>
              <FormInput label="연락처">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="010-0000-0000"
                  className={inputClass}
                />
              </FormInput>
            </div>
          </SectionCard>

          {/* PB records */}
          <SectionCard>
            <SectionHeader icon="🏅" title="마라톤 PB 기록" sub="자기 최고 기록(Personal Best)" />
            <div className="p-5 grid grid-cols-2 gap-3">
              <FormInput label="풀마라톤 (42K)">
                <TimeInput value={pbFull} onChange={setPbFull} placeholder="예: 34530" />
              </FormInput>
              <FormInput label="하프마라톤 (21K)">
                <TimeInput value={pbHalf} onChange={setPbHalf} placeholder="예: 14215" />
              </FormInput>
              <FormInput label="10K">
                <TimeInput value={pb10k} onChange={setPb10k} placeholder="예: 4830" />
              </FormInput>
              <FormInput label="5K">
                <TimeInput value={pb5k} onChange={setPb5k} placeholder="예: 2200" />
              </FormInput>
            </div>
          </SectionCard>

          {/* coaching note */}
          <SectionCard>
            <SectionHeader icon="💬" title="강습 시 바라는 점" sub="코치에게 전달될 내용이에요" />
            <div className="p-5">
              <textarea
                value={coachingNote}
                onChange={(e) => setCoachingNote(e.target.value.slice(0, 500))}
                placeholder="예: 페이스 유지하는 법을 배우고 싶습니다..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-brand-primary-border text-sm outline-none focus:border-brand-primary-border-strong focus:ring-2 focus:ring-brand-ring transition-all resize-none text-brand-text-muted placeholder:text-brand-text-subtle"
              />
              <p className="mt-1 text-[10px] text-brand-text-subtle text-right font-medium">{coachingNote.length}/500</p>
            </div>
          </SectionCard>

          {/* save button */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full py-4 rounded-2xl font-black text-white text-sm transition-all active:scale-[0.98] ${
              saving
                ? "bg-brand-dimmed cursor-not-allowed text-brand-dimmed-text"
                : saved
                ? "bg-emerald-500"
                : "bg-brand-primary hover:bg-brand-primary-hover"
            }`}
          >
            {saving ? "저장 중..." : saved ? "✓ 저장 완료!" : "프로필 저장하기"}
          </button>
        </form>
      </main>
    </div>
  );
}
