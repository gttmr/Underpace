import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/session";

// GET: 현재 유저의 신청 정보 조회
export async function GET(req: NextRequest) {
  const user = getSessionFromRequest(req);
  if (!user) return NextResponse.json(null);

  const meetingId = req.nextUrl.searchParams.get("meetingId");
  if (!meetingId) return NextResponse.json(null);

  const participant = await prisma.participant.findFirst({
    where: { meetingId: parseInt(meetingId), kakaoId: user.kakaoId },
    select: { id: true, status: true, waitlistPosition: true },
  });

  // REJECTED는 재신청 가능 — 없는 것으로 처리
  if (!participant || participant.status === "REJECTED") {
    return NextResponse.json(null);
  }

  return NextResponse.json(participant);
}

// DELETE: 신청 취소 + APPROVED였으면 대기자 자동 승격
export async function DELETE(req: NextRequest) {
  const user = getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const meetingId = req.nextUrl.searchParams.get("meetingId");
  if (!meetingId) return NextResponse.json({ error: "meetingId가 필요합니다" }, { status: 400 });

  const participant = await prisma.participant.findFirst({
    where: { meetingId: parseInt(meetingId), kakaoId: user.kakaoId },
  });

  if (!participant) return NextResponse.json({ error: "신청 내역이 없습니다" }, { status: 404 });

  const wasApproved = participant.status === "APPROVED";
  const mid = parseInt(meetingId);

  await prisma.$transaction(async (tx) => {
    await tx.participant.delete({ where: { id: participant.id } });

    if (wasApproved) {
      const firstWaitlisted = await tx.participant.findFirst({
        where: { meetingId: mid, status: "WAITLISTED" },
        orderBy: { waitlistPosition: "asc" },
      });

      if (firstWaitlisted) {
        await tx.participant.update({
          where: { id: firstWaitlisted.id },
          data: { status: "APPROVED", waitlistPosition: null, reviewedAt: new Date() },
        });

        await tx.participant.updateMany({
          where: { meetingId: mid, status: "WAITLISTED", waitlistPosition: { gt: 1 } },
          data: { waitlistPosition: { decrement: 1 } },
        });
      }
    }
  });

  return NextResponse.json({ ok: true, promoted: wasApproved });
}
