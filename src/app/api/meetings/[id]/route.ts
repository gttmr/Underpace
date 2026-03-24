import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({
    where: { id: parseInt(id) },
    include: {
      participants: {
        orderBy: [{ status: "asc" }, { submittedAt: "asc" }],
      },
    },
  });

  if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const approvedCount = meeting.participants.filter((p) => p.status === "APPROVED").length;
  const pendingCount = meeting.participants.filter((p) => p.status === "PENDING").length;
  const waitlistedCount = meeting.participants.filter((p) => p.status === "WAITLISTED").length;

  return NextResponse.json({ ...meeting, approvedCount, pendingCount, waitlistedCount });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { date, startTime, endTime, location, maxCapacity, description, isOpen } = body;

  const meeting = await prisma.meeting.update({
    where: { id: parseInt(id) },
    data: {
      ...(date && { date }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(location && { location }),
      ...(maxCapacity !== undefined && { maxCapacity: parseInt(maxCapacity) }),
      ...(description !== undefined && { description: description || null }),
      ...(isOpen !== undefined && { isOpen }),
      isOverridden: true,
    },
  });

  return NextResponse.json(meeting);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const meetingId = parseInt(id);
  const searchParams = req.nextUrl.searchParams;
  const allFuture = searchParams.get("allFuture") === "true";

  const targetMeeting = await prisma.meeting.findUnique({
    where: { id: meetingId }
  });

  if (!targetMeeting) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (allFuture && targetMeeting.scheduleId) {
    await prisma.$transaction([
      prisma.meeting.deleteMany({
        where: {
          scheduleId: targetMeeting.scheduleId,
          date: { gte: targetMeeting.date }
        }
      }),
      prisma.recurringSchedule.update({
        where: { id: targetMeeting.scheduleId },
        data: { isActive: false }
      })
    ]);
  } else {
    await prisma.meeting.delete({ where: { id: meetingId } });
  }

  return NextResponse.json({ ok: true });
}
