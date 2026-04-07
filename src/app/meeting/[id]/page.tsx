import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { CapacityBar } from "@/components/ui/CapacityBar";
import { SignupForm } from "@/components/meeting/SignupForm";
import type { MeetingWithCounts } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

type DetailedMeeting = MeetingWithCounts & {
  participantsList: {
    id: number;
    name: string;
    note: string | null;
    status: string;
  }[];
};

async function getMeeting(id: number): Promise<DetailedMeeting | null> {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      participants: {
        select: { id: true, name: true, note: true, status: true },
        orderBy: { submittedAt: "asc" },
      },
    },
  });
  if (!meeting) return null;
  return {
    id: meeting.id,
    date: meeting.date,
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    location: meeting.location,
    maxCapacity: meeting.maxCapacity,
    description: meeting.description,
    signupOpensAt: meeting.signupOpensAt?.toISOString() ?? null,
    isOpen: meeting.isOpen,
    scheduleId: meeting.scheduleId,
    approvedCount: meeting.participants.filter((p) => p.status === "APPROVED").length,
    pendingCount: meeting.participants.filter((p) => p.status === "PENDING").length,
    waitlistedCount: meeting.participants.filter((p) => p.status === "WAITLISTED").length,
    participantsList: meeting.participants,
  };
}

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = await getMeeting(parseInt(id));
  if (!meeting) notFound();

  const date = new Date(meeting.date + "T00:00:00");
  const dayName = DAY_KO[date.getDay()];
  const [, month, day] = meeting.date.split("-");

  return (
    <div className="min-h-screen bg-brand-page pb-24">
      {/* header */}
      <header className="bg-brand-primary text-white relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(196,221,255,0.4) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative max-w-xl mx-auto px-4 py-5 flex items-center gap-3">
          <Link href="/" className="text-brand-surface hover:text-white transition-colors font-black text-xl leading-none">←</Link>
          <div>
            <p className="text-[10px] font-black tracking-[0.18em] text-[rgba(196,221,255,0.65)] uppercase">모임 신청</p>
            <h1 className="font-black text-base leading-tight">
              {parseInt(month, 10)}월 {parseInt(day, 10)}일 ({dayName}) 모임
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {/* meeting info card */}
        <div className="bg-white rounded-2xl border border-brand-primary-border shadow-sm overflow-hidden animate-fade-up">
          <div className="bg-brand-surface px-5 py-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-black text-brand-text-subtle tracking-widest uppercase mb-0.5">정기 모임</p>
              <h2 className="text-2xl font-black text-brand-text leading-tight">
                {parseInt(month, 10)}월 {parseInt(day, 10)}일
              </h2>
              <p className="text-sm font-semibold text-brand-text-muted mt-0.5">{dayName}요일</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-2 text-sm text-brand-text-muted">
            <div className="flex items-center gap-2.5">
              <svg className="w-3.5 h-3.5 shrink-0 text-brand-primary-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{meeting.location}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <svg className="w-3.5 h-3.5 shrink-0 text-brand-primary-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{meeting.startTime} – {meeting.endTime}</span>
            </div>
          </div>
          {meeting.description && (
            <p className="mx-5 mb-4 text-sm text-brand-text-subtle bg-brand-surface rounded-xl px-3 py-2.5">
              {meeting.description}
            </p>
          )}
          <div className="px-5 pb-5">
            <CapacityBar current={meeting.approvedCount} max={meeting.maxCapacity} waitlisted={meeting.waitlistedCount} />
          </div>
        </div>

        {/* signup form card */}
        <div className="bg-white rounded-2xl border border-brand-primary-border shadow-sm p-5 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <p className="text-xs font-black text-brand-text-subtle uppercase tracking-widest mb-4">참가 신청</p>
          <SignupForm meeting={meeting} />
        </div>

        {/* participants */}
        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-4 bg-brand-primary rounded-full" />
              <h2 className="text-xs font-black text-brand-text-subtle uppercase tracking-widest">참석 및 대기 현황</h2>
            </div>
            <span className="brand-chip-soft text-xs font-black px-2 py-0.5 rounded-full">
              {meeting.participantsList.length}명
            </span>
          </div>

          {meeting.participantsList.length > 0 ? (
            <div className="bg-white rounded-2xl overflow-hidden border border-brand-primary-border divide-y divide-brand-divider">
              {meeting.participantsList.map((p, i) => (
                <div key={p.id} className="px-4 py-3.5 flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0
                    ${p.status === "APPROVED" ? "brand-chip-dark" :
                      p.status === "WAITLISTED" ? "brand-chip-soft" :
                      "bg-brand-dimmed text-brand-dimmed-text"}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-brand-text text-sm">{p.name}</span>
                      {p.status === "WAITLISTED" && (
                        <span className="text-[10px] brand-chip-soft px-1.5 py-0.5 rounded-full font-black">대기</span>
                      )}
                      {p.status === "APPROVED" && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-black">확정</span>
                      )}
                      {p.status === "PENDING" && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black">검토 중</span>
                      )}
                    </div>
                    {p.note && <p className="text-xs text-brand-text-subtle mt-0.5 line-clamp-1">{p.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center border border-brand-primary-border">
              <p className="text-3xl mb-2">🏃</p>
              <p className="font-bold text-brand-text-muted text-sm">아직 참가 신청자가 없습니다</p>
              <p className="text-xs text-brand-text-subtle mt-1">가장 먼저 신청해 보세요!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
