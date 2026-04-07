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
      <header className="bg-[#001d6e] text-white overflow-hidden">
        <div className="max-w-xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <Image
            src="/logo.png"
            alt="Underpace"
            width={110}
            height={46}
            className="object-contain"
            style={{ filter: "invert(1)", mixBlendMode: "screen" }}
          />

          {user ? (
            <div className="flex items-center gap-2">
              {isCoachOrAdmin && (
                <Link
                  href="/coach"
                  className="px-3 py-2 rounded-xl bg-[rgba(196,221,255,0.18)] hover:bg-[rgba(196,221,255,0.28)] text-white text-sm font-bold transition-colors border border-[rgba(196,221,255,0.25)] whitespace-nowrap"
                >
                  코치
                </Link>
              )}
              <NotificationBell />
              <Link
                href="/profile"
                className="px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.2)] text-white text-sm font-bold transition-colors border border-[rgba(255,255,255,0.15)] whitespace-nowrap"
              >
                내 프로필
              </Link>
            </div>
          ) : (
            <Link
              href={`/api/auth/kakao?returnTo=${encodeURIComponent(returnTo)}`}
              className="px-3 py-2 rounded-xl bg-[#FEE500] hover:bg-[#f0d800] text-[#3C1E1E] text-sm font-black transition-colors whitespace-nowrap active:scale-[0.97]"
            >
              로그인
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
        <ScheduleView meetings={meetingsForClient} marathons={marathonsForClient} user={user} />
      </main>

      <footer className="max-w-xl mx-auto px-4 py-8 text-center border-t border-[rgba(0,29,110,0.1)] mt-8">
        <p className="text-xs text-[rgba(0,29,110,0.4)]">문의: 동호회 단톡방</p>
        <Link href="/admin" className="text-[rgba(0,29,110,0.25)] hover:text-[rgba(0,29,110,0.5)] text-xs mt-2 inline-block transition-colors">
          관리자
        </Link>
      </footer>
    </div>
  );
}
