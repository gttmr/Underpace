import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ParticipantStatus } from "@/lib/types";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; waitlist?: string; meetingId?: string; name?: string }>;
}) {
  const { status, waitlist, meetingId, name } = await searchParams;

  let meetingDisplay = "";
  if (meetingId) {
    const meeting = await prisma.meeting.findUnique({ where: { id: parseInt(meetingId) } });
    if (meeting) {
      const date = new Date(meeting.date + "T00:00:00");
      const dayName = DAY_KO[date.getDay()];
      const [, month, day] = meeting.date.split("-");
      meetingDisplay = `${parseInt(month)}월 ${parseInt(day)}일 (${dayName}) ${meeting.startTime}`;
    }
  }

  const participantStatus = (status as ParticipantStatus) || "PENDING";
  const waitlistPos = waitlist ? parseInt(waitlist) : null;

  const statusMessages: Record<ParticipantStatus, string> = {
    PENDING:    "관리자 검토 후 연락드립니다.",
    APPROVED:   "모임 참가가 확정되었습니다.",
    WAITLISTED: `정원 초과로 대기자 ${waitlistPos}번째로 등록되었습니다.`,
    REJECTED:   "이번 모임 참가가 어렵습니다.",
  };

  return (
    <div className="min-h-screen bg-brand-page flex flex-col">
      <header className="bg-white shadow-[0_1px_12px_rgba(0,0,0,0.07)] sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 h-14 grid grid-cols-[1fr_auto_1fr] items-center">
          <Link href="/" className="text-brand-text-muted hover:text-brand-text transition-colors font-black text-lg leading-none">←</Link>
          <Link href="/"><Image src="/logo.svg" alt="Underpace" width={120} height={36} className="object-contain" priority /></Link>
          <div />
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto px-4 py-8 w-full">
        <div className="bg-brand-surface-elevated rounded-2xl border border-brand-primary-border shadow-sm overflow-hidden animate-scale-in">
          {/* success indicator */}
          <div className="bg-brand-surface p-6 flex flex-col items-center">
            <div className="w-14 h-14 bg-brand-primary rounded-full flex items-center justify-center mb-3 shadow-lg shadow-[rgba(0,29,110,0.3)]">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-black text-brand-text">신청 완료!</h2>
            <p className="text-xs text-brand-text-muted mt-1 font-medium">{statusMessages[participantStatus]}</p>
          </div>

          {/* details */}
          <div className="p-5 space-y-0">
            {name && (
              <div className="flex justify-between items-center py-3 border-b border-brand-divider">
                <span className="text-xs font-black text-brand-text-subtle uppercase tracking-wider">이름</span>
                <span className="font-black text-brand-text text-sm">{decodeURIComponent(name)}</span>
              </div>
            )}
            {meetingDisplay && (
              <div className="flex justify-between items-center py-3 border-b border-brand-divider">
                <span className="text-xs font-black text-brand-text-subtle uppercase tracking-wider">모임</span>
                <span className="font-bold text-brand-text text-sm">{meetingDisplay}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3">
              <span className="text-xs font-black text-brand-text-subtle uppercase tracking-wider">상태</span>
              <StatusBadge status={participantStatus} waitlistPosition={waitlistPos} size="sm" />
            </div>
          </div>

          <div className="px-5 pb-5">
            <Link
              href="/"
              className="brand-button-primary block w-full py-3.5 rounded-xl font-black text-sm text-center transition-all active:scale-[0.98]"
            >
              ← 홈으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
