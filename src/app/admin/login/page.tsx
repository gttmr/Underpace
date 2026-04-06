"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoLogging, setAutoLogging] = useState(true);

  // ADMIN 역할 사용자는 자동 로그인
  useEffect(() => {
    fetch("/api/admin/auto-login", { method: "POST" })
      .then((res) => {
        if (res.ok) {
          router.push("/admin");
          router.refresh();
        } else {
          setAutoLogging(false);
        }
      })
      .catch(() => setAutoLogging(false));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "오류가 발생했습니다");
      setLoading(false);
    }
  }

  if (autoLogging) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[rgba(0,29,110,0.35)] text-sm font-medium">확인 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f8ff] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-[#7fb5ff] shadow-sm overflow-hidden animate-scale-in">
          <div className="bg-[#001d6e] px-6 py-5 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(rgba(196,221,255,0.4) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <p className="relative text-[10px] font-black tracking-[0.2em] text-[rgba(196,221,255,0.65)] uppercase mb-1">UNDERPACE</p>
            <h1 className="relative text-lg font-black text-white">관리자 로그인</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-black text-[rgba(0,29,110,0.5)] mb-1.5 uppercase tracking-widest">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="관리자 비밀번호"
                className="w-full px-4 py-2.5 rounded-xl border border-[#7fb5ff] text-sm outline-none focus:border-[#001d6e] focus:ring-2 focus:ring-[rgba(127,181,255,0.25)] transition-all text-[#001d6e] font-semibold"
                autoFocus
              />
              {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3.5 rounded-xl bg-[#001d6e] hover:bg-[#00277a] disabled:bg-[#e5e7eb] disabled:text-[#9ca3af] text-white font-black text-sm transition-all active:scale-[0.98]"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
