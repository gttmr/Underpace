import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/auth";
import { generateMeetingsFromSchedule, syncUpcomingMeetingSignupWindows } from "@/lib/schedule";
import { validateSignupWindowRule } from "@/lib/meetingSignup";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { dayOfWeek, startTime, endTime, location, maxCapacity, description, isActive, signupOpenDayOfWeek, signupOpenTime } = body;
  const scheduleId = parseInt(id);

  const existing = await prisma.recurringSchedule.findUnique({
    where: { id: scheduleId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextDayOfWeek = dayOfWeek !== undefined ? parseInt(dayOfWeek) : existing.dayOfWeek;
  const nextSignupOpenDayOfWeek =
    signupOpenDayOfWeek !== undefined
      ? (signupOpenDayOfWeek === null || signupOpenDayOfWeek === "" ? null : parseInt(signupOpenDayOfWeek))
      : existing.signupOpenDayOfWeek;
  const nextSignupOpenTime =
    signupOpenTime !== undefined
      ? (signupOpenTime ? String(signupOpenTime) : null)
      : existing.signupOpenTime;
  const validationError = validateSignupWindowRule(
    nextDayOfWeek,
    nextSignupOpenDayOfWeek,
    nextSignupOpenTime,
  );

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const schedule = await prisma.recurringSchedule.update({
    where: { id: scheduleId },
    data: {
      ...(dayOfWeek !== undefined && { dayOfWeek: nextDayOfWeek }),
      ...(startTime && { startTime }),
      ...(endTime && { endTime }),
      ...(location && { location }),
      ...(maxCapacity !== undefined && { maxCapacity: parseInt(maxCapacity) }),
      ...(description !== undefined && { description: description || null }),
      ...(signupOpenDayOfWeek !== undefined && { signupOpenDayOfWeek: nextSignupOpenDayOfWeek }),
      ...(signupOpenTime !== undefined && { signupOpenTime: nextSignupOpenTime }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  if (schedule.isActive) {
    await generateMeetingsFromSchedule(schedule.id, 8);
    await syncUpcomingMeetingSignupWindows(schedule.id);
  }

  return NextResponse.json(schedule);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.recurringSchedule.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}
