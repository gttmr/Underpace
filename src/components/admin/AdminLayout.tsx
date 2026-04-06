"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/admin",          label: "대시보드", icon: "📊", exact: true },
  { href: "/admin/schedule", label: "일정관리", icon: "📅", exact: false },
  { href: "/admin/meetings", label: "모임관리", icon: "👥", exact: false },
  { href: "/admin/members",  label: "회원관리", icon: "🧑‍💼", exact: false },
  { href: "/coach",          label: "코치뷰",   icon: "🏃", exact: false },
  { href: "/admin/notices",  label: "공지관리", icon: "📢", exact: false },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  function isActive(item: (typeof NAV_ITEMS)[0]) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f8ff]">
      {/* top header */}
      <header className="bg-[#001d6e] text-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#c4ddff] hover:text-white text-sm font-semibold transition-colors">
              ← 사이트
            </Link>
            <span className="text-[#7fb5ff] font-light">|</span>
            <span className="font-black text-sm tracking-tight">관리자</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-[#c4ddff] hover:text-white text-sm font-semibold transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-6xl mx-auto w-full">
        {/* desktop sidebar */}
        <aside className="hidden md:block w-52 shrink-0 p-4">
          <nav className="space-y-0.5 sticky top-16">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all
                  ${isActive(item)
                    ? "bg-[#001d6e] text-white shadow-md shadow-[rgba(0,29,110,0.2)]"
                    : "text-[rgba(0,29,110,0.6)] hover:bg-white hover:text-[#001d6e]"
                  }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* main content */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 min-w-0">
          {children}
        </main>
      </div>

      {/* mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[rgba(0,29,110,0.1)] z-10">
        <div className="flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2.5 text-[10px] font-black transition-colors gap-0.5
                ${isActive(item) ? "text-[#001d6e]" : "text-[rgba(0,29,110,0.35)]"}`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
