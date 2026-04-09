import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { CapacityBar } from "@/components/ui/CapacityBar";
import { SignupForm } from "@/components/meeting/SignupForm";
import type { MeetingWithCounts } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

type Participant = { id: number; name: string; note: string | null; status: string; waitlistPosition: number | null };

type DetailedMeeting = MeetingWithCounts & {
  approved: Participant[];
  waitlisted: Participant[];
  rejected: Participant[];
};

async function getMeeting(id: number): Promise<DetailedMeeting | null> {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: {
      participants: {
        select: { id: true, name: true, note: true, status: true, waitlistPosition: true },
        orderBy: { submittedAt: "asc" },
      },
    },
  });
  if (!meeting) return null;
  const approved   = meeting.participants.filter((p) => p.status === "APPROVED");
  const waitlisted = meeting.participants.filter((p) => p.status === "WAITLISTED").sort((a, b) => (a.waitlistPosition ?? 0) - (b.waitlistPosition ?? 0));
  const rejected   = meeting.participants.filter((p) => p.status === "REJECTED");
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
    approvedCount: approved.length,
    pendingCount: 0,
    waitlistedCount: waitlisted.length,
    approved,
    waitlisted,
    rejected,
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
      <header className="bg-white shadow-[0_1px_12px_rgba(0,0,0,0.07)] sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 h-14 grid grid-cols-[1fr_auto_1fr] items-center">
          <Link href="/" className="text-brand-text-muted hover:text-brand-text transition-colors font-black text-lg leading-none">←</Link>
          <Link href="/"><Image src="/logo.svg" alt="Underpace" width={120} height={36} className="object-contain" priority /></Link>
          <div />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {/* meeting info card */}
        <div className="bg-brand-surface-elevated rounded-2xl border border-brand-primary-border shadow-sm overflow-hidden animate-fade-up">
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
        <div className="bg-brand-surface-elevated rounded-2xl border border-brand-primary-border shadow-sm p-5 animate-fade-up" style={{ animationDelay: "60ms" }}>
          <p className="text-xs font-black text-brand-text-subtle uppercase tracking-widest mb-4">참가 신청</p>
          <SignupForm meeting={meeting} />
        </div>

        {/* 신청자 블록 */}
        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-4 bg-brand-primary rounded-full" />
              <h2 className="text-xs font-black text-brand-text-subtle uppercase tracking-widest">신청자</h2>
            </div>
            <span className="brand-chip-soft text-xs font-black px-2 py-0.5 rounded-full">
              {meeting.approved.length}/{meeting.maxCapacity}명
            </span>
          </div>
          {meeting.approved.length > 0 ? (
            <div className="bg-brand-surface-elevated rounded-2xl overflow-hidden border border-brand-primary-border divide-y divide-brand-divider">
              {meeting.approved.map((p, i) => (
                <div key={p.id} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 brand-chip-dark">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-brand-text text-sm">{p.name}</span>
                    {p.note && <p className="text-xs text-brand-text-subtle mt-0.5 line-clamp-1">{p.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-brand-surface-elevated rounded-2xl p-10 text-center border border-brand-primary-border">
              <p className="text-3xl mb-2">🏃</p>
              <p className="font-bold text-brand-text-muted text-sm">아직 참가 신청자가 없습니다</p>
              <p className="text-xs text-brand-text-subtle mt-1">가장 먼저 신청해 보세요!</p>
            </div>
          )}
        </div>

        {/* 대기자 블록 */}
        {meeting.waitlisted.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: "160ms" }}>
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div className="flex items-center gap-2">
                <div className="w-[3px] h-4 bg-brand-primary-soft-strong rounded-full" />
                <h2 className="text-xs font-black text-brand-text-subtle uppercase tracking-widest">대기자</h2>
              </div>
              <span className="brand-chip-soft text-xs font-black px-2 py-0.5 rounded-full">
                {meeting.waitlisted.length}명
              </span>
            </div>
            <div className="bg-brand-surface-elevated rounded-2xl overflow-hidden border border-brand-primary-border divide-y divide-brand-divider">
              {meeting.waitlisted.map((p, i) => (
                <div key={p.id} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 brand-chip-soft">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-brand-text text-sm">{p.name}</span>
                    {p.note && <p className="text-xs text-brand-text-subtle mt-0.5 line-clamp-1">{p.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 취소자 블록 */}
        {meeting.rejected.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div className="flex items-center gap-2">
                <div className="w-[3px] h-4 bg-brand-dimmed-border rounded-full" />
                <h2 className="text-xs font-black text-brand-text-subtle uppercase tracking-widest">취소</h2>
              </div>
              <span className="bg-brand-dimmed text-brand-dimmed-text text-xs font-black px-2 py-0.5 rounded-full">
                {meeting.rejected.length}명
              </span>
            </div>
            <div className="rounded-2xl overflow-hidden border border-brand-dimmed-border divide-y divide-brand-divider bg-brand-surface-elevated">
              {meeting.rejected.map((p, i) => (
                <div key={p.id} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 bg-brand-dimmed text-brand-dimmed-text">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-brand-dimmed-text text-sm line-through">{p.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
