import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { meetingId, name, contact, note } = body;

  if (!meetingId || !name?.trim() || !contact?.trim()) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요" }, { status: 400 });
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id: parseInt(meetingId) },
    include: {
      participants: { select: { status: true, contact: true } },
    },
  });

  if (!meeting) return NextResponse.json({ error: "모임을 찾을 수 없습니다" }, { status: 404 });
  if (!meeting.isOpen) return NextResponse.json({ error: "신청이 마감된 모임입니다" }, { status: 400 });

  // 중복 신청 확인 (같은 연락처)
  const duplicate = meeting.participants.find((p) => p.contact === contact);
  if (duplicate) {
    return NextResponse.json({ error: "이미 신청하셨습니다" }, { status: 409 });
  }

  const approvedCount = meeting.participants.filter((p) => p.status === "APPROVED").length;
  const waitlistedCount = meeting.participants.filter((p) => p.status === "WAITLISTED").length;
  const isFull = approvedCount >= meeting.maxCapacity;

  let status = "PENDING";
  let waitlistPosition: number | null = null;

  if (isFull) {
    status = "WAITLISTED";
    waitlistPosition = waitlistedCount + 1;
  }

  const participant = await prisma.participant.create({
    data: {
      meetingId: parseInt(meetingId),
      name: name.trim(),
      contact: contact.trim(),
      note: note?.trim() || null,
      status,
      waitlistPosition,
    },
  });

  return NextResponse.json(participant, { status: 201 });
}
