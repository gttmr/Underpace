import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { CapacityBar } from "@/components/ui/CapacityBar";
import { SignupForm } from "@/components/meeting/SignupForm";
import type { MeetingWithCounts } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

async function getMeeting(id: number): Promise<MeetingWithCounts | null> {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: { participants: { select: { status: true } } },
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
    isOpen: meeting.isOpen,
    scheduleId: meeting.scheduleId,
    approvedCount: meeting.participants.filter((p) => p.status === "APPROVED").length,
    pendingCount: meeting.participants.filter((p) => p.status === "PENDING").length,
    waitlistedCount: meeting.participants.filter((p) => p.status === "WAITLISTED").length,
  };
}

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = await getMeeting(parseInt(id));
  if (!meeting) notFound();

  const date = new Date(meeting.date + "T00:00:00");
  const dayName = DAY_KO[date.getDay()];
  const [, month, day] = meeting.date.split("-");
  const displayDate = `${parseInt(month)}월 ${parseInt(day)}일 (${dayName})`;

  return (
    <div className="min-h-screen">
      <header className="bg-hero-gradient text-white">
        <div className="max-w-xl mx-auto px-4 py-5 flex items-center gap-3">
          <Link href="/" className="text-blue-200 hover:text-white transition-colors text-xl leading-none">←</Link>
          <h1 className="font-bold text-lg">모임 신청</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* 모임 정보 카드 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-xl font-extrabold text-slate-900 mb-4">
            주간 {dayName}요일 모임
          </h2>
          <div className="space-y-2 text-sm text-slate-600 mb-5">
            <div className="flex items-center gap-2.5">
              <span className="text-base">📅</span>
              <span className="font-medium text-slate-800">{displayDate}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-base">📍</span>
              <span>{meeting.location}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-base">🕐</span>
              <span>{meeting.startTime} – {meeting.endTime}</span>
            </div>
          </div>

          {meeting.description && (
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 mb-5">{meeting.description}</p>
          )}

          <CapacityBar current={meeting.approvedCount} max={meeting.maxCapacity} />
        </div>

        {/* 신청 폼 카드 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="text-base font-bold text-slate-800 mb-4">참가 신청</h3>
          <SignupForm meeting={meeting} />
        </div>
      </main>
    </div>
  );
}
