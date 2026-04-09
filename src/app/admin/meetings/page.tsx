import Link from "next/link";
import { prisma } from "@/lib/db";
import { AdminLayout } from "@/components/admin/AdminLayout";

export const dynamic = "force-dynamic";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

export default async function AdminMeetingsPage() {
  const today = new Date().toISOString().split("T")[0];

  const meetings = await prisma.meeting.findMany({
    orderBy: { date: "desc" },
    include: { participants: { select: { status: true } } },
  });

  const upcoming = meetings.filter((m) => m.date >= today);
  const past = meetings.filter((m) => m.date < today);

  function MeetingRow({ m }: { m: (typeof meetings)[0] }) {
    const approved = m.participants.filter((p) => p.status === "APPROVED").length;
    const pending = m.participants.filter((p) => p.status === "PENDING").length;
    const waitlisted = m.participants.filter((p) => p.status === "WAITLISTED").length;
    const d = new Date(m.date + "T00:00:00");
    const [, month, day] = m.date.split("-");
    const pct = Math.min((approved / m.maxCapacity) * 100, 100);

    return (
      <Link
        href={`/admin/meetings/${m.id}`}
        className="block bg-brand-surface-elevated rounded-xl border border-brand-primary-border p-4 hover:border-brand-primary-border-strong transition-colors"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="font-semibold text-brand-text text-sm">
              {parseInt(month)}월 {parseInt(day)}일 ({DAY_KO[d.getDay()]})
            </p>
            <p className="text-xs text-brand-text-subtle mt-0.5">
              {m.startTime}–{m.endTime} · {m.location}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!m.isOpen && <span className="text-xs bg-brand-dimmed text-brand-dimmed-text px-1.5 py-0.5 rounded-full">마감</span>}
            {pending > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">대기 {pending}</span>}
            {waitlisted > 0 && <span className="text-xs brand-chip-soft px-1.5 py-0.5 rounded-full">대기자 {waitlisted}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-brand-surface rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : pct >= 85 ? "bg-amber-400" : "bg-green-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-brand-text-subtle shrink-0">{approved}/{m.maxCapacity}명</span>
        </div>
      </Link>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-xl font-extrabold text-brand-text mb-6">모임 관리</h1>

      <section className="mb-8">
        <h2 className="text-sm font-bold text-brand-text-muted mb-3">예정된 모임 ({upcoming.length})</h2>
        <div className="space-y-3">
          {upcoming.map((m) => <MeetingRow key={m.id} m={m} />)}
          {upcoming.length === 0 && <p className="text-sm text-brand-text-subtle text-center py-6">예정된 모임이 없습니다</p>}
        </div>
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-brand-text-muted mb-3">지난 모임 ({past.length})</h2>
          <div className="space-y-3 opacity-70">
            {past.map((m) => <MeetingRow key={m.id} m={m} />)}
          </div>
        </section>
      )}
    </AdminLayout>
  );
}
