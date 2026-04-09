import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { countParticipantsByStatus } from "@/lib/participant-utils";
import { apiError, apiOk } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meeting = await prisma.meeting.findUnique({
    where: { id: parseInt(id) },
    include: { participants: { orderBy: [{ status: "asc" }, { submittedAt: "asc" }] } },
  });

  if (!meeting) return apiError(404, "Not found");

  return apiOk({ ...meeting, ...countParticipantsByStatus(meeting.participants) });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const { date, startTime, endTime, location, maxCapacity, description, isOpen, signupOpensAt, classType } = await req.json();

  const meeting = await prisma.meeting.update({
    where: { id: parseInt(id) },
    data: {
      ...(date && { date }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(location && { location }),
      ...(maxCapacity !== undefined && { maxCapacity: parseInt(maxCapacity) }),
      ...(description !== undefined && { description: description || null }),
      ...(signupOpensAt !== undefined && { signupOpensAt: signupOpensAt ? new Date(signupOpensAt) : null }),
      ...(isOpen !== undefined && { isOpen }),
      ...(classType !== undefined && { classType: classType || null }),
      isOverridden: true,
    },
  });

  return apiOk(meeting);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { id } = await params;
  const meetingId = parseInt(id);
  const allFuture = req.nextUrl.searchParams.get("allFuture") === "true";

  const targetMeeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!targetMeeting) return apiError(404, "Not found");

  if (allFuture && targetMeeting.scheduleId) {
    await prisma.$transaction([
      prisma.meeting.deleteMany({
        where: { scheduleId: targetMeeting.scheduleId, date: { gte: targetMeeting.date } },
      }),
      prisma.recurringSchedule.update({
        where: { id: targetMeeting.scheduleId },
        data: { isActive: false },
      }),
    ]);
  } else {
    await prisma.meeting.delete({ where: { id: meetingId } });
  }

  return apiOk({ ok: true });
}
