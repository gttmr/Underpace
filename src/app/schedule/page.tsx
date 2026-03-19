import Link from "next/link";
import { prisma } from "@/lib/db";
import { CapacityBar } from "@/components/ui/CapacityBar";

export const dynamic = "force-dynamic";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

export default async function SchedulePage() {
  const today = new Date().toISOString().split("T")[0];

  const meetings = await prisma.meeting.findMany({
    orderBy: { date: "asc" },
    include: { participants: { select: { status: true } } },
  });

  const upcoming = meetings.filter((m) => m.date >= today);
  const past = meetings.filter((m) => m.date < today).reverse();

  function MeetingRow({ m }: { m: (typeof meetings)[0] }) {
    const approved = m.participants.filter((p) => p.status === "APPROVED").length;
    const date = new Date(m.date + "T00:00:00");
    const dayName = DAY_KO[date.getDay()];
    const [, month, day] = m.date.split("-");
    const isClosed = !m.isOpen;
    const isFull = approved >= m.maxCapacity;

    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 ${isClosed || m.date < today ? "opacity-60" : ""}`}>
        <div className="text-center min-w-[52px]">
          <p className="text-xs text-slate-500">{parseInt(month)}월</p>
          <p className="text-2xl font-extrabold text-slate-900 leading-none">{parseInt(day)}</p>
          <p className="text-xs text-slate-500">{dayName}요일</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-slate-800">
              {m.startTime} – {m.endTime}
            </span>
            {isClosed && (
              <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">마감</span>
            )}
            {!isClosed && isFull && (
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">정원마감</span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">📍 {m.location}</p>
          <div className="mt-2">
            <CapacityBar current={approved} max={m.maxCapacity} showLabel={false} />
            <p className="text-xs text-slate-400 mt-0.5">{approved}/{m.maxCapacity}명</p>
          </div>
        </div>
        {m.date >= today && !isClosed && (
          <Link
            href={`/meeting/${m.id}`}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors
              ${isFull ? "bg-blue-400 hover:bg-blue-500" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {isFull ? "대기 신청" : "신청"}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-hero-gradient text-white">
        <div className="max-w-xl mx-auto px-4 py-5 flex items-center gap-3">
          <Link href="/" className="text-blue-200 hover:text-white transition-colors text-xl leading-none">←</Link>
          <h1 className="font-bold text-lg">전체 일정</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-8">
        {upcoming.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">예정된 모임</h2>
            <div className="space-y-3">
              {upcoming.map((m) => <MeetingRow key={m.id} m={m} />)}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">지난 모임</h2>
            <div className="space-y-3">
              {past.map((m) => <MeetingRow key={m.id} m={m} />)}
            </div>
          </section>
        )}

        {meetings.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">📅</p>
            <p className="font-medium">등록된 일정이 없습니다</p>
          </div>
        )}
      </main>
    </div>
  );
}
