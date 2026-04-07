import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import ScheduleView from "./ScheduleView";
import NotificationBell from "@/components/notifications/NotificationBell";

export default async function SchedulePageContent({ returnTo }: { returnTo: string }) {
  const user = await getSession();

  const userRole = user
    ? (await prisma.user.findUnique({ where: { kakaoId: user.kakaoId }, select: { role: true } }))?.role ?? null
    : null;
  const isCoachOrAdmin = userRole === "COACH" || userRole === "ADMIN";

  const [meetings, marathons] = await Promise.all([
    prisma.meeting.findMany({
      orderBy: { date: "asc" },
      include: { participants: { select: { status: true } } },
    }),
    prisma.marathon.findMany({ orderBy: { date: "asc" } }),
  ]);

  const meetingsForClient = meetings.map((meeting) => ({
    id: meeting.id,
    date: meeting.date,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    location: meeting.location,
    maxCapacity: meeting.maxCapacity,
    isOpen: meeting.isOpen,
    signupOpensAt: meeting.signupOpensAt?.toISOString() ?? null,
    approvedCount: meeting.participants.filter((p) => p.status === "APPROVED").length,
    waitlistedCount: meeting.participants.filter((p) => p.status === "WAITLISTED").length,
  }));

  const marathonsForClient = marathons.map((m) => ({
    id: m.id,
    title: m.title,
    date: m.date,
    startTime: m.startTime,
    location: m.location,
    link: m.link,
  }));

  return (
    <div className="min-h-screen bg-white">
      {/* ── header ── */}
      <header className="bg-white shadow-[0_1px_12px_rgba(0,0,0,0.07)] sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 h-14 grid grid-cols-[1fr_auto_1fr] items-center">
          <div />

          {/* center — 로고 */}
          <Image
            src="/logo.svg"
            alt="Underpace"
            width={140}
            height={40}
            className="object-contain"
            priority
          />

          {/* right — 로그인 시 액션 버튼 */}
          <div className="flex items-center gap-1.5 justify-end">
            {user && (
              <>
                {isCoachOrAdmin && (
                  <Link
                    href="/coach"
                    className="px-2.5 py-1.5 rounded-lg bg-brand-surface hover:bg-brand-surface-strong text-brand-text text-xs font-bold transition-colors border border-brand-primary-border whitespace-nowrap"
                  >
                    코치
                  </Link>
                )}
                <NotificationBell light />
                <Link
                  href="/profile"
                  className="px-2.5 py-1.5 rounded-lg bg-brand-surface hover:bg-brand-surface-strong text-brand-text text-xs font-bold transition-colors border border-brand-primary-border whitespace-nowrap"
                >
                  프로필
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4 pb-28">
        <ScheduleView meetings={meetingsForClient} marathons={marathonsForClient} user={user} />
      </main>

      <footer className="max-w-xl mx-auto px-4 py-8 text-center border-t border-[rgba(0,29,110,0.1)]">
        <p className="text-xs text-[rgba(0,29,110,0.4)]">문의: 동호회 단톡방</p>
        <Link href="/admin" className="text-[rgba(0,29,110,0.25)] hover:text-[rgba(0,29,110,0.5)] text-xs mt-2 inline-block transition-colors">
          관리자
        </Link>
      </footer>

      {/* ── 비로그인 하단 CTA ── */}
      {!user && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/80 backdrop-blur-sm border-t border-gray-100">
          <div className="max-w-xl mx-auto px-4 py-3">
            <Link
              href={`/api/auth/kakao?returnTo=${encodeURIComponent(returnTo)}`}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-brand-primary hover:bg-brand-primary-hover text-white font-black text-base tracking-tight transition-all active:scale-[0.98]"
            >
              카카오로 로그인
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
