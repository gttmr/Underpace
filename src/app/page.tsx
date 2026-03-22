import Link from "next/link";
import { prisma } from "@/lib/db";
import { MeetingCard } from "@/components/meeting/MeetingCard";
import type { MeetingWithCounts } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getUpcomingMeetings(): Promise<MeetingWithCounts[]> {
  const today = new Date().toISOString().split("T")[0];
  const meetings = await prisma.meeting.findMany({
    where: { date: { gte: today } },
    orderBy: { date: "asc" },
    take: 10,
    include: { participants: { select: { status: true } } },
  });

  return meetings.map((m) => ({
    id: m.id,
    date: m.date,
    startTime: m.startTime,
    endTime: m.endTime,
    location: m.location,
    maxCapacity: m.maxCapacity,
    description: m.description,
    isOpen: m.isOpen,
    scheduleId: m.scheduleId,
    approvedCount: m.participants.filter((p) => p.status === "APPROVED").length,
    pendingCount: m.participants.filter((p) => p.status === "PENDING").length,
    waitlistedCount: m.participants.filter((p) => p.status === "WAITLISTED").length,
  }));
}

async function getPinnedNotice() {
  return prisma.notice.findFirst({ where: { isPinned: true }, orderBy: { createdAt: "desc" } });
}

export default async function HomePage() {
  const [meetings, pinnedNotice] = await Promise.all([getUpcomingMeetings(), getPinnedNotice()]);

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="bg-hero-gradient text-white">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight">⚡ 동호회</h1>
              <p className="text-blue-200 text-sm mt-0.5">주간 모임 참가신청</p>
            </div>
          </div>
        </div>
      </header>

      {/* 공지 배너 */}
      {pinnedNotice && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-start gap-2">
            <span className="text-amber-500 text-sm font-bold shrink-0">📢</span>
            <div>
              <span className="text-sm font-semibold text-amber-800">{pinnedNotice.title}</span>
              <p className="text-xs text-amber-700 mt-0.5 line-clamp-2">{pinnedNotice.body}</p>
            </div>
          </div>
        </div>
      )}

      {/* 모임 목록 */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">예정된 모임</h2>
          <Link href="/schedule" className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
            전체 일정
          </Link>
        </div>

        {meetings.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">📅</p>
            <p className="font-medium">예정된 모임이 없습니다</p>
            <p className="text-sm mt-1">곧 새로운 모임이 등록될 예정입니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-sm text-slate-400 border-t border-slate-200 mt-8">
        <p>문의: 동호회 단톡방</p>
        <Link href="/admin" className="text-slate-300 hover:text-slate-500 text-xs mt-2 inline-block transition-colors">
          관리자
        </Link>
      </footer>
    </div>
  );
}
