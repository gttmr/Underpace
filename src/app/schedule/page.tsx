import Link from "next/link";
import { prisma } from "@/lib/db";
import ScheduleView from "@/components/schedule/ScheduleView";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const meetings = await prisma.meeting.findMany({
    orderBy: { date: "asc" },
    include: { participants: { select: { status: true } } },
  });

  const meetingsForClient = meetings.map((m) => ({
    id: m.id,
    date: m.date,
    startTime: m.startTime,
    endTime: m.endTime,
    location: m.location,
    maxCapacity: m.maxCapacity,
    isOpen: m.isOpen,
    approvedCount: m.participants.filter((p) => p.status === "APPROVED").length,
  }));

  return (
    <div className="min-h-screen">
      <header className="bg-hero-gradient text-white">
        <div className="max-w-xl mx-auto px-4 py-5 flex items-center gap-3">
          <Link href="/" className="text-blue-200 hover:text-white transition-colors text-xl leading-none">←</Link>
          <h1 className="font-bold text-lg">전체 일정</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <ScheduleView meetings={meetingsForClient} />
      </main>
    </div>
  );
}
